import { NextRequest, NextResponse } from 'next/server';
import {
  getAllRecurringEventRules,
  createRecurringEventRuleWithEvents,
} from '@/lib/dal/recurring-event-rules';
import {
  RecurringEventRulesGetResponse,
  RecurringEventRuleCreateRequestSchema,
  RecurringEventRuleCreateResponse,
} from '@/lib/schemas';

/**
 * GET /api/recurring-event-rules
 * Get all recurring event rules
 */
export async function GET(request: NextRequest) {
  try {
    const rules = await getAllRecurringEventRules();

    // Serialize the data
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

    const response: RecurringEventRulesGetResponse = {
      success: true,
      data: serializedData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching recurring event rules:', error);
    const response: RecurringEventRulesGetResponse = {
      success: false,
      error: 'Failed to fetch recurring event rules',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/recurring-event-rules
 * Create a new recurring event rule and generate projection events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod
    const validation = RecurringEventRuleCreateRequestSchema.safeParse(body);
    if (!validation.success) {
      const response: RecurringEventRuleCreateResponse = {
        success: false,
        error: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
      return NextResponse.json(response, { status: 400 });
    }

    const validatedData = validation.data;

    // Parse dates
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    // Create the rule and generate events
    const { rule, eventsCreated } = await createRecurringEventRuleWithEvents({
      name: validatedData.name,
      description: validatedData.description,
      value: validatedData.value,
      type: validatedData.type,
      certainty: validatedData.certainty,
      payTo: validatedData.payTo,
      paidBy: validatedData.paidBy,
      bankAccountId: validatedData.bankAccountId,
      decisionPathId: validatedData.decisionPathId,
      startDate,
      endDate,
      frequency: validatedData.frequency,
    });

    // Recalculate balances from the start date through the end date
    const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');
    await recalculateBalancesFrom(startDate, endDate, validatedData.bankAccountId);

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
      isBaseRule: rule.isBaseRule,
      baseRuleId: rule.baseRuleId,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
    };

    const response: RecurringEventRuleCreateResponse = {
      success: true,
      data: {
        rule: serializedRule,
        generatedEventsCount: eventsCreated,
      },
      message: `Recurring event rule created successfully with ${eventsCreated} events`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating recurring event rule:', error);
    const response: RecurringEventRuleCreateResponse = {
      success: false,
      error: 'Failed to create recurring event rule',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
