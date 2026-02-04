import { NextRequest, NextResponse } from 'next/server';
import {
  getProjectionEventById,
  updateProjectionEvent,
  deleteProjectionEvent,
} from '@/lib/dal/projection-events';
import {
  ProjectionEventGetResponse,
  ProjectionEventUpdateRequestSchema,
  ProjectionEventPutResponse,
  ProjectionEventDeleteResponse,
} from '@/lib/schemas';

/**
 * GET /api/projection-events/[id]
 * Get a single projection event by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await getProjectionEventById(id);

    if (!event) {
      const response: ProjectionEventGetResponse = {
        success: false,
        error: 'Projection event not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Serialize the data
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

    const response: ProjectionEventGetResponse = {
      success: true,
      data: serializedData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching projection event:', error);
    const response: ProjectionEventGetResponse = {
      success: false,
      error: 'Failed to fetch projection event',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PUT /api/projection-events/[id]
 * Update a projection event
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body with Zod
    const validation = ProjectionEventUpdateRequestSchema.safeParse(body);
    if (!validation.success) {
      const response: ProjectionEventPutResponse = {
        success: false,
        error: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
      return NextResponse.json(response, { status: 400 });
    }

    const validatedData = validation.data;
    const updateData: any = {};

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.value !== undefined) updateData.value = validatedData.value;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.certainty !== undefined) updateData.certainty = validatedData.certainty;
    if (validatedData.payTo !== undefined) updateData.payTo = validatedData.payTo;
    if (validatedData.paidBy !== undefined) updateData.paidBy = validatedData.paidBy;
    if (validatedData.date !== undefined) updateData.date = new Date(validatedData.date);
    if (validatedData.bankAccountId !== undefined) updateData.bankAccountId = validatedData.bankAccountId;
    if (validatedData.decisionPathId !== undefined) updateData.decisionPathId = validatedData.decisionPathId;
    // IMPORTANT: Preserve recurringRuleId to maintain parent-child relationship for events created by recurring rules
    if (validatedData.recurringRuleId !== undefined) updateData.recurringRuleId = validatedData.recurringRuleId;

    const event = await updateProjectionEvent(id, updateData);

    // Recalculate balances from this day forward (6 months)
    const { addMonths } = await import('date-fns');
    const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');

    const eventDate = event.date;
    const endDate = addMonths(eventDate, 6);
    await recalculateBalancesFrom(eventDate, endDate, event.bankAccountId);

    // Serialize the response
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

    const response: ProjectionEventPutResponse = {
      success: true,
      data: serializedData,
      message: 'Projection event updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating projection event:', error);
    const response: ProjectionEventPutResponse = {
      success: false,
      error: 'Failed to update projection event',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/projection-events/[id]
 * Delete a projection event
 * Note: To delete all events from a recurring rule, delete the rule itself via /api/recurring-event-rules
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the event first to capture its date for recalculation
    const eventToDelete = await getProjectionEventById(id);

    if (!eventToDelete) {
      const response: ProjectionEventDeleteResponse = {
        success: false,
        error: 'Projection event not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const eventDate = eventToDelete.date;

    // Delete the event
    await deleteProjectionEvent(id);

    // Recalculate balances from the event date forward (6 months)
    const { addMonths } = await import('date-fns');
    const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');

    const endDate = addMonths(eventDate, 6);
    await recalculateBalancesFrom(eventDate, endDate, eventToDelete.bankAccountId);

    const response: ProjectionEventDeleteResponse = {
      success: true,
      message: 'Projection event deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting projection event:', error);
    const response: ProjectionEventDeleteResponse = {
      success: false,
      error: 'Failed to delete projection event',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
