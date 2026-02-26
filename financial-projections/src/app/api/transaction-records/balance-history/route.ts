import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import { getTransactionRecords } from '@/lib/dal/transaction-records';
import { getSettings } from '@/lib/dal/settings';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date-format';

/**
 * GET /api/transaction-records/balance-history
 * Get daily account balances over a date range
 */
export const { GET } = defineRoute({
  operationId: 'getBalanceHistory',
  method: 'GET',
  summary: 'Get balance history',
  description: 'Get daily account balances over a date range for a bank account. Returns end-of-day balance for each day with statistics (positive/negative/zero days, min/max/average). Dates and currency formatted according to user settings.',
  tags: ['Transaction Records'],
  queryParams: z.object({
    bankAccountId: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    responseFormat: z.enum(['json', 'toon']).optional(),
  }),
  action: async ({ queryParams }) => {
    try {
      const bankAccountId = queryParams?.bankAccountId;
      const startDateStr = queryParams?.startDate;
      const endDateStr = queryParams?.endDate;
      const responseFormat = queryParams?.responseFormat || 'json';

      // Validate required parameters
      if (!bankAccountId) {
        return Response.json(
          {
            success: false,
            error: 'Missing required parameter: bankAccountId',
          },
          { status: 400 }
        );
      }

      if (!startDateStr || !endDateStr) {
        return Response.json(
          {
            success: false,
            error: 'Missing required parameters: startDate and endDate',
          },
          { status: 400 }
        );
      }

      // Parse dates
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return Response.json(
          {
            success: false,
            error: 'Invalid date format. Use YYYY-MM-DD',
          },
          { status: 400 }
        );
      }

      if (startDate > endDate) {
        return Response.json(
          {
            success: false,
            error: 'startDate must be before or equal to endDate',
          },
          { status: 400 }
        );
      }

      // Get user settings for currency and date format
      const settings = await getSettings();
      if (!settings) {
        return Response.json(
          {
            success: false,
            error: 'Settings not found',
          },
          { status: 500 }
        );
      }
      const currencySymbol = getCurrencySymbol(settings.currency);

      // Fetch all transactions in the date range
      const transactions = await getTransactionRecords(
        bankAccountId,
        startDate,
        endDate,
        undefined, // page
        undefined  // pageSize - get all
      );

      if (transactions.length === 0) {
        return Response.json({
          success: true,
          data: {
            items: [],
            stats: {
              positiveDays: 0,
              negativeDays: 0,
              zeroDays: 0,
              totalDays: 0,
              averageBalance: 0,
              minBalance: 0,
              maxBalance: 0,
            },
          },
        });
      }

      // Group transactions by date and get the last balance of each day
      const balancesByDate = new Map<string, number>();

      for (const transaction of transactions) {
        // Convert Date to YYYY-MM-DD string
        const date = new Date(transaction.transactionDate);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const balance = typeof transaction.balance === 'number'
          ? transaction.balance
          : parseFloat(transaction.balance.toString());

        // Only keep the latest balance for each date (transactions are ordered by date)
        balancesByDate.set(dateKey, balance);
      }

      // Convert to array and sort by date
      const sortedBalances = Array.from(balancesByDate.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([dateStr, balance]) => {
          const date = new Date(dateStr);
          return {
            date: formatDate(date, settings.dateFormat),
            currency: currencySymbol,
            balance,
            isNegative: balance < 0,
          };
        });

      // Calculate statistics
      const balances = sortedBalances.map(item => item.balance);
      const positiveDays = balances.filter(b => b > 0).length;
      const negativeDays = balances.filter(b => b < 0).length;
      const zeroDays = balances.filter(b => b === 0).length;
      const totalDays = balances.length;
      const averageBalance = balances.reduce((sum, b) => sum + b, 0) / totalDays;
      const minBalance = Math.min(...balances);
      const maxBalance = Math.max(...balances);

      const responseData = {
        items: sortedBalances,
        stats: {
          positiveDays,
          negativeDays,
          zeroDays,
          totalDays,
          averageBalance: Math.round(averageBalance * 100) / 100,
          minBalance: Math.round(minBalance * 100) / 100,
          maxBalance: Math.round(maxBalance * 100) / 100,
        },
      };

      // Return TOON format if requested
      if (responseFormat === 'toon') {
        const toonItems = sortedBalances.map(item =>
          `${item.date}|${item.currency}${item.balance.toFixed(2)}|${item.isNegative ? 'NEG' : 'POS'}`
        ).join('\n');

        const toonStats = `POS:${positiveDays}|NEG:${negativeDays}|ZERO:${zeroDays}|TOTAL:${totalDays}|AVG:${responseData.stats.averageBalance.toFixed(2)}|MIN:${minBalance.toFixed(2)}|MAX:${maxBalance.toFixed(2)}`;

        return Response.json({
          success: true,
          data: {
            items: toonItems,
            stats: toonStats,
          },
        });
      }

      // Return standard JSON format
      return Response.json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error('Error fetching balance history:', error);
      return Response.json(
        {
          success: false,
          error: 'Failed to fetch balance history',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  },
  responses: {
    200: { description: 'Balance history retrieved successfully' },
    400: { description: 'Invalid or missing query parameters' },
    500: { description: 'Server error' },
  },
});
