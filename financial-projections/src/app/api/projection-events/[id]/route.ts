import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import {
  getProjectionEventById,
  updateProjectionEvent,
  deleteProjectionEvent,
} from '@/lib/dal/projection-events';
import {
  ProjectionEventGetResponseSchema,
  ProjectionEventUpdateRequestSchema,
  ProjectionEventPutResponseSchema,
  ProjectionEventDeleteResponseSchema,
} from '@/lib/schemas';

const pathParams = z.object({ id: z.string() });

/**
 * GET /api/projection-events/[id]
 * Get a single projection event by ID
 */
export const { GET } = defineRoute({
  operationId: 'getProjectionEventById',
  method: 'GET',
  summary: 'Get a projection event by ID',
  description: 'Get a single projection event by its ID',
  tags: ['Projection Events'],
  pathParams,
  action: async ({ pathParams: { id } }) => {
    try {
      const event = await getProjectionEventById(id);

      if (!event) {
        return Response.json(
          { success: false, error: 'Projection event not found' },
          { status: 404 }
        );
      }

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

      return Response.json({ success: true, data: serializedData });
    } catch (error) {
      console.error('Error fetching projection event:', error);
      return Response.json(
        { success: false, error: 'Failed to fetch projection event' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Projection event retrieved successfully',
      content: ProjectionEventGetResponseSchema,
    },
    404: { description: 'Projection event not found' },
    500: { description: 'Server error' },
  },
});

/**
 * PUT /api/projection-events/[id]
 * Update a projection event
 */
export const { PUT } = defineRoute({
  operationId: 'updateProjectionEvent',
  method: 'PUT',
  summary: 'Update a projection event',
  description: 'Update a projection event and recalculate forward balances',
  tags: ['Projection Events'],
  pathParams,
  requestBody: ProjectionEventUpdateRequestSchema,
  action: async ({ pathParams: { id }, body }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {};

      if (body.name !== undefined) updateData.name = body.name;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.value !== undefined) updateData.value = body.value;
      if (body.type !== undefined) updateData.type = body.type;
      if (body.certainty !== undefined) updateData.certainty = body.certainty;
      if (body.payTo !== undefined) updateData.payTo = body.payTo;
      if (body.paidBy !== undefined) updateData.paidBy = body.paidBy;
      if (body.date !== undefined) updateData.date = new Date(body.date);
      if (body.bankAccountId !== undefined) updateData.bankAccountId = body.bankAccountId;
      if (body.decisionPathId !== undefined) updateData.decisionPathId = body.decisionPathId;
      // IMPORTANT: Preserve recurringRuleId to maintain parent-child relationship
      if (body.recurringRuleId !== undefined) updateData.recurringRuleId = body.recurringRuleId;

      const event = await updateProjectionEvent(id, updateData);

      // Recalculate balances from this day forward (6 months)
      const { addMonths } = await import('date-fns');
      const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');

      const eventDate = event.date;
      const endDate = addMonths(eventDate, 6);
      await recalculateBalancesFrom(eventDate, endDate, event.bankAccountId);

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

      return Response.json({
        success: true,
        data: serializedData,
        message: 'Projection event updated successfully',
      });
    } catch (error) {
      console.error('Error updating projection event:', error);
      return Response.json(
        { success: false, error: 'Failed to update projection event' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Projection event updated successfully',
      content: ProjectionEventPutResponseSchema,
    },
    400: { description: 'Invalid request body' },
    404: { description: 'Projection event not found' },
    500: { description: 'Server error' },
  },
});

/**
 * DELETE /api/projection-events/[id]
 * Delete a projection event
 */
export const { DELETE } = defineRoute({
  operationId: 'deleteProjectionEvent',
  method: 'DELETE',
  summary: 'Delete a projection event',
  description: 'Delete a projection event and recalculate forward balances',
  tags: ['Projection Events'],
  pathParams,
  action: async ({ pathParams: { id } }) => {
    try {
      // Get the event first to capture its date for recalculation
      const eventToDelete = await getProjectionEventById(id);

      if (!eventToDelete) {
        return Response.json(
          { success: false, error: 'Projection event not found' },
          { status: 404 }
        );
      }

      const eventDate = eventToDelete.date;

      await deleteProjectionEvent(id);

      // Recalculate balances from the event date forward (6 months)
      const { addMonths } = await import('date-fns');
      const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');

      const endDate = addMonths(eventDate, 6);
      await recalculateBalancesFrom(eventDate, endDate, eventToDelete.bankAccountId);

      return Response.json({
        success: true,
        message: 'Projection event deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting projection event:', error);
      return Response.json(
        { success: false, error: 'Failed to delete projection event' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Projection event deleted successfully',
      content: ProjectionEventDeleteResponseSchema,
    },
    404: { description: 'Projection event not found' },
    500: { description: 'Server error' },
  },
});
