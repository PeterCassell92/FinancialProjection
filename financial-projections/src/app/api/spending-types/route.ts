import { NextRequest, NextResponse } from 'next/server';
import {
  getAllSpendingTypes,
  getSpendingTypesWithCounts,
  createSpendingType,
  CreateSpendingTypeInput,
} from '@/lib/dal/spending-types';
import {
  SpendingTypesGetResponse,
  SpendingTypeCreateRequestSchema,
  SpendingTypeCreateResponse,
} from '@/lib/schemas';

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

    // Serialize the data
    const serializedData = spendingTypes.map(st => ({
      id: st.id,
      name: st.name,
      description: st.description,
      color: st.color,
      createdAt: st.createdAt.toISOString(),
      updatedAt: st.updatedAt.toISOString(),
    }));

    const response: SpendingTypesGetResponse = {
      success: true,
      data: serializedData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching spending types:', error);
    const response: SpendingTypesGetResponse = {
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

    // Validate request body with Zod
    const validation = SpendingTypeCreateRequestSchema.safeParse(body);
    if (!validation.success) {
      const response: SpendingTypeCreateResponse = {
        success: false,
        error: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
      return NextResponse.json(response, { status: 400 });
    }

    const validatedData = validation.data;
    const input: CreateSpendingTypeInput = {
      name: validatedData.name,
      description: validatedData.description,
      color: validatedData.color,
    };

    const spendingType = await createSpendingType(input);

    // Serialize the response
    const serializedData = {
      id: spendingType.id,
      name: spendingType.name,
      description: spendingType.description,
      color: spendingType.color,
      createdAt: spendingType.createdAt.toISOString(),
      updatedAt: spendingType.updatedAt.toISOString(),
    };

    const response: SpendingTypeCreateResponse = {
      success: true,
      data: serializedData,
      message: 'Spending type created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Error creating spending type:', error);

    // Check for unique constraint violation
    if (error.code === 'P2002') {
      const response: SpendingTypeCreateResponse = {
        success: false,
        error: 'Spending type with this name already exists',
      };
      return NextResponse.json(response, { status: 409 });
    }

    const response: SpendingTypeCreateResponse = {
      success: false,
      error: 'Failed to create spending type',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
