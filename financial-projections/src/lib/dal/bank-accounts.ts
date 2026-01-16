import prisma from '@/lib/prisma';
import { BankAccount, BankProvider } from '@prisma/client';

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
        accountNumber,
      },
    },
  });
}

/**
 * Create a new bank account
 */
export async function createBankAccount(input: CreateBankAccountInput): Promise<BankAccount> {
  return await prisma.bankAccount.create({
    data: input,
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
  const existing = await getBankAccountBySortCodeAndNumber(sortCode, accountNumber);
  if (existing) {
    return existing;
  }

  return await createBankAccount({
    name,
    sortCode,
    accountNumber,
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
 * due to the RESTRICT constraint
 */
export async function deleteBankAccount(id: string): Promise<BankAccount> {
  return await prisma.bankAccount.delete({
    where: { id },
  });
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
