import { NextRequest, NextResponse } from 'next/server';
import {
  getDailyBalance,
  getDailyBalances,
  setActualBalance,
  clearActualBalance,
} from '@/lib/dal/daily-balance';
import {
  DailyBalanceGetResponse,
  DailyBalancesGetResponse,
  DailyBalanceSetActualRequestSchema,
  DailyBalanceSetActualResponse,
} from '@/lib/schemas';

// Define a simple response type for DELETE operations
type ApiResponse = {
  success: boolean;
  error?: string;
  message?: string;
};

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
      const response: DailyBalancesGetResponse = {
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
        const response: DailyBalanceGetResponse = {
          success: false,
          error: 'Daily balance not found for this date and bank account',
        };
        return NextResponse.json(response, { status: 404 });
      }

      // Serialize the data
      const serializedData = {
        id: balance.id,
        date: balance.date.toISOString(),
        expectedBalance: parseFloat(balance.expectedBalance.toString()),
        actualBalance: balance.actualBalance
          ? parseFloat(balance.actualBalance.toString())
          : null,
        bankAccountId: balance.bankAccountId,
        createdAt: balance.createdAt.toISOString(),
        updatedAt: balance.updatedAt.toISOString(),
      };

      const response: DailyBalanceGetResponse = {
        success: true,
        data: serializedData,
      };

      return NextResponse.json(response);
    }

    if (!startDateParam || !endDateParam) {
      const response: DailyBalancesGetResponse = {
        success: false,
        error: 'startDate and endDate query parameters are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    const balances = await getDailyBalances(startDate, endDate, bankAccountId);

    // Serialize the data
    const serializedData = balances.map((balance) => ({
      id: balance.id,
      date: balance.date.toISOString(),
      expectedBalance: parseFloat(balance.expectedBalance.toString()),
      actualBalance: balance.actualBalance
        ? parseFloat(balance.actualBalance.toString())
        : null,
      bankAccountId: balance.bankAccountId,
      createdAt: balance.createdAt.toISOString(),
      updatedAt: balance.updatedAt.toISOString(),
    }));

    const response: DailyBalancesGetResponse = {
      success: true,
      data: serializedData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching daily balances:', error);
    const response: DailyBalancesGetResponse = {
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
    const body = await request.json();

    // Validate request body with Zod
    const validation = DailyBalanceSetActualRequestSchema.safeParse(body);
    if (!validation.success) {
      const response: DailyBalanceSetActualResponse = {
        success: false,
        error: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
      return NextResponse.json(response, { status: 400 });
    }

    const validatedData = validation.data;

    const date = new Date(validatedData.date);
    const balance = await setActualBalance(date, validatedData.bankAccountId, validatedData.actualBalance);

    // Recalculate balances from the next day forward (6 months) for this bank account
    const { addDays, addMonths } = await import('date-fns');
    const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');

    const nextDay = addDays(date, 1);
    const endDate = addMonths(nextDay, 6);
    await recalculateBalancesFrom(nextDay, endDate, validatedData.bankAccountId);

    // Serialize the response
    const serializedData = {
      id: balance.id,
      date: balance.date.toISOString(),
      expectedBalance: parseFloat(balance.expectedBalance.toString()),
      actualBalance: balance.actualBalance
        ? parseFloat(balance.actualBalance.toString())
        : null,
      bankAccountId: balance.bankAccountId,
      createdAt: balance.createdAt.toISOString(),
      updatedAt: balance.updatedAt.toISOString(),
    };

    const response: DailyBalanceSetActualResponse = {
      success: true,
      data: serializedData,
      message: 'Actual balance set successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error setting actual balance:', error);
    const response: DailyBalanceSetActualResponse = {
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
