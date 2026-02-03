import { z } from 'zod';

/**
 * Recurring Event Rule base data schema
 */
const RecurringEventRuleDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  value: z.number(),
  type: z.enum(['EXPENSE', 'INCOMING']),
  certainty: z.enum(['UNLIKELY', 'POSSIBLE', 'LIKELY', 'CERTAIN']),
  payTo: z.string().nullable(),
  paidBy: z.string().nullable(),
  decisionPathId: z.string().nullable(),
  bankAccountId: z.string(),
  startDate: z.string(), // ISO date string
  endDate: z.string(),   // ISO date string
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Recurring Event Rule GET Response Schema (single by ID)
 */
export const RecurringEventRuleGetResponseSchema = z.object({
  success: z.boolean(),
  data: RecurringEventRuleDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Recurring Event Rules GET Response Schema (list all)
 */
export const RecurringEventRulesGetResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(RecurringEventRuleDataSchema).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Recurring Event Rule POST Request Schema (create)
 */
export const RecurringEventRuleCreateRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  value: z.number().positive('Value must be greater than 0'),
  type: z.enum(['EXPENSE', 'INCOMING']),
  certainty: z.enum(['UNLIKELY', 'POSSIBLE', 'LIKELY', 'CERTAIN']),
  payTo: z.string().optional(),
  paidBy: z.string().optional(),
  decisionPathId: z.string().optional(),
  bankAccountId: z.string(),
  startDate: z.string(), // ISO date string
  endDate: z.string(),   // ISO date string
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL']),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
  },
  {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  }
);

/**
 * Recurring Event Rule POST Response Schema
 */
export const RecurringEventRuleCreateResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    rule: RecurringEventRuleDataSchema,
    generatedEventsCount: z.number(),
  }).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Recurring Event Rule PUT Request Schema (update)
 */
export const RecurringEventRuleUpdateRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().nullable().optional(),
  value: z.number().positive('Value must be greater than 0').optional(),
  type: z.enum(['EXPENSE', 'INCOMING']).optional(),
  certainty: z.enum(['UNLIKELY', 'POSSIBLE', 'LIKELY', 'CERTAIN']).optional(),
  payTo: z.string().nullable().optional(),
  paidBy: z.string().nullable().optional(),
  decisionPathId: z.string().nullable().optional(),
  bankAccountId: z.string().optional(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(),   // ISO date string
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL']).optional(),
}).refine(
  (data) => {
    // Only validate if both dates are provided
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    }
    return true;
  },
  {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  }
);

/**
 * Recurring Event Rule PUT Response Schema
 */
export const RecurringEventRuleUpdateResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    rule: RecurringEventRuleDataSchema,
    regeneratedEventsCount: z.number(),
  }).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Recurring Event Rule DELETE Response Schema
 */
export const RecurringEventRuleDeleteResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Export types
export type RecurringEventRuleData = z.infer<typeof RecurringEventRuleDataSchema>;
export type RecurringEventRuleGetResponse = z.infer<typeof RecurringEventRuleGetResponseSchema>;
export type RecurringEventRulesGetResponse = z.infer<typeof RecurringEventRulesGetResponseSchema>;
export type RecurringEventRuleCreateRequest = z.infer<typeof RecurringEventRuleCreateRequestSchema>;
export type RecurringEventRuleCreateResponse = z.infer<typeof RecurringEventRuleCreateResponseSchema>;
export type RecurringEventRuleUpdateRequest = z.infer<typeof RecurringEventRuleUpdateRequestSchema>;
export type RecurringEventRuleUpdateResponse = z.infer<typeof RecurringEventRuleUpdateResponseSchema>;
export type RecurringEventRuleDeleteResponse = z.infer<typeof RecurringEventRuleDeleteResponseSchema>;
