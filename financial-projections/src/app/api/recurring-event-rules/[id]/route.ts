import { NextRequest, NextResponse } from 'next/server';
import {
  getRecurringEventRuleById,
  updateRecurringEventRuleAndRegenerateEvents,
  deleteRecurringEventRule,
  deleteGeneratedEventsForRule,
} from '@/lib/dal/recurring-event-rules';
import { RecurringEventRuleCreateRequestSchema } from '@/lib/schemas';
import {
  handleApiError,
  createNotFoundResponse,
  createValidationErrorResponse,
} from '@/lib/api/error-response';

/**
 * GET /api/recurring-event-rules/[id]
 * Get a single recurring event rule by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rule = await getRecurringEventRuleById(params.id);

    if (!rule) {
      return createNotFoundResponse('Recurring event rule', params.id);
    }

    // Serialize the data
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
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
      projectionEvents: rule.projectionEvents.map((event) => ({
        id: event.id,
        date: event.date.toISOString(),
        value: parseFloat(event.value.toString()),
      })),
    };

    return NextResponse.json({
      success: true,
      data: serializedRule,
    });
  } catch (error) {
    console.error('Error fetching recurring event rule:', error);
    return handleApiError(error);
  }
}

/**
 * PATCH /api/recurring-event-rules/[id]
 * Update a recurring event rule and regenerate its events
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validate request body with Zod (reuse create schema for validation)
    const validation = RecurringEventRuleCreateRequestSchema.partial().safeParse(body);
    if (!validation.success) {
      return createValidationErrorResponse(
        'body',
        validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      );
    }

    const validatedData = validation.data;

    // Check if rule exists
    const existingRule = await getRecurringEventRuleById(params.id);
    if (!existingRule) {
      return createNotFoundResponse('Recurring event rule', params.id);
    }

    // Parse dates if provided
    const updates: any = { ...validatedData };
    if (validatedData.startDate) {
      updates.startDate = new Date(validatedData.startDate);
    }
    if (validatedData.endDate) {
      updates.endDate = new Date(validatedData.endDate);
    }

    // Update the rule and regenerate events
    const { rule, eventsCreated } = await updateRecurringEventRuleAndRegenerateEvents(
      params.id,
      updates
    );

    // Recalculate balances
    const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');
    const startDate = updates.startDate || existingRule.startDate;
    const endDate = updates.endDate || existingRule.endDate;
    await recalculateBalancesFrom(startDate, endDate, rule.bankAccountId);

    // Serialize the response
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
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        rule: serializedRule,
        generatedEventsCount: eventsCreated,
      },
      message: `Recurring event rule updated successfully with ${eventsCreated} events`,
    });
  } catch (error) {
    console.error('Error updating recurring event rule:', error);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/recurring-event-rules/[id]
 * Delete a recurring event rule and all its generated events
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if rule exists
    const existingRule = await getRecurringEventRuleById(params.id);
    if (!existingRule) {
      return createNotFoundResponse('Recurring event rule', params.id);
    }

    // Store the date range and bank account for recalculation
    const startDate = existingRule.startDate;
    const endDate = existingRule.endDate;
    const bankAccountId = existingRule.bankAccountId;

    // Delete all generated events first
    await deleteGeneratedEventsForRule(params.id);

    // Delete the rule itself
    await deleteRecurringEventRule(params.id);

    // Recalculate balances for the affected date range
    const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');
    await recalculateBalancesFrom(startDate, endDate, bankAccountId);

    return NextResponse.json({
      success: true,
      message: 'Recurring event rule and all generated events deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting recurring event rule:', error);
    return handleApiError(error);
  }
}
