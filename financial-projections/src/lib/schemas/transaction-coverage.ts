import { z } from 'zod';

/**
 * Transaction Coverage Response Schema
 */
export const TransactionCoverageResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    bankAccountId: z.string(),
    coverageRanges: z.array(z.object({
      startDate: z.string(),
      endDate: z.string(),
    })),
    totalCoveredDays: z.number(),
    latestCoveredDate: z.string().nullable(),
  }).optional(),
  error: z.string().optional(),
});

export type TransactionCoverageResponse = z.infer<typeof TransactionCoverageResponseSchema>;
