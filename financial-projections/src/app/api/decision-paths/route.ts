import { NextRequest, NextResponse } from 'next/server';
import {
  getAllDecisionPaths,
  createDecisionPath,
  getDecisionPathsWithUsage,
} from '@/lib/dal/decision-paths';
import {
  DecisionPathsGetResponse,
  DecisionPathCreateRequestSchema,
  DecisionPathCreateResponse,
} from '@/lib/schemas';

/**
 * GET /api/decision-paths
 * Get all decision paths with optional usage statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeUsage = searchParams.get('includeUsage') === 'true';

    let decisionPaths;
    if (includeUsage) {
      decisionPaths = await getDecisionPathsWithUsage();
    } else {
      decisionPaths = await getAllDecisionPaths();
    }

    // Serialize the data
    const serializedData = decisionPaths.map(dp => ({
      id: dp.id,
      name: dp.name,
      description: dp.description,
      createdAt: dp.createdAt.toISOString(),
    }));

    const response: DecisionPathsGetResponse = {
      success: true,
      data: serializedData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching decision paths:', error);
    const response: DecisionPathsGetResponse = {
      success: false,
      error: 'Failed to fetch decision paths',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/decision-paths
 * Create a new decision path
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod
    const validation = DecisionPathCreateRequestSchema.safeParse(body);
    if (!validation.success) {
      const response: DecisionPathCreateResponse = {
        success: false,
        error: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
      return NextResponse.json(response, { status: 400 });
    }

    const validatedData = validation.data;
    const decisionPath = await createDecisionPath(
      validatedData.name,
      validatedData.description
    );

    // Serialize the response
    const serializedData = {
      id: decisionPath.id,
      name: decisionPath.name,
      description: decisionPath.description,
      createdAt: decisionPath.createdAt.toISOString(),
    };

    const response: DecisionPathCreateResponse = {
      success: true,
      data: serializedData,
      message: 'Decision path created successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating decision path:', error);
    const response: DecisionPathCreateResponse = {
      success: false,
      error: 'Failed to create decision path',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
