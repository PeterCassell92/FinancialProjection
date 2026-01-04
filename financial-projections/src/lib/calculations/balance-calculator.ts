import {
  eachDayOfInterval,
  startOfDay,
  isSameDay,
  isBefore,
  isAfter
} from 'date-fns';
import { CertaintyLevel, EventType } from '@/lib/prisma';
import { getProjectionEvents } from '@/lib/dal/projection-events';
import { getDailyBalances, batchUpsertDailyBalances, getMostRecentActualBalanceOnOrBefore } from '@/lib/dal/daily-balance';
import { getOrCreateSettings } from '@/lib/dal/settings';

/**
 * Find the correct starting balance and date for calculations
 *
 * Algorithm:
 * 1. Look for the most recent actual balance on or before the start date
 * 2. If found and it's before the start date, use that as the starting point
 * 3. If the most recent actual balance is on or after the start date, recursively look for the previous one
 * 4. If no actual balance is found, fall back to the initial bank balance and its date from settings
 */
async function findStartingBalanceAndDate(
  startDate: Date
): Promise<{ balance: number; date: Date }> {
  const start = startOfDay(startDate);

  // Look for the most recent actual balance on or before the start date
  const mostRecentActual = await getMostRecentActualBalanceOnOrBefore(start);

  if (mostRecentActual && mostRecentActual.actualBalance !== null) {
    // Found an actual balance - use it as our starting point
    return {
      balance: parseFloat(mostRecentActual.actualBalance.toString()),
      date: startOfDay(mostRecentActual.date),
    };
  }

  // No actual balance found - fall back to initial balance from settings
  const settings = await getOrCreateSettings();
  return {
    balance: parseFloat(settings.initialBankBalance.toString()),
    date: startOfDay(settings.initialBalanceDate),
  };
}

/**
 * Calculate and store daily balances for a date range
 *
 * Algorithm:
 * 1. Find the most recent actual balance (or initial balance if none exists)
 * 2. If that balance is before the startDate, fetch all events from that date forward
 * 3. Calculate day-by-day from the starting balance date through the entire range
 * 4. When an actual balance is encountered, use it instead of the calculated value
 * 5. Store all calculated balances for the requested range
 *
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @param enabledDecisionPathIds - Optional set of decision path IDs that are enabled.
 *                                  If provided, events with decision paths not in this set will be excluded.
 *                                  If not provided, all events are included.
 */
export async function calculateDailyBalances(
  startDate: Date,
  endDate: Date,
  enabledDecisionPathIds?: Set<string>
): Promise<void> {
  // Normalize dates to start of day
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);

  // Find the correct starting balance and date
  const { balance: startingBalance, date: startingDate } = await findStartingBalanceAndDate(start);

  // Determine the actual calculation range
  // We need to calculate from the startingDate (where we have a known balance)
  // through to the endDate (the end of the requested range)
  const calculationStart = isBefore(startingDate, start) ? startingDate : start;

  // Get all events from the calculation start to the end
  const events = await getProjectionEvents(calculationStart, end);

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
  const existingDailyBalances = await getDailyBalances(calculationStart, end);
  const actualBalanceMap = new Map<string, number>();
  existingDailyBalances.forEach((balance) => {
    if (balance.actualBalance !== null && balance.actualBalance !== undefined) {
      const dateKey = startOfDay(balance.date).toISOString();
      actualBalanceMap.set(dateKey, parseFloat(balance.actualBalance.toString()));
    }
  });

  // Calculate balance for each day from calculationStart to end
  const allDays = eachDayOfInterval({ start: calculationStart, end });
  const balancesToUpsert = [];
  let currentBalance = startingBalance;

  for (const day of allDays) {
    const dateKey = startOfDay(day).toISOString();

    // Check if there's an actual balance for this day that overrides calculation
    const actualBalance = actualBalanceMap.get(dateKey);

    // If this is the starting date and we have an actual balance there, skip event calculation
    // because we're starting FROM this balance
    if (isSameDay(day, startingDate) && actualBalance !== undefined) {
      balancesToUpsert.push({
        date: day,
        expectedBalance: actualBalance, // Expected equals actual when we start from actual
        actualBalance,
      });
      currentBalance = actualBalance;
      continue;
    }

    // Get events for this day
    const dayEvents = eventsByDate.get(dateKey) || [];

    // Calculate day's impact from events (excluding UNLIKELY and disabled decision paths)
    let dayImpact = 0;

    for (const event of dayEvents) {
      // Skip UNLIKELY events
      if (event.certainty === CertaintyLevel.UNLIKELY) {
        continue;
      }

      // Skip events with decision paths that are disabled
      if (enabledDecisionPathIds && event.decisionPathId) {
        if (!enabledDecisionPathIds.has(event.decisionPathId)) {
          continue;
        }
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

  // Only upsert balances within the originally requested range
  // (we may have calculated extra days if startingDate was before start)
  const balancesInRequestedRange = balancesToUpsert.filter((b) => {
    const balanceDate = startOfDay(b.date);
    return (isSameDay(balanceDate, start) || isAfter(balanceDate, start)) &&
           (isSameDay(balanceDate, end) || isBefore(balanceDate, end));
  });

  // Batch upsert all daily balances
  await batchUpsertDailyBalances(balancesInRequestedRange);
}

/**
 * Recalculate balances from a specific date forward
 * Useful when events are added/removed/updated
 *
 * @param fromDate - Start date for recalculation
 * @param toDate - End date for recalculation
 * @param enabledDecisionPathIds - Optional set of enabled decision path IDs
 */
export async function recalculateBalancesFrom(
  fromDate: Date,
  toDate: Date,
  enabledDecisionPathIds?: Set<string>
): Promise<void> {
  await calculateDailyBalances(fromDate, toDate, enabledDecisionPathIds);
}

/**
 * Calculate balance for a single day (without persisting)
 * Useful for preview/validation
 *
 * @param date - The date to calculate for
 * @param previousBalance - The balance from the previous day
 * @param enabledDecisionPathIds - Optional set of enabled decision path IDs
 */
export async function calculateBalanceForDay(
  date: Date,
  previousBalance: number,
  enabledDecisionPathIds?: Set<string>
): Promise<{ expectedBalance: number; events: any[] }> {
  const day = startOfDay(date);
  const events = await getProjectionEvents(day, day);

  let balance = previousBalance;

  const relevantEvents = events.filter((e) => {
    // Skip UNLIKELY events
    if (e.certainty === CertaintyLevel.UNLIKELY) {
      return false;
    }

    // Skip events with decision paths that are disabled
    if (enabledDecisionPathIds && e.decisionPathId) {
      if (!enabledDecisionPathIds.has(e.decisionPathId)) {
        return false;
      }
    }

    return true;
  });

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
