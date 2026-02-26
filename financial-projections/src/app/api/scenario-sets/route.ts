import defineRoute from '@omer-x/next-openapi-route-handler';
import {
  getAllScenarioSets,
  createScenarioSet,
  getOrCreateDefaultScenarioSet,
} from '@/lib/dal/scenario-sets';
import {
  ScenarioSetsGetResponseSchema,
  ScenarioSetCreateRequestSchema,
  ScenarioSetCreateResponseSchema,
} from '@/lib/schemas';

/**
 * GET /api/scenario-sets
 * Get all scenario sets
 */
export const { GET } = defineRoute({
  operationId: 'getScenarioSets',
  method: 'GET',
  summary: 'Get all scenario sets',
  description: 'Get all scenario sets, ensuring default scenario exists',
  tags: ['Scenario Sets'],
  action: async () => {
    try {
      // Ensure default scenario exists
      await getOrCreateDefaultScenarioSet();

      const scenarioSets = await getAllScenarioSets();

      return Response.json({ success: true, data: scenarioSets });
    } catch (error) {
      console.error('Error fetching scenario sets:', error);
      return Response.json(
        { success: false, error: 'Failed to fetch scenario sets' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'List of scenario sets retrieved successfully',
      content: ScenarioSetsGetResponseSchema,
    },
    500: { description: 'Server error' },
  },
});

/**
 * POST /api/scenario-sets
 * Create a new scenario set
 */
export const { POST } = defineRoute({
  operationId: 'createScenarioSet',
  method: 'POST',
  summary: 'Create a new scenario set',
  description: 'Create a new scenario set with name and decision path states',
  tags: ['Scenario Sets'],
  requestBody: ScenarioSetCreateRequestSchema,
  action: async ({ body }) => {
    try {
      // Convert decision paths array to Record<string, boolean>
      const decisionPathStates: Record<string, boolean> = {};
      if (body.decisionPaths) {
        body.decisionPaths.forEach((dp: { decisionPathId: string; enabled?: boolean }) => {
          decisionPathStates[dp.decisionPathId] = dp.enabled ?? true;
        });
      }

      const scenarioSet = await createScenarioSet(
        body.name,
        decisionPathStates,
        body.description,
        body.isDefault || false
      );

      return Response.json({
        success: true,
        data: scenarioSet,
        message: 'Scenario set created successfully',
      });
    } catch (error) {
      console.error('Error creating scenario set:', error);
      return Response.json(
        { success: false, error: 'Failed to create scenario set' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Scenario set created successfully',
      content: ScenarioSetCreateResponseSchema,
    },
    400: { description: 'Invalid request body' },
    500: { description: 'Server error' },
  },
});
