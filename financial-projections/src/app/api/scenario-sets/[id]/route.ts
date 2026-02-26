import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import {
  getScenarioSetById,
  updateScenarioSet,
  updateScenarioSetDecisionPaths,
  deleteScenarioSet,
} from '@/lib/dal/scenario-sets';
import {
  ScenarioSetGetResponseSchema,
  ScenarioSetUpdateRequestSchema,
  ScenarioSetUpdateResponseSchema,
  ScenarioSetDeleteResponseSchema,
} from '@/lib/schemas';

const pathParams = z.object({ id: z.string() });

/**
 * GET /api/scenario-sets/[id]
 * Get a specific scenario set by ID
 */
export const { GET } = defineRoute({
  operationId: 'getScenarioSetById',
  method: 'GET',
  summary: 'Get a scenario set by ID',
  description: 'Get a specific scenario set by its ID, optionally with active state',
  tags: ['Scenario Sets'],
  pathParams,
  queryParams: z.object({
    includeActiveState: z.string().optional(),
  }),
  action: async ({ pathParams: { id } }) => {
    try {
      const scenarioSet = await getScenarioSetById(id);

      if (!scenarioSet) {
        return Response.json(
          { success: false, error: 'Scenario set not found' },
          { status: 404 }
        );
      }

      const serializedData = {
        id: scenarioSet.id,
        name: scenarioSet.name,
        description: scenarioSet.description,
        isDefault: scenarioSet.isDefault,
        decisionPaths: scenarioSet.decisionPaths.map(dp => ({
          id: dp.id,
          decisionPathId: dp.decisionPathId,
          enabled: dp.enabled,
          decisionPath: {
            id: dp.decisionPath.id,
            name: dp.decisionPath.name,
            description: dp.decisionPath.description,
          },
        })),
        createdAt: scenarioSet.createdAt.toISOString(),
        updatedAt: scenarioSet.updatedAt.toISOString(),
      };

      return Response.json({ success: true, data: serializedData });
    } catch (error) {
      console.error('Error fetching scenario set:', error);
      return Response.json(
        { success: false, error: 'Failed to fetch scenario set' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Scenario set retrieved successfully',
      content: ScenarioSetGetResponseSchema,
    },
    404: { description: 'Scenario set not found' },
    500: { description: 'Server error' },
  },
});

/**
 * PATCH /api/scenario-sets/[id]
 * Update a scenario set's name/description or decision path states
 */
export const { PATCH } = defineRoute({
  operationId: 'updateScenarioSet',
  method: 'PATCH',
  summary: 'Update a scenario set',
  description: "Update a scenario set's name, description, or decision path states",
  tags: ['Scenario Sets'],
  pathParams,
  requestBody: ScenarioSetUpdateRequestSchema,
  action: async ({ pathParams: { id }, body }) => {
    try {
      let scenarioSet;

      // If decisionPaths is provided, update those
      if (body.decisionPaths) {
        const decisionPathStates: Record<string, boolean> = {};
        body.decisionPaths.forEach((dp: { decisionPathId: string; enabled: boolean }) => {
          decisionPathStates[dp.decisionPathId] = dp.enabled;
        });

        scenarioSet = await updateScenarioSetDecisionPaths(id, decisionPathStates);
      } else {
        const updates: { name?: string; description?: string; isDefault?: boolean } = {};
        if (body.name !== undefined) {
          updates.name = body.name;
        }
        if (body.description !== undefined) {
          updates.description = body.description ?? undefined;
        }
        if (body.isDefault !== undefined) {
          updates.isDefault = body.isDefault;
        }

        scenarioSet = await updateScenarioSet(id, updates);
      }

      if (!scenarioSet) {
        return Response.json(
          { success: false, error: 'Scenario set not found' },
          { status: 404 }
        );
      }

      const serializedData = {
        id: scenarioSet.id,
        name: scenarioSet.name,
        description: scenarioSet.description,
        isDefault: scenarioSet.isDefault,
        decisionPaths: scenarioSet.decisionPaths.map(dp => ({
          id: dp.id,
          decisionPathId: dp.decisionPathId,
          enabled: dp.enabled,
          decisionPath: {
            id: dp.decisionPath.id,
            name: dp.decisionPath.name,
            description: dp.decisionPath.description,
          },
        })),
        createdAt: scenarioSet.createdAt.toISOString(),
        updatedAt: scenarioSet.updatedAt.toISOString(),
      };

      return Response.json({
        success: true,
        data: serializedData,
        message: 'Scenario set updated successfully',
      });
    } catch (error) {
      console.error('Error updating scenario set:', error);
      return Response.json(
        { success: false, error: 'Failed to update scenario set' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Scenario set updated successfully',
      content: ScenarioSetUpdateResponseSchema,
    },
    400: { description: 'Invalid request body' },
    404: { description: 'Scenario set not found' },
    500: { description: 'Server error' },
  },
});

/**
 * DELETE /api/scenario-sets/[id]
 * Delete a scenario set
 */
export const { DELETE } = defineRoute({
  operationId: 'deleteScenarioSet',
  method: 'DELETE',
  summary: 'Delete a scenario set',
  description: 'Delete a scenario set (cannot delete the default scenario set)',
  tags: ['Scenario Sets'],
  pathParams,
  action: async ({ pathParams: { id } }) => {
    try {
      const scenarioSet = await getScenarioSetById(id);

      if (scenarioSet?.isDefault) {
        return Response.json(
          { success: false, error: 'Cannot delete the default scenario set' },
          { status: 400 }
        );
      }

      await deleteScenarioSet(id);

      return Response.json({
        success: true,
        message: 'Scenario set deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting scenario set:', error);
      return Response.json(
        { success: false, error: 'Failed to delete scenario set' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Scenario set deleted successfully',
      content: ScenarioSetDeleteResponseSchema,
    },
    400: { description: 'Cannot delete default scenario set' },
    404: { description: 'Scenario set not found' },
    500: { description: 'Server error' },
  },
});
