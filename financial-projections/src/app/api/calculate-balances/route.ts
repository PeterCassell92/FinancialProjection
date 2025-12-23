import { NextRequest, NextResponse } from 'next/server';
import { calculateDailyBalances, recalculateBalancesFrom } from '@/lib/calculations/balance-calculator';
import { ApiResponse, CalculateBalancesRequest } from '@/types';

/**
 * POST /api/calculate-balances
 * Trigger balance calculation for a date range
 */
export async function POST(request: NextRequest) {
  try {
    const body: CalculateBalancesRequest = await request.json();

    if (!body.startDate || !body.endDate) {
      const response: ApiResponse = {
        success: false,
        error: 'startDate and endDate are required',
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

    // Calculate balances
    await calculateDailyBalances(startDate, endDate);

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
