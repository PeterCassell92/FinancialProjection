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
  uploadOperationId?: string;  // Optional: link to upload operation
  csvRowNumber?: number;        // Optional: row number in CSV file
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
  uploadSources: Array<{
    id: string;
    csvRowNumber: number;
    uploadOperationId: string;
  }>;
}

export interface GetTransactionRecordsOptions {
  bankAccountId: string;
  startDate?: Date;
  endDate?: Date;
  description?: string;  // Partial match search on transaction description
  page?: number;         // Page number (1-indexed)
  pageSize?: number;     // Number of records per page
}

/**
 * Get transaction records for a bank account with optional date range, description search, and pagination
 * Results are sorted by transaction date (desc), then by CSV row number (asc) for same-day transactions
 */
export async function getTransactionRecords(
  bankAccountId: string,
  startDate?: Date,
  endDate?: Date,
  page?: number,
  pageSize?: number,
  description?: string
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

  // Add description search (case-insensitive partial match)
  if (description) {
    where.transactionDescription = {
      contains: description,
      mode: 'insensitive',
    };
  }

  // Calculate pagination
  const skip = page && pageSize ? (page - 1) * pageSize : undefined;
  const take = pageSize;

  const records = await prisma.transactionRecord.findMany({
    where,
    include: {
      spendingTypes: {
        include: {
          spendingType: true,
        },
      },
      uploadSources: {
        select: {
          id: true,
          csvRowNumber: true,
          uploadOperationId: true,
        },
      },
    },
    orderBy: [
      { transactionDate: 'desc' },
      { id: 'asc' }, // Secondary sort by ID for consistent ordering
    ],
    skip,
    take,
  });

  // Post-process to sort by CSV row number within the same date
  // Group by date and sort each group by csvRowNumber
  const sortedRecords = records.sort((a, b) => {
    // First sort by date (desc)
    const dateCompare = b.transactionDate.getTime() - a.transactionDate.getTime();
    if (dateCompare !== 0) return dateCompare;

    // For same date, sort by CSV row number (asc)
    const aRowNum = a.uploadSources[0]?.csvRowNumber ?? Number.MAX_SAFE_INTEGER;
    const bRowNum = b.uploadSources[0]?.csvRowNumber ?? Number.MAX_SAFE_INTEGER;
    return aRowNum - bRowNum;
  });

  return sortedRecords;
}

/**
 * Get total count of transaction records matching the criteria
 */
export async function getTransactionRecordsCount(
  bankAccountId: string,
  startDate?: Date,
  endDate?: Date,
  description?: string
): Promise<number> {
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

  // Add description search (case-insensitive partial match)
  if (description) {
    where.transactionDescription = {
      contains: description,
      mode: 'insensitive',
    };
  }

  return await prisma.transactionRecord.count({ where });
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
      uploadSources: {
        select: {
          id: true,
          csvRowNumber: true,
          uploadOperationId: true,
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
 *
 * If uploadOperationId and csvRowNumber are provided, creates junction table entries
 * to link transactions to their source CSV file and row number
 */
export async function batchCreateTransactionRecords(
  inputs: CreateTransactionRecordInput[]
): Promise<number> {
  // Check if any input has upload operation info - if so, use transaction with junction table
  const hasUploadInfo = inputs.some(input => input.uploadOperationId && input.csvRowNumber !== undefined);

  if (hasUploadInfo) {
    // Use transaction to create records with junction table entries
    let successCount = 0;

    for (const input of inputs) {
      try {
        await prisma.transactionRecord.create({
          data: {
            transactionDate: input.transactionDate,
            transactionType: input.transactionType,
            transactionDescription: input.transactionDescription,
            debitAmount: input.debitAmount ? new Prisma.Decimal(input.debitAmount) : null,
            creditAmount: input.creditAmount ? new Prisma.Decimal(input.creditAmount) : null,
            balance: new Prisma.Decimal(input.balance),
            bankAccountId: input.bankAccountId,
            notes: input.notes,
            // Create junction table entry if upload info provided
            ...(input.uploadOperationId && input.csvRowNumber !== undefined ? {
              uploadSources: {
                create: {
                  uploadOperationId: input.uploadOperationId,
                  csvRowNumber: input.csvRowNumber,
                },
              },
            } : {}),
          },
        });
        successCount++;
      } catch (error) {
        // Skip duplicates but log other errors
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          // Duplicate - skip silently
          continue;
        }
        console.error('Error creating transaction record:', error);
      }
    }

    return successCount;
  } else {
    // Original behavior: use createMany for better performance when no upload info
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
 * Mass update multiple transaction records with the same data
 * Useful for applying notes or spending types to many transactions at once
 */
export async function updateManyTransactionRecords(
  ids: string[],
  input: Partial<UpdateTransactionRecordInput>
): Promise<number> {
  let updatedCount = 0;

  // Use a transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // Handle spending types if provided
    if (input.spendingTypeIds !== undefined) {
      // Delete existing spending type associations for all records
      await tx.transactionSpendingType.deleteMany({
        where: { transactionRecordId: { in: ids } },
      });

      // Create new associations if any spending types provided
      if (input.spendingTypeIds.length > 0) {
        const createData = ids.flatMap((id) =>
          input.spendingTypeIds!.map((spendingTypeId) => ({
            transactionRecordId: id,
            spendingTypeId,
          }))
        );

        await tx.transactionSpendingType.createMany({
          data: createData,
        });
      }
    }

    // Update notes if provided
    if (input.notes !== undefined) {
      const result = await tx.transactionRecord.updateMany({
        where: { id: { in: ids } },
        data: { notes: input.notes },
      });
      updatedCount = result.count;
    } else {
      // If only updating spending types, count as updated
      updatedCount = ids.length;
    }
  });

  return updatedCount;
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
 * Delete all transaction records for a bank account
 */
export async function deleteAllTransactionRecords(bankAccountId: string): Promise<number> {
  const result = await prisma.transactionRecord.deleteMany({
    where: { bankAccountId },
  });
  return result.count;
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

/**
 * Check if there are existing transaction records for a bank account within a date range
 * Returns true if there's an overlap, false otherwise
 */
export async function checkDateRangeOverlap(
  bankAccountId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  hasOverlap: boolean;
  overlappingRecordCount: number;
  earliestOverlappingDate?: Date;
  latestOverlappingDate?: Date;
}> {
  const overlappingRecords = await prisma.transactionRecord.findMany({
    where: {
      bankAccountId,
      transactionDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      transactionDate: true,
    },
    orderBy: {
      transactionDate: 'asc',
    },
  });

  if (overlappingRecords.length === 0) {
    return {
      hasOverlap: false,
      overlappingRecordCount: 0,
    };
  }

  return {
    hasOverlap: true,
    overlappingRecordCount: overlappingRecords.length,
    earliestOverlappingDate: overlappingRecords[0].transactionDate,
    latestOverlappingDate: overlappingRecords[overlappingRecords.length - 1].transactionDate,
  };
}
