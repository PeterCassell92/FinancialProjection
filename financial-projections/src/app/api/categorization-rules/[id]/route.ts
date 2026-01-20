import { NextRequest, NextResponse } from 'next/server';
import {
  getCategorizationRuleById,
  updateCategorizationRule,
  deleteCategorizationRule,
  UpdateCategorizationRuleInput,
} from '@/lib/dal/categorization-rules';

/**
 * GET /api/categorization-rules/[id]
 * Get a specific categorization rule
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rule = await getCategorizationRuleById(id);

    if (!rule) {
      return NextResponse.json(
        {
          success: false,
          error: 'Categorization rule not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: rule.id,
        descriptionString: rule.descriptionString,
        exactMatch: rule.exactMatch,
        spendingTypes: rule.spendingTypes.map((st) => ({
          id: st.spendingType.id,
          name: st.spendingType.name,
        })),
        createdAt: rule.createdAt.toISOString(),
        updatedAt: rule.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching categorization rule:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categorization rule',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/categorization-rules/[id]
 * Update a categorization rule
 *
 * Body (all fields optional):
 * {
 *   descriptionString?: string;
 *   exactMatch?: boolean;
 *   spendingTypeIds?: string[];
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate types if provided
    if (body.descriptionString !== undefined && typeof body.descriptionString !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid field: descriptionString must be a string',
        },
        { status: 400 }
      );
    }

    if (body.exactMatch !== undefined && typeof body.exactMatch !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid field: exactMatch must be a boolean',
        },
        { status: 400 }
      );
    }

    if (body.spendingTypeIds !== undefined && !Array.isArray(body.spendingTypeIds)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid field: spendingTypeIds must be an array',
        },
        { status: 400 }
      );
    }

    const input: UpdateCategorizationRuleInput = {
      descriptionString: body.descriptionString,
      exactMatch: body.exactMatch,
      spendingTypeIds: body.spendingTypeIds,
    };

    const rule = await updateCategorizationRule(id, input);

    return NextResponse.json({
      success: true,
      data: {
        id: rule.id,
        descriptionString: rule.descriptionString,
        exactMatch: rule.exactMatch,
        spendingTypes: rule.spendingTypes.map((st) => ({
          id: st.spendingType.id,
          name: st.spendingType.name,
        })),
        createdAt: rule.createdAt.toISOString(),
        updatedAt: rule.updatedAt.toISOString(),
      },
      message: 'Categorization rule updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating categorization rule:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: 'Categorization rule not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update categorization rule',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categorization-rules/[id]
 * Delete a categorization rule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteCategorizationRule(id);

    return NextResponse.json({
      success: true,
      message: 'Categorization rule deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting categorization rule:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: 'Categorization rule not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete categorization rule',
      },
      { status: 500 }
    );
  }
}
