import { NextRequest, NextResponse } from 'next/server';
import {
  getProjectionEvents,
  createProjectionEvent,
  getProjectionEventsByDate,
} from '@/lib/dal/projection-events';
import { ApiResponse, CreateProjectionEventRequest } from '@/types';

/**
 * GET /api/projection-events
 * Get projection events within a date range or for a specific date
 * Query params: startDate, endDate OR date
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const dateParam = searchParams.get('date');

    if (dateParam) {
      // Get events for a specific date
      const date = new Date(dateParam);
      const events = await getProjectionEventsByDate(date);

      const response: ApiResponse = {
        success: true,
        data: events.map((event) => ({
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
        })),
      };

      return NextResponse.json(response);
    }

    if (!startDateParam || !endDateParam) {
      const response: ApiResponse = {
        success: false,
        error: 'startDate and endDate query parameters are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    const events = await getProjectionEvents(startDate, endDate);

    const response: ApiResponse = {
      success: true,
      data: events.map((event) => ({
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
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching projection events:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch projection events',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/projection-events
 * Create a new projection event
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateProjectionEventRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.value || !body.type || !body.certainty || !body.date) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields: name, value, type, certainty, date',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const event = await createProjectionEvent({
      name: body.name,
      description: body.description,
      value: body.value,
      type: body.type,
      certainty: body.certainty,
      payTo: body.payTo,
      paidBy: body.paidBy,
      date: new Date(body.date),
      decisionPath: body.decisionPath,
    });

    // Recalculate balances from this day forward (6 months)
    const { addMonths } = await import('date-fns');
    const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');

    const eventDate = new Date(body.date);
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
      message: 'Projection event created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating projection event:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create projection event',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
