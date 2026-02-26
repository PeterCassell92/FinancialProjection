import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import {
  getRecurringEventRuleById,
  createRevisionForRecurringRule,
} from '@/lib/dal/recurring-event-rules';
import {
  RecurringEventRuleRevisionCreateRequestSchema,
  RecurringEventRuleRevisionCreateResponseSchema,
} from '@/lib/schemas';

const pathParams = z.object({ id: z.string() });

/**
 * POST /api/recurring-event-rules/[id]/revisions
 * Create a revision for a recurring event rule (to handle value changes over time)
 */
export const { POST } = defineRoute({
  operationId: 'createRecurringEventRuleRevision',
  method: 'POST',
  summary: 'Create a revision for a recurring event rule',
  description: 'Create a revision (value change) of an existing recurring event rule, splitting it at the revision start date',
  tags: ['Recurring Event Rules'],
  pathParams,
  requestBody: RecurringEventRuleRevisionCreateRequestSchema,
  action: async ({ pathParams: { id }, body }) => {
    try {
      // Check if base rule exists
      const baseRule = await getRecurringEventRuleById(id);
      if (!baseRule) {
        return Response.json(
          { success: false, error: 'Recurring event rule not found' },
          { status: 404 }
        );
      }

      // Parse the revision start date
      const revisionStartDate = new Date(body.startDate);

      // Validate that revision start date is within base rule's date range
      if (revisionStartDate <= baseRule.startDate || revisionStartDate >= baseRule.endDate) {
        return Response.json(
          {
            success: false,
            error: `Revision start date must be between ${baseRule.startDate.toISOString().split('T')[0]} and ${baseRule.endDate.toISOString().split('T')[0]}`,
          },
          { status: 400 }
        );
      }

      // Create the revision
      const result = await createRevisionForRecurringRule(id, {
        startDate: revisionStartDate,
        value: body.value,
        description: body.description,
        frequency: body.frequency,
        decisionPathId: body.decisionPathId,
      });

      // Recalculate balances for the affected date range
      const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');
      await recalculateBalancesFrom(
        result.baseRule.startDate,
        result.revision.endDate,
        result.baseRule.bankAccountId
      );

      // Serialize the response
      const serializedBaseRule = {
        id: result.baseRule.id,
        name: result.baseRule.name,
        description: result.baseRule.description,
        value: parseFloat(result.baseRule.value.toString()),
        type: result.baseRule.type,
        certainty: result.baseRule.certainty,
        payTo: result.baseRule.payTo,
        paidBy: result.baseRule.paidBy,
        decisionPathId: result.baseRule.decisionPathId,
        bankAccountId: result.baseRule.bankAccountId,
        startDate: result.baseRule.startDate.toISOString(),
        endDate: result.baseRule.endDate.toISOString(),
        frequency: result.baseRule.frequency,
        isBaseRule: result.baseRule.isBaseRule,
        baseRuleId: result.baseRule.baseRuleId,
        createdAt: result.baseRule.createdAt.toISOString(),
        updatedAt: result.baseRule.updatedAt.toISOString(),
      };

      const serializedRevision = {
        id: result.revision.id,
        name: result.revision.name,
        description: result.revision.description,
        value: parseFloat(result.revision.value.toString()),
        type: result.revision.type,
        certainty: result.revision.certainty,
        payTo: result.revision.payTo,
        paidBy: result.revision.paidBy,
        decisionPathId: result.revision.decisionPathId,
        bankAccountId: result.revision.bankAccountId,
        startDate: result.revision.startDate.toISOString(),
        endDate: result.revision.endDate.toISOString(),
        frequency: result.revision.frequency,
        isBaseRule: result.revision.isBaseRule,
        baseRuleId: result.revision.baseRuleId,
        createdAt: result.revision.createdAt.toISOString(),
        updatedAt: result.revision.updatedAt.toISOString(),
      };

      return Response.json({
        success: true,
        data: {
          baseRule: serializedBaseRule,
          revision: serializedRevision,
          baseRuleEventsDeleted: result.baseRuleEventsDeleted,
          revisionEventsCreated: result.revisionEventsCreated,
        },
        message: `Revision created successfully. Base rule ends ${serializedBaseRule.endDate}, revision starts ${serializedRevision.startDate}`,
      });
    } catch (error) {
      console.error('Error creating revision:', error);
      return Response.json(
        { success: false, error: 'Failed to create revision' },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: 'Revision created successfully',
      content: RecurringEventRuleRevisionCreateResponseSchema,
    },
    400: { description: 'Invalid request body or revision date out of range' },
    404: { description: 'Recurring event rule not found' },
    500: { description: 'Server error' },
  },
});
