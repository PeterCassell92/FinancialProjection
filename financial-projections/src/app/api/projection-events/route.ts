import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import {
  getProjectionEvents,
  createProjectionEvent,
  getProjectionEventsByDate,
} from '@/lib/dal/projection-events';
import {
  ProjectionEventsGetResponseSchema,
  ProjectionEventCreateRequestSchema,
  ProjectionEventCreateResponseSchema,
} from '@/lib/schemas';

/**
 * GET /api/projection-events
 * Get projection events within a date range or for a specific date
 */
export const { GET } = defineRoute({
  operationId: 'getProjectionEvents',
  method: 'GET',
  summary: 'Get projection events',
  description: 'Get projection events within a date range (startDate, endDate) or for a specific date',
  tags: ['Projection Events'],
  queryParams: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    date: z.string().optional(),
  }),
  action: async ({ queryParams }) => {
    try {
      const { startDate: startDateParam, endDate: endDateParam, date: dateParam } = queryParams || {};

      if (dateParam) {
        const date = new Date(dateParam);
        const events = await getProjectionEventsByDate(date);

        const serializedData = events.map((event) => ({
          id: event.id,
          name: event.name,
          description: event.description,
          value: parseFloat(event.value.toString()),
          type: event.type,
          certainty: event.certainty,
          payTo: event.payTo,
          paidBy: event.paidBy,
          date: event.date.toISOString(),
          decisionPathId: event.decisionPathId,
          bankAccountId: event.bankAccountId,
          recurringRuleId: event.recurringRuleId,
          createdAt: event.createdAt.toISOString(),
          updatedAt: event.updatedAt.toISOString(),
        }));

        return Response.json({ success: true, data: serializedData });
      }

      if (!startDateParam || !endDateParam) {
        return Response.json(
          { success: false, error: 'startDate and endDate query parameters are required' },
          { status: 400 }
        );
      }

      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);

      const events = await getProjectionEvents(startDate, endDate);

      const serializedData = events.map((event) => ({
        id: event.id,
        name: event.name,
        description: event.description,
        value: parseFloat(event.value.toString()),
        type: event.type,
        certainty: event.certainty,
        payTo: event.payTo,
        paidBy: event.paidBy,
        date: event.date.toISOString(),
        decisionPathId: event.decisionPathId,
        bankAccountId: event.bankAccountId,
        recurringRuleId: event.recurringRuleId,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      }));

      return Response.json({ success: true, data: serializedData });
    } catch (error) {
      console.error('Error fetching projection events:', error);
      return Response.json(
        { success: false, error: 'Failed to fetch projection events' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Projection events retrieved successfully',
      content: ProjectionEventsGetResponseSchema,
    },
    400: { description: 'Missing required query parameters' },
    500: { description: 'Server error' },
  },
});

/**
 * POST /api/projection-events
 * Create a new projection event
 */
export const { POST } = defineRoute({
  operationId: 'createProjectionEvent',
  method: 'POST',
  summary: 'Create a projection event',
  description: 'Create a new projection event and recalculate forward balances',
  tags: ['Projection Events'],
  requestBody: ProjectionEventCreateRequestSchema,
  action: async ({ body }) => {
    try {
      const event = await createProjectionEvent({
        name: body.name,
        description: body.description,
        value: body.value,
        type: body.type,
        certainty: body.certainty,
        payTo: body.payTo,
        paidBy: body.paidBy,
        date: new Date(body.date),
        bankAccountId: body.bankAccountId,
        decisionPathId: body.decisionPathId,
      });

      // Recalculate balances from this day forward (6 months)
      const { addMonths } = await import('date-fns');
      const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');

      const eventDate = new Date(body.date);
      const endDate = addMonths(eventDate, 6);
      await recalculateBalancesFrom(eventDate, endDate, body.bankAccountId);

      const serializedData = {
        id: event.id,
        name: event.name,
        description: event.description,
        value: parseFloat(event.value.toString()),
        type: event.type,
        certainty: event.certainty,
        payTo: event.payTo,
        paidBy: event.paidBy,
        date: event.date.toISOString(),
        decisionPathId: event.decisionPathId,
        bankAccountId: event.bankAccountId,
        recurringRuleId: event.recurringRuleId,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      };

      return Response.json(
        { success: true, data: serializedData, message: 'Projection event created successfully' },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error creating projection event:', error);
      return Response.json(
        { success: false, error: 'Failed to create projection event' },
        { status: 500 }
      );
    }
  },
  responses: {
    201: {
      description: 'Projection event created successfully',
      content: ProjectionEventCreateResponseSchema,
    },
    400: { description: 'Invalid request body' },
    500: { description: 'Server error' },
  },
});
