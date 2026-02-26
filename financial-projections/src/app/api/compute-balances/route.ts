import defineRoute from '@omer-x/next-openapi-route-handler';
import { computeBalancesOnTheFly } from '@/lib/calculations/balance-calculator';
import { getLastTransactionBalanceOnOrBefore, getTransactionCoverage } from '@/lib/dal/transaction-records';
import { ComputeBalancesRequestSchema, ComputeBalancesResponseSchema } from '@/lib/schemas';
import { format } from 'date-fns';

/**
 * POST /api/compute-balances
 * Compute daily balances on-the-fly WITHOUT storing them
 */
export const { POST } = defineRoute({
  operationId: 'computeBalances',
  method: 'POST',
  summary: 'Compute balances on-the-fly',
  description: 'Compute daily balances on-the-fly without storing them. Supports what-if analysis with different starting dates and decision path combinations.',
  tags: ['Balance Calculations'],
  requestBody: ComputeBalancesRequestSchema,
  action: async ({ body }) => {
    try {
      const { startDate, endDate, bankAccountId, useTrueBalanceFromDate, enabledDecisionPathIds } = body;

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

      return Response.json({
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
      });
    } catch (error) {
      console.error('Error computing balances:', error);
      return Response.json(
        { success: false, error: 'Failed to compute balances' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Balances computed successfully',
      content: ComputeBalancesResponseSchema,
    },
    400: { description: 'Invalid request body' },
    500: { description: 'Server error' },
  },
});
