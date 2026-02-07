import { NextRequest, NextResponse } from 'next/server';
import { computeBalancesOnTheFly } from '@/lib/calculations/balance-calculator';
import { getLastTransactionBalanceOnOrBefore, getTransactionCoverage } from '@/lib/dal/transaction-records';
import { ComputeBalancesRequestSchema, ComputeBalancesResponse } from '@/lib/schemas';
import { format, startOfDay } from 'date-fns';

/**
 * POST /api/compute-balances
 * Compute daily balances on-the-fly WITHOUT storing them.
 * Supports what-if analysis with different starting dates and decision path combinations.
 *
 * Body:
 * - startDate: string (YYYY-MM-DD) - Start of the date range
 * - endDate: string (YYYY-MM-DD) - End of the date range
 * - bankAccountId: string - The bank account to compute for
 * - useTrueBalanceFromDate: string (YYYY-MM-DD) - Starting point date within transaction coverage
 * - enabledDecisionPathIds?: string[] - Optional list of enabled decision path IDs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = ComputeBalancesRequestSchema.safeParse(body);
    if (!validation.success) {
      const response: ComputeBalancesResponse = {
        success: false,
        error: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
      return NextResponse.json(response, { status: 400 });
    }

    const { startDate, endDate, bankAccountId, useTrueBalanceFromDate, enabledDecisionPathIds } = validation.data;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const trueBalanceDate = new Date(useTrueBalanceFromDate);

    // Get the starting balance info for the response
    const startingTx = await getLastTransactionBalanceOnOrBefore(trueBalanceDate, bankAccountId);

    // Get coverage to determine which days are "true" vs "projected"
    const coverage = await getTransactionCoverage(bankAccountId);

    const enabledPathIds = enabledDecisionPathIds
      ? new Set(enabledDecisionPathIds)
      : undefined;

    const balances = await computeBalancesOnTheFly(
      start,
      end,
      bankAccountId,
      trueBalanceDate,
      enabledPathIds,
      coverage.latestCoveredDate || undefined
    );

    const response: ComputeBalancesResponse = {
      success: true,
      data: {
        startingBalance: startingTx?.balance ?? 0,
        startingDate: startingTx
          ? format(startingTx.date, 'yyyy-MM-dd')
          : format(start, 'yyyy-MM-dd'),
        balances: balances.map(b => ({
          date: format(b.date, 'yyyy-MM-dd'),
          expectedBalance: Math.round(b.expectedBalance * 100) / 100,
          eventCount: b.eventCount,
          balanceType: b.balanceType,
        })),
        daysComputed: balances.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error computing balances:', error);
    const response: ComputeBalancesResponse = {
      success: false,
      error: 'Failed to compute balances',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
