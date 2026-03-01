import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import { getUploadOperationById } from '@/lib/dal/upload-operations';

const pathParams = z.object({
  id: z.string(),
});

/**
 * GET /api/upload-operations/[id]
 * Get a specific upload operation by ID
 */
export const { GET } = defineRoute({
  operationId: 'getUploadOperationById',
  method: 'GET',
  summary: 'Get an upload operation by ID',
  description: 'Retrieve the status and metadata of a specific upload operation',
  tags: ['Upload Operations'],
  pathParams,
  action: async ({ pathParams: { id } }) => {
    try {
      const uploadOperation = await getUploadOperationById(id);

      if (!uploadOperation) {
        return Response.json(
          { success: false, error: 'Upload operation not found' },
          { status: 404 }
        );
      }

      const serializedData = {
        id: uploadOperation.id,
        filename: uploadOperation.filename,
        uploadDateTime: uploadOperation.uploadDateTime.toISOString(),
        fileType: uploadOperation.fileType,
        operationStatus: uploadOperation.operationStatus,
        fileSize: uploadOperation.fileSize,
        numberOfRecords: uploadOperation.numberOfRecords,
        errorMessage: uploadOperation.errorMessage,
        earliestDate: uploadOperation.earliestDate?.toISOString() ?? null,
        latestDate: uploadOperation.latestDate?.toISOString() ?? null,
        detectedAccountNumber: uploadOperation.detectedAccountNumber,
        detectedSortCode: uploadOperation.detectedSortCode,
        dataFormat: {
          id: uploadOperation.dataFormat.id,
          name: uploadOperation.dataFormat.name,
        },
        bankAccount: uploadOperation.bankAccount
          ? {
              id: uploadOperation.bankAccount.id,
              name: uploadOperation.bankAccount.name,
              sortCode: uploadOperation.bankAccount.sortCode,
              accountNumber: uploadOperation.bankAccount.accountNumber,
            }
          : null,
      };

      return Response.json({ success: true, data: serializedData });
    } catch (error) {
      console.error('Error fetching upload operation:', error);
      return Response.json(
        { success: false, error: 'Failed to fetch upload operation' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: { description: 'Upload operation retrieved successfully' },
    404: { description: 'Upload operation not found' },
    500: { description: 'Server error' },
  },
});
