import { NextRequest, NextResponse } from 'next/server';
import {
  getAllCategorizationRules,
  createCategorizationRule,
  CreateCategorizationRuleInput,
} from '@/lib/dal/categorization-rules';

/**
 * GET /api/categorization-rules
 * Get all categorization rules with their spending types
 */
export async function GET() {
  try {
    const rules = await getAllCategorizationRules();

    return NextResponse.json({
      success: true,
      data: rules.map((rule) => ({
        id: rule.id,
        descriptionString: rule.descriptionString,
        exactMatch: rule.exactMatch,
        spendingTypes: rule.spendingTypes.map((st) => ({
          id: st.spendingType.id,
          name: st.spendingType.name,
        })),
        createdAt: rule.createdAt.toISOString(),
        updatedAt: rule.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching categorization rules:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categorization rules',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categorization-rules
 * Create a new categorization rule
 *
 * Body:
 * {
 *   descriptionString: string;
 *   exactMatch: boolean;
 *   spendingTypeIds: string[];
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.descriptionString || typeof body.descriptionString !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid required field: descriptionString',
        },
        { status: 400 }
      );
    }

    if (typeof body.exactMatch !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid required field: exactMatch (must be boolean)',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.spendingTypeIds) || body.spendingTypeIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid required field: spendingTypeIds (must be non-empty array)',
        },
        { status: 400 }
      );
    }

    const input: CreateCategorizationRuleInput = {
      descriptionString: body.descriptionString,
      exactMatch: body.exactMatch,
      spendingTypeIds: body.spendingTypeIds,
    };

    const rule = await createCategorizationRule(input);

    return NextResponse.json(
      {
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
        message: 'Categorization rule created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating categorization rule:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create categorization rule',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
