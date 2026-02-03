import { NextRequest, NextResponse } from 'next/server';
import {
  getRecurringEventRuleById,
  createRevisionForRecurringRule,
} from '@/lib/dal/recurring-event-rules';
import { RecurringEventRuleRevisionCreateRequestSchema } from '@/lib/schemas';
import {
  handleApiError,
  createNotFoundResponse,
  createValidationErrorResponse,
} from '@/lib/api/error-response';

/**
 * POST /api/recurring-event-rules/[id]/revisions
 * Create a revision for a recurring event rule (to handle value changes over time)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validation = RecurringEventRuleRevisionCreateRequestSchema.safeParse(body);
    if (!validation.success) {
      return createValidationErrorResponse(
        'body',
        validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      );
    }

    const validatedData = validation.data;

    // Check if base rule exists
    const baseRule = await getRecurringEventRuleById(id);
    if (!baseRule) {
      return createNotFoundResponse('Recurring event rule', id);
    }

    // Parse the revision start date
    const revisionStartDate = new Date(validatedData.startDate);

    // Validate that revision start date is within base rule's date range
    if (revisionStartDate <= baseRule.startDate || revisionStartDate >= baseRule.endDate) {
      return NextResponse.json(
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
      value: validatedData.value,
      description: validatedData.description,
      frequency: validatedData.frequency,
      decisionPathId: validatedData.decisionPathId,
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

    return NextResponse.json({
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
    return handleApiError(error);
  }
}
