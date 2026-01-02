import { DateFormat } from '@prisma/client';
import { format as dateFnsFormat, parse as dateFnsParse } from 'date-fns';

/**
 * Get the date format pattern for the user's preference
 */
export function getDateFormatPattern(dateFormat: DateFormat): string {
  return dateFormat === 'UK' ? 'dd/MM/yyyy' : 'MM/dd/yyyy';
}

/**
 * Get the HTML input date format pattern
 * Note: HTML date inputs always use yyyy-MM-dd format internally
 * but we can use this to show the format to users in labels/placeholders
 */
export function getDateInputPlaceholder(dateFormat: DateFormat): string {
  return dateFormat === 'UK' ? 'DD/MM/YYYY' : 'MM/DD/YYYY';
}

/**
 * Format a Date object as a string according to the user's preference
 */
export function formatDate(date: Date, dateFormat: DateFormat): string {
  const pattern = getDateFormatPattern(dateFormat);
  return dateFnsFormat(date, pattern);
}

/**
 * Parse a date string according to the user's format preference
 */
export function parseDate(dateString: string, dateFormat: DateFormat): Date {
  const pattern = getDateFormatPattern(dateFormat);
  return dateFnsParse(dateString, pattern, new Date());
}

/**
 * Convert a Date to the HTML input format (yyyy-MM-dd)
 */
export function toHtmlDateInput(date: Date): string {
  return dateFnsFormat(date, 'yyyy-MM-dd');
}

/**
 * Convert from HTML date input format (yyyy-MM-dd) to a Date
 */
export function fromHtmlDateInput(dateString: string): Date {
  return dateFnsParse(dateString, 'yyyy-MM-dd', new Date());
}

/**
 * Format a date for display in the UI
 * This will use the user's preferred format
 */
export function formatDateForDisplay(date: Date | string, dateFormat: DateFormat): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDate(dateObj, dateFormat);
}
