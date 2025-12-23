import {
  eachDayOfInterval,
  startOfDay,
  isSameDay,
  addDays
} from 'date-fns';
import { CertaintyLevel, EventType } from '@/lib/prisma';
import { getProjectionEvents } from '@/lib/dal/projection-events';
import { getDailyBalances, batchUpsertDailyBalances } from '@/lib/dal/daily-balance';
import { getOrCreateSettings } from '@/lib/dal/settings';

/**
 * Calculate and store daily balances for a date range
 *
 * Algorithm:
 * 1. Start with initial bank balance from settings or previous day's actual/expected balance
 * 2. For each day in range:
 *    - Start with previous day's balance (actual if set, otherwise expected)
 *    - Add all INCOMING events (except UNLIKELY)
 *    - Subtract all EXPENSE events (except UNLIKELY)
 *    - Check if user set an actual balance (overrides calculated)
 *    - Store the result in DailyBalance table
 */
export async function calculateDailyBalances(
  startDate: Date,
  endDate: Date
): Promise<void> {
  // Normalize dates to start of day
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);

  // Get initial balance from settings
  const settings = await getOrCreateSettings();
  let currentBalance = parseFloat(settings.initialBankBalance.toString());

  // Check if there's a previous actual balance set before our start date
  const existingBalances = await getDailyBalances(
    addDays(start, -30), // Look back 30 days
    addDays(start, -1)
  );

  // Find the most recent actual balance before start date
  const previousActualBalance = existingBalances
    .filter((b) => b.actualBalance !== null && b.actualBalance !== undefined)
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

  if (previousActualBalance && previousActualBalance.actualBalance !== null && previousActualBalance.actualBalance !== undefined) {
    currentBalance = parseFloat(previousActualBalance.actualBalance.toString());
  } else {
    // Use the expected balance of the day before if available
    const previousDayBalance = existingBalances
      .filter((b) => isSameDay(b.date, addDays(start, -1)))
      [0];

    if (previousDayBalance) {
      currentBalance = parseFloat(previousDayBalance.expectedBalance.toString());
    }
  }

  // Get all events in the date range
  const events = await getProjectionEvents(start, end);

  // Group events by date
  const eventsByDate = new Map<string, typeof events>();
  events.forEach((event) => {
    const dateKey = startOfDay(event.date).toISOString();
    if (!eventsByDate.has(dateKey)) {
      eventsByDate.set(dateKey, []);
    }
    eventsByDate.get(dateKey)!.push(event);
  });

  // Get existing daily balances to check for actual balances
  const existingDailyBalances = await getDailyBalances(start, end);
  const actualBalanceMap = new Map<string, number>();
  existingDailyBalances.forEach((balance) => {
    if (balance.actualBalance !== null && balance.actualBalance !== undefined) {
      const dateKey = startOfDay(balance.date).toISOString();
      actualBalanceMap.set(dateKey, parseFloat(balance.actualBalance.toString()));
    }
  });

  // Calculate balance for each day
  const days = eachDayOfInterval({ start, end });
  const balancesToUpsert = [];

  for (const day of days) {
    const dateKey = startOfDay(day).toISOString();
    const dayEvents = eventsByDate.get(dateKey) || [];

    // Calculate day's impact from events (excluding UNLIKELY)
    let dayImpact = 0;

    for (const event of dayEvents) {
      // Skip UNLIKELY events
      if (event.certainty === CertaintyLevel.UNLIKELY) {
        continue;
      }

      const eventValue = parseFloat(event.value.toString());

      if (event.type === EventType.INCOMING) {
        dayImpact += eventValue;
      } else {
        // EXPENSE
        dayImpact -= eventValue;
      }
    }

    // Calculate expected balance
    const expectedBalance = currentBalance + dayImpact;

    // Check if user set an actual balance for this day
    const actualBalance = actualBalanceMap.get(dateKey);

    balancesToUpsert.push({
      date: day,
      expectedBalance,
      actualBalance,
    });

    // Update current balance for next iteration
    if (actualBalance !== undefined) {
      // If actual balance is set, use that for next day's starting point
      currentBalance = actualBalance;
    } else {
      // Otherwise use the calculated expected balance
      currentBalance = expectedBalance;
    }
  }

  // Batch upsert all daily balances
  await batchUpsertDailyBalances(balancesToUpsert);
}

/**
 * Recalculate balances from a specific date forward
 * Useful when events are added/removed/updated
 */
export async function recalculateBalancesFrom(
  fromDate: Date,
  toDate: Date
): Promise<void> {
  await calculateDailyBalances(fromDate, toDate);
}

/**
 * Calculate balance for a single day (without persisting)
 * Useful for preview/validation
 */
export async function calculateBalanceForDay(
  date: Date,
  previousBalance: number
): Promise<{ expectedBalance: number; events: any[] }> {
  const day = startOfDay(date);
  const events = await getProjectionEvents(day, day);

  let balance = previousBalance;

  const relevantEvents = events.filter(
    (e) => e.certainty !== CertaintyLevel.UNLIKELY
  );

  for (const event of relevantEvents) {
    const eventValue = parseFloat(event.value.toString());
    if (event.type === EventType.INCOMING) {
      balance += eventValue;
    } else {
      balance -= eventValue;
    }
  }

  return {
    expectedBalance: balance,
    events: relevantEvents,
  };
}
