import { NextRequest, NextResponse } from 'next/server';
import {
  getProjectionEvents,
  createProjectionEvent,
  getProjectionEventsByDate,
} from '@/lib/dal/projection-events';
import {
  ProjectionEventsGetResponse,
  ProjectionEventCreateRequestSchema,
  ProjectionEventCreateResponse,
} from '@/lib/schemas';

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

      // Serialize the data
      const serializedData = events.map((event) => ({
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
      }));

      const response: ProjectionEventsGetResponse = {
        success: true,
        data: serializedData,
      };

      return NextResponse.json(response);
    }

    if (!startDateParam || !endDateParam) {
      const response: ProjectionEventsGetResponse = {
        success: false,
        error: 'startDate and endDate query parameters are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    const events = await getProjectionEvents(startDate, endDate);

    // Serialize the data
    const serializedData = events.map((event) => ({
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
    }));

    const response: ProjectionEventsGetResponse = {
      success: true,
      data: serializedData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching projection events:', error);
    const response: ProjectionEventsGetResponse = {
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
    const body = await request.json();

    // Validate request body with Zod
    const validation = ProjectionEventCreateRequestSchema.safeParse(body);
    if (!validation.success) {
      const response: ProjectionEventCreateResponse = {
        success: false,
        error: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
      return NextResponse.json(response, { status: 400 });
    }

    const validatedData = validation.data;

    const event = await createProjectionEvent({
      name: validatedData.name,
      description: validatedData.description,
      value: validatedData.value,
      type: validatedData.type,
      certainty: validatedData.certainty,
      payTo: validatedData.payTo,
      paidBy: validatedData.paidBy,
      date: new Date(validatedData.date),
      bankAccountId: validatedData.bankAccountId,
      decisionPathId: validatedData.decisionPathId,
    });

    // Recalculate balances from this day forward (6 months)
    const { addMonths } = await import('date-fns');
    const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');

    const eventDate = new Date(validatedData.date);
    const endDate = addMonths(eventDate, 6);
    await recalculateBalancesFrom(eventDate, endDate, validatedData.bankAccountId);

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

    const response: ProjectionEventCreateResponse = {
      success: true,
      data: serializedData,
      message: 'Projection event created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating projection event:', error);
    const response: ProjectionEventCreateResponse = {
      success: false,
      error: 'Failed to create projection event',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
