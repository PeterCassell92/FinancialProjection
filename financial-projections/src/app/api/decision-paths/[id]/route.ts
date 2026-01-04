import { NextRequest, NextResponse } from 'next/server';
import {
  getDecisionPathById,
  updateDecisionPath,
  deleteDecisionPath,
} from '@/lib/dal/decision-paths';
import { ApiResponse } from '@/types';

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
      const response: ApiResponse = {
        success: false,
        error: 'Decision path not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      data: decisionPath,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching decision path:', error);
    const response: ApiResponse = {
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

    const updates: { name?: string; description?: string } = {};
    if (body.name !== undefined) {
      updates.name = body.name;
    }
    if (body.description !== undefined) {
      updates.description = body.description;
    }

    const decisionPath = await updateDecisionPath(id, updates);

    const response: ApiResponse = {
      success: true,
      data: decisionPath,
      message: 'Decision path updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating decision path:', error);
    const response: ApiResponse = {
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

    const response: ApiResponse = {
      success: true,
      message: 'Decision path deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting decision path:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete decision path',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
