import { NextRequest, NextResponse } from 'next/server';
import {
  getScenarioSetById,
  updateScenarioSet,
  updateScenarioSetDecisionPaths,
  deleteScenarioSet,
  getActiveScenarioState,
} from '@/lib/dal/scenario-sets';
import {
  ScenarioSetGetResponse,
  ScenarioSetUpdateRequestSchema,
  ScenarioSetUpdateResponse,
  ScenarioSetDeleteResponse,
} from '@/lib/schemas';

/**
 * GET /api/scenario-sets/[id]
 * Get a specific scenario set by ID
 * Query param: includeActiveState=true to merge with all current decision paths
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeActiveState = searchParams.get('includeActiveState') === 'true';

    const scenarioSet = await getScenarioSetById(id);

    if (!scenarioSet) {
      const response: ScenarioSetGetResponse = {
        success: false,
        error: 'Scenario set not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Serialize the scenario set data
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

    const response: ScenarioSetGetResponse = {
      success: true,
      data: serializedData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching scenario set:', error);
    const response: ScenarioSetGetResponse = {
      success: false,
      error: 'Failed to fetch scenario set',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PATCH /api/scenario-sets/[id]
 * Update a scenario set's name/description or decision path states
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body with Zod
    const validation = ScenarioSetUpdateRequestSchema.safeParse(body);
    if (!validation.success) {
      const response: ScenarioSetUpdateResponse = {
        success: false,
        error: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
      return NextResponse.json(response, { status: 400 });
    }

    const validatedData = validation.data;
    let scenarioSet;

    // If decisionPaths is provided, update those
    if (validatedData.decisionPaths) {
      // Convert array to Record<string, boolean>
      const decisionPathStates: Record<string, boolean> = {};
      validatedData.decisionPaths.forEach(dp => {
        decisionPathStates[dp.decisionPathId] = dp.enabled;
      });

      scenarioSet = await updateScenarioSetDecisionPaths(
        id,
        decisionPathStates
      );
    } else {
      // Otherwise update name/description
      const updates: { name?: string; description?: string; isDefault?: boolean } = {};
      if (validatedData.name !== undefined) {
        updates.name = validatedData.name;
      }
      if (validatedData.description !== undefined) {
        updates.description = validatedData.description ?? undefined;
      }
      if (validatedData.isDefault !== undefined) {
        updates.isDefault = validatedData.isDefault;
      }

      scenarioSet = await updateScenarioSet(id, updates);
    }

    if (!scenarioSet) {
      const response: ScenarioSetUpdateResponse = {
        success: false,
        error: 'Scenario set not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Serialize the response
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

    const response: ScenarioSetUpdateResponse = {
      success: true,
      data: serializedData,
      message: 'Scenario set updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating scenario set:', error);
    const response: ScenarioSetUpdateResponse = {
      success: false,
      error: 'Failed to update scenario set',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/scenario-sets/[id]
 * Delete a scenario set
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if this is the default scenario
    const scenarioSet = await getScenarioSetById(id);

    if (scenarioSet?.isDefault) {
      const response: ScenarioSetDeleteResponse = {
        success: false,
        error: 'Cannot delete the default scenario set',
      };
      return NextResponse.json(response, { status: 400 });
    }

    await deleteScenarioSet(id);

    const response: ScenarioSetDeleteResponse = {
      success: true,
      message: 'Scenario set deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting scenario set:', error);
    const response: ScenarioSetDeleteResponse = {
      success: false,
      error: 'Failed to delete scenario set',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
