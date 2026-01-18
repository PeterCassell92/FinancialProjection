import { prisma, EventType, CertaintyLevel, RecurrenceFrequency } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { generateRecurringDates } from '@/lib/utils/recurring-date-generator';
import { createProjectionEvent } from './projection-events';

// Use Prisma's generated types with unchecked input for direct field access
export type CreateRecurringEventRuleInput = Omit<
  Prisma.RecurringProjectionEventRuleUncheckedCreateInput,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateRecurringEventRuleInput = Partial<
  Omit<Prisma.RecurringProjectionEventRuleUncheckedUpdateInput, 'id' | 'createdAt' | 'updatedAt'>
>;

/**
 * Get all recurring event rules
 */
export async function getAllRecurringEventRules() {
  return await prisma.recurringProjectionEventRule.findMany({
    include: {
      _count: {
        select: { projectionEvents: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get a single recurring event rule by ID
 */
export async function getRecurringEventRuleById(id: string) {
  return await prisma.recurringProjectionEventRule.findUnique({
    where: { id },
    include: {
      projectionEvents: {
        orderBy: {
          date: 'asc',
        },
      },
    },
  });
}

/**
 * Get all recurring event rules by decision path
 */
export async function getRecurringEventRulesByDecisionPath(decisionPathId: string) {
  return await prisma.recurringProjectionEventRule.findMany({
    where: { decisionPathId },
    include: {
      _count: {
        select: { projectionEvents: true },
      },
    },
    orderBy: {
      startDate: 'asc',
    },
  });
}

/**
 * Create a new recurring event rule (without generating events)
 */
export async function createRecurringEventRule(input: CreateRecurringEventRuleInput) {
  return await prisma.recurringProjectionEventRule.create({
    data: {
      name: input.name,
      description: input.description,
      value: input.value,
      type: input.type,
      certainty: input.certainty,
      payTo: input.payTo,
      paidBy: input.paidBy,
      bankAccountId: input.bankAccountId,
      decisionPathId: input.decisionPathId,
      startDate: input.startDate,
      endDate: input.endDate,
      frequency: input.frequency,
    },
  });
}

/**
 * Update a recurring event rule
 */
export async function updateRecurringEventRule(
  id: string,
  input: UpdateRecurringEventRuleInput
) {
  const data: any = { ...input };

  if (input.value !== undefined) {
    data.value = input.value;
  }

  return await prisma.recurringProjectionEventRule.update({
    where: { id },
    data,
  });
}

/**
 * Delete a recurring event rule (cascade deletes all generated events)
 */
export async function deleteRecurringEventRule(id: string) {
  return await prisma.recurringProjectionEventRule.delete({
    where: { id },
  });
}

/**
 * Delete all generated projection events for a recurring rule
 */
export async function deleteGeneratedEventsForRule(ruleId: string) {
  return await prisma.projectionEvent.deleteMany({
    where: { recurringRuleId: ruleId },
  });
}

/**
 * Generate projection events from a recurring rule
 * Returns the count of events created
 */
export async function generateProjectionEventsFromRule(ruleId: string): Promise<number> {
  const rule = await getRecurringEventRuleById(ruleId);

  if (!rule) {
    throw new Error(`Recurring rule not found: ${ruleId}`);
  }

  // Generate the dates
  // endDate is required but may be null in DB from old data
  if (!rule.endDate) {
    throw new Error(`Recurring rule ${ruleId} is missing required endDate`);
  }

  const dates = generateRecurringDates({
    startDate: rule.startDate,
    endDate: rule.endDate,
    frequency: rule.frequency,
    eventType: rule.type,
  });

  // Create projection events for each date (use adjusted date)
  const createdEvents = await Promise.all(
    dates.map(({ adjustedDate }) =>
      createProjectionEvent({
        name: rule.name,
        description: rule.description || undefined,
        value: parseFloat(rule.value.toString()),
        type: rule.type,
        certainty: rule.certainty,
        payTo: rule.payTo || undefined,
        paidBy: rule.paidBy || undefined,
        date: adjustedDate,
        bankAccountId: rule.bankAccountId,
        decisionPathId: rule.decisionPathId,
        recurringRuleId: ruleId,
      })
    )
  );

  return createdEvents.length;
}

/**
 * Create a recurring rule and generate all its projection events
 */
export async function createRecurringEventRuleWithEvents(
  input: CreateRecurringEventRuleInput
): Promise<{ rule: any; eventsCreated: number }> {
  // Create the rule
  const rule = await createRecurringEventRule(input);

  // Generate events
  const eventsCreated = await generateProjectionEventsFromRule(rule.id);

  return { rule, eventsCreated };
}

/**
 * Update a recurring rule and regenerate all its projection events
 */
export async function updateRecurringEventRuleAndRegenerateEvents(
  id: string,
  input: UpdateRecurringEventRuleInput
): Promise<{ rule: any; eventsCreated: number }> {
  // Delete existing generated events
  await deleteGeneratedEventsForRule(id);

  // Update the rule
  const rule = await updateRecurringEventRule(id, input);

  // Regenerate events
  const eventsCreated = await generateProjectionEventsFromRule(id);

  return { rule, eventsCreated };
}
