import { NextRequest, NextResponse } from 'next/server';
import { deleteAllTransactionRecords } from '@/lib/dal/transaction-records';
import { ApiResponse } from '@/types';

/**
 * DELETE /api/transaction-records/bulk-delete
 * Delete all transaction records for a bank account
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bankAccountId = searchParams.get('bankAccountId');

    if (!bankAccountId) {
      const response: ApiResponse = {
        success: false,
        error: 'Bank account ID is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const deletedCount = await deleteAllTransactionRecords(bankAccountId);

    const response: ApiResponse<{ deletedCount: number }> = {
      success: true,
      message: `Successfully deleted ${deletedCount} transaction record(s)`,
      data: { deletedCount },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error deleting all transaction records:', error);

    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete transaction records',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
