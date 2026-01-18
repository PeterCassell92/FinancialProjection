import { z } from 'zod';

/**
 * Settings GET Response Schema
 */
export const SettingsGetResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string(),
    initialBankBalance: z.number(),
    initialBalanceDate: z.string(), // ISO date string
    currency: z.enum(['GBP', 'USD']),
    dateFormat: z.enum(['UK', 'US']),
    defaultBankAccountId: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Settings PUT Request Schema (Full replacement)
 */
export const SettingsPutRequestSchema = z.object({
  initialBankBalance: z.number().positive('Initial bank balance must be positive'),
  initialBalanceDate: z.string().optional(), // ISO date string
  currency: z.enum(['GBP', 'USD']).optional(),
  dateFormat: z.enum(['UK', 'US']).optional(),
  defaultBankAccountId: z.string().nullable().optional(),
});

/**
 * Settings PUT Response Schema
 */
export const SettingsPutResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string(),
    initialBankBalance: z.number(),
    initialBalanceDate: z.string(),
    currency: z.enum(['GBP', 'USD']),
    dateFormat: z.enum(['UK', 'US']),
    defaultBankAccountId: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Settings PATCH Request Schema (Partial update)
 */
export const SettingsPatchRequestSchema = z.object({
  initialBankBalance: z.number().positive('Initial bank balance must be positive').optional(),
  initialBalanceDate: z.string().optional(), // ISO date string
  currency: z.enum(['GBP', 'USD']).optional(),
  dateFormat: z.enum(['UK', 'US']).optional(),
  defaultBankAccountId: z.string().nullable().optional(),
});

/**
 * Settings PATCH Response Schema
 */
export const SettingsPatchResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string(),
    initialBankBalance: z.number(),
    initialBalanceDate: z.string(),
    currency: z.enum(['GBP', 'USD']),
    dateFormat: z.enum(['UK', 'US']),
    defaultBankAccountId: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Export types
export type SettingsGetResponse = z.infer<typeof SettingsGetResponseSchema>;
export type SettingsPutRequest = z.infer<typeof SettingsPutRequestSchema>;
export type SettingsPutResponse = z.infer<typeof SettingsPutResponseSchema>;
export type SettingsPatchRequest = z.infer<typeof SettingsPatchRequestSchema>;
export type SettingsPatchResponse = z.infer<typeof SettingsPatchResponseSchema>;
