import { prisma, EventType, CertaintyLevel } from '@/lib/prisma';

export interface CreateProjectionEventInput {
  name: string;
  description?: string;
  value: number;
  type: EventType;
  certainty: CertaintyLevel;
  payTo?: string;
  paidBy?: string;
  date: Date;
  isRecurring?: boolean;
  recurringEventId?: string;
  onTheSameDateEachMonth?: boolean;
  monthlyEventDay?: number;
  untilTargetDate?: Date;
}

export interface UpdateProjectionEventInput {
  name?: string;
  description?: string;
  value?: number;
  type?: EventType;
  certainty?: CertaintyLevel;
  payTo?: string;
  paidBy?: string;
  date?: Date;
  onTheSameDateEachMonth?: boolean;
  monthlyEventDay?: number;
  untilTargetDate?: Date;
}

/**
 * Get all projection events within a date range
 */
export async function getProjectionEvents(startDate: Date, endDate: Date) {
  return await prisma.projectionEvent.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      recurringDates: true,
    },
    orderBy: {
      date: 'asc',
    },
  });
}

/**
 * Get a single projection event by ID
 */
export async function getProjectionEventById(id: string) {
  return await prisma.projectionEvent.findUnique({
    where: { id },
    include: {
      recurringDates: true,
    },
  });
}

/**
 * Get all events for a specific date
 */
export async function getProjectionEventsByDate(date: Date) {
  return await prisma.projectionEvent.findMany({
    where: { date },
    include: {
      recurringDates: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

/**
 * Get all recurring events by recurringEventId
 */
export async function getRecurringEventGroup(recurringEventId: string) {
  return await prisma.projectionEvent.findMany({
    where: { recurringEventId },
    include: {
      recurringDates: true,
    },
    orderBy: {
      date: 'asc',
    },
  });
}

/**
 * Create a new projection event
 */
export async function createProjectionEvent(input: CreateProjectionEventInput) {
  return await prisma.projectionEvent.create({
    data: {
      name: input.name,
      description: input.description,
      value: input.value,
      type: input.type,
      certainty: input.certainty,
      payTo: input.payTo,
      paidBy: input.paidBy,
      date: input.date,
      isRecurring: input.isRecurring ?? false,
      recurringEventId: input.recurringEventId,
      onTheSameDateEachMonth: input.onTheSameDateEachMonth ?? false,
      monthlyEventDay: input.monthlyEventDay,
      untilTargetDate: input.untilTargetDate,
    },
  });
}

/**
 * Update a projection event
 */
export async function updateProjectionEvent(
  id: string,
  input: UpdateProjectionEventInput
) {
  const data: any = { ...input };

  if (input.value !== undefined) {
    data.value = input.value;
  }

  return await prisma.projectionEvent.update({
    where: { id },
    data,
  });
}

/**
 * Delete a projection event
 */
export async function deleteProjectionEvent(id: string) {
  return await prisma.projectionEvent.delete({
    where: { id },
  });
}

/**
 * Delete all events in a recurring group
 */
export async function deleteRecurringEventGroup(recurringEventId: string) {
  return await prisma.projectionEvent.deleteMany({
    where: { recurringEventId },
  });
}

/**
 * Get events grouped by type for a date range (useful for charts)
 */
export async function getEventsGroupedByType(startDate: Date, endDate: Date) {
  const events = await prisma.projectionEvent.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      certainty: {
        not: CertaintyLevel.UNLIKELY, // Exclude unlikely events
      },
    },
  });

  return {
    expenses: events.filter((e) => e.type === EventType.EXPENSE),
    incoming: events.filter((e) => e.type === EventType.INCOMING),
  };
}
