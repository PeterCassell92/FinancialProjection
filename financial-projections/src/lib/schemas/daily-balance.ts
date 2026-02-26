import { z } from 'zod';

/**
 * Daily Balance base data schema
 */
const DailyBalanceDataSchema = z.object({
  id: z.string(),
  date: z.string(), // ISO date string
  expectedBalance: z.number(),
  actualBalance: z.number().nullable(),
  bankAccountId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Daily Balance GET Response Schema (single by date and bank account)
 */
export const DailyBalanceGetResponseSchema = z.object({
  success: z.boolean(),
  data: DailyBalanceDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Daily Balances GET Response Schema (list, with date range)
 */
export const DailyBalancesGetResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(DailyBalanceDataSchema).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Daily Balance PUT Request Schema (set actual balance)
 */
export const DailyBalanceSetActualRequestSchema = z.object({
  date: z.string(), // ISO date string
  actualBalance: z.number(),
  bankAccountId: z.string(),
});

/**
 * Daily Balance PUT Response Schema
 */
export const DailyBalanceSetActualResponseSchema = z.object({
  success: z.boolean(),
  data: DailyBalanceDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Daily Balance Query Parameters Schema
 */
export const DailyBalanceQueryParamsSchema = z.object({
  date: z.string(), // ISO date string
  bankAccountId: z.string(),
});

/**
 * Daily Balances Query Parameters Schema (for range queries)
 */
export const DailyBalancesQueryParamsSchema = z.object({
  startDate: z.string(), // ISO date string
  endDate: z.string(),   // ISO date string
  bankAccountId: z.string(),
});

/**
 * Daily Balance DELETE Response Schema
 */
export const DailyBalanceClearActualResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Export types
export type DailyBalanceClearActualResponse = z.infer<typeof DailyBalanceClearActualResponseSchema>;
export type DailyBalanceData = z.infer<typeof DailyBalanceDataSchema>;
export type DailyBalanceGetResponse = z.infer<typeof DailyBalanceGetResponseSchema>;
export type DailyBalancesGetResponse = z.infer<typeof DailyBalancesGetResponseSchema>;
export type DailyBalanceSetActualRequest = z.infer<typeof DailyBalanceSetActualRequestSchema>;
export type DailyBalanceSetActualResponse = z.infer<typeof DailyBalanceSetActualResponseSchema>;
export type DailyBalanceQueryParams = z.infer<typeof DailyBalanceQueryParamsSchema>;
export type DailyBalancesQueryParams = z.infer<typeof DailyBalancesQueryParamsSchema>;
