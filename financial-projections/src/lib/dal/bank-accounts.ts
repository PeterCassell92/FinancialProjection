import prisma from '@/lib/prisma';
import { BankAccount, BankProvider } from '@prisma/client';

/**
 * Normalize account number to 8 digits with leading zeros
 * UK bank account numbers should always be 8 digits
 */
function normalizeAccountNumber(accountNumber: string): string {
  const cleaned = accountNumber.trim();
  return cleaned.length < 8 ? cleaned.padStart(8, '0') : cleaned;
}

export interface CreateBankAccountInput {
  name: string;
  description?: string;
  sortCode: string;
  accountNumber: string;
  provider: BankProvider;
}

export interface UpdateBankAccountInput {
  name?: string;
  description?: string;
  provider?: BankProvider;
}

/**
 * Get all bank accounts
 */
export async function getAllBankAccounts(): Promise<BankAccount[]> {
  return await prisma.bankAccount.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get a bank account by ID
 */
export async function getBankAccountById(id: string): Promise<BankAccount | null> {
  return await prisma.bankAccount.findUnique({
    where: { id },
  });
}

/**
 * Get a bank account by sort code and account number
 */
export async function getBankAccountBySortCodeAndNumber(
  sortCode: string,
  accountNumber: string
): Promise<BankAccount | null> {
  return await prisma.bankAccount.findUnique({
    where: {
      sortCode_accountNumber: {
        sortCode,
        accountNumber: normalizeAccountNumber(accountNumber),
      },
    },
  });
}

/**
 * Create a new bank account
 */
export async function createBankAccount(input: CreateBankAccountInput): Promise<BankAccount> {
  return await prisma.bankAccount.create({
    data: {
      ...input,
      accountNumber: normalizeAccountNumber(input.accountNumber),
    },
  });
}

/**
 * Get or create a bank account by sort code and account number
 * Useful when importing CSV data
 */
export async function getOrCreateBankAccount(
  sortCode: string,
  accountNumber: string,
  name: string,
  provider: BankProvider,
  description?: string
): Promise<BankAccount> {
  const normalizedAccountNumber = normalizeAccountNumber(accountNumber);
  const existing = await getBankAccountBySortCodeAndNumber(sortCode, normalizedAccountNumber);
  if (existing) {
    return existing;
  }

  return await createBankAccount({
    name,
    sortCode,
    accountNumber: normalizedAccountNumber,
    provider,
    description,
  });
}

/**
 * Update a bank account
 */
export async function updateBankAccount(
  id: string,
  input: UpdateBankAccountInput
): Promise<BankAccount> {
  return await prisma.bankAccount.update({
    where: { id },
    data: input,
  });
}

/**
 * Delete a bank account
 * Note: This will fail if there are related records (projection events, daily balances, etc.)
 * due to the RESTRICT constraint. Use deleteBankAccountAndAllAssociatedRecords for complete deletion.
 */
export async function deleteBankAccount(id: string): Promise<BankAccount> {
  return await prisma.bankAccount.delete({
    where: { id },
  });
}

/**
 * Delete a bank account and ALL associated records
 * This includes: projection events, recurring rules, daily balances,
 * upload operations, transaction records, and the bank account itself
 *
 * @returns The number of deleted transaction records
 */
export async function deleteBankAccountAndAllAssociatedRecords(id: string): Promise<number> {
  // Use a transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // 1. Delete all projection events for this account
    await tx.projectionEvent.deleteMany({
      where: { bankAccountId: id },
    });

    // 2. Delete all recurring projection event rules for this account
    await tx.recurringProjectionEventRule.deleteMany({
      where: { bankAccountId: id },
    });

    // 3. Delete all daily balances for this account
    await tx.dailyBalance.deleteMany({
      where: { bankAccountId: id },
    });

    // 4. Delete all upload operations for this account
    // Note: This will also cascade delete TransactionUploadSource entries
    await tx.uploadOperation.deleteMany({
      where: { bankAccountId: id },
    });

    // 5. Delete all transaction records for this account
    // Note: This will also cascade delete TransactionSpendingType junction entries
    const deleteResult = await tx.transactionRecord.deleteMany({
      where: { bankAccountId: id },
    });

    // 6. Finally, delete the bank account itself
    await tx.bankAccount.delete({
      where: { id },
    });

    return deleteResult.count;
  });

  return result;
}

/**
 * Get bank account with transaction count
 */
export async function getBankAccountsWithCounts() {
  return await prisma.bankAccount.findMany({
    include: {
      _count: {
        select: {
          transactionRecords: true,
          projectionEvents: true,
          recurringRules: true,
          dailyBalances: true,
          uploadOperations: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
