import { NextRequest, NextResponse } from 'next/server';
import {
  getAllScenarioSets,
  createScenarioSet,
  getOrCreateDefaultScenarioSet,
} from '@/lib/dal/scenario-sets';
import { ApiResponse } from '@/types';

/**
 * GET /api/scenario-sets
 * Get all scenario sets
 */
export async function GET() {
  try {
    // Ensure default scenario exists
    await getOrCreateDefaultScenarioSet();

    const scenarioSets = await getAllScenarioSets();

    const response: ApiResponse = {
      success: true,
      data: scenarioSets,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching scenario sets:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch scenario sets',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/scenario-sets
 * Create a new scenario set
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string') {
      const response: ApiResponse = {
        success: false,
        error: 'name is required and must be a string',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (!body.decisionPathStates || typeof body.decisionPathStates !== 'object') {
      const response: ApiResponse = {
        success: false,
        error: 'decisionPathStates is required and must be an object mapping decision path IDs to boolean values',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const scenarioSet = await createScenarioSet(
      body.name,
      body.decisionPathStates,
      body.description,
      body.isDefault || false
    );

    const response: ApiResponse = {
      success: true,
      data: scenarioSet,
      message: 'Scenario set created successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating scenario set:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create scenario set',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
