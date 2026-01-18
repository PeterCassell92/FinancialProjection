import { NextRequest, NextResponse } from 'next/server';
import { getUploadOperationById } from '@/lib/dal/upload-operations';
import { checkDateRangeOverlap } from '@/lib/dal/transaction-records';
import { getOrCreateBankAccount } from '@/lib/dal/bank-accounts';
import { BankProvider } from '@prisma/client';
import { DateOverlapCheckResponse } from '@/lib/schemas';

/**
 * POST /api/transaction-records/check-date-overlap
 * Check if uploading this CSV will overlap with existing transaction records
 *
 * Body (JSON):
 * - uploadOperationId: string
 * - bankAccountId?: string (optional - if not provided, will use detected account from upload operation)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uploadOperationId, bankAccountId: providedBankAccountId } = body;

    if (!uploadOperationId) {
      const response: DateOverlapCheckResponse = {
        success: false,
        error: 'Missing required field: uploadOperationId',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get the upload operation
    const uploadOperation = await getUploadOperationById(uploadOperationId);
    if (!uploadOperation) {
      const response: DateOverlapCheckResponse = {
        success: false,
        error: 'Upload operation not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Verify the upload operation passed validity check
    if (uploadOperation.operationStatus !== 'VALIDITY_CHECK_PASSED') {
      const response: DateOverlapCheckResponse = {
        success: false,
        error: 'Upload operation has not passed validity check',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Ensure we have date range information
    if (!uploadOperation.earliestDate || !uploadOperation.latestDate) {
      const response: DateOverlapCheckResponse = {
        success: false,
        error: 'Upload operation missing date range information',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Determine which bank account to check against
    let bankAccountId: string;

    if (providedBankAccountId) {
      // User selected a specific bank account
      bankAccountId = providedBankAccountId;
    } else {
      // Get or create bank account based on detected info
      if (!uploadOperation.detectedAccountNumber || !uploadOperation.detectedSortCode) {
        const response: DateOverlapCheckResponse = {
          success: false,
          error: 'Unable to determine bank account - missing detected account information',
        };
        return NextResponse.json(response, { status: 400 });
      }

      const bankAccount = await getOrCreateBankAccount(
        uploadOperation.detectedSortCode,
        uploadOperation.detectedAccountNumber,
        `Account ${uploadOperation.detectedAccountNumber}`,
        BankProvider.HALIFAX, // TODO: Detect provider from data format
        `Sort Code: ${uploadOperation.detectedSortCode}`
      );
      bankAccountId = bankAccount.id;
    }

    // Check for date overlap
    const overlapCheck = await checkDateRangeOverlap(
      bankAccountId,
      uploadOperation.earliestDate,
      uploadOperation.latestDate
    );

    const response: DateOverlapCheckResponse = {
      success: true,
      data: {
        uploadOperationId,
        bankAccountId,
        hasOverlap: overlapCheck.hasOverlap,
        overlappingRecordCount: overlapCheck.overlappingRecordCount,
        earliestOverlappingDate: overlapCheck.earliestOverlappingDate?.toISOString(),
        latestOverlappingDate: overlapCheck.latestOverlappingDate?.toISOString(),
        csvDateRange: {
          earliest: uploadOperation.earliestDate.toISOString(),
          latest: uploadOperation.latestDate.toISOString(),
        },
        detectedAccountNumber: uploadOperation.detectedAccountNumber,
        detectedSortCode: uploadOperation.detectedSortCode,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error checking date overlap:', error);

    const response: DateOverlapCheckResponse = {
      success: false,
      error: 'Failed to check date overlap',
      data: {
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
