import { z } from 'zod';

/**
 * Projection Event base data schema
 */
const ProjectionEventDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  value: z.number(),
  type: z.enum(['EXPENSE', 'INCOMING']),
  certainty: z.enum(['UNLIKELY', 'POSSIBLE', 'LIKELY', 'CERTAIN']),
  payTo: z.string().nullable(),
  paidBy: z.string().nullable(),
  date: z.string(), // ISO date string
  decisionPathId: z.string().nullable(),
  bankAccountId: z.string(),
  recurringRuleId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Projection Event GET Response Schema (single by ID)
 */
export const ProjectionEventGetResponseSchema = z.object({
  success: z.boolean(),
  data: ProjectionEventDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Projection Events GET Response Schema (list, with optional filters)
 */
export const ProjectionEventsGetResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ProjectionEventDataSchema).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Projection Event POST Request Schema (create)
 */
export const ProjectionEventCreateRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  value: z.number().positive('Value must be greater than 0'),
  type: z.enum(['EXPENSE', 'INCOMING']),
  certainty: z.enum(['UNLIKELY', 'POSSIBLE', 'LIKELY', 'CERTAIN']),
  payTo: z.string().optional(),
  paidBy: z.string().optional(),
  date: z.string(), // ISO date string
  decisionPathId: z.string().optional(),
  bankAccountId: z.string(),
});

/**
 * Projection Event POST Response Schema
 */
export const ProjectionEventCreateResponseSchema = z.object({
  success: z.boolean(),
  data: ProjectionEventDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Projection Event PUT Request Schema (full update)
 */
export const ProjectionEventUpdateRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().nullable().optional(),
  value: z.number().positive('Value must be greater than 0').optional(),
  type: z.enum(['EXPENSE', 'INCOMING']).optional(),
  certainty: z.enum(['UNLIKELY', 'POSSIBLE', 'LIKELY', 'CERTAIN']).optional(),
  payTo: z.string().nullable().optional(),
  paidBy: z.string().nullable().optional(),
  date: z.string().optional(), // ISO date string
  decisionPathId: z.string().nullable().optional(),
  bankAccountId: z.string().optional(),
});

/**
 * Projection Event PUT Response Schema
 */
export const ProjectionEventPutResponseSchema = z.object({
  success: z.boolean(),
  data: ProjectionEventDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Projection Event DELETE Response Schema
 */
export const ProjectionEventDeleteResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Projection Events Query Parameters Schema
 */
export const ProjectionEventsQueryParamsSchema = z.object({
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(),   // ISO date string
  type: z.enum(['EXPENSE', 'INCOMING']).optional(),
  certainty: z.enum(['UNLIKELY', 'POSSIBLE', 'LIKELY', 'CERTAIN']).optional(),
  bankAccountId: z.string().optional(),
  decisionPathId: z.string().optional(),
});

// Export types
export type ProjectionEventData = z.infer<typeof ProjectionEventDataSchema>;
export type ProjectionEventGetResponse = z.infer<typeof ProjectionEventGetResponseSchema>;
export type ProjectionEventsGetResponse = z.infer<typeof ProjectionEventsGetResponseSchema>;
export type ProjectionEventCreateRequest = z.infer<typeof ProjectionEventCreateRequestSchema>;
export type ProjectionEventCreateResponse = z.infer<typeof ProjectionEventCreateResponseSchema>;
export type ProjectionEventUpdateRequest = z.infer<typeof ProjectionEventUpdateRequestSchema>;
export type ProjectionEventPutResponse = z.infer<typeof ProjectionEventPutResponseSchema>;
export type ProjectionEventDeleteResponse = z.infer<typeof ProjectionEventDeleteResponseSchema>;
export type ProjectionEventsQueryParams = z.infer<typeof ProjectionEventsQueryParamsSchema>;
