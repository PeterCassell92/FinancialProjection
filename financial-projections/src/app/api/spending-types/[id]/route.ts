import { NextRequest, NextResponse } from 'next/server';
import {
  getSpendingTypeById,
  updateSpendingType,
  deleteSpendingType,
  UpdateSpendingTypeInput,
} from '@/lib/dal/spending-types';
import { ApiResponse } from '@/types';

/**
 * GET /api/spending-types/[id]
 * Get a specific spending type
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const spendingType = await getSpendingTypeById(id);

    if (!spendingType) {
      const response: ApiResponse = {
        success: false,
        error: 'Spending type not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      data: spendingType,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching spending type:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch spending type',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PATCH /api/spending-types/[id]
 * Update a spending type
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const input: UpdateSpendingTypeInput = {
      name: body.name,
      description: body.description,
      color: body.color,
    };

    const spendingType = await updateSpendingType(id, input);

    const response: ApiResponse = {
      success: true,
      data: spendingType,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error updating spending type:', error);

    if (error.code === 'P2025') {
      const response: ApiResponse = {
        success: false,
        error: 'Spending type not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    if (error.code === 'P2002') {
      const response: ApiResponse = {
        success: false,
        error: 'Spending type with this name already exists',
      };
      return NextResponse.json(response, { status: 409 });
    }

    const response: ApiResponse = {
      success: false,
      error: 'Failed to update spending type',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/spending-types/[id]
 * Delete a spending type
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteSpendingType(id);

    const response: ApiResponse = {
      success: true,
      message: 'Spending type deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error deleting spending type:', error);

    if (error.code === 'P2025') {
      const response: ApiResponse = {
        success: false,
        error: 'Spending type not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete spending type',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
