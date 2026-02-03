import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  startOfDay,
  isWeekend,
  isSaturday,
  isSunday,
  endOfMonth,
  getDate,
  getMonth,
  getYear,
  set,
  isAfter,
  isBefore,
  isSameDay,
  format,
} from 'date-fns';
import { RecurrenceFrequency, EventType } from '@/lib/prisma';

/**
 * UK Bank Holidays for 2025-2027
 * TODO: In future, fetch from gov.uk API or use a library
 * Format: YYYY-MM-DD
 */
const UK_BANK_HOLIDAYS = new Set([
  // 2025
  '2025-01-01', // New Year's Day
  '2025-04-18', // Good Friday
  '2025-04-21', // Easter Monday
  '2025-05-05', // Early May Bank Holiday
  '2025-05-26', // Spring Bank Holiday
  '2025-08-25', // Summer Bank Holiday
  '2025-12-25', // Christmas Day
  '2025-12-26', // Boxing Day

  // 2026
  '2026-01-01', // New Year's Day
  '2026-04-03', // Good Friday
  '2026-04-06', // Easter Monday
  '2026-05-04', // Early May Bank Holiday
  '2026-05-25', // Spring Bank Holiday
  '2026-08-31', // Summer Bank Holiday
  '2026-12-25', // Christmas Day
  '2026-12-28', // Boxing Day (substitute)

  // 2027
  '2027-01-01', // New Year's Day
  '2027-03-26', // Good Friday
  '2027-03-29', // Easter Monday
  '2027-05-03', // Early May Bank Holiday
  '2027-05-31', // Spring Bank Holiday
  '2027-08-30', // Summer Bank Holiday
  '2027-12-27', // Christmas Day (substitute)
  '2027-12-28', // Boxing Day (substitute)
]);

/**
 * Check if a date is a UK bank holiday
 */
export function isUKBankHoliday(date: Date): boolean {
  const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
  return UK_BANK_HOLIDAYS.has(dateStr);
}

/**
 * Check if a date is a non-working day (weekend or bank holiday)
 */
export function isNonWorkingDay(date: Date): boolean {
  return isWeekend(date) || isUKBankHoliday(date);
}

/**
 * Adjust date to next working day if it falls on a weekend or bank holiday
 * Only applies to INCOMING type events (e.g., salary payments)
 * Maximum adjustment is 5 days forward
 */
export function adjustToNextWorkingDay(date: Date, eventType: EventType): Date {
  // Don't adjust expenses - they're due when they're due
  if (eventType === 'EXPENSE') {
    return startOfDay(date);
  }

  let adjustedDate = startOfDay(date);
  let daysAdjusted = 0;
  const MAX_ADJUSTMENT_DAYS = 5;

  while (isNonWorkingDay(adjustedDate) && daysAdjusted < MAX_ADJUSTMENT_DAYS) {
    adjustedDate = addDays(adjustedDate, 1);
    daysAdjusted++;
  }

  if (daysAdjusted >= MAX_ADJUSTMENT_DAYS) {
    console.warn(
      `Date ${format(date, 'yyyy-MM-dd')} required ${daysAdjusted} days adjustment. Using ${format(adjustedDate, 'yyyy-MM-dd')}`
    );
  }

  return adjustedDate;
}

/**
 * Calculate the next monthly recurrence date
 * Handles edge cases like Jan 31 → Feb 28, etc.
 */
function getNextMonthlyDate(currentDate: Date): Date {
  const dayOfMonth = getDate(currentDate);
  const nextMonth = addMonths(currentDate, 1);
  const lastDayOfNextMonth = endOfMonth(nextMonth);
  const lastDayNumber = getDate(lastDayOfNextMonth);

  // If the target day doesn't exist in next month, use last day of month
  if (dayOfMonth > lastDayNumber) {
    return lastDayOfNextMonth;
  }

  // Otherwise, use the same day of month
  return set(nextMonth, { date: dayOfMonth });
}

/**
 * Calculate the next annual recurrence date
 * Handles leap year edge case (Feb 29 → Feb 28 on non-leap years)
 */
function getNextAnnualDate(currentDate: Date): Date {
  const dayOfMonth = getDate(currentDate);
  const month = getMonth(currentDate);
  const nextYear = addYears(currentDate, 1);

  // Special case: Feb 29 on leap year
  if (month === 1 && dayOfMonth === 29) {
    const nextYearDate = set(nextYear, { month: 1, date: 28 });
    const endOfFeb = endOfMonth(nextYearDate);
    const lastDayOfFeb = getDate(endOfFeb);

    // Use Feb 29 if it exists, otherwise Feb 28
    return set(nextYear, { month: 1, date: Math.min(29, lastDayOfFeb) });
  }

  return set(nextYear, { month, date: dayOfMonth });
}

interface GenerateRecurringDatesOptions {
  startDate: Date;
  endDate?: Date; // Optional for backward compatibility, but required in practice
  frequency: RecurrenceFrequency;
  eventType: EventType;
  maxYearsForward?: number; // Default: 2 years if no endDate (fallback only)
}

/**
 * Generate all recurring dates based on the rule
 * Returns array of dates (unadjusted and adjusted for working days)
 */
export function generateRecurringDates(
  options: GenerateRecurringDatesOptions
): Array<{ date: Date; adjustedDate: Date }> {
  const {
    startDate,
    endDate,
    frequency,
    eventType,
    maxYearsForward = 2,
  } = options;

  const dates: Array<{ date: Date; adjustedDate: Date }> = [];
  let currentDate = startOfDay(startDate);

  // If no end date, project forward by maxYearsForward
  const effectiveEndDate = endDate
    ? startOfDay(endDate)
    : addYears(startDate, maxYearsForward);

  // Always include the start date
  dates.push({
    date: currentDate,
    adjustedDate: adjustToNextWorkingDay(currentDate, eventType),
  });

  // Generate subsequent dates
  while (true) {
    let nextDate: Date;

    switch (frequency) {
      case 'DAILY':
        nextDate = addDays(currentDate, 1);
        break;

      case 'WEEKLY':
        nextDate = addWeeks(currentDate, 1);
        break;

      case 'MONTHLY':
        nextDate = getNextMonthlyDate(currentDate);
        break;

      case 'QUARTERLY':
        // Add 3 months
        nextDate = getNextMonthlyDate(getNextMonthlyDate(getNextMonthlyDate(currentDate)));
        break;

      case 'BIANNUAL':
        // Add 6 months
        nextDate = addMonths(currentDate, 6);
        break;

      case 'ANNUAL':
        nextDate = getNextAnnualDate(currentDate);
        break;

      default:
        throw new Error(`Unsupported frequency: ${frequency}`);
    }

    // Stop if we've exceeded the end date
    if (isAfter(nextDate, effectiveEndDate)) {
      break;
    }

    dates.push({
      date: nextDate,
      adjustedDate: adjustToNextWorkingDay(nextDate, eventType),
    });

    currentDate = nextDate;

    // Safety check: prevent infinite loops (max 10 years of daily events = 3650 dates)
    if (dates.length > 3650) {
      console.warn(
        `Generated ${dates.length} recurring dates. Stopping to prevent infinite loop.`
      );
      break;
    }
  }

  return dates;
}

/**
 * Preview recurring dates (returns first N dates for UI preview)
 */
export function previewRecurringDates(
  options: GenerateRecurringDatesOptions,
  limit: number = 10
): Array<{ date: Date; adjustedDate: Date; isAdjusted: boolean }> {
  const allDates = generateRecurringDates(options);

  return allDates.slice(0, limit).map(({ date, adjustedDate }) => ({
    date,
    adjustedDate,
    isAdjusted: !isSameDay(date, adjustedDate),
  }));
}
