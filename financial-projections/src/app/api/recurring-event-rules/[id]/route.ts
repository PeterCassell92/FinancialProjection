import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import {
  getRecurringEventRuleById,
  updateRecurringEventRuleAndRegenerateEvents,
  deleteRecurringEventRule,
  deleteGeneratedEventsForRule,
} from '@/lib/dal/recurring-event-rules';
import {
  RecurringEventRuleGetResponseSchema,
  RecurringEventRuleUpdateRequestSchema,
  RecurringEventRuleUpdateResponseSchema,
  RecurringEventRuleDeleteResponseSchema,
} from '@/lib/schemas';

const pathParams = z.object({ id: z.string() });

/**
 * GET /api/recurring-event-rules/[id]
 * Get a single recurring event rule by ID
 */
export const { GET } = defineRoute({
  operationId: 'getRecurringEventRuleById',
  method: 'GET',
  summary: 'Get a recurring event rule by ID',
  description: 'Get a single recurring event rule by its ID, including generated projection events',
  tags: ['Recurring Event Rules'],
  pathParams,
  action: async ({ pathParams: { id } }) => {
    try {
      const rule = await getRecurringEventRuleById(id);

      if (!rule) {
        return Response.json(
          { success: false, error: 'Recurring event rule not found' },
          { status: 404 }
        );
      }

      const serializedRule = {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        value: parseFloat(rule.value.toString()),
        type: rule.type,
        certainty: rule.certainty,
        payTo: rule.payTo,
        paidBy: rule.paidBy,
        decisionPathId: rule.decisionPathId,
        bankAccountId: rule.bankAccountId,
        startDate: rule.startDate.toISOString(),
        endDate: rule.endDate.toISOString(),
        frequency: rule.frequency,
        isBaseRule: rule.isBaseRule,
        baseRuleId: rule.baseRuleId,
        createdAt: rule.createdAt.toISOString(),
        updatedAt: rule.updatedAt.toISOString(),
        projectionEvents: rule.projectionEvents.map((event) => ({
          id: event.id,
          date: event.date.toISOString(),
          value: parseFloat(event.value.toString()),
        })),
      };

      return Response.json({ success: true, data: serializedRule });
    } catch (error) {
      console.error('Error fetching recurring event rule:', error);
      return Response.json(
        { success: false, error: 'Failed to fetch recurring event rule' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Recurring event rule retrieved successfully',
      content: RecurringEventRuleGetResponseSchema,
    },
    404: { description: 'Recurring event rule not found' },
    500: { description: 'Server error' },
  },
});

/**
 * PATCH /api/recurring-event-rules/[id]
 * Update a recurring event rule and regenerate its events
 */
export const { PATCH } = defineRoute({
  operationId: 'updateRecurringEventRule',
  method: 'PATCH',
  summary: 'Update a recurring event rule',
  description: 'Update a recurring event rule and regenerate its events',
  tags: ['Recurring Event Rules'],
  pathParams,
  requestBody: RecurringEventRuleUpdateRequestSchema,
  action: async ({ pathParams: { id }, body }) => {
    try {
      // Check if rule exists
      const existingRule = await getRecurringEventRuleById(id);
      if (!existingRule) {
        return Response.json(
          { success: false, error: 'Recurring event rule not found' },
          { status: 404 }
        );
      }

      // Parse dates if provided
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updates: any = { ...body };
      if (body.startDate) {
        updates.startDate = new Date(body.startDate);
      }
      if (body.endDate) {
        updates.endDate = new Date(body.endDate);
      }

      // Update the rule and regenerate events
      const { rule, eventsCreated } = await updateRecurringEventRuleAndRegenerateEvents(id, updates);

      // Recalculate balances
      const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');
      const startDate = updates.startDate || existingRule.startDate;
      const endDate = updates.endDate || existingRule.endDate;
      await recalculateBalancesFrom(startDate, endDate, rule.bankAccountId);

      const serializedRule = {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        value: parseFloat(rule.value.toString()),
        type: rule.type,
        certainty: rule.certainty,
        payTo: rule.payTo,
        paidBy: rule.paidBy,
        decisionPathId: rule.decisionPathId,
        bankAccountId: rule.bankAccountId,
        startDate: rule.startDate.toISOString(),
        endDate: rule.endDate.toISOString(),
        frequency: rule.frequency,
        isBaseRule: rule.isBaseRule,
        baseRuleId: rule.baseRuleId,
        createdAt: rule.createdAt.toISOString(),
        updatedAt: rule.updatedAt.toISOString(),
      };

      return Response.json({
        success: true,
        data: { rule: serializedRule, generatedEventsCount: eventsCreated },
        message: `Recurring event rule updated successfully with ${eventsCreated} events`,
      });
    } catch (error) {
      console.error('Error updating recurring event rule:', error);
      return Response.json(
        { success: false, error: 'Failed to update recurring event rule' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Recurring event rule updated successfully',
      content: RecurringEventRuleUpdateResponseSchema,
    },
    400: { description: 'Invalid request body' },
    404: { description: 'Recurring event rule not found' },
    500: { description: 'Server error' },
  },
});

/**
 * DELETE /api/recurring-event-rules/[id]
 * Delete a recurring event rule and all its generated events
 */
export const { DELETE } = defineRoute({
  operationId: 'deleteRecurringEventRule',
  method: 'DELETE',
  summary: 'Delete a recurring event rule',
  description: 'Delete a recurring event rule and all its generated events, then recalculate balances',
  tags: ['Recurring Event Rules'],
  pathParams,
  action: async ({ pathParams: { id } }) => {
    try {
      const existingRule = await getRecurringEventRuleById(id);
      if (!existingRule) {
        return Response.json(
          { success: false, error: 'Recurring event rule not found' },
          { status: 404 }
        );
      }

      const startDate = existingRule.startDate;
      const endDate = existingRule.endDate;
      const bankAccountId = existingRule.bankAccountId;

      // Delete all generated events first
      await deleteGeneratedEventsForRule(id);

      // Delete the rule itself
      await deleteRecurringEventRule(id);

      // Recalculate balances for the affected date range
      const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');
      await recalculateBalancesFrom(startDate, endDate, bankAccountId);

      return Response.json({
        success: true,
        message: 'Recurring event rule and all generated events deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting recurring event rule:', error);
      return Response.json(
        { success: false, error: 'Failed to delete recurring event rule' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Recurring event rule deleted successfully',
      content: RecurringEventRuleDeleteResponseSchema,
    },
    404: { description: 'Recurring event rule not found' },
    500: { description: 'Server error' },
  },
});
