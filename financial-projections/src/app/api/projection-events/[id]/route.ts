import { NextRequest, NextResponse } from 'next/server';
import {
  getProjectionEventById,
  updateProjectionEvent,
  deleteProjectionEvent,
} from '@/lib/dal/projection-events';
import { ApiResponse, UpdateProjectionEventRequest } from '@/types';

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
      const response: ApiResponse = {
        success: false,
        error: 'Projection event not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      data: {
        id: event.id,
        name: event.name,
        description: event.description,
        value: parseFloat(event.value.toString()),
        type: event.type,
        certainty: event.certainty,
        payTo: event.payTo,
        paidBy: event.paidBy,
        date: event.date,
        decisionPath: event.decisionPath,
        recurringRuleId: event.recurringRuleId,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching projection event:', error);
    const response: ApiResponse = {
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
    const body: UpdateProjectionEventRequest = await request.json();

    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.value !== undefined) updateData.value = body.value;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.certainty !== undefined) updateData.certainty = body.certainty;
    if (body.payTo !== undefined) updateData.payTo = body.payTo;
    if (body.paidBy !== undefined) updateData.paidBy = body.paidBy;
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.decisionPath !== undefined) updateData.decisionPath = body.decisionPath;

    const event = await updateProjectionEvent(id, updateData);

    // Recalculate balances from this day forward (6 months)
    const { addMonths } = await import('date-fns');
    const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');

    const eventDate = event.date;
    const endDate = addMonths(eventDate, 6);
    await recalculateBalancesFrom(eventDate, endDate);

    const response: ApiResponse = {
      success: true,
      data: {
        id: event.id,
        name: event.name,
        description: event.description,
        value: parseFloat(event.value.toString()),
        type: event.type,
        certainty: event.certainty,
        payTo: event.payTo,
        paidBy: event.paidBy,
        date: event.date,
        decisionPath: event.decisionPath,
        recurringRuleId: event.recurringRuleId,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      },
      message: 'Projection event updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating projection event:', error);
    const response: ApiResponse = {
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
      const response: ApiResponse = {
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
    await recalculateBalancesFrom(eventDate, endDate);

    const response: ApiResponse = {
      success: true,
      message: 'Projection event deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting projection event:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete projection event',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
