import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import {
  getTransactionRecords,
  getTransactionRecordsCount,
  updateTransactionRecord,
  deleteTransactionRecord,
  UpdateTransactionRecordInput,
  TransactionRecordWithSpendingTypes,
} from '@/lib/dal/transaction-records';
import { ApiResponse } from '@/types';
import { formatTransactionsAsTOON } from '@/lib/formatters/toon';

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
 * Response data for transaction records with optional pagination
 */
interface TransactionRecordsResponseData {
  transactions: SerializedTransactionRecord[];
  pagination?: {
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
  };
}

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
 * Get transaction records for a bank account with optional date filtering, description search, spending type filtering, amount filtering, and pagination
 *
 * Query parameters:
 * - bankAccountId (required): Bank account ID
 * - startDate (optional): ISO date string for start of date range
 * - endDate (optional): ISO date string for end of date range
 * - description (optional): Partial match search on transaction description (case-insensitive)
 * - spendingTypeIds (optional): Comma-separated list of spending type IDs to filter by
 * - spendingTypeNames (optional): Comma-separated list of spending type names to filter by
 * - amountOperator (optional): Amount comparison operator - 'lessThan' or 'greaterThan'
 * - amountValue (optional): Amount value to compare against (magnitude)
 * - page (optional): Page number (1-indexed, default: no pagination)
 * - pageSize (optional): Number of records per page (default: no pagination)
 * - format (optional): Response format - 'json' (default) or 'toon' (compact format for AI)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bankAccountId = searchParams.get('bankAccountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const description = searchParams.get('description');
    const spendingTypeIdsParam = searchParams.get('spendingTypeIds');
    const spendingTypeNamesParam = searchParams.get('spendingTypeNames');
    const amountOperatorParam = searchParams.get('amountOperator');
    const amountValueParam = searchParams.get('amountValue');
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const format = searchParams.get('format') || 'json';

    if (!bankAccountId) {
      const response: ApiResponse = {
        success: false,
        error: 'bankAccountId query parameter is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;
    const spendingTypeIds = spendingTypeIdsParam ? spendingTypeIdsParam.split(',').map(id => id.trim()) : undefined;
    const spendingTypeNames = spendingTypeNamesParam ? spendingTypeNamesParam.split(',').map(name => name.trim()) : undefined;
    const amountOperator = (amountOperatorParam === 'lessThan' || amountOperatorParam === 'greaterThan') ? amountOperatorParam : undefined;
    const amountValue = amountValueParam ? parseFloat(amountValueParam) : undefined;
    const page = pageParam ? parseInt(pageParam, 10) : undefined;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : undefined;

    // Validate pagination parameters
    if (page !== undefined && page < 1) {
      const response: ApiResponse = {
        success: false,
        error: 'page must be >= 1',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (pageSize !== undefined && pageSize < 1) {
      const response: ApiResponse = {
        success: false,
        error: 'pageSize must be >= 1',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Fetch transactions and total count in parallel
    const [transactions, totalCount] = await Promise.all([
      getTransactionRecords(
        bankAccountId,
        startDateObj,
        endDateObj,
        page,
        pageSize,
        description || undefined,
        spendingTypeIds,
        spendingTypeNames,
        amountOperator,
        amountValue
      ),
      page && pageSize
        ? getTransactionRecordsCount(
            bankAccountId,
            startDateObj,
            endDateObj,
            description || undefined,
            spendingTypeIds,
            spendingTypeNames,
            amountOperator,
            amountValue
          )
        : Promise.resolve(undefined),
    ]);

    // Convert Decimal fields to numbers for JSON serialization
    const serializedTransactions: SerializedTransactionRecord[] = transactions.map(serializeTransactionRecord);

    // Build pagination metadata if applicable
    const paginationMetadata =
      page && pageSize && totalCount !== undefined
        ? {
            page,
            pageSize,
            totalRecords: totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
          }
        : undefined;

    // Return TOON format if requested
    if (format === 'toon') {
      const toonData = formatTransactionsAsTOON(serializedTransactions, paginationMetadata);
      const response: ApiResponse<string> = {
        success: true,
        data: toonData,
      };
      return NextResponse.json(response);
    }

    // Default JSON format
    const responseData: TransactionRecordsResponseData = {
      transactions: serializedTransactions,
    };

    if (paginationMetadata) {
      responseData.pagination = paginationMetadata;
    }

    const response: ApiResponse<TransactionRecordsResponseData> = {
      success: true,
      data: responseData,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Error fetching transaction records:', error);

    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Add specific Prisma error handling if needed
    }

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transaction records',
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

    await updateTransactionRecord(body.id, input);

    // Fetch the updated transaction with all relations
    const { getTransactionRecordById } = await import('@/lib/dal/transaction-records');
    const updatedTransaction = await getTransactionRecordById(body.id);

    if (!updatedTransaction) {
      const response: ApiResponse = {
        success: false,
        error: 'Transaction record not found after update',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Serialize the transaction
    const serialized = serializeTransactionRecord(updatedTransaction);

    const response: ApiResponse = {
      success: true,
      data: serialized,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Error updating transaction record:', error);

    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        const response: ApiResponse = {
          success: false,
          error: 'Transaction record not found',
        };
        return NextResponse.json(response, { status: 404 });
      }
    }

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update transaction record',
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
  } catch (error: unknown) {
    console.error('Error deleting transaction record:', error);

    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        const response: ApiResponse = {
          success: false,
          error: 'Transaction record not found',
        };
        return NextResponse.json(response, { status: 404 });
      }
    }

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete transaction record',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
