import { NextRequest, NextResponse } from 'next/server';
import {
  getTransactionRecords,
  updateTransactionRecord,
  deleteTransactionRecord,
  UpdateTransactionRecordInput,
  TransactionRecordWithSpendingTypes,
} from '@/lib/dal/transaction-records';
import { ApiResponse } from '@/types';

/**
 * Serialized transaction record with Decimal fields converted to numbers
 * This replaces Prisma.Decimal types with number for JSON serialization
 */
type SerializedTransactionRecord = Omit<TransactionRecordWithSpendingTypes, 'debitAmount' | 'creditAmount' | 'balance'> & {
  debitAmount: number | null;
  creditAmount: number | null;
  balance: number;
};

/**
 * Convert a TransactionRecordWithSpendingTypes to a serialized version
 */
function serializeTransactionRecord(transaction: TransactionRecordWithSpendingTypes): SerializedTransactionRecord {
  // Access Decimal fields that TypeScript doesn't infer from the extended interface
  const record = transaction as TransactionRecordWithSpendingTypes & {
    debitAmount: { toString(): string } | null;
    creditAmount: { toString(): string } | null;
    balance: { toString(): string };
  };

  return {
    ...transaction,
    debitAmount: record.debitAmount ? parseFloat(record.debitAmount.toString()) : null,
    creditAmount: record.creditAmount ? parseFloat(record.creditAmount.toString()) : null,
    balance: parseFloat(record.balance.toString()),
  };
}

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

    const transactions: TransactionRecordWithSpendingTypes[] = await getTransactionRecords(
      bankAccountId,
      startDateObj,
      endDateObj
    );

    // Convert Decimal fields to numbers for JSON serialization
    const serializedTransactions: SerializedTransactionRecord[] = transactions.map(serializeTransactionRecord);

    const response: ApiResponse<SerializedTransactionRecord[]> = {
      success: true,
      data: serializedTransactions,
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

/**
 * DELETE /api/transaction-records
 * Delete a transaction record
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: 'Transaction record ID is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    await deleteTransactionRecord(id);

    const response: ApiResponse = {
      success: true,
      message: 'Transaction record deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error deleting transaction record:', error);

    if (error.code === 'P2025') {
      const response: ApiResponse = {
        success: false,
        error: 'Transaction record not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete transaction record',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
