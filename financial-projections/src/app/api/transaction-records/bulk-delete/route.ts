import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import { deleteAllTransactionRecords } from '@/lib/dal/transaction-records';
import { TransactionRecordsBulkDeleteResponseSchema } from '@/lib/schemas';

/**
 * DELETE /api/transaction-records/bulk-delete
 * Delete all transaction records for a bank account
 */
export const { DELETE } = defineRoute({
  operationId: 'bulkDeleteTransactionRecords',
  method: 'DELETE',
  summary: 'Bulk delete transaction records',
  description: 'Delete all transaction records for a specified bank account',
  tags: ['Transaction Records'],
  queryParams: z.object({
    bankAccountId: z.string(),
  }),
  action: async ({ queryParams }) => {
    try {
      const bankAccountId = queryParams?.bankAccountId;

      if (!bankAccountId) {
        return Response.json(
          {
            success: false,
            error: 'Bank account ID is required',
          },
          { status: 400 }
        );
      }

      const deletedCount = await deleteAllTransactionRecords(bankAccountId);

      return Response.json({
        success: true,
        message: `Successfully deleted ${deletedCount} transaction record(s)`,
        data: { deletedCount },
      });
    } catch (error: unknown) {
      console.error('Error deleting all transaction records:', error);

      return Response.json(
        {
          success: false,
          error: 'Failed to delete transaction records',
        },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Transaction records deleted successfully',
      content: TransactionRecordsBulkDeleteResponseSchema,
    },
    400: { description: 'Missing bank account ID' },
    500: { description: 'Server error' },
  },
});
