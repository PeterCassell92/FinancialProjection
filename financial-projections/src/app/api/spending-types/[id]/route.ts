import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import {
  getSpendingTypeById,
  updateSpendingType,
  deleteSpendingType,
  UpdateSpendingTypeInput,
} from '@/lib/dal/spending-types';
import {
  SpendingTypeGetResponseSchema,
  SpendingTypeUpdateRequestSchema,
  SpendingTypeUpdateResponseSchema,
  SpendingTypeDeleteResponseSchema,
} from '@/lib/schemas';

const pathParams = z.object({ id: z.string() });

/**
 * GET /api/spending-types/[id]
 * Get a specific spending type
 */
export const { GET } = defineRoute({
  operationId: 'getSpendingTypeById',
  method: 'GET',
  summary: 'Get a spending type by ID',
  description: 'Get a specific spending type by its ID',
  tags: ['Spending Types'],
  pathParams,
  action: async ({ pathParams: { id } }) => {
    try {
      const spendingType = await getSpendingTypeById(id);

      if (!spendingType) {
        return Response.json(
          { success: false, error: 'Spending type not found' },
          { status: 404 }
        );
      }

      const serializedData = {
        id: spendingType.id,
        name: spendingType.name,
        description: spendingType.description,
        color: spendingType.color,
        createdAt: spendingType.createdAt.toISOString(),
        updatedAt: spendingType.updatedAt.toISOString(),
      };

      return Response.json({ success: true, data: serializedData });
    } catch (error) {
      console.error('Error fetching spending type:', error);
      return Response.json(
        { success: false, error: 'Failed to fetch spending type' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Spending type retrieved successfully',
      content: SpendingTypeGetResponseSchema,
    },
    404: { description: 'Spending type not found' },
    500: { description: 'Server error' },
  },
});

/**
 * PATCH /api/spending-types/[id]
 * Update a spending type
 */
export const { PATCH } = defineRoute({
  operationId: 'updateSpendingType',
  method: 'PATCH',
  summary: 'Update a spending type',
  description: 'Update a spending type by its ID',
  tags: ['Spending Types'],
  pathParams,
  requestBody: SpendingTypeUpdateRequestSchema,
  action: async ({ pathParams: { id }, body }) => {
    try {
      const input: UpdateSpendingTypeInput = {
        name: body.name,
        description: body.description ?? undefined,
        color: body.color ?? undefined,
      };

      const spendingType = await updateSpendingType(id, input);

      const serializedData = {
        id: spendingType.id,
        name: spendingType.name,
        description: spendingType.description,
        color: spendingType.color,
        createdAt: spendingType.createdAt.toISOString(),
        updatedAt: spendingType.updatedAt.toISOString(),
      };

      return Response.json({
        success: true,
        data: serializedData,
        message: 'Spending type updated successfully',
      });
    } catch (error: unknown) {
      console.error('Error updating spending type:', error);

      if (error instanceof Object && 'code' in error && error.code === 'P2025') {
        return Response.json(
          { success: false, error: 'Spending type not found' },
          { status: 404 }
        );
      }

      if (error instanceof Object && 'code' in error && error.code === 'P2002') {
        return Response.json(
          { success: false, error: 'Spending type with this name already exists' },
          { status: 409 }
        );
      }

      return Response.json(
        { success: false, error: 'Failed to update spending type' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Spending type updated successfully',
      content: SpendingTypeUpdateResponseSchema,
    },
    400: { description: 'Invalid request body' },
    404: { description: 'Spending type not found' },
    409: { description: 'Spending type with this name already exists' },
    500: { description: 'Server error' },
  },
});

/**
 * DELETE /api/spending-types/[id]
 * Delete a spending type
 */
export const { DELETE } = defineRoute({
  operationId: 'deleteSpendingType',
  method: 'DELETE',
  summary: 'Delete a spending type',
  description: 'Delete a spending type by its ID',
  tags: ['Spending Types'],
  pathParams,
  action: async ({ pathParams: { id } }) => {
    try {
      await deleteSpendingType(id);

      return Response.json({
        success: true,
        message: 'Spending type deleted successfully',
      });
    } catch (error: unknown) {
      console.error('Error deleting spending type:', error);

      if (error instanceof Object && 'code' in error && error.code === 'P2025') {
        return Response.json(
          { success: false, error: 'Spending type not found' },
          { status: 404 }
        );
      }

      return Response.json(
        { success: false, error: 'Failed to delete spending type' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Spending type deleted successfully',
      content: SpendingTypeDeleteResponseSchema,
    },
    404: { description: 'Spending type not found' },
    500: { description: 'Server error' },
  },
});
