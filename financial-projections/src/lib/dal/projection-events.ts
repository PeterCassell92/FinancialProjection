import { prisma, EventType, CertaintyLevel } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Use Prisma's generated types with custom handling for relation fields
// We use the unchecked input which allows setting foreign keys directly
export type CreateProjectionEventInput = Omit<
  Prisma.ProjectionEventUncheckedCreateInput,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateProjectionEventInput = Partial<
  Omit<Prisma.ProjectionEventUncheckedUpdateInput, 'id' | 'createdAt' | 'updatedAt'>
>;

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
  });
}

/**
 * Get all events for a specific date
 */
export async function getProjectionEventsByDate(date: Date) {
  return await prisma.projectionEvent.findMany({
    where: { date },
    orderBy: {
      createdAt: 'asc',
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
      bankAccountId: input.bankAccountId,
      decisionPathId: input.decisionPathId,
      recurringRuleId: input.recurringRuleId,
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
