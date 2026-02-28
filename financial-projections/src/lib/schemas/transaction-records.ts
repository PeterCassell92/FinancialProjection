import { z } from 'zod';

/**
 * Transaction Record base data schema
 */
const TransactionRecordDataSchema = z.object({
  id: z.string(),
  bankAccountId: z.string(),
  transactionDate: z.string(), // ISO date string
  transactionType: z.enum([
    'DEB', 'DD', 'CHG', 'CR', 'SO', 'BP', 'TFR',
    'FPI', 'FPO', 'ATM', 'DEP', 'INT', 'FEE', 'OTHER'
  ]),
  transactionDescription: z.string(),
  debitAmount: z.number().nullable(),
  creditAmount: z.number().nullable(),
  balance: z.number(),
  notes: z.string().nullable(),
  bankAccount: z.object({
    id: z.string(),
    name: z.string(),
    sortCode: z.string(),
    accountNumber: z.string(),
  }),
  spendingTypes: z.array(z.object({
    spendingType: z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      color: z.string().nullable(),
    }),
  })),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Transaction Records GET Response Schema (with pagination)
 */
export const TransactionRecordsGetResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    transactions: z.array(TransactionRecordDataSchema),
    pagination: z.object({
      page: z.number(),
      pageSize: z.number(),
      totalRecords: z.number(),
      totalPages: z.number(),
    }).optional(),
  }).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Transaction Record PATCH Request Schema (update metadata only)
 */
export const TransactionRecordUpdateRequestSchema = z.object({
  id: z.string(),
  notes: z.string().optional(),
  spendingTypeIds: z.array(z.string()).optional(),
});

/**
 * Transaction Record PATCH Response Schema
 */
export const TransactionRecordUpdateResponseSchema = z.object({
  success: z.boolean(),
  data: TransactionRecordDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Transaction Record DELETE Response Schema
 */
export const TransactionRecordDeleteResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Transaction Records Bulk Delete Response Schema
 */
export const TransactionRecordsBulkDeleteResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    deletedCount: z.number(),
  }).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * CSV Validity Check Response Schema
 */
export const CsvValidityCheckResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    uploadOperationId: z.string().optional(),
    validityCheck: z.enum(['PASSED', 'FAILED']).optional(),
    detectedFormat: z.string().optional(),
    accountNumber: z.string().optional(),
    sortCode: z.string().optional(),
    earliestDate: z.string().optional(),
    latestDate: z.string().optional(),
    transactionCount: z.number().optional(),
    details: z.string().optional(),
  }).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * CSV Date Overlap Check Request Schema
 */
export const DateOverlapCheckRequestSchema = z.object({
  bankAccountId: z.string(),
  startDate: z.string(), // ISO date string
  endDate: z.string(),   // ISO date string
});

/**
 * CSV Date Overlap Check Response Schema
 */
export const DateOverlapCheckResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    uploadOperationId: z.string().optional(),
    bankAccountId: z.string().optional(),
    hasOverlap: z.boolean().optional(),
    overlappingRecordCount: z.number().optional(),
    earliestOverlappingDate: z.string().optional(),
    latestOverlappingDate: z.string().optional(),
    csvDateRange: z.object({
      earliest: z.string(),
      latest: z.string(),
    }).optional(),
    detectedAccountNumber: z.string().nullable().optional(),
    detectedSortCode: z.string().nullable().optional(),
    details: z.string().optional(),
  }).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * CSV Upload Response Schema
 */
export const CsvUploadResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    uploadOperationId: z.string().optional(),
    bankAccountId: z.string().optional(),
    bankAccountName: z.string().optional(),
    recordsProcessed: z.number().optional(),
    recordsImported: z.number().optional(),
    recordsFailed: z.number().optional(),
    zeroEventDaysInserted: z.number().optional(),
    errors: z.array(z.string()).optional(),
    metadata: z.any().optional(),
    details: z.string().optional(),
  }).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Transaction Record Query Parameters Schema
 */
export const TransactionRecordsQueryParamsSchema = z.object({
  bankAccountId: z.string(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(),   // ISO date string
  description: z.string().optional(), // Partial match search
  page: z.string().optional(),      // Page number (will be parsed to number)
  pageSize: z.string().optional(),  // Records per page (will be parsed to number)
});

// Export types
export type TransactionRecordData = z.infer<typeof TransactionRecordDataSchema>;
export type TransactionRecordsGetResponse = z.infer<typeof TransactionRecordsGetResponseSchema>;
export type TransactionRecordUpdateRequest = z.infer<typeof TransactionRecordUpdateRequestSchema>;
export type TransactionRecordUpdateResponse = z.infer<typeof TransactionRecordUpdateResponseSchema>;
export type TransactionRecordDeleteResponse = z.infer<typeof TransactionRecordDeleteResponseSchema>;
export type TransactionRecordsBulkDeleteResponse = z.infer<typeof TransactionRecordsBulkDeleteResponseSchema>;
export type CsvValidityCheckResponse = z.infer<typeof CsvValidityCheckResponseSchema>;
export type DateOverlapCheckRequest = z.infer<typeof DateOverlapCheckRequestSchema>;
export type DateOverlapCheckResponse = z.infer<typeof DateOverlapCheckResponseSchema>;
export type CsvUploadResponse = z.infer<typeof CsvUploadResponseSchema>;
export type TransactionRecordsQueryParams = z.infer<typeof TransactionRecordsQueryParamsSchema>;
