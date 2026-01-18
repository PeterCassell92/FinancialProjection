import { NextRequest, NextResponse } from 'next/server';
import {
  getSpendingTypeById,
  updateSpendingType,
  deleteSpendingType,
  UpdateSpendingTypeInput,
} from '@/lib/dal/spending-types';
import {
  SpendingTypeGetResponse,
  SpendingTypeUpdateRequestSchema,
  SpendingTypeUpdateResponse,
  SpendingTypeDeleteResponse,
} from '@/lib/schemas';

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
      const response: SpendingTypeGetResponse = {
        success: false,
        error: 'Spending type not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Serialize the data
    const serializedData = {
      id: spendingType.id,
      name: spendingType.name,
      description: spendingType.description,
      color: spendingType.color,
      createdAt: spendingType.createdAt.toISOString(),
      updatedAt: spendingType.updatedAt.toISOString(),
    };

    const response: SpendingTypeGetResponse = {
      success: true,
      data: serializedData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching spending type:', error);
    const response: SpendingTypeGetResponse = {
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

    // Validate request body with Zod
    const validation = SpendingTypeUpdateRequestSchema.safeParse(body);
    if (!validation.success) {
      const response: SpendingTypeUpdateResponse = {
        success: false,
        error: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
      return NextResponse.json(response, { status: 400 });
    }

    const validatedData = validation.data;
    const input: UpdateSpendingTypeInput = {
      name: validatedData.name,
      description: validatedData.description ?? undefined,
      color: validatedData.color ?? undefined,
    };

    const spendingType = await updateSpendingType(id, input);

    // Serialize the response
    const serializedData = {
      id: spendingType.id,
      name: spendingType.name,
      description: spendingType.description,
      color: spendingType.color,
      createdAt: spendingType.createdAt.toISOString(),
      updatedAt: spendingType.updatedAt.toISOString(),
    };

    const response: SpendingTypeUpdateResponse = {
      success: true,
      data: serializedData,
      message: 'Spending type updated successfully',
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error updating spending type:', error);

    if (error.code === 'P2025') {
      const response: SpendingTypeUpdateResponse = {
        success: false,
        error: 'Spending type not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    if (error.code === 'P2002') {
      const response: SpendingTypeUpdateResponse = {
        success: false,
        error: 'Spending type with this name already exists',
      };
      return NextResponse.json(response, { status: 409 });
    }

    const response: SpendingTypeUpdateResponse = {
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

    const response: SpendingTypeDeleteResponse = {
      success: true,
      message: 'Spending type deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error deleting spending type:', error);

    if (error.code === 'P2025') {
      const response: SpendingTypeDeleteResponse = {
        success: false,
        error: 'Spending type not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: SpendingTypeDeleteResponse = {
      success: false,
      error: 'Failed to delete spending type',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
