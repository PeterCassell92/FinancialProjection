import { z } from 'zod';

/**
 * Spending Type base data schema
 */
const SpendingTypeDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  color: z.string().nullable(), // Hex color code
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Spending Type GET Response Schema (single by ID)
 */
export const SpendingTypeGetResponseSchema = z.object({
  success: z.boolean(),
  data: SpendingTypeDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Spending Types GET Response Schema (list all)
 */
export const SpendingTypesGetResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(SpendingTypeDataSchema).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Spending Type POST Request Schema (create)
 */
export const SpendingTypeCreateRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code (e.g., #FF5733)').optional(),
});

/**
 * Spending Type POST Response Schema
 */
export const SpendingTypeCreateResponseSchema = z.object({
  success: z.boolean(),
  data: SpendingTypeDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Spending Type PATCH Request Schema (update)
 */
export const SpendingTypeUpdateRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code (e.g., #FF5733)').nullable().optional(),
});

/**
 * Spending Type PATCH Response Schema
 */
export const SpendingTypeUpdateResponseSchema = z.object({
  success: z.boolean(),
  data: SpendingTypeDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Spending Type DELETE Response Schema
 */
export const SpendingTypeDeleteResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Export types
export type SpendingTypeData = z.infer<typeof SpendingTypeDataSchema>;
export type SpendingTypeGetResponse = z.infer<typeof SpendingTypeGetResponseSchema>;
export type SpendingTypesGetResponse = z.infer<typeof SpendingTypesGetResponseSchema>;
export type SpendingTypeCreateRequest = z.infer<typeof SpendingTypeCreateRequestSchema>;
export type SpendingTypeCreateResponse = z.infer<typeof SpendingTypeCreateResponseSchema>;
export type SpendingTypeUpdateRequest = z.infer<typeof SpendingTypeUpdateRequestSchema>;
export type SpendingTypeUpdateResponse = z.infer<typeof SpendingTypeUpdateResponseSchema>;
export type SpendingTypeDeleteResponse = z.infer<typeof SpendingTypeDeleteResponseSchema>;
