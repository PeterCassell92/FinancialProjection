import defineRoute from '@omer-x/next-openapi-route-handler';
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
 */
export const { POST } = defineRoute({
  operationId: 'removeSpendingTypesFromTransactions',
  method: 'POST',
  summary: 'Remove spending types from transactions',
  description: 'Remove specific spending types from transactions matching a description pattern within a bank account',
  tags: ['Transaction Records'],
  requestBody: removeSpendingTypesSchema,
  action: async ({ body }) => {
    try {
      // body is already validated by defineRoute via removeSpendingTypesSchema
      const { bankAccountId, descriptionString, exactMatch, spendingTypeIds, dateRange } = body;

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

      return Response.json(response, { status: 200 });
    } catch (error) {
      console.error('Remove spending types by condition error:', error);

      const response: RemoveSpendingTypesResponse = {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to remove spending types by condition',
      };

      return Response.json(response, { status: 500 });
    }
  },
  responses: {
    200: { description: 'Spending types removed successfully' },
    400: { description: 'Invalid request body' },
    500: { description: 'Server error' },
  },
});
