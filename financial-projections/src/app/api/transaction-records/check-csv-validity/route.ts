import defineRoute from '@omer-x/next-openapi-route-handler';
import { saveCsvFile } from '@/lib/utils/file-storage';
import { processorRegistry } from '@/lib/processors/DataFormatProcessorRegistry';
import {
  createUploadOperation,
  updateUploadOperation,
  getDataFormatByName,
} from '@/lib/dal/upload-operations';
import { CsvValidityCheckResponseSchema } from '@/lib/schemas';
import type { CsvValidityCheckResponse } from '@/lib/schemas';

/**
 * POST /api/transaction-records/check-csv-validity
 * Validate a CSV file and extract metadata for preflight check
 *
 * Body (FormData):
 * - file: File (CSV file)
 * - dataFormatId: string (e.g., "halifax_csv_v1")
 */
export const { POST } = defineRoute({
  operationId: 'checkCsvValidity',
  method: 'POST',
  summary: 'Check CSV validity',
  description: 'Validate a CSV file and extract metadata for preflight check before uploading',
  tags: ['Transaction Records'],
  action: async (_, request) => {
    let uploadOperationId: string | undefined;

    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const dataFormatId = formData.get('dataFormatId') as string;

      if (!file || !dataFormatId) {
        const response: CsvValidityCheckResponse = {
          success: false,
          error: 'Missing required fields: file, dataFormatId',
        };
        return Response.json(response, { status: 400 });
      }

      // Validate data format exists in database
      const dataFormat = await getDataFormatByName(dataFormatId);
      if (!dataFormat) {
        const response: CsvValidityCheckResponse = {
          success: false,
          error: `Unknown data format: ${dataFormatId}`,
        };
        return Response.json(response, { status: 400 });
      }

      // Check if processor exists for this format
      const processor = processorRegistry.getProcessor(dataFormatId);
      if (!processor) {
        const response: CsvValidityCheckResponse = {
          success: false,
          error: `No processor available for format: ${dataFormatId}`,
        };
        return Response.json(response, { status: 400 });
      }

      // Save file to disk
      const filePath = await saveCsvFile(file);

      // Create upload operation record with CHECKING status
      const uploadOperation = await createUploadOperation({
        filename: file.name || 'upload.csv',
        fileType: '.csv',
        fileSize: file.size,
        dataFormatId: dataFormat.id,
        localFileLocation: filePath,
      });
      uploadOperationId = uploadOperation.id;

      // Update status to CHECKING
      await updateUploadOperation(uploadOperationId, {
        operationStatus: 'CHECKING',
      });

      // Read file content for processing
      const csvContent = await file.text();

      // Perform preflight check
      const preflightResult = processor.preflightCheck(csvContent);

      if (!preflightResult.valid) {
        // Preflight check failed
        await updateUploadOperation(uploadOperationId, {
          operationStatus: 'VALIDITY_CHECK_FAILED',
          errorMessage: preflightResult.error || 'CSV validation failed',
        });

        const response: CsvValidityCheckResponse = {
          success: false,
          error: preflightResult.error || 'CSV validation failed',
          data: {
            uploadOperationId,
            validityCheck: 'FAILED',
          },
        };
        return Response.json(response, { status: 400 });
      }

      // Preflight check passed - update with metadata
      await updateUploadOperation(uploadOperationId, {
        operationStatus: 'VALIDITY_CHECK_PASSED',
        detectedAccountNumber: preflightResult.accountNumber,
        detectedSortCode: preflightResult.sortCode,
        earliestDate: preflightResult.earliestDate,
        latestDate: preflightResult.latestDate,
        numberOfRecords: preflightResult.transactionCount,
      });

      const response: CsvValidityCheckResponse = {
        success: true,
        data: {
          uploadOperationId,
          validityCheck: 'PASSED',
          accountNumber: preflightResult.accountNumber,
          sortCode: preflightResult.sortCode,
          earliestDate: preflightResult.earliestDate.toISOString(),
          latestDate: preflightResult.latestDate.toISOString(),
          transactionCount: preflightResult.transactionCount,
        },
        message: 'CSV validation successful',
      };

      return Response.json(response, { status: 200 });
    } catch (error) {
      console.error('Error checking CSV validity:', error);

      // Update upload operation status to FAILED if we created one
      if (uploadOperationId) {
        try {
          await updateUploadOperation(uploadOperationId, {
            operationStatus: 'VALIDITY_CHECK_FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          });
        } catch (updateError) {
          console.error('Failed to update upload operation status:', updateError);
        }
      }

      const response: CsvValidityCheckResponse = {
        success: false,
        error: 'Failed to check CSV validity',
        data: {
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
      return Response.json(response, { status: 500 });
    }
  },
  responses: {
    200: {
      description: 'CSV validity check passed',
      content: CsvValidityCheckResponseSchema,
    },
    400: { description: 'Invalid request or CSV validation failed' },
    500: { description: 'Server error' },
  },
});
