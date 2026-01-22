import prisma from '@/lib/prisma';
import { TransactionRecord, TransactionType, Prisma } from '@prisma/client';
import { getSpendingTypeAssociationsForTransaction } from './categorization-rules';

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
  description?: string;      // Partial match search on transaction description
  spendingTypeIds?: string[]; // Filter by spending type IDs
  spendingTypeNames?: string[]; // Filter by spending type names (will be converted to IDs)
  amountOperator?: 'lessThan' | 'greaterThan';  // Amount comparison operator
  amountValue?: number;      // Amount value to compare against (magnitude)
  page?: number;             // Page number (1-indexed)
  pageSize?: number;         // Number of records per page
}

/**
 * Get transaction records for a bank account with optional date range, description search, spending type filtering, amount filtering, and pagination
 * Results are sorted by transaction date (desc), then by CSV row number (asc) for same-day transactions
 */
export async function getTransactionRecords(
  bankAccountId: string,
  startDate?: Date,
  endDate?: Date,
  page?: number,
  pageSize?: number,
  description?: string,
  spendingTypeIds?: string[],
  spendingTypeNames?: string[],
  amountOperator?: 'lessThan' | 'greaterThan',
  amountValue?: number
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

  // Add spending type filtering
  // If names are provided, look them up to get IDs
  let resolvedSpendingTypeIds = spendingTypeIds;
  if (spendingTypeNames && spendingTypeNames.length > 0) {
    const spendingTypes = await prisma.spendingType.findMany({
      where: {
        name: {
          in: spendingTypeNames,
        },
      },
      select: {
        id: true,
      },
    });
    const idsFromNames = spendingTypes.map(st => st.id);

    // Merge with any provided IDs
    resolvedSpendingTypeIds = resolvedSpendingTypeIds
      ? [...resolvedSpendingTypeIds, ...idsFromNames]
      : idsFromNames;
  }

  // Apply spending type filter if we have IDs
  if (resolvedSpendingTypeIds && resolvedSpendingTypeIds.length > 0) {
    where.spendingTypes = {
      some: {
        spendingTypeId: {
          in: resolvedSpendingTypeIds,
        },
      },
    };
  }

  // Apply amount filter
  // Since amounts are stored as positive values in debit/credit fields,
  // we can directly filter on them
  if (amountOperator && amountValue !== undefined) {
    const amountConditions: Prisma.TransactionRecordWhereInput[] = [];

    if (amountOperator === 'lessThan') {
      // Transactions where amount is less than amountValue
      amountConditions.push(
        { debitAmount: { not: null, lt: amountValue } },
        { creditAmount: { not: null, lt: amountValue } }
      );
    } else if (amountOperator === 'greaterThan') {
      // Transactions where amount is greater than amountValue
      amountConditions.push(
        { debitAmount: { not: null, gt: amountValue } },
        { creditAmount: { not: null, gt: amountValue } }
      );
    }

    if (amountConditions.length > 0) {
      where.OR = amountConditions;
    }
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
  description?: string,
  spendingTypeIds?: string[],
  spendingTypeNames?: string[],
  amountOperator?: 'lessThan' | 'greaterThan',
  amountValue?: number
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

  // Add spending type filtering
  // If names are provided, look them up to get IDs
  let resolvedSpendingTypeIds = spendingTypeIds;
  if (spendingTypeNames && spendingTypeNames.length > 0) {
    const spendingTypes = await prisma.spendingType.findMany({
      where: {
        name: {
          in: spendingTypeNames,
        },
      },
      select: {
        id: true,
      },
    });
    const idsFromNames = spendingTypes.map(st => st.id);

    // Merge with any provided IDs
    resolvedSpendingTypeIds = resolvedSpendingTypeIds
      ? [...resolvedSpendingTypeIds, ...idsFromNames]
      : idsFromNames;
  }

  // Apply spending type filter if we have IDs
  if (resolvedSpendingTypeIds && resolvedSpendingTypeIds.length > 0) {
    where.spendingTypes = {
      some: {
        spendingTypeId: {
          in: resolvedSpendingTypeIds,
        },
      },
    };
  }

  // Apply amount filter
  // Since amounts are stored as positive values in debit/credit fields,
  // we can directly filter on them
  if (amountOperator && amountValue !== undefined) {
    const amountConditions: Prisma.TransactionRecordWhereInput[] = [];

    if (amountOperator === 'lessThan') {
      // Transactions where amount is less than amountValue
      amountConditions.push(
        { debitAmount: { not: null, lt: amountValue } },
        { creditAmount: { not: null, lt: amountValue } }
      );
    } else if (amountOperator === 'greaterThan') {
      // Transactions where amount is greater than amountValue
      amountConditions.push(
        { debitAmount: { not: null, gt: amountValue } },
        { creditAmount: { not: null, gt: amountValue } }
      );
    }

    if (amountConditions.length > 0) {
      where.OR = amountConditions;
    }
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
 *
 * Uses createMany() for optimal performance with bulk inserts
 */
export async function batchCreateTransactionRecords(
  inputs: CreateTransactionRecordInput[]
): Promise<number> {
  if (inputs.length === 0) {
    return 0;
  }

  // Check if any input has upload operation info
  const hasUploadInfo = inputs.some(input => input.uploadOperationId && input.csvRowNumber !== undefined);

  // Step 1: Pre-process all data to ensure correct types
  const transactionData = inputs.map((input) => ({
    transactionDate: input.transactionDate,
    transactionType: input.transactionType,
    transactionDescription: input.transactionDescription,
    debitAmount: input.debitAmount ? new Prisma.Decimal(input.debitAmount) : null,
    creditAmount: input.creditAmount ? new Prisma.Decimal(input.creditAmount) : null,
    balance: new Prisma.Decimal(input.balance),
    bankAccountId: input.bankAccountId,
    notes: input.notes,
  }));

  // Step 2: Bulk insert transaction records (much faster than individual creates)
  const result = await prisma.transactionRecord.createMany({
    data: transactionData,
    skipDuplicates: true,
  });

  // Step 3: Fetch created records for categorization and junction table linking
  if (result.count > 0) {
    // Get date range for efficient querying
    const dates = inputs.map(input => input.transactionDate);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Fetch records to match them with junction table data
    // We need to match by unique combination of date, description, debit, credit, and balance
    // Include existing upload sources so we can filter out records already linked to THIS upload
    const allRecords = await prisma.transactionRecord.findMany({
      where: {
        bankAccountId: inputs[0].bankAccountId,
        transactionDate: {
          gte: minDate,
          lte: maxDate,
        },
      },
      include: {
        uploadSources: {
          select: {
            uploadOperationId: true,
          },
        },
        spendingTypes: {
          select: {
            spendingTypeId: true,
          },
        },
      },
      orderBy: [
        { transactionDate: 'asc' },
        { transactionDescription: 'asc' },
        { balance: 'asc' },
      ],
    });

    // Filter out records that already have a source from THIS upload operation
    const createdRecords = allRecords.filter(record =>
      !record.uploadSources.some(source => source.uploadOperationId === inputs[0].uploadOperationId)
    );

    // Create a map for quick lookup, allowing multiple records with the same key
    // Key format: date_description_debit_credit_balance
    const recordMap = new Map<string, string[]>();
    createdRecords.forEach(record => {
      const key = `${record.transactionDate.toISOString()}_${record.transactionDescription}_${record.debitAmount?.toString() ?? 'null'}_${record.creditAmount?.toString() ?? 'null'}_${record.balance.toString()}`;
      const existing = recordMap.get(key) || [];
      existing.push(record.id);
      recordMap.set(key, existing);
    });

    // Track which record IDs we've already used (to handle duplicates)
    const usedRecordIds = new Set<string>();

    // Step 4: Apply categorization rules to newly created records
    // Build a map of transaction descriptions to spending type IDs with tracking
    const spendingTypeAssociations: Array<{
      transactionRecordId: string;
      spendingTypeId: string;
      categorizationRuleId: string;
      appliedManually: boolean;
    }> = [];

    for (const input of inputs) {
      const key = `${input.transactionDate.toISOString()}_${input.transactionDescription}_${input.debitAmount?.toString() ?? 'null'}_${input.creditAmount?.toString() ?? 'null'}_${input.balance.toString()}`;
      const matchingIds = recordMap.get(key);

      if (matchingIds && matchingIds.length > 0) {
        // Find the first unused record ID for this key
        const recordId = matchingIds.find(id => !usedRecordIds.has(id));

        if (recordId) {
          // Get the record to check if it already has spending types
          const record = createdRecords.find(r => r.id === recordId);

          // Only apply categorization rules if the record doesn't already have spending types
          if (record && record.spendingTypes.length === 0) {
            // Get spending type associations with rule IDs for this transaction description
            const associations = await getSpendingTypeAssociationsForTransaction(input.transactionDescription);

            console.log(`[CSV Import Categorization] Transaction: "${input.transactionDescription}" - Found ${associations.length} matching rule associations`);

            // Add associations for each spending type with tracking info
            for (const association of associations) {
              spendingTypeAssociations.push({
                transactionRecordId: recordId,
                spendingTypeId: association.spendingTypeId,
                categorizationRuleId: association.categorizationRuleId,
                appliedManually: false, // Applied by rule during import
              });
            }
          }

          // Mark this record ID as used for the junction table mapping
          usedRecordIds.add(recordId);
        }
      }
    }

    // Bulk insert spending type associations
    if (spendingTypeAssociations.length > 0) {
      console.log(`[CSV Import Categorization] Creating ${spendingTypeAssociations.length} spending type associations`);
      await prisma.transactionSpendingType.createMany({
        data: spendingTypeAssociations,
        skipDuplicates: true,
      });
      console.log(`[CSV Import Categorization] Successfully created spending type associations`);
    } else {
      console.log(`[CSV Import Categorization] No spending type associations to create`);
    }

    // Reset usedRecordIds for junction table creation
    usedRecordIds.clear();

    // Step 5: Build junction table entries for upload operations
    const junctionData = hasUploadInfo ? inputs
      .filter(input => input.uploadOperationId && input.csvRowNumber !== undefined)
      .map(input => {
        const key = `${input.transactionDate.toISOString()}_${input.transactionDescription}_${input.debitAmount?.toString() ?? 'null'}_${input.creditAmount?.toString() ?? 'null'}_${input.balance.toString()}`;
        const matchingIds = recordMap.get(key);

        if (!matchingIds || matchingIds.length === 0) {
          console.warn('Could not find matching transaction record for junction table entry', {
            date: input.transactionDate,
            description: input.transactionDescription,
            debitAmount: input.debitAmount,
            creditAmount: input.creditAmount,
            balance: input.balance,
          });
          return null;
        }

        // Find the first unused record ID for this key
        const recordId = matchingIds.find(id => !usedRecordIds.has(id));

        if (!recordId) {
          console.warn('All matching records already used for junction table entry', {
            date: input.transactionDate,
            description: input.transactionDescription,
            balance: input.balance,
          });
          return null;
        }

        // Mark this record ID as used
        usedRecordIds.add(recordId);

        return {
          transactionRecordId: recordId,
          uploadOperationId: input.uploadOperationId!,
          csvRowNumber: input.csvRowNumber!,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null) : [];

    // Bulk insert junction table entries
    if (junctionData.length > 0) {
      await prisma.transactionUploadSource.createMany({
        data: junctionData,
        skipDuplicates: true,
      });
    }
  }

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
          appliedManually: true, // User manually selected these spending types
          categorizationRuleId: null, // Not applied by a rule
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
            appliedManually: true, // User manually selected these spending types
            categorizationRuleId: null, // Not applied by a rule
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
 * Does NOT delete the bank account itself
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
