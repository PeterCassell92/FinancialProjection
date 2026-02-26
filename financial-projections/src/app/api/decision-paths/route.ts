import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import {
  getAllDecisionPaths,
  createDecisionPath,
  getDecisionPathsWithUsage,
} from '@/lib/dal/decision-paths';
import {
  DecisionPathsGetResponseSchema,
  DecisionPathCreateRequestSchema,
  DecisionPathCreateResponseSchema,
} from '@/lib/schemas';

/**
 * GET /api/decision-paths
 * Get all decision paths with optional usage statistics
 */
export const { GET } = defineRoute({
  operationId: 'getDecisionPaths',
  method: 'GET',
  summary: 'Get all decision paths',
  description: 'Get all decision paths with optional usage statistics',
  tags: ['Decision Paths'],
  queryParams: z.object({
    includeUsage: z.string().optional(),
  }),
  action: async ({ queryParams }) => {
    try {
      const includeUsage = queryParams?.includeUsage === 'true';

      let decisionPaths;
      if (includeUsage) {
        decisionPaths = await getDecisionPathsWithUsage();
      } else {
        decisionPaths = await getAllDecisionPaths();
      }

      const serializedData = decisionPaths.map(dp => ({
        id: dp.id,
        name: dp.name,
        description: dp.description,
        createdAt: dp.createdAt.toISOString(),
      }));

      return Response.json({ success: true, data: serializedData });
    } catch (error) {
      console.error('Error fetching decision paths:', error);
      return Response.json(
        { success: false, error: 'Failed to fetch decision paths' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'List of decision paths retrieved successfully',
      content: DecisionPathsGetResponseSchema,
    },
    500: { description: 'Server error' },
  },
});

/**
 * POST /api/decision-paths
 * Create a new decision path
 */
export const { POST } = defineRoute({
  operationId: 'createDecisionPath',
  method: 'POST',
  summary: 'Create a new decision path',
  description: 'Create a new decision path with name and optional description',
  tags: ['Decision Paths'],
  requestBody: DecisionPathCreateRequestSchema,
  action: async ({ body }) => {
    try {
      const decisionPath = await createDecisionPath(body.name, body.description);

      const serializedData = {
        id: decisionPath.id,
        name: decisionPath.name,
        description: decisionPath.description,
        createdAt: decisionPath.createdAt.toISOString(),
      };

      return Response.json({
        success: true,
        data: serializedData,
        message: 'Decision path created successfully',
      });
    } catch (error) {
      console.error('Error creating decision path:', error);
      return Response.json(
        { success: false, error: 'Failed to create decision path' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Decision path created successfully',
      content: DecisionPathCreateResponseSchema,
    },
    400: { description: 'Invalid request body' },
    500: { description: 'Server error' },
  },
});
