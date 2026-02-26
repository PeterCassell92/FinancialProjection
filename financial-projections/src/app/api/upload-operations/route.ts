import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import {
  getAllUploadOperations,
  getUploadOperationsByBankAccount,
  getAllDataFormats,
} from '@/lib/dal/upload-operations';
import { ApiResponse } from '@/types';

/**
 * GET /api/upload-operations
 * Get upload operations, optionally filtered by bank account
 * Also supports getting data formats
 */
export const { GET } = defineRoute({
  operationId: 'getUploadOperations',
  method: 'GET',
  summary: 'Get upload operations',
  description: 'Get upload operations with optional bank account filtering, or get data formats. Supports JSON and TOON response formats.',
  tags: ['Upload Operations'],
  queryParams: z.object({
    bankAccountId: z.string().optional(),
    formats: z.string().optional(),
    responseFormat: z.enum(['json', 'toon']).optional(),
  }),
  action: async ({ queryParams }) => {
    try {
      const bankAccountId = queryParams?.bankAccountId;
      const getFormats = queryParams?.formats === 'true';
      const responseFormat = queryParams?.responseFormat || 'json';

      // If requesting data formats
      if (getFormats) {
        const dataFormats = await getAllDataFormats();

        if (responseFormat === 'toon') {
          const toonData = dataFormats
            .map((df) => `${df.id}|${df.name}|${df.description || 'N/A'}`)
            .join('\n');
          return Response.json({
            success: true,
            data: toonData,
          });
        }

        const response: ApiResponse = {
          success: true,
          data: dataFormats,
        };
        return Response.json(response);
      }

      // Get upload operations
      let uploadOperations;
      if (bankAccountId) {
        uploadOperations = await getUploadOperationsByBankAccount(bankAccountId);
      } else {
        uploadOperations = await getAllUploadOperations();
      }

      // Return TOON format if requested
      if (responseFormat === 'toon') {
        const toonData = uploadOperations
          .map((op) => {
            const date = new Date(op.createdAt).toISOString().split('T')[0];
            const status = op.operationStatus;
            const records = op.numberOfRecords || 0;
            const bankAcctName = op.bankAccount?.name || 'N/A';
            const formatName = op.dataFormat?.name || 'N/A';
            return `${op.id}|${date}|${status}|${records}|${bankAcctName}|${formatName}|${op.filename}`;
          })
          .join('\n');

        return Response.json({
          success: true,
          data: toonData,
        });
      }

      const response: ApiResponse = {
        success: true,
        data: uploadOperations,
      };

      return Response.json(response);
    } catch (error: unknown) {
      console.error('Error fetching upload operations:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to fetch upload operations',
      };
      return Response.json(response, { status: 500 });
    }
  },
  responses: {
    200: { description: 'Upload operations or data formats retrieved successfully' },
    500: { description: 'Server error' },
  },
});
