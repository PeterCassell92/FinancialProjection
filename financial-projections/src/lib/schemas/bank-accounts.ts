import { z } from 'zod';

/**
 * Bank Account base data schema
 */
export const BankAccountDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  sortCode: z.string(),
  accountNumber: z.string(),
  provider: z.enum([
    'HALIFAX',
    'LLOYDS',
    'BANK_OF_SCOTLAND',
    'BARCLAYS',
    'HSBC',
    'NATIONWIDE',
    'SANTANDER',
    'NATWEST',
    'RBS',
    'TSB',
    'OTHER',
  ]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Bank Account GET Response Schema (single account by ID)
 */
export const BankAccountGetResponseSchema = z.object({
  success: z.boolean(),
  data: BankAccountDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Bank Accounts GET Response Schema (list all)
 */
export const BankAccountsGetResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(BankAccountDataSchema).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Bank Account POST Request Schema (create)
 */
export const BankAccountCreateRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  sortCode: z.string().regex(/^\d{2}-\d{2}-\d{2}$/, 'Sort code must be in format XX-XX-XX'),
  accountNumber: z.string().regex(/^\d{8}$/, 'Account number must be 8 digits'),
  provider: z.enum([
    'HALIFAX',
    'LLOYDS',
    'BANK_OF_SCOTLAND',
    'BARCLAYS',
    'HSBC',
    'NATIONWIDE',
    'SANTANDER',
    'NATWEST',
    'RBS',
    'TSB',
    'OTHER',
  ]).optional().default('OTHER'),
});

/**
 * Bank Account POST Response Schema
 */
export const BankAccountCreateResponseSchema = z.object({
  success: z.boolean(),
  data: BankAccountDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Bank Account PATCH Request Schema (update)
 */
export const BankAccountUpdateRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().nullable().optional(),
  sortCode: z.string().regex(/^\d{2}-\d{2}-\d{2}$/, 'Sort code must be in format XX-XX-XX').optional(),
  accountNumber: z.string().regex(/^\d{8}$/, 'Account number must be 8 digits').optional(),
  provider: z.enum([
    'HALIFAX',
    'LLOYDS',
    'BANK_OF_SCOTLAND',
    'BARCLAYS',
    'HSBC',
    'NATIONWIDE',
    'SANTANDER',
    'NATWEST',
    'RBS',
    'TSB',
    'OTHER',
  ]).optional(),
});

/**
 * Bank Account PATCH Response Schema
 */
export const BankAccountUpdateResponseSchema = z.object({
  success: z.boolean(),
  data: BankAccountDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Bank Account DELETE Response Schema
 */
export const BankAccountDeleteResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Export types
export type BankAccountData = z.infer<typeof BankAccountDataSchema>;
export type BankAccountGetResponse = z.infer<typeof BankAccountGetResponseSchema>;
export type BankAccountsGetResponse = z.infer<typeof BankAccountsGetResponseSchema>;
export type BankAccountCreateRequest = z.infer<typeof BankAccountCreateRequestSchema>;
export type BankAccountCreateResponse = z.infer<typeof BankAccountCreateResponseSchema>;
export type BankAccountUpdateRequest = z.infer<typeof BankAccountUpdateRequestSchema>;
export type BankAccountUpdateResponse = z.infer<typeof BankAccountUpdateResponseSchema>;
export type BankAccountDeleteResponse = z.infer<typeof BankAccountDeleteResponseSchema>;
