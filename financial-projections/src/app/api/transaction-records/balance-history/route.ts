import { NextRequest, NextResponse } from 'next/server';
import { getTransactionRecords } from '@/lib/dal/transaction-records';
import { getSettings } from '@/lib/dal/settings';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date-format';

/**
 * GET /api/transaction-records/balance-history
 * Get daily account balances over a date range
 *
 * Query Parameters:
 * - bankAccountId (required): UUID of the bank account
 * - startDate (required): Start date (YYYY-MM-DD)
 * - endDate (required): End date (YYYY-MM-DD)
 * - format (optional): Response format - 'json' (default) or 'toon' (compact)
 *
 * Returns:
 * {
 *   success: boolean;
 *   data: {
 *     items: Array<{
 *       date: string;          // Formatted according to user settings
 *       currency: string;      // Currency symbol
 *       balance: number;
 *       isNegative: boolean;
 *     }>;
 *     stats: {
 *       positiveDays: number;
 *       negativeDays: number;
 *       zeroDays: number;
 *       totalDays: number;
 *       averageBalance: number;
 *       minBalance: number;
 *       maxBalance: number;
 *     };
 *   };
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bankAccountId = searchParams.get('bankAccountId');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const responseFormat = searchParams.get('responseFormat') || 'json';

    // Validate required parameters
    if (!bankAccountId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: bankAccountId',
        },
        { status: 400 }
      );
    }

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
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
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD',
        },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
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
      return NextResponse.json(
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
      return NextResponse.json({
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

      return NextResponse.json({
        success: true,
        data: {
          items: toonItems,
          stats: toonStats,
        },
      });
    }

    // Return standard JSON format
    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Error fetching balance history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch balance history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
