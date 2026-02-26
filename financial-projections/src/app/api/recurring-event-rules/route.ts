import defineRoute from '@omer-x/next-openapi-route-handler';
import {
  getAllRecurringEventRules,
  createRecurringEventRuleWithEvents,
} from '@/lib/dal/recurring-event-rules';
import {
  RecurringEventRulesGetResponseSchema,
  RecurringEventRuleCreateRequestSchema,
  RecurringEventRuleCreateResponseSchema,
} from '@/lib/schemas';

/**
 * GET /api/recurring-event-rules
 * Get all recurring event rules
 */
export const { GET } = defineRoute({
  operationId: 'getRecurringEventRules',
  method: 'GET',
  summary: 'Get all recurring event rules',
  description: 'Get all recurring event rules',
  tags: ['Recurring Event Rules'],
  action: async () => {
    try {
      const rules = await getAllRecurringEventRules();

      const serializedData = rules.map((rule) => ({
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
      }));

      return Response.json({ success: true, data: serializedData });
    } catch (error) {
      console.error('Error fetching recurring event rules:', error);
      return Response.json(
        { success: false, error: 'Failed to fetch recurring event rules' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'List of recurring event rules retrieved successfully',
      content: RecurringEventRulesGetResponseSchema,
    },
    500: { description: 'Server error' },
  },
});

/**
 * POST /api/recurring-event-rules
 * Create a new recurring event rule and generate projection events
 */
export const { POST } = defineRoute({
  operationId: 'createRecurringEventRule',
  method: 'POST',
  summary: 'Create a recurring event rule',
  description: 'Create a new recurring event rule and generate projection events',
  tags: ['Recurring Event Rules'],
  requestBody: RecurringEventRuleCreateRequestSchema,
  action: async ({ body }) => {
    try {
      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);

      const { rule, eventsCreated } = await createRecurringEventRuleWithEvents({
        name: body.name,
        description: body.description,
        value: body.value,
        type: body.type,
        certainty: body.certainty,
        payTo: body.payTo,
        paidBy: body.paidBy,
        bankAccountId: body.bankAccountId,
        decisionPathId: body.decisionPathId,
        startDate,
        endDate,
        frequency: body.frequency,
      });

      // Recalculate balances from the start date through the end date
      const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');
      await recalculateBalancesFrom(startDate, endDate, body.bankAccountId);

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

      return Response.json(
        {
          success: true,
          data: { rule: serializedRule, generatedEventsCount: eventsCreated },
          message: `Recurring event rule created successfully with ${eventsCreated} events`,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error creating recurring event rule:', error);
      return Response.json(
        { success: false, error: 'Failed to create recurring event rule' },
        { status: 500 }
      );
    }
  },
  responses: {
    201: {
      description: 'Recurring event rule created successfully',
      content: RecurringEventRuleCreateResponseSchema,
    },
    400: { description: 'Invalid request body' },
    500: { description: 'Server error' },
  },
});
