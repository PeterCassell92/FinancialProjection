import { NextRequest, NextResponse } from 'next/server';
import { parseHalifaxCSV, validateHalifaxCSVFormat } from '@/lib/parsers/halifax-csv-parser';
import { getOrCreateBankAccount } from '@/lib/dal/bank-accounts';
import { batchCreateTransactionRecords, CreateTransactionRecordInput } from '@/lib/dal/transaction-records';
import {
  createUploadOperation,
  updateUploadOperation,
  getDataFormatByName,
} from '@/lib/dal/upload-operations';
import { ApiResponse } from '@/types';
import { BankProvider } from '@prisma/client';

/**
 * POST /api/transaction-records/upload-csv
 * Upload and parse a CSV file containing bank transactions
 *
 * Body:
 * - csvContent: string (CSV file content)
 * - dataFormat: string (e.g., "HalifaxAccountExportCSV")
 * - bankAccountName?: string (optional, for new accounts)
 */
export async function POST(request: NextRequest) {
  let uploadOperationId: string | undefined;

  try {
    const body = await request.json();

    if (!body.csvContent || !body.dataFormat) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields: csvContent, dataFormat',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get data format from database
    const dataFormat = await getDataFormatByName(body.dataFormat);
    if (!dataFormat) {
      const response: ApiResponse = {
        success: false,
        error: `Unknown data format: ${body.dataFormat}`,
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate CSV format
    if (body.dataFormat === 'HalifaxAccountExportCSV') {
      const validation = validateHalifaxCSVFormat(body.csvContent);
      if (!validation.valid) {
        const response: ApiResponse = {
          success: false,
          error: `Invalid CSV format: ${validation.error}`,
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Parse CSV
    let parseResult;
    if (body.dataFormat === 'HalifaxAccountExportCSV') {
      parseResult = parseHalifaxCSV(body.csvContent);
    } else {
      const response: ApiResponse = {
        success: false,
        error: `Unsupported data format: ${body.dataFormat}`,
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (!parseResult.success || parseResult.transactions.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to parse CSV',
        data: {
          errors: parseResult.errors,
          metadata: parseResult.metadata,
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get or create bank account from the first transaction
    const firstTx = parseResult.transactions[0];
    const bankAccount = await getOrCreateBankAccount(
      firstTx.sortCode,
      firstTx.accountNumber,
      body.bankAccountName || `Account ${firstTx.accountNumber}`,
      BankProvider.HALIFAX,
      `Sort Code: ${firstTx.sortCode}`
    );

    // Create upload operation record
    const uploadOperation = await createUploadOperation({
      filename: body.filename || 'upload.csv',
      fileType: '.csv',
      fileSize: body.csvContent.length,
      dataFormatId: dataFormat.id,
      bankAccountId: bankAccount.id,
    });
    uploadOperationId = uploadOperation.id;

    // Update status to IN_PROGRESS
    await updateUploadOperation(uploadOperationId, {
      operationStatus: 'IN_PROGRESS',
    });

    // Convert parsed transactions to DAL format
    const transactionInputs: CreateTransactionRecordInput[] = parseResult.transactions.map(
      (tx) => ({
        transactionDate: tx.transactionDate,
        transactionType: tx.transactionType,
        transactionDescription: tx.transactionDescription,
        debitAmount: tx.debitAmount,
        creditAmount: tx.creditAmount,
        balance: tx.balance,
        bankAccountId: bankAccount.id,
      })
    );

    // Batch insert transactions
    const insertedCount = await batchCreateTransactionRecords(transactionInputs);

    // Update upload operation status to COMPLETED
    await updateUploadOperation(uploadOperationId, {
      operationStatus: insertedCount === parseResult.transactions.length ? 'COMPLETED' : 'PARTIAL',
      numberOfRecords: insertedCount,
    });

    const response: ApiResponse = {
      success: true,
      data: {
        uploadOperationId,
        bankAccountId: bankAccount.id,
        bankAccountName: bankAccount.name,
        totalTransactions: parseResult.transactions.length,
        insertedTransactions: insertedCount,
        skippedTransactions: parseResult.transactions.length - insertedCount,
        errors: parseResult.errors,
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error uploading CSV:', error);

    // Update upload operation status to FAILED if we created one
    if (uploadOperationId) {
      try {
        await updateUploadOperation(uploadOperationId, {
          operationStatus: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      } catch (updateError) {
        console.error('Failed to update upload operation status:', updateError);
      }
    }

    const response: ApiResponse = {
      success: false,
      error: 'Failed to process CSV upload',
      data: {
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
