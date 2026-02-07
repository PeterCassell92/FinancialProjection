import {
  eachDayOfInterval,
  startOfDay,
  isSameDay,
  isBefore,
  isAfter
} from 'date-fns';
import { CertaintyLevel, EventType } from '@/lib/prisma';
import { getProjectionEvents } from '@/lib/dal/projection-events';
import { batchUpsertDailyBalances } from '@/lib/dal/daily-balance';
import { getLastTransactionBalanceOnOrBefore } from '@/lib/dal/transaction-records';

export interface ComputedDailyBalance {
  date: Date;
  expectedBalance: number;
  eventCount: number;
  balanceType: 'true' | 'projected';
}

/**
 * Find the correct starting balance and date for calculations.
 * Uses transaction history as the source of truth.
 *
 * Algorithm:
 * 1. If useTrueBalanceFromDate is provided, find the last transaction balance on or before that date
 * 2. If not provided, find the most recent transaction balance on or before the start date
 * 3. If no transactions exist at all, return balance = 0
 */
async function findStartingBalanceAndDate(
  startDate: Date,
  bankAccountId: string,
  useTrueBalanceFromDate?: Date | null
): Promise<{ balance: number; date: Date }> {
  const effectiveDate = useTrueBalanceFromDate
    ? startOfDay(useTrueBalanceFromDate)
    : startOfDay(startDate);

  // Look for the most recent transaction balance on or before the effective date
  const lastTx = await getLastTransactionBalanceOnOrBefore(effectiveDate, bankAccountId);

  if (lastTx) {
    return {
      balance: lastTx.balance,
      date: startOfDay(lastTx.date),
    };
  }

  // No transaction history at all - return zero balance
  return {
    balance: 0,
    date: startOfDay(startDate),
  };
}

/**
 * Core balance computation logic shared by both store and on-the-fly modes.
 * Returns computed daily balances for the requested range.
 */
async function computeBalances(
  startDate: Date,
  endDate: Date,
  bankAccountId: string,
  enabledDecisionPathIds?: Set<string>,
  useTrueBalanceFromDate?: Date | null
): Promise<Array<{ date: Date; bankAccountId: string; expectedBalance: number }>> {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);

  // Find the correct starting balance and date
  const { balance: startingBalance, date: startingDate } = await findStartingBalanceAndDate(
    start, bankAccountId, useTrueBalanceFromDate
  );

  // Determine the actual calculation range
  const calculationStart = isBefore(startingDate, start) ? startingDate : start;

  // Get all events from the calculation start to the end for this bank account
  const allEvents = await getProjectionEvents(calculationStart, end);
  const events = allEvents.filter(event => event.bankAccountId === bankAccountId);

  // Group events by date
  const eventsByDate = new Map<string, typeof events>();
  events.forEach((event) => {
    const dateKey = startOfDay(event.date).toISOString();
    if (!eventsByDate.has(dateKey)) {
      eventsByDate.set(dateKey, []);
    }
    eventsByDate.get(dateKey)!.push(event);
  });

  // Calculate balance for each day
  const allDays = eachDayOfInterval({ start: calculationStart, end });
  const results: Array<{ date: Date; bankAccountId: string; expectedBalance: number }> = [];
  let currentBalance = startingBalance;

  for (const day of allDays) {
    const dateKey = startOfDay(day).toISOString();
    const dayEvents = eventsByDate.get(dateKey) || [];

    // Calculate day's impact from events (excluding UNLIKELY and disabled decision paths)
    let dayImpact = 0;

    for (const event of dayEvents) {
      if (event.certainty === CertaintyLevel.UNLIKELY) {
        continue;
      }

      if (enabledDecisionPathIds && event.decisionPathId) {
        if (!enabledDecisionPathIds.has(event.decisionPathId)) {
          continue;
        }
      }

      const eventValue = parseFloat(event.value.toString());

      if (event.type === EventType.INCOMING) {
        dayImpact += eventValue;
      } else {
        dayImpact -= eventValue;
      }
    }

    const expectedBalance = currentBalance + dayImpact;

    results.push({
      date: day,
      bankAccountId,
      expectedBalance,
    });

    currentBalance = expectedBalance;
  }

  // Only return balances within the originally requested range
  return results.filter((b) => {
    const balanceDate = startOfDay(b.date);
    return (isSameDay(balanceDate, start) || isAfter(balanceDate, start)) &&
           (isSameDay(balanceDate, end) || isBefore(balanceDate, end));
  });
}

/**
 * Calculate and store daily balances for a date range (cache mode).
 * Uses the most recent transaction as the starting balance.
 * Stores results in the DailyBalance table for fast page loads.
 *
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @param bankAccountId - The bank account to calculate balances for
 * @param enabledDecisionPathIds - Optional set of decision path IDs that are enabled
 */
export async function calculateDailyBalances(
  startDate: Date,
  endDate: Date,
  bankAccountId: string,
  enabledDecisionPathIds?: Set<string>
): Promise<void> {
  const balances = await computeBalances(startDate, endDate, bankAccountId, enabledDecisionPathIds);
  await batchUpsertDailyBalances(balances);
}

/**
 * Recalculate balances from a specific date forward.
 * Called by event/rule CRUD APIs to keep the DailyBalance cache fresh.
 * Uses the most recent transaction as the default starting balance.
 */
export async function recalculateBalancesFrom(
  fromDate: Date,
  toDate: Date,
  bankAccountId: string,
  enabledDecisionPathIds?: Set<string>
): Promise<void> {
  await calculateDailyBalances(fromDate, toDate, bankAccountId, enabledDecisionPathIds);
}

/**
 * Compute daily balances on-the-fly WITHOUT storing them.
 * Accepts explicit starting parameters for what-if scenarios.
 *
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @param bankAccountId - The bank account to calculate for
 * @param useTrueBalanceFromDate - Date within transaction coverage to use as starting point
 * @param enabledDecisionPathIds - Optional set of enabled decision path IDs
 * @param transactionCoverageEndDate - If provided, marks days on or before this date as 'true' balance type
 */
export async function computeBalancesOnTheFly(
  startDate: Date,
  endDate: Date,
  bankAccountId: string,
  useTrueBalanceFromDate: Date,
  enabledDecisionPathIds?: Set<string>,
  transactionCoverageEndDate?: Date
): Promise<ComputedDailyBalance[]> {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  const trueBalanceDate = startOfDay(useTrueBalanceFromDate);
  const coverageEnd = transactionCoverageEndDate
    ? startOfDay(transactionCoverageEndDate)
    : trueBalanceDate;

  const { balance: startingBalance, date: startingDate } = await findStartingBalanceAndDate(
    start, bankAccountId, useTrueBalanceFromDate
  );

  const calculationStart = isBefore(startingDate, start) ? startingDate : start;

  const allEvents = await getProjectionEvents(calculationStart, end);
  const events = allEvents.filter(event => event.bankAccountId === bankAccountId);

  // Group events by date
  const eventsByDate = new Map<string, typeof events>();
  events.forEach((event) => {
    const dateKey = startOfDay(event.date).toISOString();
    if (!eventsByDate.has(dateKey)) {
      eventsByDate.set(dateKey, []);
    }
    eventsByDate.get(dateKey)!.push(event);
  });

  const allDays = eachDayOfInterval({ start: calculationStart, end });
  const results: ComputedDailyBalance[] = [];
  let currentBalance = startingBalance;

  for (const day of allDays) {
    const dateKey = startOfDay(day).toISOString();
    const dayEvents = eventsByDate.get(dateKey) || [];

    let dayImpact = 0;
    let eventCount = 0;

    for (const event of dayEvents) {
      if (event.certainty === CertaintyLevel.UNLIKELY) {
        continue;
      }

      if (enabledDecisionPathIds && event.decisionPathId) {
        if (!enabledDecisionPathIds.has(event.decisionPathId)) {
          continue;
        }
      }

      const eventValue = parseFloat(event.value.toString());

      if (event.type === EventType.INCOMING) {
        dayImpact += eventValue;
      } else {
        dayImpact -= eventValue;
      }
      eventCount++;
    }

    const expectedBalance = currentBalance + dayImpact;
    const dayDate = startOfDay(day);

    // Only include days in the requested range
    if ((isSameDay(dayDate, start) || isAfter(dayDate, start)) &&
        (isSameDay(dayDate, end) || isBefore(dayDate, end))) {
      results.push({
        date: day,
        expectedBalance,
        eventCount,
        balanceType: (isSameDay(dayDate, coverageEnd) || isBefore(dayDate, coverageEnd))
          ? 'true'
          : 'projected',
      });
    }

    currentBalance = expectedBalance;
  }

  return results;
}

/**
 * Calculate balance for a single day (without persisting)
 * Useful for preview/validation
 */
export async function calculateBalanceForDay(
  date: Date,
  previousBalance: number,
  bankAccountId: string,
  enabledDecisionPathIds?: Set<string>
): Promise<{ expectedBalance: number; events: any[] }> {
  const day = startOfDay(date);
  const allEvents = await getProjectionEvents(day, day);

  const events = allEvents.filter(event => event.bankAccountId === bankAccountId);

  let balance = previousBalance;

  const relevantEvents = events.filter((e) => {
    if (e.certainty === CertaintyLevel.UNLIKELY) {
      return false;
    }

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
