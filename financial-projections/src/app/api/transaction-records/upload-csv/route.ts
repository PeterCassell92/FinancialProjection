import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import { readCsvFile } from '@/lib/utils/file-storage';
import { processorRegistry } from '@/lib/processors/DataFormatProcessorRegistry';
import {
  getOrCreateBankAccount,
  getBankAccountById,
} from '@/lib/dal/bank-accounts';
import {
  batchCreateTransactionRecords,
  CreateTransactionRecordInput,
  insertZeroEventDayRecords,
} from '@/lib/dal/transaction-records';
import {
  getUploadOperationById,
  updateUploadOperation,
} from '@/lib/dal/upload-operations';
import { CsvUploadResponseSchema } from '@/lib/schemas';
import type { CsvUploadResponse } from '@/lib/schemas';
import { BankProvider, TransactionType } from '@prisma/client';
import prisma from '@/lib/prisma';

const uploadCsvRequestSchema = z.object({
  uploadOperationId: z.string(),
  bankAccountId: z.string().optional(),
  deleteOverlapping: z.boolean().optional().default(false),
});

/**
 * POST /api/transaction-records/upload-csv
 * Complete the upload and processing of a CSV file containing bank transactions
 * This endpoint is called after preflight check has passed
 */
export const { POST } = defineRoute({
  operationId: 'uploadCsv',
  method: 'POST',
  summary: 'Upload and process CSV',
  description: 'Complete the upload and processing of a CSV file containing bank transactions after preflight check has passed',
  tags: ['Transaction Records'],
  requestBody: uploadCsvRequestSchema,
  action: async ({ body }) => {
    let uploadOperationId: string | undefined;

    try {
      uploadOperationId = body.uploadOperationId;
      const providedBankAccountId = body.bankAccountId;
      const deleteOverlapping = body.deleteOverlapping || false;

      if (!uploadOperationId) {
        const response: CsvUploadResponse = {
          success: false,
          error: 'Missing required field: uploadOperationId',
        };
        return Response.json(response, { status: 400 });
      }

      // Get the upload operation
      const uploadOperation = await getUploadOperationById(uploadOperationId);
      if (!uploadOperation) {
        const response: CsvUploadResponse = {
          success: false,
          error: 'Upload operation not found',
        };
        return Response.json(response, { status: 404 });
      }

      // Verify the upload operation passed validity check
      if (uploadOperation.operationStatus !== 'VALIDITY_CHECK_PASSED') {
        const response: CsvUploadResponse = {
          success: false,
          error: 'Upload operation has not passed validity check',
        };
        return Response.json(response, { status: 400 });
      }

      // Verify we have the saved file
      if (!uploadOperation.localFileLocation) {
        const response: CsvUploadResponse = {
          success: false,
          error: 'Upload operation missing saved file location',
        };
        return Response.json(response, { status: 400 });
      }

      // Update status to IN_PROGRESS
      await updateUploadOperation(uploadOperationId, {
        operationStatus: 'IN_PROGRESS',
      });

      // Read the saved CSV file
      const csvContent = await readCsvFile(uploadOperation.localFileLocation);

      // Get the processor for this data format
      const processor = processorRegistry.getProcessor(uploadOperation.dataFormat.name);
      if (!processor) {
        throw new Error(`No processor available for format: ${uploadOperation.dataFormat.name}`);
      }

      // Parse CSV
      const parseResult = processor.parse(csvContent);

      if (!parseResult.success || parseResult.transactions.length === 0) {
        await updateUploadOperation(uploadOperationId, {
          operationStatus: 'FAILED',
          errorMessage: parseResult.errors.join('; ') || 'Failed to parse CSV',
        });

        const response: CsvUploadResponse = {
          success: false,
          error: 'Failed to parse CSV',
          data: {
            errors: parseResult.errors,
            metadata: parseResult.metadata,
          },
        };
        return Response.json(response, { status: 400 });
      }

      // Determine bank account
      let bankAccount;
      if (providedBankAccountId) {
        // Use provided bank account ID
        const account = await getBankAccountById(providedBankAccountId);
        if (!account) {
          await updateUploadOperation(uploadOperationId, {
            operationStatus: 'FAILED',
            errorMessage: `Bank account not found: ${providedBankAccountId}`,
          });

          const response: CsvUploadResponse = {
            success: false,
            error: `Bank account not found: ${providedBankAccountId}`,
          };
          return Response.json(response, { status: 400 });
        }
        bankAccount = account;
      } else {
        // Auto-detect from CSV
        const firstTx = parseResult.transactions[0];
        bankAccount = await getOrCreateBankAccount(
          firstTx.sortCode,
          firstTx.accountNumber,
          `Account ${firstTx.accountNumber}`,
          BankProvider.HALIFAX, // TODO: Detect provider from data format
          `Sort Code: ${firstTx.sortCode}`
        );
      }

      // Update upload operation with bank account
      await updateUploadOperation(uploadOperationId, {
        bankAccountId: bankAccount.id,
      });

      // Delete overlapping records if requested
      if (deleteOverlapping && uploadOperation.earliestDate && uploadOperation.latestDate) {
        await prisma.transactionRecord.deleteMany({
          where: {
            bankAccountId: bankAccount.id,
            transactionDate: {
              gte: uploadOperation.earliestDate,
              lte: uploadOperation.latestDate,
            },
          },
        });
      }

      // Convert parsed transactions to DAL format
      // Include uploadOperationId and csvRowNumber to create junction table entries
      const transactionInputs: CreateTransactionRecordInput[] = parseResult.transactions.map(
        (tx, index) => ({
          transactionDate: tx.transactionDate,
          transactionType: tx.transactionType as TransactionType, // Parser returns string, cast to TransactionType enum
          transactionDescription: tx.transactionDescription,
          debitAmount: tx.debitAmount ?? undefined,
          creditAmount: tx.creditAmount ?? undefined,
          balance: tx.balance,
          bankAccountId: bankAccount.id,
          uploadOperationId: uploadOperationId,
          csvRowNumber: index + 1, // CSV row numbers are 1-indexed (or use header offset if needed)
        })
      );

      // Batch insert transactions
      const insertedCount = await batchCreateTransactionRecords(transactionInputs);

      // Fill gaps with ZERO_EVENT records for complete date coverage
      let zeroEventCount = 0;
      if (uploadOperation.earliestDate && uploadOperation.latestDate) {
        zeroEventCount = await insertZeroEventDayRecords(
          bankAccount.id,
          uploadOperation.earliestDate,
          uploadOperation.latestDate,
          uploadOperationId!
        );
      }

      // Update upload operation status to COMPLETED
      await updateUploadOperation(uploadOperationId, {
        operationStatus: insertedCount === parseResult.transactions.length ? 'COMPLETED' : 'PARTIAL',
        numberOfRecords: insertedCount + zeroEventCount,
      });

      const response: CsvUploadResponse = {
        success: true,
        data: {
          uploadOperationId,
          bankAccountId: bankAccount.id,
          bankAccountName: bankAccount.name,
          recordsProcessed: parseResult.transactions.length,
          recordsImported: insertedCount,
          recordsFailed: parseResult.transactions.length - insertedCount,
          zeroEventDaysInserted: zeroEventCount,
          errors: parseResult.errors.length > 0 ? parseResult.errors : undefined,
        },
        message: `Successfully imported ${insertedCount} transactions${zeroEventCount > 0 ? ` (${zeroEventCount} zero-event days added for coverage)` : ''}`,
      };

      return Response.json(response, { status: 201 });
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

      const response: CsvUploadResponse = {
        success: false,
        error: 'Failed to process CSV upload',
        data: {
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
      return Response.json(response, { status: 500 });
    }
  },
  responses: {
    201: {
      description: 'CSV uploaded and processed successfully',
      content: CsvUploadResponseSchema,
    },
    400: { description: 'Invalid request or CSV parsing failed' },
    404: { description: 'Upload operation not found' },
    500: { description: 'Server error' },
  },
});
