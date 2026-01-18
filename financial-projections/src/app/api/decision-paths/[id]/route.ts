import { NextRequest, NextResponse } from 'next/server';
import {
  getDecisionPathById,
  updateDecisionPath,
  deleteDecisionPath,
} from '@/lib/dal/decision-paths';
import {
  DecisionPathGetResponse,
  DecisionPathUpdateRequestSchema,
  DecisionPathUpdateResponse,
  DecisionPathDeleteResponse,
} from '@/lib/schemas';

/**
 * GET /api/decision-paths/[id]
 * Get a specific decision path by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decisionPath = await getDecisionPathById(id);

    if (!decisionPath) {
      const response: DecisionPathGetResponse = {
        success: false,
        error: 'Decision path not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Serialize the data
    const serializedData = {
      id: decisionPath.id,
      name: decisionPath.name,
      description: decisionPath.description,
      createdAt: decisionPath.createdAt.toISOString(),
    };

    const response: DecisionPathGetResponse = {
      success: true,
      data: serializedData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching decision path:', error);
    const response: DecisionPathGetResponse = {
      success: false,
      error: 'Failed to fetch decision path',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PATCH /api/decision-paths/[id]
 * Update a decision path
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body with Zod
    const validation = DecisionPathUpdateRequestSchema.safeParse(body);
    if (!validation.success) {
      const response: DecisionPathUpdateResponse = {
        success: false,
        error: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
      return NextResponse.json(response, { status: 400 });
    }

    const validatedData = validation.data;
    const updates: { name?: string; description?: string } = {};
    if (validatedData.name !== undefined) {
      updates.name = validatedData.name;
    }
    if (validatedData.description !== undefined) {
      updates.description = validatedData.description ?? undefined;
    }

    const decisionPath = await updateDecisionPath(id, updates);

    // Serialize the response
    const serializedData = {
      id: decisionPath.id,
      name: decisionPath.name,
      description: decisionPath.description,
      createdAt: decisionPath.createdAt.toISOString(),
    };

    const response: DecisionPathUpdateResponse = {
      success: true,
      data: serializedData,
      message: 'Decision path updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating decision path:', error);
    const response: DecisionPathUpdateResponse = {
      success: false,
      error: 'Failed to update decision path',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/decision-paths/[id]
 * Delete a decision path
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteDecisionPath(id);

    const response: DecisionPathDeleteResponse = {
      success: true,
      message: 'Decision path deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting decision path:', error);
    const response: DecisionPathDeleteResponse = {
      success: false,
      error: 'Failed to delete decision path',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
