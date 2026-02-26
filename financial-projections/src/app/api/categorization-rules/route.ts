import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import {
  getAllCategorizationRules,
  createCategorizationRule,
  CreateCategorizationRuleInput,
} from '@/lib/dal/categorization-rules';

const CreateCategorizationRuleRequestSchema = z.object({
  descriptionString: z.string(),
  exactMatch: z.boolean(),
  spendingTypeIds: z.array(z.string()).min(1),
});

/**
 * GET /api/categorization-rules
 * Get all categorization rules with their spending types
 */
export const { GET } = defineRoute({
  operationId: 'getCategorizationRules',
  method: 'GET',
  summary: 'Get all categorization rules',
  description: 'Get all categorization rules with their spending types',
  tags: ['Categorization Rules'],
  action: async () => {
    try {
      const rules = await getAllCategorizationRules();

      return Response.json({
        success: true,
        data: rules.map((rule) => ({
          id: rule.id,
          descriptionString: rule.descriptionString,
          exactMatch: rule.exactMatch,
          spendingTypes: rule.spendingTypes.map((st) => ({
            id: st.spendingType.id,
            name: st.spendingType.name,
          })),
          createdAt: rule.createdAt.toISOString(),
          updatedAt: rule.updatedAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error('Error fetching categorization rules:', error);
      return Response.json(
        {
          success: false,
          error: 'Failed to fetch categorization rules',
        },
        { status: 500 }
      );
    }
  },
  responses: {
    200: { description: 'List of categorization rules retrieved successfully' },
    500: { description: 'Server error' },
  },
});

/**
 * POST /api/categorization-rules
 * Create a new categorization rule
 */
export const { POST } = defineRoute({
  operationId: 'createCategorizationRule',
  method: 'POST',
  summary: 'Create a new categorization rule',
  description: 'Create a new categorization rule with description string, match type, and spending type associations',
  tags: ['Categorization Rules'],
  requestBody: CreateCategorizationRuleRequestSchema,
  action: async ({ body }) => {
    try {
      const input: CreateCategorizationRuleInput = {
        descriptionString: body.descriptionString,
        exactMatch: body.exactMatch,
        spendingTypeIds: body.spendingTypeIds,
      };

      const rule = await createCategorizationRule(input);

      return Response.json(
        {
          success: true,
          data: {
            id: rule.id,
            descriptionString: rule.descriptionString,
            exactMatch: rule.exactMatch,
            spendingTypes: rule.spendingTypes.map((st) => ({
              id: st.spendingType.id,
              name: st.spendingType.name,
            })),
            createdAt: rule.createdAt.toISOString(),
            updatedAt: rule.updatedAt.toISOString(),
          },
          message: 'Categorization rule created successfully',
        },
        { status: 201 }
      );
    } catch (error: unknown) {
      console.error('Error creating categorization rule:', error);
      return Response.json(
        {
          success: false,
          error: 'Failed to create categorization rule',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  },
  responses: {
    201: { description: 'Categorization rule created successfully' },
    400: { description: 'Invalid request body' },
    500: { description: 'Server error' },
  },
});
