import { NextRequest, NextResponse } from 'next/server';
import {
  getAllRecurringEventRules,
  createRecurringEventRuleWithEvents,
} from '@/lib/dal/recurring-event-rules';
import { ApiResponse } from '@/types';
import { EventType, CertaintyLevel, RecurrenceFrequency } from '@/lib/prisma';

interface CreateRecurringEventRuleRequest {
  name: string;
  description?: string;
  value: number;
  type: EventType;
  certainty: CertaintyLevel;
  payTo?: string;
  paidBy?: string;
  bankAccountId: string;
  decisionPath?: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string - required to prevent infinite event generation
  frequency: RecurrenceFrequency;
}

/**
 * GET /api/recurring-event-rules
 * Get all recurring event rules
 */
export async function GET(request: NextRequest) {
  try {
    const rules = await getAllRecurringEventRules();

    const response: ApiResponse = {
      success: true,
      data: rules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        value: parseFloat(rule.value.toString()),
        type: rule.type,
        certainty: rule.certainty,
        payTo: rule.payTo,
        paidBy: rule.paidBy,
        decisionPath: rule.decisionPath,
        startDate: rule.startDate,
        endDate: rule.endDate,
        frequency: rule.frequency,
        generatedEventsCount: rule._count.projectionEvents,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching recurring event rules:', error);
    const response: ApiResponse = {
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
    const body: CreateRecurringEventRuleRequest = await request.json();

    // Validate required fields
    if (
      !body.name ||
      body.value === undefined ||
      body.value === null ||
      !body.type ||
      !body.certainty ||
      !body.bankAccountId ||
      !body.startDate ||
      !body.endDate ||
      !body.frequency
    ) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields: name, value, type, certainty, bankAccountId, startDate, endDate, frequency',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate date range
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (isNaN(startDate.getTime())) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid startDate format. Expected ISO date string (YYYY-MM-DD)',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (isNaN(endDate.getTime())) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid endDate format. Expected ISO date string (YYYY-MM-DD)',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (endDate <= startDate) {
      const response: ApiResponse = {
        success: false,
        error: 'endDate must be after startDate',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate value is positive
    if (body.value <= 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Value must be greater than 0',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Create the rule and generate events
    const { rule, eventsCreated } = await createRecurringEventRuleWithEvents({
      name: body.name,
      description: body.description,
      value: body.value,
      type: body.type,
      certainty: body.certainty,
      payTo: body.payTo,
      paidBy: body.paidBy,
      bankAccountId: body.bankAccountId,
      decisionPath: body.decisionPath,
      startDate,
      endDate,
      frequency: body.frequency,
    });

    // Recalculate balances from the start date through the end date
    const { recalculateBalancesFrom } = await import('@/lib/calculations/balance-calculator');
    await recalculateBalancesFrom(startDate, endDate);

    const response: ApiResponse = {
      success: true,
      data: {
        rule: {
          id: rule.id,
          name: rule.name,
          description: rule.description,
          value: parseFloat(rule.value.toString()),
          type: rule.type,
          certainty: rule.certainty,
          payTo: rule.payTo,
          paidBy: rule.paidBy,
          decisionPath: rule.decisionPath,
          startDate: rule.startDate,
          endDate: rule.endDate,
          frequency: rule.frequency,
          createdAt: rule.createdAt,
          updatedAt: rule.updatedAt,
        },
        generatedEventsCount: eventsCreated,
      },
      message: `Recurring event rule created successfully with ${eventsCreated} events`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating recurring event rule:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create recurring event rule',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
