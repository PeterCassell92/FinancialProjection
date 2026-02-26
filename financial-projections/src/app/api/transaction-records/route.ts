import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import {
  getTransactionRecords,
  getTransactionRecordsCount,
  updateTransactionRecord,
  deleteTransactionRecord,
  UpdateTransactionRecordInput,
  TransactionRecordWithSpendingTypes,
} from '@/lib/dal/transaction-records';
import {
  TransactionRecordsGetResponseSchema,
  TransactionRecordUpdateRequestSchema,
  TransactionRecordUpdateResponseSchema,
  TransactionRecordDeleteResponseSchema,
} from '@/lib/schemas';
import { formatTransactionsAsTOON } from '@/lib/formatters/toon';

/**
 * Serialized transaction record with Decimal fields converted to numbers
 */
type SerializedTransactionRecord = Omit<TransactionRecordWithSpendingTypes, 'debitAmount' | 'creditAmount' | 'balance'> & {
  debitAmount: number | null;
  creditAmount: number | null;
  balance: number;
};

/**
 * Convert a TransactionRecordWithSpendingTypes to a serialized version
 */
function serializeTransactionRecord(transaction: TransactionRecordWithSpendingTypes): SerializedTransactionRecord {
  const record = transaction as TransactionRecordWithSpendingTypes & {
    debitAmount: { toString(): string } | null;
    creditAmount: { toString(): string } | null;
    balance: { toString(): string };
  };

  return {
    ...transaction,
    debitAmount: record.debitAmount ? parseFloat(record.debitAmount.toString()) : null,
    creditAmount: record.creditAmount ? parseFloat(record.creditAmount.toString()) : null,
    balance: parseFloat(record.balance.toString()),
  };
}

/**
 * GET /api/transaction-records
 * Get transaction records for a bank account with optional filtering and pagination
 */
export const { GET } = defineRoute({
  operationId: 'getTransactionRecords',
  method: 'GET',
  summary: 'Get transaction records',
  description: 'Get transaction records for a bank account with optional date filtering, description search, spending type filtering, amount filtering, and pagination. Amount filter compares absolute value (magnitude) so greaterThan 100 matches both debits and credits over 100. Supports TOON compact response format (60-70% fewer tokens).',
  tags: ['Transaction Records'],
  queryParams: z.object({
    bankAccountId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    description: z.string().optional(),
    spendingTypeIds: z.string().optional(),
    spendingTypeNames: z.string().optional(),
    amountOperator: z.string().optional(),
    amountValue: z.string().optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
    responseFormat: z.enum(['json', 'toon']).optional(),
  }),
  action: async ({ queryParams }) => {
    try {
      const bankAccountId = queryParams?.bankAccountId;
      const startDate = queryParams?.startDate;
      const endDate = queryParams?.endDate;
      const description = queryParams?.description;
      const spendingTypeIdsParam = queryParams?.spendingTypeIds;
      const spendingTypeNamesParam = queryParams?.spendingTypeNames;
      const amountOperatorParam = queryParams?.amountOperator;
      const amountValueParam = queryParams?.amountValue;
      const pageParam = queryParams?.page;
      const pageSizeParam = queryParams?.pageSize;
      const responseFormat = queryParams?.responseFormat || 'json';

      if (!bankAccountId) {
        return Response.json(
          { success: false, error: 'bankAccountId query parameter is required' },
          { status: 400 }
        );
      }

      const startDateObj = startDate ? new Date(startDate) : undefined;
      const endDateObj = endDate ? new Date(endDate) : undefined;
      const spendingTypeIds = spendingTypeIdsParam ? spendingTypeIdsParam.split(',').map(id => id.trim()) : undefined;
      const spendingTypeNames = spendingTypeNamesParam ? spendingTypeNamesParam.split(',').map(name => name.trim()) : undefined;
      const amountOperator = (amountOperatorParam === 'lessThan' || amountOperatorParam === 'greaterThan') ? amountOperatorParam : undefined;
      const amountValue = amountValueParam ? parseFloat(amountValueParam) : undefined;
      const page = pageParam ? parseInt(pageParam, 10) : undefined;
      const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : undefined;

      if (page !== undefined && page < 1) {
        return Response.json(
          { success: false, error: 'page must be >= 1' },
          { status: 400 }
        );
      }

      if (pageSize !== undefined && pageSize < 1) {
        return Response.json(
          { success: false, error: 'pageSize must be >= 1' },
          { status: 400 }
        );
      }

      const [transactions, totalCount] = await Promise.all([
        getTransactionRecords(
          bankAccountId,
          startDateObj,
          endDateObj,
          page,
          pageSize,
          description || undefined,
          spendingTypeIds,
          spendingTypeNames,
          amountOperator,
          amountValue
        ),
        page && pageSize
          ? getTransactionRecordsCount(
              bankAccountId,
              startDateObj,
              endDateObj,
              description || undefined,
              spendingTypeIds,
              spendingTypeNames,
              amountOperator,
              amountValue
            )
          : Promise.resolve(undefined),
      ]);

      const serializedTransactions = transactions.map(serializeTransactionRecord);

      const paginationMetadata =
        page && pageSize && totalCount !== undefined
          ? {
              page,
              pageSize,
              totalRecords: totalCount,
              totalPages: Math.ceil(totalCount / pageSize),
            }
          : undefined;

      // Return TOON format if requested
      if (responseFormat === 'toon') {
        const toonData = formatTransactionsAsTOON(serializedTransactions, paginationMetadata);
        return Response.json({ success: true, data: toonData });
      }

      // Default JSON format
      const responseData: { transactions: SerializedTransactionRecord[]; pagination?: typeof paginationMetadata } = {
        transactions: serializedTransactions,
      };

      if (paginationMetadata) {
        responseData.pagination = paginationMetadata;
      }

      return Response.json({ success: true, data: responseData });
    } catch (error: unknown) {
      console.error('Error fetching transaction records:', error);
      return Response.json(
        { success: false, error: error instanceof Error ? error.message : 'Failed to fetch transaction records' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Transaction records retrieved successfully',
      content: TransactionRecordsGetResponseSchema,
    },
    400: { description: 'Missing or invalid query parameters' },
    500: { description: 'Server error' },
  },
});

/**
 * PATCH /api/transaction-records
 * Update a transaction record (metadata only)
 */
export const { PATCH } = defineRoute({
  operationId: 'updateTransactionRecord',
  method: 'PATCH',
  summary: 'Update a transaction record',
  description: 'Update a transaction record metadata (notes, spending types)',
  tags: ['Transaction Records'],
  requestBody: TransactionRecordUpdateRequestSchema,
  action: async ({ body }) => {
    try {
      const input: UpdateTransactionRecordInput = {
        notes: body.notes,
        spendingTypeIds: body.spendingTypeIds,
      };

      await updateTransactionRecord(body.id, input);

      // Fetch the updated transaction with all relations
      const { getTransactionRecordById } = await import('@/lib/dal/transaction-records');
      const updatedTransaction = await getTransactionRecordById(body.id);

      if (!updatedTransaction) {
        return Response.json(
          { success: false, error: 'Transaction record not found after update' },
          { status: 404 }
        );
      }

      const serialized = serializeTransactionRecord(updatedTransaction);

      return Response.json({ success: true, data: serialized });
    } catch (error: unknown) {
      console.error('Error updating transaction record:', error);

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return Response.json(
            { success: false, error: 'Transaction record not found' },
            { status: 404 }
          );
        }
      }

      return Response.json(
        { success: false, error: error instanceof Error ? error.message : 'Failed to update transaction record' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Transaction record updated successfully',
      content: TransactionRecordUpdateResponseSchema,
    },
    400: { description: 'Invalid request body' },
    404: { description: 'Transaction record not found' },
    500: { description: 'Server error' },
  },
});

/**
 * DELETE /api/transaction-records
 * Delete a transaction record
 */
export const { DELETE } = defineRoute({
  operationId: 'deleteTransactionRecord',
  method: 'DELETE',
  summary: 'Delete a transaction record',
  description: 'Delete a transaction record by ID',
  tags: ['Transaction Records'],
  queryParams: z.object({
    id: z.string().optional(),
  }),
  action: async ({ queryParams }) => {
    try {
      const id = queryParams?.id;

      if (!id) {
        return Response.json(
          { success: false, error: 'Transaction record ID is required' },
          { status: 400 }
        );
      }

      await deleteTransactionRecord(id);

      return Response.json({
        success: true,
        message: 'Transaction record deleted successfully',
      });
    } catch (error: unknown) {
      console.error('Error deleting transaction record:', error);

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return Response.json(
            { success: false, error: 'Transaction record not found' },
            { status: 404 }
          );
        }
      }

      return Response.json(
        { success: false, error: error instanceof Error ? error.message : 'Failed to delete transaction record' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Transaction record deleted successfully',
      content: TransactionRecordDeleteResponseSchema,
    },
    400: { description: 'Missing transaction record ID' },
    404: { description: 'Transaction record not found' },
    500: { description: 'Server error' },
  },
});
