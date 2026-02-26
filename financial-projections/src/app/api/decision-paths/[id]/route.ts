import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import {
  getDecisionPathById,
  updateDecisionPath,
  deleteDecisionPath,
} from '@/lib/dal/decision-paths';
import {
  DecisionPathGetResponseSchema,
  DecisionPathUpdateRequestSchema,
  DecisionPathUpdateResponseSchema,
  DecisionPathDeleteResponseSchema,
} from '@/lib/schemas';

const pathParams = z.object({ id: z.string() });

/**
 * GET /api/decision-paths/[id]
 * Get a specific decision path by ID
 */
export const { GET } = defineRoute({
  operationId: 'getDecisionPathById',
  method: 'GET',
  summary: 'Get a decision path by ID',
  description: 'Get a specific decision path by its ID',
  tags: ['Decision Paths'],
  pathParams,
  action: async ({ pathParams: { id } }) => {
    try {
      const decisionPath = await getDecisionPathById(id);

      if (!decisionPath) {
        return Response.json(
          { success: false, error: 'Decision path not found' },
          { status: 404 }
        );
      }

      const serializedData = {
        id: decisionPath.id,
        name: decisionPath.name,
        description: decisionPath.description,
        createdAt: decisionPath.createdAt.toISOString(),
      };

      return Response.json({ success: true, data: serializedData });
    } catch (error) {
      console.error('Error fetching decision path:', error);
      return Response.json(
        { success: false, error: 'Failed to fetch decision path' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Decision path retrieved successfully',
      content: DecisionPathGetResponseSchema,
    },
    404: { description: 'Decision path not found' },
    500: { description: 'Server error' },
  },
});

/**
 * PATCH /api/decision-paths/[id]
 * Update a decision path
 */
export const { PATCH } = defineRoute({
  operationId: 'updateDecisionPath',
  method: 'PATCH',
  summary: 'Update a decision path',
  description: 'Update a decision path by its ID',
  tags: ['Decision Paths'],
  pathParams,
  requestBody: DecisionPathUpdateRequestSchema,
  action: async ({ pathParams: { id }, body }) => {
    try {
      const updates: { name?: string; description?: string } = {};
      if (body.name !== undefined) {
        updates.name = body.name;
      }
      if (body.description !== undefined) {
        updates.description = body.description ?? undefined;
      }

      const decisionPath = await updateDecisionPath(id, updates);

      const serializedData = {
        id: decisionPath.id,
        name: decisionPath.name,
        description: decisionPath.description,
        createdAt: decisionPath.createdAt.toISOString(),
      };

      return Response.json({
        success: true,
        data: serializedData,
        message: 'Decision path updated successfully',
      });
    } catch (error) {
      console.error('Error updating decision path:', error);
      return Response.json(
        { success: false, error: 'Failed to update decision path' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Decision path updated successfully',
      content: DecisionPathUpdateResponseSchema,
    },
    400: { description: 'Invalid request body' },
    404: { description: 'Decision path not found' },
    500: { description: 'Server error' },
  },
});

/**
 * DELETE /api/decision-paths/[id]
 * Delete a decision path
 */
export const { DELETE } = defineRoute({
  operationId: 'deleteDecisionPath',
  method: 'DELETE',
  summary: 'Delete a decision path',
  description: 'Delete a decision path by its ID',
  tags: ['Decision Paths'],
  pathParams,
  action: async ({ pathParams: { id } }) => {
    try {
      await deleteDecisionPath(id);

      return Response.json({
        success: true,
        message: 'Decision path deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting decision path:', error);
      return Response.json(
        { success: false, error: 'Failed to delete decision path' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Decision path deleted successfully',
      content: DecisionPathDeleteResponseSchema,
    },
    404: { description: 'Decision path not found' },
    500: { description: 'Server error' },
  },
});
