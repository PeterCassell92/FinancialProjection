import { NextRequest, NextResponse } from 'next/server';
import {
  getTransactionRecords,
  updateTransactionRecord,
  UpdateTransactionRecordInput,
} from '@/lib/dal/transaction-records';
import { ApiResponse } from '@/types';

/**
 * GET /api/transaction-records
 * Get transaction records for a bank account with optional date filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bankAccountId = searchParams.get('bankAccountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!bankAccountId) {
      const response: ApiResponse = {
        success: false,
        error: 'bankAccountId query parameter is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    const transactions = await getTransactionRecords(
      bankAccountId,
      startDateObj,
      endDateObj
    );

    const response: ApiResponse = {
      success: true,
      data: transactions,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching transaction records:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch transaction records',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PATCH /api/transaction-records
 * Update a transaction record (metadata only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      const response: ApiResponse = {
        success: false,
        error: 'Transaction record ID is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const input: UpdateTransactionRecordInput = {
      notes: body.notes,
      spendingTypeIds: body.spendingTypeIds,
    };

    const transaction = await updateTransactionRecord(body.id, input);

    const response: ApiResponse = {
      success: true,
      data: transaction,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error updating transaction record:', error);

    if (error.code === 'P2025') {
      const response: ApiResponse = {
        success: false,
        error: 'Transaction record not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: false,
      error: 'Failed to update transaction record',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
