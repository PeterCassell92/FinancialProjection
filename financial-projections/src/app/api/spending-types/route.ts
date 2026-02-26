import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import {
  getAllSpendingTypes,
  getSpendingTypesWithCounts,
  createSpendingType,
  CreateSpendingTypeInput,
} from '@/lib/dal/spending-types';
import {
  SpendingTypesGetResponseSchema,
  SpendingTypeCreateRequestSchema,
  SpendingTypeCreateResponseSchema,
} from '@/lib/schemas';

/**
 * GET /api/spending-types
 * Get all spending types, optionally with usage counts
 */
export const { GET } = defineRoute({
  operationId: 'getSpendingTypes',
  method: 'GET',
  summary: 'Get all spending types',
  description: 'Get all spending types, optionally with usage counts',
  tags: ['Spending Types'],
  queryParams: z.object({
    includeCounts: z.string().optional(),
  }),
  action: async ({ queryParams }) => {
    try {
      const includeCounts = queryParams?.includeCounts === 'true';

      let spendingTypes;
      if (includeCounts) {
        spendingTypes = await getSpendingTypesWithCounts();
      } else {
        spendingTypes = await getAllSpendingTypes();
      }

      const serializedData = spendingTypes.map(st => ({
        id: st.id,
        name: st.name,
        description: st.description,
        color: st.color,
        createdAt: st.createdAt.toISOString(),
        updatedAt: st.updatedAt.toISOString(),
      }));

      return Response.json({ success: true, data: serializedData });
    } catch (error) {
      console.error('Error fetching spending types:', error);
      return Response.json(
        { success: false, error: 'Failed to fetch spending types' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'List of spending types retrieved successfully',
      content: SpendingTypesGetResponseSchema,
    },
    500: { description: 'Server error' },
  },
});

/**
 * POST /api/spending-types
 * Create a new spending type
 */
export const { POST } = defineRoute({
  operationId: 'createSpendingType',
  method: 'POST',
  summary: 'Create a new spending type',
  description: 'Create a new spending type with name, description, and color',
  tags: ['Spending Types'],
  requestBody: SpendingTypeCreateRequestSchema,
  action: async ({ body }) => {
    try {
      const input: CreateSpendingTypeInput = {
        name: body.name,
        description: body.description,
        color: body.color,
      };

      const spendingType = await createSpendingType(input);

      const serializedData = {
        id: spendingType.id,
        name: spendingType.name,
        description: spendingType.description,
        color: spendingType.color,
        createdAt: spendingType.createdAt.toISOString(),
        updatedAt: spendingType.updatedAt.toISOString(),
      };

      return Response.json(
        { success: true, data: serializedData, message: 'Spending type created successfully' },
        { status: 201 }
      );
    } catch (error: unknown) {
      console.error('Error creating spending type:', error);

      if (error instanceof Object && 'code' in error && error.code === 'P2002') {
        return Response.json(
          { success: false, error: 'Spending type with this name already exists' },
          { status: 409 }
        );
      }

      return Response.json(
        { success: false, error: 'Failed to create spending type' },
        { status: 500 }
      );
    }
  },
  responses: {
    201: {
      description: 'Spending type created successfully',
      content: SpendingTypeCreateResponseSchema,
    },
    400: { description: 'Invalid request body' },
    409: { description: 'Spending type with this name already exists' },
    500: { description: 'Server error' },
  },
});
