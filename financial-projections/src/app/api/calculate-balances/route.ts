import { NextRequest, NextResponse } from 'next/server';
import { calculateDailyBalances, recalculateBalancesFrom } from '@/lib/calculations/balance-calculator';
import {
  CalculateBalancesRequestSchema,
  CalculateBalancesResponse,
} from '@/lib/schemas';

/**
 * POST /api/calculate-balances
 * Trigger balance calculation for a date range
 *
 * Body:
 * - startDate: string (required) - ISO date string
 * - endDate: string (required) - ISO date string
 * - bankAccountId: string (required)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod
    const validation = CalculateBalancesRequestSchema.safeParse(body);
    if (!validation.success) {
      const response: CalculateBalancesResponse = {
        success: false,
        error: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
      return NextResponse.json(response, { status: 400 });
    }

    const validatedData = validation.data;

    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    // Calculate balances for the specified bank account
    await calculateDailyBalances(startDate, endDate, validatedData.bankAccountId);

    const response: CalculateBalancesResponse = {
      success: true,
      message: `Balances calculated successfully from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error calculating balances:', error);
    const response: CalculateBalancesResponse = {
      success: false,
      error: 'Failed to calculate balances',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
