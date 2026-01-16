import { NextRequest, NextResponse } from 'next/server';
import {
  getAllSpendingTypes,
  getSpendingTypesWithCounts,
  createSpendingType,
  CreateSpendingTypeInput,
} from '@/lib/dal/spending-types';
import { ApiResponse } from '@/types';

/**
 * GET /api/spending-types
 * Get all spending types, optionally with usage counts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeCounts = searchParams.get('includeCounts') === 'true';

    let spendingTypes;
    if (includeCounts) {
      spendingTypes = await getSpendingTypesWithCounts();
    } else {
      spendingTypes = await getAllSpendingTypes();
    }

    const response: ApiResponse = {
      success: true,
      data: spendingTypes,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching spending types:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch spending types',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/spending-types
 * Create a new spending type
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required field: name',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const input: CreateSpendingTypeInput = {
      name: body.name,
      description: body.description,
      color: body.color,
    };

    const spendingType = await createSpendingType(input);

    const response: ApiResponse = {
      success: true,
      data: spendingType,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Error creating spending type:', error);

    // Check for unique constraint violation
    if (error.code === 'P2002') {
      const response: ApiResponse = {
        success: false,
        error: 'Spending type with this name already exists',
      };
      return NextResponse.json(response, { status: 409 });
    }

    const response: ApiResponse = {
      success: false,
      error: 'Failed to create spending type',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
