import { prisma } from '@/lib/prisma';

export interface CreateRecurringDateInput {
  projectionEventId: string;
  recurringEventId: string;
  date: Date;
}

/**
 * Create a recurring date entry
 */
export async function createRecurringDate(input: CreateRecurringDateInput) {
  return await prisma.eventRecurringDate.create({
    data: input,
  });
}

/**
 * Create multiple recurring dates in a batch
 */
export async function createRecurringDates(inputs: CreateRecurringDateInput[]) {
  return await prisma.eventRecurringDate.createMany({
    data: inputs,
  });
}

/**
 * Get all recurring dates for a specific event
 */
export async function getRecurringDatesForEvent(projectionEventId: string) {
  return await prisma.eventRecurringDate.findMany({
    where: { projectionEventId },
    orderBy: { date: 'asc' },
  });
}

/**
 * Get all recurring dates for a recurring group
 */
export async function getRecurringDatesForGroup(recurringEventId: string) {
  return await prisma.eventRecurringDate.findMany({
    where: { recurringEventId },
    orderBy: { date: 'asc' },
  });
}

/**
 * Delete all recurring dates for an event
 */
export async function deleteRecurringDatesForEvent(projectionEventId: string) {
  return await prisma.eventRecurringDate.deleteMany({
    where: { projectionEventId },
  });
}

/**
 * Delete all recurring dates for a recurring group
 */
export async function deleteRecurringDatesForGroup(recurringEventId: string) {
  return await prisma.eventRecurringDate.deleteMany({
    where: { recurringEventId },
  });
}

/**
 * Delete a specific recurring date entry
 */
export async function deleteRecurringDate(id: string) {
  return await prisma.eventRecurringDate.delete({
    where: { id },
  });
}
