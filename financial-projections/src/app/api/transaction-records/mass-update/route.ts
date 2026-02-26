import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import { updateManyTransactionRecords, UpdateTransactionRecordInput } from '@/lib/dal/transaction-records';
import { ApiResponse } from '@/types';

/**
 * Zod schema for mass update transaction records request
 */
const massUpdateSchema = z.object({
  transactionIds: z.array(z.string()).min(1, 'At least one transaction ID is required'),
  notes: z.string().optional(),
  spendingTypeIds: z.array(z.string()).optional(),
});

/**
 * Response data for mass update
 */
interface MassUpdateResponseData {
  updatedCount: number;
}

type MassUpdateResponse = ApiResponse<MassUpdateResponseData>;

/**
 * PATCH /api/transaction-records/mass-update
 * Update multiple transaction records at once with the same notes and/or spending types
 */
export const { PATCH } = defineRoute({
  operationId: 'massUpdateTransactionRecords',
  method: 'PATCH',
  summary: 'Mass update transaction records',
  description: 'Update multiple transaction records at once with the same notes and/or spending types',
  tags: ['Transaction Records'],
  requestBody: massUpdateSchema,
  action: async ({ body }) => {
    try {
      // body is already validated by defineRoute via massUpdateSchema
      const { transactionIds, notes, spendingTypeIds } = body;

      // Build update input
      const updateData: Partial<UpdateTransactionRecordInput> = {};
      if (notes !== undefined) {
        updateData.notes = notes;
      }
      if (spendingTypeIds !== undefined) {
        updateData.spendingTypeIds = spendingTypeIds;
      }

      // Ensure at least one field to update
      if (Object.keys(updateData).length === 0) {
        const response: MassUpdateResponse = {
          success: false,
          error: 'At least one field (notes or spendingTypeIds) must be provided',
        };
        return Response.json(response, { status: 400 });
      }

      // Perform mass update
      const updatedCount = await updateManyTransactionRecords(transactionIds, updateData);

      const response: MassUpdateResponse = {
        success: true,
        data: {
          updatedCount,
        },
        message: `Successfully updated ${updatedCount} transaction${updatedCount === 1 ? '' : 's'}`,
      };

      return Response.json(response, { status: 200 });
    } catch (error) {
      console.error('Mass update transaction records error:', error);

      const response: MassUpdateResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mass update transaction records',
      };

      return Response.json(response, { status: 500 });
    }
  },
  responses: {
    200: { description: 'Transaction records updated successfully' },
    400: { description: 'Invalid request body or no fields to update' },
    500: { description: 'Server error' },
  },
});
