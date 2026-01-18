import { z } from 'zod';

/**
 * Decision Path base data schema
 */
const DecisionPathDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
});

/**
 * Decision Path GET Response Schema (single by ID)
 */
export const DecisionPathGetResponseSchema = z.object({
  success: z.boolean(),
  data: DecisionPathDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Decision Paths GET Response Schema (list all)
 */
export const DecisionPathsGetResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(DecisionPathDataSchema).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Decision Path POST Request Schema (create)
 */
export const DecisionPathCreateRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

/**
 * Decision Path POST Response Schema
 */
export const DecisionPathCreateResponseSchema = z.object({
  success: z.boolean(),
  data: DecisionPathDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Decision Path PATCH Request Schema (update)
 */
export const DecisionPathUpdateRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().nullable().optional(),
});

/**
 * Decision Path PATCH Response Schema
 */
export const DecisionPathUpdateResponseSchema = z.object({
  success: z.boolean(),
  data: DecisionPathDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Decision Path DELETE Response Schema
 */
export const DecisionPathDeleteResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Export types
export type DecisionPathData = z.infer<typeof DecisionPathDataSchema>;
export type DecisionPathGetResponse = z.infer<typeof DecisionPathGetResponseSchema>;
export type DecisionPathsGetResponse = z.infer<typeof DecisionPathsGetResponseSchema>;
export type DecisionPathCreateRequest = z.infer<typeof DecisionPathCreateRequestSchema>;
export type DecisionPathCreateResponse = z.infer<typeof DecisionPathCreateResponseSchema>;
export type DecisionPathUpdateRequest = z.infer<typeof DecisionPathUpdateRequestSchema>;
export type DecisionPathUpdateResponse = z.infer<typeof DecisionPathUpdateResponseSchema>;
export type DecisionPathDeleteResponse = z.infer<typeof DecisionPathDeleteResponseSchema>;
