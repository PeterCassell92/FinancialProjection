import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import {
  getCategorizationRuleById,
  updateCategorizationRule,
  deleteCategorizationRule,
  UpdateCategorizationRuleInput,
} from '@/lib/dal/categorization-rules';

const pathParams = z.object({ id: z.string() });

const UpdateCategorizationRuleRequestSchema = z.object({
  descriptionString: z.string().optional(),
  exactMatch: z.boolean().optional(),
  spendingTypeIds: z.array(z.string()).optional(),
});

/**
 * GET /api/categorization-rules/[id]
 * Get a specific categorization rule
 */
export const { GET } = defineRoute({
  operationId: 'getCategorizationRuleById',
  method: 'GET',
  summary: 'Get a categorization rule by ID',
  description: 'Get a specific categorization rule by its ID',
  tags: ['Categorization Rules'],
  pathParams,
  action: async ({ pathParams: { id } }) => {
    try {
      const rule = await getCategorizationRuleById(id);

      if (!rule) {
        return Response.json(
          {
            success: false,
            error: 'Categorization rule not found',
          },
          { status: 404 }
        );
      }

      return Response.json({
        success: true,
        data: {
          id: rule.id,
          descriptionString: rule.descriptionString,
          exactMatch: rule.exactMatch,
          spendingTypes: rule.spendingTypes.map((st) => ({
            id: st.spendingType.id,
            name: st.spendingType.name,
          })),
          createdAt: rule.createdAt.toISOString(),
          updatedAt: rule.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Error fetching categorization rule:', error);
      return Response.json(
        {
          success: false,
          error: 'Failed to fetch categorization rule',
        },
        { status: 500 }
      );
    }
  },
  responses: {
    200: { description: 'Categorization rule retrieved successfully' },
    404: { description: 'Categorization rule not found' },
    500: { description: 'Server error' },
  },
});

/**
 * PATCH /api/categorization-rules/[id]
 * Update a categorization rule
 */
export const { PATCH } = defineRoute({
  operationId: 'updateCategorizationRule',
  method: 'PATCH',
  summary: 'Update a categorization rule',
  description: 'Update a categorization rule by its ID. All fields are optional.',
  tags: ['Categorization Rules'],
  pathParams,
  requestBody: UpdateCategorizationRuleRequestSchema,
  action: async ({ pathParams: { id }, body }) => {
    try {
      const input: UpdateCategorizationRuleInput = {
        descriptionString: body.descriptionString,
        exactMatch: body.exactMatch,
        spendingTypeIds: body.spendingTypeIds,
      };

      const rule = await updateCategorizationRule(id, input);

      return Response.json({
        success: true,
        data: {
          id: rule.id,
          descriptionString: rule.descriptionString,
          exactMatch: rule.exactMatch,
          spendingTypes: rule.spendingTypes.map((st) => ({
            id: st.spendingType.id,
            name: st.spendingType.name,
          })),
          createdAt: rule.createdAt.toISOString(),
          updatedAt: rule.updatedAt.toISOString(),
        },
        message: 'Categorization rule updated successfully',
      });
    } catch (error: unknown) {
      console.error('Error updating categorization rule:', error);

      if (error instanceof Object && 'code' in error && error.code === 'P2025') {
        return Response.json(
          {
            success: false,
            error: 'Categorization rule not found',
          },
          { status: 404 }
        );
      }

      return Response.json(
        {
          success: false,
          error: 'Failed to update categorization rule',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  },
  responses: {
    200: { description: 'Categorization rule updated successfully' },
    400: { description: 'Invalid request body' },
    404: { description: 'Categorization rule not found' },
    500: { description: 'Server error' },
  },
});

/**
 * DELETE /api/categorization-rules/[id]
 * Delete a categorization rule
 */
export const { DELETE } = defineRoute({
  operationId: 'deleteCategorizationRule',
  method: 'DELETE',
  summary: 'Delete a categorization rule',
  description: 'Delete a categorization rule by its ID',
  tags: ['Categorization Rules'],
  pathParams,
  action: async ({ pathParams: { id } }) => {
    try {
      await deleteCategorizationRule(id);

      return Response.json({
        success: true,
        message: 'Categorization rule deleted successfully',
      });
    } catch (error: unknown) {
      console.error('Error deleting categorization rule:', error);

      if (error instanceof Object && 'code' in error && error.code === 'P2025') {
        return Response.json(
          {
            success: false,
            error: 'Categorization rule not found',
          },
          { status: 404 }
        );
      }

      return Response.json(
        {
          success: false,
          error: 'Failed to delete categorization rule',
        },
        { status: 500 }
      );
    }
  },
  responses: {
    200: { description: 'Categorization rule deleted successfully' },
    404: { description: 'Categorization rule not found' },
    500: { description: 'Server error' },
  },
});
