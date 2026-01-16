import prisma from '@/lib/prisma';
import { TransactionRecord, TransactionType, Prisma } from '@prisma/client';

export interface CreateTransactionRecordInput {
  transactionDate: Date;
  transactionType: TransactionType;
  transactionDescription: string;
  debitAmount?: number;
  creditAmount?: number;
  balance: number;
  bankAccountId: string;
  notes?: string;
}

export interface UpdateTransactionRecordInput {
  notes?: string;
  spendingTypeIds?: string[];  // For updating spending types
}

export interface TransactionRecordWithSpendingTypes extends TransactionRecord {
  spendingTypes: Array<{
    id: string;
    spendingType: {
      id: string;
      name: string;
      description: string | null;
      color: string | null;
    };
  }>;
}

/**
 * Get transaction records for a bank account with optional date range
 */
export async function getTransactionRecords(
  bankAccountId: string,
  startDate?: Date,
  endDate?: Date
): Promise<TransactionRecordWithSpendingTypes[]> {
  const where: Prisma.TransactionRecordWhereInput = {
    bankAccountId,
  };

  if (startDate || endDate) {
    where.transactionDate = {};
    if (startDate) {
      where.transactionDate.gte = startDate;
    }
    if (endDate) {
      where.transactionDate.lte = endDate;
    }
  }

  return await prisma.transactionRecord.findMany({
    where,
    include: {
      spendingTypes: {
        include: {
          spendingType: true,
        },
      },
    },
    orderBy: {
      transactionDate: 'desc',
    },
  });
}

/**
 * Get a single transaction record by ID
 */
export async function getTransactionRecordById(
  id: string
): Promise<TransactionRecordWithSpendingTypes | null> {
  return await prisma.transactionRecord.findUnique({
    where: { id },
    include: {
      spendingTypes: {
        include: {
          spendingType: true,
        },
      },
    },
  });
}

/**
 * Create a single transaction record
 */
export async function createTransactionRecord(
  input: CreateTransactionRecordInput
): Promise<TransactionRecord> {
  return await prisma.transactionRecord.create({
    data: {
      transactionDate: input.transactionDate,
      transactionType: input.transactionType,
      transactionDescription: input.transactionDescription,
      debitAmount: input.debitAmount ? new Prisma.Decimal(input.debitAmount) : null,
      creditAmount: input.creditAmount ? new Prisma.Decimal(input.creditAmount) : null,
      balance: new Prisma.Decimal(input.balance),
      bankAccountId: input.bankAccountId,
      notes: input.notes,
    },
  });
}

/**
 * Batch create transaction records
 * Useful for CSV import
 */
export async function batchCreateTransactionRecords(
  inputs: CreateTransactionRecordInput[]
): Promise<number> {
  const data = inputs.map((input) => ({
    transactionDate: input.transactionDate,
    transactionType: input.transactionType,
    transactionDescription: input.transactionDescription,
    debitAmount: input.debitAmount ? new Prisma.Decimal(input.debitAmount) : null,
    creditAmount: input.creditAmount ? new Prisma.Decimal(input.creditAmount) : null,
    balance: new Prisma.Decimal(input.balance),
    bankAccountId: input.bankAccountId,
    notes: input.notes,
  }));

  const result = await prisma.transactionRecord.createMany({
    data,
    skipDuplicates: true,
  });

  return result.count;
}

/**
 * Update transaction record (mainly for metadata/notes)
 */
export async function updateTransactionRecord(
  id: string,
  input: UpdateTransactionRecordInput
): Promise<TransactionRecord> {
  // Handle spending types separately if provided
  if (input.spendingTypeIds) {
    // First, delete existing spending type associations
    await prisma.transactionSpendingType.deleteMany({
      where: { transactionRecordId: id },
    });

    // Then create new associations
    if (input.spendingTypeIds.length > 0) {
      await prisma.transactionSpendingType.createMany({
        data: input.spendingTypeIds.map((spendingTypeId) => ({
          transactionRecordId: id,
          spendingTypeId,
        })),
      });
    }
  }

  // Update the record itself
  return await prisma.transactionRecord.update({
    where: { id },
    data: {
      notes: input.notes,
    },
  });
}

/**
 * Delete a transaction record
 */
export async function deleteTransactionRecord(id: string): Promise<TransactionRecord> {
  return await prisma.transactionRecord.delete({
    where: { id },
  });
}

/**
 * Get transaction record statistics for a bank account
 */
export async function getTransactionStats(bankAccountId: string) {
  const [totalTransactions, totalDebits, totalCredits] = await Promise.all([
    prisma.transactionRecord.count({
      where: { bankAccountId },
    }),
    prisma.transactionRecord.aggregate({
      where: {
        bankAccountId,
        debitAmount: { not: null },
      },
      _sum: {
        debitAmount: true,
      },
    }),
    prisma.transactionRecord.aggregate({
      where: {
        bankAccountId,
        creditAmount: { not: null },
      },
      _sum: {
        creditAmount: true,
      },
    }),
  ]);

  return {
    totalTransactions,
    totalDebits: totalDebits._sum.debitAmount?.toNumber() || 0,
    totalCredits: totalCredits._sum.creditAmount?.toNumber() || 0,
  };
}
