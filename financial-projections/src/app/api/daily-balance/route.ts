import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import {
  getDailyBalance,
  getDailyBalances,
  setActualBalance,
  clearActualBalance,
} from '@/lib/dal/daily-balance';
import {
  DailyBalancesGetResponseSchema,
  DailyBalanceSetActualRequestSchema,
  DailyBalanceSetActualResponseSchema,
  DailyBalanceClearActualResponseSchema,
} from '@/lib/schemas';

/**
 * GET /api/daily-balance
 * Get daily balances for a date range or specific date
 */
export const { GET } = defineRoute({
  operationId: 'getDailyBalances',
  method: 'GET',
  summary: 'Get daily balances',
  description: 'Get daily balances for a date range (startDate, endDate, bankAccountId) or a specific date (date, bankAccountId)',
  tags: ['Daily Balance'],
  queryParams: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    date: z.string().optional(),
    bankAccountId: z.string().optional(),
  }),
  action: async ({ queryParams }) => {
    try {
      const { startDate: startDateParam, endDate: endDateParam, date: dateParam, bankAccountId } = queryParams || {};

      if (!bankAccountId) {
        return Response.json(
          { success: false, error: 'bankAccountId query parameter is required' },
          { status: 400 }
        );
      }

      if (dateParam) {
        // Get balance for a specific date and bank account
        const date = new Date(dateParam);
        const balance = await getDailyBalance(date, bankAccountId);

        if (!balance) {
          return Response.json(
            { success: false, error: 'Daily balance not found for this date and bank account' },
            { status: 404 }
          );
        }

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

        return Response.json({ success: true, data: serializedData });
      }

      if (!startDateParam || !endDateParam) {
        return Response.json(
          { success: false, error: 'startDate and endDate query parameters are required' },
          { status: 400 }
        );
      }

      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);

      const balances = await getDailyBalances(startDate, endDate, bankAccountId);

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

      return Response.json({ success: true, data: serializedData });
    } catch (error) {
      console.error('Error fetching daily balances:', error);
      return Response.json(
        { success: false, error: 'Failed to fetch daily balances' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Daily balances retrieved successfully',
      content: DailyBalancesGetResponseSchema,
    },
    400: { description: 'Missing required query parameters' },
    404: { description: 'Daily balance not found' },
    500: { description: 'Server error' },
  },
});

/**
 * PUT /api/daily-balance
 * Set actual balance for a specific date and bank account
 */
export const { PUT } = defineRoute({
  operationId: 'setActualBalance',
  method: 'PUT',
  summary: 'Set actual balance',
  description: 'Set actual balance for a specific date and bank account, then recalculate forward balances',
  tags: ['Daily Balance'],
  requestBody: DailyBalanceSetActualRequestSchema,
  action: async ({ body }) => {
    try {
      const date = new Date(body.date);
      const balance = await setActualBalance(date, body.bankAccountId, body.actualBalance);

      // Recalculate balances from the next day forward (6 months) for this bank account
      const { addDays, addMonths } = await import('date-fns');
      const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');

      const nextDay = addDays(date, 1);
      const endDate = addMonths(nextDay, 6);
      await recalculateBalancesFrom(nextDay, endDate, body.bankAccountId);

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

      return Response.json({
        success: true,
        data: serializedData,
        message: 'Actual balance set successfully',
      });
    } catch (error) {
      console.error('Error setting actual balance:', error);
      return Response.json(
        { success: false, error: 'Failed to set actual balance' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Actual balance set successfully',
      content: DailyBalanceSetActualResponseSchema,
    },
    400: { description: 'Invalid request body' },
    500: { description: 'Server error' },
  },
});

/**
 * DELETE /api/daily-balance
 * Clear actual balance for a specific date and bank account
 */
export const { DELETE } = defineRoute({
  operationId: 'clearActualBalance',
  method: 'DELETE',
  summary: 'Clear actual balance',
  description: 'Clear actual balance for a specific date and bank account, then recalculate forward balances',
  tags: ['Daily Balance'],
  queryParams: z.object({
    date: z.string().optional(),
    bankAccountId: z.string().optional(),
  }),
  action: async ({ queryParams }) => {
    try {
      const dateParam = queryParams?.date;
      const bankAccountId = queryParams?.bankAccountId;

      if (!dateParam || !bankAccountId) {
        return Response.json(
          { success: false, error: 'date and bankAccountId query parameters are required' },
          { status: 400 }
        );
      }

      const date = new Date(dateParam);
      await clearActualBalance(date, bankAccountId);

      // Recalculate balances from this day forward (6 months) for this bank account
      const { addMonths } = await import('date-fns');
      const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');

      const endDate = addMonths(date, 6);
      await recalculateBalancesFrom(date, endDate, bankAccountId);

      return Response.json({
        success: true,
        message: 'Actual balance cleared successfully',
      });
    } catch (error) {
      console.error('Error clearing actual balance:', error);
      return Response.json(
        { success: false, error: 'Failed to clear actual balance' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Actual balance cleared successfully',
      content: DailyBalanceClearActualResponseSchema,
    },
    400: { description: 'Missing required query parameters' },
    500: { description: 'Server error' },
  },
});
