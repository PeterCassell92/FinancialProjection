import { z } from 'zod';

/**
 * Schema for Settings data returned from API
 *
 * Note: initialBankBalance can be undefined/null for first-time users
 * who haven't set up their initial balance yet
 */
export const SettingsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string(),
    initialBankBalance: z.number().optional().nullable(),
    initialBalanceDate: z.string().optional().nullable(), // ISO date string
    createdAt: z.string(),
    updatedAt: z.string(),
  }).optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export type SettingsResponse = z.infer<typeof SettingsResponseSchema>;
