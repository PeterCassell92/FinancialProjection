import { Currency } from '@prisma/client';

/**
 * Format a number as currency based on the user's currency preference
 */
export function formatCurrency(value: number, currency: Currency): string {
  // Convert Currency enum to string
  const currencyCode = currency?.toString() ?? 'GBP';

  // Use appropriate locale for each currency
  const locale = currencyCode === 'GBP' ? 'en-GB' : 'en-US';

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(value);
}

/**
 * Get the currency symbol for display
 */
export function getCurrencySymbol(currency: Currency): string {
  const currencyCode = currency.toString();
  return currencyCode === 'GBP' ? '£' : '$';
}

/**
 * Parse a currency string to a number
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols and commas
  const cleaned = value.replace(/[£$,]/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
