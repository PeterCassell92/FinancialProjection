import { z } from 'zod';

/**
 * Compute Balances Request Schema
 * For on-the-fly balance computation without storage
 */
export const ComputeBalancesRequestSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  bankAccountId: z.string().min(1),
  useTrueBalanceFromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  enabledDecisionPathIds: z.array(z.string()).optional(),
});

/**
 * Compute Balances Response Schema
 */
export const ComputeBalancesResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    startingBalance: z.number(),
    startingDate: z.string(),
    balances: z.array(z.object({
      date: z.string(),
      expectedBalance: z.number(),
      eventCount: z.number(),
      balanceType: z.enum(['true', 'projected']),
    })),
    daysComputed: z.number(),
  }).optional(),
  error: z.string().optional(),
});

export type ComputeBalancesRequest = z.infer<typeof ComputeBalancesRequestSchema>;
export type ComputeBalancesResponse = z.infer<typeof ComputeBalancesResponseSchema>;
