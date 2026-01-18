import { z } from 'zod';

/**
 * Scenario Set Decision Path data schema
 */
const ScenarioSetDecisionPathDataSchema = z.object({
  id: z.string(),
  decisionPathId: z.string(),
  enabled: z.boolean(),
  decisionPath: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
  }),
});

/**
 * Scenario Set base data schema
 */
const ScenarioSetDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isDefault: z.boolean(),
  decisionPaths: z.array(ScenarioSetDecisionPathDataSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Scenario Set GET Response Schema (single by ID)
 */
export const ScenarioSetGetResponseSchema = z.object({
  success: z.boolean(),
  data: ScenarioSetDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Scenario Sets GET Response Schema (list all)
 */
export const ScenarioSetsGetResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ScenarioSetDataSchema).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Scenario Set POST Request Schema (create)
 */
export const ScenarioSetCreateRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
  decisionPaths: z.array(z.object({
    decisionPathId: z.string(),
    enabled: z.boolean().optional().default(true),
  })).optional(),
});

/**
 * Scenario Set POST Response Schema
 */
export const ScenarioSetCreateResponseSchema = z.object({
  success: z.boolean(),
  data: ScenarioSetDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Scenario Set PATCH Request Schema (update)
 */
export const ScenarioSetUpdateRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().nullable().optional(),
  isDefault: z.boolean().optional(),
  decisionPaths: z.array(z.object({
    decisionPathId: z.string(),
    enabled: z.boolean(),
  })).optional(),
});

/**
 * Scenario Set PATCH Response Schema
 */
export const ScenarioSetUpdateResponseSchema = z.object({
  success: z.boolean(),
  data: ScenarioSetDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Scenario Set DELETE Response Schema
 */
export const ScenarioSetDeleteResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Export types
export type ScenarioSetDecisionPathData = z.infer<typeof ScenarioSetDecisionPathDataSchema>;
export type ScenarioSetData = z.infer<typeof ScenarioSetDataSchema>;
export type ScenarioSetGetResponse = z.infer<typeof ScenarioSetGetResponseSchema>;
export type ScenarioSetsGetResponse = z.infer<typeof ScenarioSetsGetResponseSchema>;
export type ScenarioSetCreateRequest = z.infer<typeof ScenarioSetCreateRequestSchema>;
export type ScenarioSetCreateResponse = z.infer<typeof ScenarioSetCreateResponseSchema>;
export type ScenarioSetUpdateRequest = z.infer<typeof ScenarioSetUpdateRequestSchema>;
export type ScenarioSetUpdateResponse = z.infer<typeof ScenarioSetUpdateResponseSchema>;
export type ScenarioSetDeleteResponse = z.infer<typeof ScenarioSetDeleteResponseSchema>;
