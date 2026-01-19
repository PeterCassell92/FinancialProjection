import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types';

const analyticsQuerySchema = z.object({
  bankAccountId: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * GET /api/transaction-records/analytics
 * Get transaction analytics grouped by spending types
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      bankAccountId: searchParams.get('bankAccountId'),
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    };

    const validation = analyticsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.errors[0]?.message || 'Invalid query parameters',
        },
        { status: 400 }
      );
    }

    const { bankAccountId, startDate, endDate } = validation.data;

    // Build where clause
    const whereClause: any = {
      bankAccountId,
    };

    if (startDate || endDate) {
      whereClause.transactionDate = {};
      if (startDate) whereClause.transactionDate.gte = new Date(startDate);
      if (endDate) whereClause.transactionDate.lte = new Date(endDate);
    }

    // Get all transactions with spending types
    const transactions = await prisma.transactionRecord.findMany({
      where: whereClause,
      include: {
        spendingTypes: {
          include: {
            spendingType: true,
          },
        },
      },
      orderBy: {
        transactionDate: 'desc',
      },
    });

    // Calculate analytics by spending type
    const spendingTypeMap = new Map<
      string,
      {
        id: string;
        name: string;
        color: string | null;
        totalDebit: number;
        totalCredit: number;
        count: number;
      }
    >();

    // Track uncategorized transactions
    let uncategorizedDebit = 0;
    let uncategorizedCredit = 0;
    let uncategorizedCount = 0;

    for (const transaction of transactions) {
      const debitAmount = transaction.debitAmount || 0;
      const creditAmount = transaction.creditAmount || 0;

      if (transaction.spendingTypes.length === 0) {
        // Uncategorized
        uncategorizedDebit += debitAmount;
        uncategorizedCredit += creditAmount;
        uncategorizedCount += 1;
      } else {
        // Categorized - split amount across all spending types
        const splitDebit = debitAmount / transaction.spendingTypes.length;
        const splitCredit = creditAmount / transaction.spendingTypes.length;

        for (const { spendingType } of transaction.spendingTypes) {
          const existing = spendingTypeMap.get(spendingType.id);
          if (existing) {
            existing.totalDebit += splitDebit;
            existing.totalCredit += splitCredit;
            existing.count += 1;
          } else {
            spendingTypeMap.set(spendingType.id, {
              id: spendingType.id,
              name: spendingType.name,
              color: spendingType.color,
              totalDebit: splitDebit,
              totalCredit: splitCredit,
              count: 1,
            });
          }
        }
      }
    }

    // Convert map to array and add uncategorized
    const categoryData = Array.from(spendingTypeMap.values());

    if (uncategorizedCount > 0) {
      categoryData.push({
        id: 'uncategorized',
        name: 'Uncategorized',
        color: '#9CA3AF',
        totalDebit: uncategorizedDebit,
        totalCredit: uncategorizedCredit,
        count: uncategorizedCount,
      });
    }

    // Sort by total debit (expenses) descending
    categoryData.sort((a, b) => b.totalDebit - a.totalDebit);

    // Calculate totals
    const totals = {
      totalDebit: categoryData.reduce((sum, cat) => sum + cat.totalDebit, 0),
      totalCredit: categoryData.reduce((sum, cat) => sum + cat.totalCredit, 0),
      transactionCount: transactions.length,
    };

    // Calculate spending over time (monthly)
    const monthlyData = new Map<string, { month: string; debit: number; credit: number; count: number }>();

    for (const transaction of transactions) {
      const date = new Date(transaction.transactionDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const existing = monthlyData.get(monthKey);
      const debit = transaction.debitAmount || 0;
      const credit = transaction.creditAmount || 0;

      if (existing) {
        existing.debit += debit;
        existing.credit += credit;
        existing.count += 1;
      } else {
        monthlyData.set(monthKey, {
          month: monthKey,
          debit,
          credit,
          count: 1,
        });
      }
    }

    const monthlySpending = Array.from(monthlyData.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          byCategory: categoryData,
          totals,
          monthlySpending,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Transaction analytics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get transaction analytics',
      },
      { status: 500 }
    );
  }
}
