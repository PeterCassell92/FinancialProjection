import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types';

/**
 * Zod schema for remove spending types by condition request
 */
const removeSpendingTypesSchema = z.object({
  bankAccountId: z.string().min(1, 'Bank account ID is required'),
  descriptionString: z.string().min(1, 'Description string is required'),
  exactMatch: z.boolean().default(false),
  spendingTypeIds: z.array(z.string()).min(1, 'At least one spending type ID is required'),
  dateRange: z
    .object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    })
    .optional(),
});

/**
 * Response data for remove spending types
 */
interface RemoveSpendingTypesResponseData {
  transactionsMatched: number;
  spendingTypesRemoved: number;
}

type RemoveSpendingTypesResponse = ApiResponse<RemoveSpendingTypesResponseData>;

/**
 * POST /api/transaction-records/remove-spending-types
 * Remove specific spending types from transactions matching a description pattern
 *
 * Request body:
 * {
 *   bankAccountId: string;           // Required: Bank account to search in
 *   descriptionString: string;       // Required: Description pattern to match
 *   exactMatch: boolean;             // Optional: true for exact match, false for contains (default: false)
 *   spendingTypeIds: string[];       // Required: Array of spending type IDs to remove
 *   dateRange?: {                    // Optional: Filter by date range
 *     startDate?: string;            // ISO datetime string
 *     endDate?: string;              // ISO datetime string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = removeSpendingTypesSchema.safeParse(body);
    if (!validation.success) {
      const response: RemoveSpendingTypesResponse = {
        success: false,
        error: validation.error.message || 'Invalid request body',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const { bankAccountId, descriptionString, exactMatch, spendingTypeIds, dateRange } =
      validation.data;

    // Build date range filter if provided
    const dateFilter = dateRange
      ? {
          transactionDate: {
            ...(dateRange.startDate && { gte: new Date(dateRange.startDate) }),
            ...(dateRange.endDate && { lte: new Date(dateRange.endDate) }),
          },
        }
      : {};

    // Find all transactions matching the criteria
    const matchingTransactions = await prisma.transactionRecord.findMany({
      where: {
        bankAccountId,
        ...dateFilter,
      },
      include: {
        spendingTypes: {
          select: {
            id: true,
            spendingTypeId: true,
          },
        },
      },
    });

    // Filter transactions by description pattern
    const filteredTransactions = matchingTransactions.filter((transaction) => {
      if (exactMatch) {
        return (
          transaction.transactionDescription.toLowerCase() ===
          descriptionString.toLowerCase()
        );
      } else {
        return transaction.transactionDescription
          .toLowerCase()
          .includes(descriptionString.toLowerCase());
      }
    });

    // Collect all spending type association IDs to delete
    const associationIdsToDelete: string[] = [];

    for (const transaction of filteredTransactions) {
      for (const spendingType of transaction.spendingTypes) {
        // Only delete if this spending type is in the list of types to remove
        if (spendingTypeIds.includes(spendingType.spendingTypeId)) {
          associationIdsToDelete.push(spendingType.id);
        }
      }
    }

    // Delete the spending type associations
    let deletedCount = 0;
    if (associationIdsToDelete.length > 0) {
      const deleteResult = await prisma.transactionSpendingType.deleteMany({
        where: {
          id: {
            in: associationIdsToDelete,
          },
        },
      });
      deletedCount = deleteResult.count;
    }

    const response: RemoveSpendingTypesResponse = {
      success: true,
      data: {
        transactionsMatched: filteredTransactions.length,
        spendingTypesRemoved: deletedCount,
      },
      message: `Removed ${deletedCount} spending type association(s) from ${filteredTransactions.length} matching transaction(s)`,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Remove spending types by condition error:', error);

    const response: RemoveSpendingTypesResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to remove spending types by condition',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
