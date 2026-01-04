import { NextRequest, NextResponse } from 'next/server';
import {
  getScenarioSetById,
  updateScenarioSet,
  updateScenarioSetDecisionPaths,
  deleteScenarioSet,
  getActiveScenarioState,
} from '@/lib/dal/scenario-sets';
import { ApiResponse } from '@/types';

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
      const response: ApiResponse = {
        success: false,
        error: 'Scenario set not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    let responseData: any = scenarioSet;

    if (includeActiveState) {
      const activeState = await getActiveScenarioState(id);
      responseData = {
        ...scenarioSet,
        activeState,
      };
    }

    const response: ApiResponse = {
      success: true,
      data: responseData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching scenario set:', error);
    const response: ApiResponse = {
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

    let scenarioSet;

    // If decisionPathStates is provided, update those
    if (body.decisionPathStates) {
      scenarioSet = await updateScenarioSetDecisionPaths(
        id,
        body.decisionPathStates
      );
    } else {
      // Otherwise update name/description
      const updates: { name?: string; description?: string } = {};
      if (body.name !== undefined) {
        updates.name = body.name;
      }
      if (body.description !== undefined) {
        updates.description = body.description;
      }

      scenarioSet = await updateScenarioSet(id, updates);
    }

    const response: ApiResponse = {
      success: true,
      data: scenarioSet,
      message: 'Scenario set updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating scenario set:', error);
    const response: ApiResponse = {
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
      const response: ApiResponse = {
        success: false,
        error: 'Cannot delete the default scenario set',
      };
      return NextResponse.json(response, { status: 400 });
    }

    await deleteScenarioSet(id);

    const response: ApiResponse = {
      success: true,
      message: 'Scenario set deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting scenario set:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete scenario set',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
