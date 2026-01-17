import { NextRequest, NextResponse } from 'next/server';
import { calculateDailyBalances, recalculateBalancesFrom } from '@/lib/calculations/balance-calculator';
import { ApiResponse, CalculateBalancesRequest } from '@/types';

/**
 * POST /api/calculate-balances
 * Trigger balance calculation for a date range
 *
 * Body can include:
 * - startDate: string (required)
 * - endDate: string (required)
 * - bankAccountId: string (required)
 * - enabledDecisionPathIds: string[] (optional) - IDs of decision paths that are enabled
 */
export async function POST(request: NextRequest) {
  try {
    const body: CalculateBalancesRequest & { enabledDecisionPathIds?: string[], bankAccountId: string } = await request.json();

    if (!body.startDate || !body.endDate || !body.bankAccountId) {
      const response: ApiResponse = {
        success: false,
        error: 'startDate, endDate, and bankAccountId are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid date format',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (startDate > endDate) {
      const response: ApiResponse = {
        success: false,
        error: 'startDate must be before or equal to endDate',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Convert enabled decision path IDs array to Set (if provided)
    const enabledDecisionPathIds = body.enabledDecisionPathIds
      ? new Set(body.enabledDecisionPathIds)
      : undefined;

    // Calculate balances with decision path filtering for the specified bank account
    await calculateDailyBalances(startDate, endDate, body.bankAccountId, enabledDecisionPathIds);

    const response: ApiResponse = {
      success: true,
      message: `Balances calculated successfully from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error calculating balances:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to calculate balances',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
