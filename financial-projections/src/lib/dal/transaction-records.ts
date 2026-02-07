import prisma from '@/lib/prisma';
import { TransactionRecord, TransactionType, Prisma } from '@prisma/client';
import { getSpendingTypeAssociationsForTransaction } from './categorization-rules';
import { eachDayOfInterval, startOfDay } from 'date-fns';

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

/**
 * Get the most recent TransactionRecord balance on or before a given date for a bank account.
 * This is the key query for finding starting balances for projections.
 * Uses the composite index [bankAccountId, transactionDate] for efficiency.
 */
export async function getLastTransactionBalanceOnOrBefore(
  date: Date,
  bankAccountId: string
): Promise<{ balance: number; date: Date } | null> {
  const record = await prisma.transactionRecord.findFirst({
    where: {
      bankAccountId,
      transactionDate: {
        lte: startOfDay(date),
      },
    },
    orderBy: [
      { transactionDate: 'desc' },
      { createdAt: 'desc' },
    ],
    select: {
      balance: true,
      transactionDate: true,
    },
  });

  if (!record) {
    return null;
  }

  return {
    balance: parseFloat(record.balance.toString()),
    date: record.transactionDate,
  };
}

/**
 * Insert ZERO_EVENT records for days within a date range that have no transaction records.
 * This ensures complete date coverage for a bank account within imported ranges.
 *
 * For each gap day, carries forward the balance from the most recent prior transaction.
 */
export async function insertZeroEventDayRecords(
  bankAccountId: string,
  startDate: Date,
  endDate: Date,
  uploadOperationId: string
): Promise<number> {
  const rangeStart = startOfDay(startDate);
  const rangeEnd = startOfDay(endDate);

  // Get all existing transaction dates in the range for this account
  const existingRecords = await prisma.transactionRecord.findMany({
    where: {
      bankAccountId,
      transactionDate: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    },
    select: {
      transactionDate: true,
      balance: true,
    },
    orderBy: [
      { transactionDate: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  // Build a set of dates that already have records and a map of last balance per day
  const existingDates = new Set<string>();
  const lastBalancePerDay = new Map<string, number>();
  for (const record of existingRecords) {
    const dateKey = startOfDay(record.transactionDate).toISOString();
    existingDates.add(dateKey);
    // Keep overwriting - since ordered by asc date then desc createdAt,
    // the last one per date key is the most recent record
    lastBalancePerDay.set(dateKey, parseFloat(record.balance.toString()));
  }

  // Get the balance from the day before rangeStart (for carry-forward on first gap day)
  const priorBalance = await getLastTransactionBalanceOnOrBefore(
    new Date(rangeStart.getTime() - 86400000), // day before rangeStart
    bankAccountId
  );

  // Generate all days in the range
  const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  // Find gap days and build ZERO_EVENT records
  const zeroEventRecords: Array<{
    transactionDate: Date;
    transactionType: TransactionType;
    transactionDescription: string;
    debitAmount: null;
    creditAmount: null;
    balance: Prisma.Decimal;
    bankAccountId: string;
  }> = [];

  let carryForwardBalance = priorBalance ? priorBalance.balance : 0;

  for (const day of allDays) {
    const dateKey = startOfDay(day).toISOString();

    if (existingDates.has(dateKey)) {
      // This day has transactions - update carry-forward balance
      carryForwardBalance = lastBalancePerDay.get(dateKey) ?? carryForwardBalance;
    } else {
      // Gap day - insert ZERO_EVENT record
      zeroEventRecords.push({
        transactionDate: startOfDay(day),
        transactionType: 'ZERO_EVENT' as TransactionType,
        transactionDescription: 'No transactions',
        debitAmount: null,
        creditAmount: null,
        balance: new Prisma.Decimal(carryForwardBalance),
        bankAccountId,
      });
    }
  }

  if (zeroEventRecords.length === 0) {
    return 0;
  }

  // Batch insert ZERO_EVENT records
  const result = await prisma.transactionRecord.createMany({
    data: zeroEventRecords,
    skipDuplicates: true,
  });

  // Create junction table entries to link zero-event records to the upload operation
  if (result.count > 0) {
    // Fetch the newly created ZERO_EVENT records to get their IDs
    const createdZeroEvents = await prisma.transactionRecord.findMany({
      where: {
        bankAccountId,
        transactionType: 'ZERO_EVENT',
        transactionDate: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      select: {
        id: true,
        transactionDate: true,
      },
    });

    // Build junction entries - use a simple row number offset
    const junctionData = createdZeroEvents.map((record, index) => ({
      transactionRecordId: record.id,
      uploadOperationId,
      csvRowNumber: -1 * (index + 1), // Negative row numbers to distinguish from real CSV rows
    }));

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
 * Get the closing balance per day from transaction records for a bank account within a date range.
 * Returns the balance from the last transaction on each day.
 * Used by the projections view to show true (transaction-based) balances.
 */
export async function getDailyTransactionBalances(
  bankAccountId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{ date: Date; closingBalance: number }>> {
  const rangeStart = startOfDay(startDate);
  const rangeEnd = startOfDay(endDate);

  // Get all transaction records in the range, ordered by date asc then createdAt desc
  // so we can pick the last balance per day
  const records = await prisma.transactionRecord.findMany({
    where: {
      bankAccountId,
      transactionDate: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    },
    select: {
      transactionDate: true,
      balance: true,
      createdAt: true,
    },
    orderBy: [
      { transactionDate: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  // Group by date and take the first record per date (most recent createdAt due to desc order)
  const balanceByDate = new Map<string, { date: Date; closingBalance: number }>();
  for (const record of records) {
    const dateKey = startOfDay(record.transactionDate).toISOString();
    if (!balanceByDate.has(dateKey)) {
      balanceByDate.set(dateKey, {
        date: record.transactionDate,
        closingBalance: parseFloat(record.balance.toString()),
      });
    }
  }

  return Array.from(balanceByDate.values());
}

export interface CoverageRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Get continuous date coverage ranges for a bank account.
 * Queries distinct transaction dates and groups consecutive dates into ranges.
 * With ZERO_EVENT records filling imported ranges, gaps only appear between non-contiguous imports.
 */
export async function getTransactionCoverage(
  bankAccountId: string
): Promise<{
  coverageRanges: CoverageRange[];
  totalCoveredDays: number;
  latestCoveredDate: Date | null;
}> {
  // Get all distinct transaction dates for this account, ordered ascending
  const distinctDates = await prisma.transactionRecord.findMany({
    where: { bankAccountId },
    select: { transactionDate: true },
    distinct: ['transactionDate'],
    orderBy: { transactionDate: 'asc' },
  });

  if (distinctDates.length === 0) {
    return {
      coverageRanges: [],
      totalCoveredDays: 0,
      latestCoveredDate: null,
    };
  }

  // Group consecutive dates into ranges
  const coverageRanges: CoverageRange[] = [];
  let rangeStart = distinctDates[0].transactionDate;
  let rangeEnd = distinctDates[0].transactionDate;

  for (let i = 1; i < distinctDates.length; i++) {
    const currentDate = distinctDates[i].transactionDate;
    const prevDate = distinctDates[i - 1].transactionDate;

    // Check if dates are consecutive (gap of 1 day = 86400000ms)
    const diffMs = currentDate.getTime() - prevDate.getTime();
    if (diffMs <= 86400000) {
      // Consecutive - extend the current range
      rangeEnd = currentDate;
    } else {
      // Gap found - close current range and start new one
      coverageRanges.push({ startDate: rangeStart, endDate: rangeEnd });
      rangeStart = currentDate;
      rangeEnd = currentDate;
    }
  }

  // Close the final range
  coverageRanges.push({ startDate: rangeStart, endDate: rangeEnd });

  return {
    coverageRanges,
    totalCoveredDays: distinctDates.length,
    latestCoveredDate: distinctDates[distinctDates.length - 1].transactionDate,
  };
}
