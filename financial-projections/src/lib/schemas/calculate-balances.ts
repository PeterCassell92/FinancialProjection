import { z } from 'zod';

/**
 * Calculate Balances POST Request Schema
 */
export const CalculateBalancesRequestSchema = z.object({
  startDate: z.string(), // ISO date string
  endDate: z.string(),   // ISO date string
  bankAccountId: z.string(),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
  },
  {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  }
);

/**
 * Daily Balance Summary data schema (used in response)
 */
const DailyBalanceSummarySchema = z.object({
  date: z.string(), // ISO date string
  expectedBalance: z.number(),
  actualBalance: z.number().nullable(),
});

/**
 * Calculate Balances POST Response Schema
 */
export const CalculateBalancesResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    balances: z.array(DailyBalanceSummarySchema),
    startDate: z.string(),
    endDate: z.string(),
    daysCalculated: z.number(),
  }).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Export types
export type CalculateBalancesRequest = z.infer<typeof CalculateBalancesRequestSchema>;
export type DailyBalanceSummary = z.infer<typeof DailyBalanceSummarySchema>;
export type CalculateBalancesResponse = z.infer<typeof CalculateBalancesResponseSchema>;
