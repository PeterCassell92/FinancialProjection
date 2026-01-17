import { NextRequest, NextResponse } from 'next/server';
import {
  getDailyBalance,
  getDailyBalances,
  setActualBalance,
  clearActualBalance,
} from '@/lib/dal/daily-balance';
import { ApiResponse, SetActualBalanceRequest } from '@/types';

/**
 * GET /api/daily-balance
 * Get daily balances for a date range or specific date
 * Query params: startDate, endDate, bankAccountId OR date, bankAccountId
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const dateParam = searchParams.get('date');
    const bankAccountId = searchParams.get('bankAccountId');

    if (!bankAccountId) {
      const response: ApiResponse = {
        success: false,
        error: 'bankAccountId query parameter is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (dateParam) {
      // Get balance for a specific date and bank account
      const date = new Date(dateParam);
      const balance = await getDailyBalance(date, bankAccountId);

      if (!balance) {
        const response: ApiResponse = {
          success: false,
          error: 'Daily balance not found for this date and bank account',
        };
        return NextResponse.json(response, { status: 404 });
      }

      const response: ApiResponse = {
        success: true,
        data: {
          id: balance.id,
          date: balance.date,
          expectedBalance: parseFloat(balance.expectedBalance.toString()),
          actualBalance: balance.actualBalance
            ? parseFloat(balance.actualBalance.toString())
            : undefined,
          createdAt: balance.createdAt,
          updatedAt: balance.updatedAt,
        },
      };

      return NextResponse.json(response);
    }

    if (!startDateParam || !endDateParam) {
      const response: ApiResponse = {
        success: false,
        error: 'startDate and endDate query parameters are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    const balances = await getDailyBalances(startDate, endDate, bankAccountId);

    const response: ApiResponse = {
      success: true,
      data: balances.map((balance) => ({
        id: balance.id,
        date: balance.date,
        expectedBalance: parseFloat(balance.expectedBalance.toString()),
        actualBalance: balance.actualBalance
          ? parseFloat(balance.actualBalance.toString())
          : undefined,
        createdAt: balance.createdAt,
        updatedAt: balance.updatedAt,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching daily balances:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch daily balances',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PUT /api/daily-balance
 * Set actual balance for a specific date and bank account
 */
export async function PUT(request: NextRequest) {
  try {
    const body: SetActualBalanceRequest & { bankAccountId: string } = await request.json();

    if (!body.date || typeof body.actualBalance !== 'number' || !body.bankAccountId) {
      const response: ApiResponse = {
        success: false,
        error: 'date, actualBalance, and bankAccountId are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const date = new Date(body.date);
    const balance = await setActualBalance(date, body.bankAccountId, body.actualBalance);

    // Recalculate balances from the next day forward (6 months) for this bank account
    const { addDays, addMonths } = await import('date-fns');
    const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');

    const nextDay = addDays(date, 1);
    const endDate = addMonths(nextDay, 6);
    await recalculateBalancesFrom(nextDay, endDate, body.bankAccountId);

    const response: ApiResponse = {
      success: true,
      data: {
        id: balance.id,
        date: balance.date,
        expectedBalance: parseFloat(balance.expectedBalance.toString()),
        actualBalance: balance.actualBalance
          ? parseFloat(balance.actualBalance.toString())
          : undefined,
        createdAt: balance.createdAt,
        updatedAt: balance.updatedAt,
      },
      message: 'Actual balance set successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error setting actual balance:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to set actual balance',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/daily-balance
 * Clear actual balance for a specific date and bank account
 * Query params: date, bankAccountId
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const bankAccountId = searchParams.get('bankAccountId');

    if (!dateParam || !bankAccountId) {
      const response: ApiResponse = {
        success: false,
        error: 'date and bankAccountId query parameters are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const date = new Date(dateParam);
    await clearActualBalance(date, bankAccountId);

    // Recalculate balances from this day forward (6 months) for this bank account
    const { addMonths } = await import('date-fns');
    const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');

    const endDate = addMonths(date, 6);
    await recalculateBalancesFrom(date, endDate, bankAccountId);

    const response: ApiResponse = {
      success: true,
      message: 'Actual balance cleared successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error clearing actual balance:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to clear actual balance',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
