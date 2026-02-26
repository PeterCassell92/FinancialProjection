import defineRoute from '@omer-x/next-openapi-route-handler';
import { calculateDailyBalances } from '@/lib/calculations/balance-calculator';
import {
  CalculateBalancesRequestSchema,
  CalculateBalancesResponseSchema,
} from '@/lib/schemas';

/**
 * POST /api/calculate-balances
 * Trigger balance calculation for a date range
 */
export const { POST } = defineRoute({
  operationId: 'calculateBalances',
  method: 'POST',
  summary: 'Calculate daily balances',
  description: 'Trigger balance calculation for a date range and bank account',
  tags: ['Balance Calculations'],
  requestBody: CalculateBalancesRequestSchema,
  action: async ({ body }) => {
    try {
      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);

      // Calculate balances for the specified bank account
      await calculateDailyBalances(startDate, endDate, body.bankAccountId);

      return Response.json({
        success: true,
        message: `Balances calculated successfully from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      });
    } catch (error) {
      console.error('Error calculating balances:', error);
      return Response.json(
        { success: false, error: 'Failed to calculate balances' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Balances calculated successfully',
      content: CalculateBalancesResponseSchema,
    },
    400: { description: 'Invalid request body' },
    500: { description: 'Server error' },
  },
});
