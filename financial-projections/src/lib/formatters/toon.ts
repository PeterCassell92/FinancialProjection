/**
 * TOON (Token Oriented Object Notation) Formatter
 *
 * Converts JSON data to a compact, pipe-delimited format that uses 50-70% fewer tokens
 * while remaining highly readable for AI models.
 *
 * Benefits:
 * - Dramatically reduced token usage compared to verbose JSON
 * - Human and AI readable
 * - Maintains data structure and relationships
 * - Easy to parse
 */

/**
 * Serialized transaction record with Decimal fields as numbers (for TOON formatting)
 */
export interface SerializedToonTransactionRecord {
  id: string;
  bankAccountId: string;
  transactionDate: Date;
  transactionType: string;
  transactionDescription: string;
  debitAmount: number | null;
  creditAmount: number | null;
  balance: number;
  notes: string | null;
  spendingTypes: Array<{
    spendingType: {
      id: string;
      name: string;
      description: string | null;
      color: string | null;
    };
  }>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Format transaction records in TOON format
 *
 * Example output:
 * ```
 * TRANSACTIONS (100 records)
 * ID|Date|Type|Description|Debit|Credit|Balance|SpendingTypes|Notes
 * abc123|2025-01-15|DEB|TESCO STORES|45.67||1234.56|Groceries|Weekly shop
 * def456|2025-01-14|CRE|SALARY PAYMENT||3000.00|4234.56|Income|Monthly salary
 * ```
 */
export function formatTransactionsAsTOON(
  transactions: SerializedToonTransactionRecord[],
  pagination?: {
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
  }
): string {
  if (transactions.length === 0) {
    return 'TRANSACTIONS (0 records)\nNo transactions found.';
  }

  const lines: string[] = [];

  // Header with count and pagination info
  if (pagination) {
    lines.push(
      `TRANSACTIONS (Page ${pagination.page}/${pagination.totalPages}, showing ${transactions.length} of ${pagination.totalRecords} total)`
    );
  } else {
    lines.push(`TRANSACTIONS (${transactions.length} records)`);
  }

  // Column headers
  lines.push('ID|Date|Type|Description|Debit|Credit|Balance|SpendingTypes|Notes');

  // Data rows
  for (const tx of transactions) {
    const id = tx.id.substring(0, 8); // Shortened UUID for compactness
    const date = tx.transactionDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const type = tx.transactionType;
    const description = escapeForTOON(tx.transactionDescription);
    const debit = tx.debitAmount?.toFixed(2) ?? '';
    const credit = tx.creditAmount?.toFixed(2) ?? '';
    const balance = tx.balance.toFixed(2);
    const spendingTypes =
      tx.spendingTypes.map((st) => st.spendingType.name).join(';') || 'Uncategorized';
    const notes = tx.notes ? escapeForTOON(tx.notes) : '';

    lines.push(`${id}|${date}|${type}|${description}|${debit}|${credit}|${balance}|${spendingTypes}|${notes}`);
  }

  // Footer with summary
  const totalDebit = transactions.reduce((sum, tx) => sum + (tx.debitAmount ?? 0), 0);
  const totalCredit = transactions.reduce((sum, tx) => sum + (tx.creditAmount ?? 0), 0);
  lines.push('---');
  lines.push(`SUMMARY: Debit=${totalDebit.toFixed(2)} | Credit=${totalCredit.toFixed(2)}`);

  return lines.join('\n');
}

/**
 * Escape special characters for TOON format
 * Replaces pipes and newlines to prevent parsing issues
 */
function escapeForTOON(str: string): string {
  return str.replace(/\|/g, '｜').replace(/\n/g, ' ').replace(/\r/g, '');
}

/**
 * Format transaction analytics in TOON format
 */
export function formatAnalyticsAsTOON(analytics: {
  byCategory: Array<{
    id: string;
    name: string;
    color: string | null;
    totalDebit: number;
    totalCredit: number;
    count: number;
  }>;
  totals: {
    totalDebit: number;
    totalCredit: number;
    transactionCount: number;
  };
  monthlySpending?: Array<{
    month: string;
    debit: number;
    credit: number;
    count: number;
  }>;
}): string {
  const lines: string[] = [];

  // Overall totals
  lines.push('TRANSACTION ANALYTICS');
  lines.push('---');
  lines.push(
    `TOTALS: Debit=${analytics.totals.totalDebit.toFixed(2)} | Credit=${analytics.totals.totalCredit.toFixed(2)} | Transactions=${analytics.totals.transactionCount}`
  );
  lines.push('');

  // By category
  lines.push('BY CATEGORY');
  lines.push('Category|Debit|Credit|Count|Color');
  for (const cat of analytics.byCategory) {
    lines.push(
      `${cat.name}|${cat.totalDebit.toFixed(2)}|${cat.totalCredit.toFixed(2)}|${cat.count}|${cat.color ?? 'N/A'}`
    );
  }
  lines.push('');

  // Monthly spending (if available)
  if (analytics.monthlySpending && analytics.monthlySpending.length > 0) {
    lines.push('MONTHLY SPENDING');
    lines.push('Month|Debit|Credit|Count');
    for (const month of analytics.monthlySpending) {
      lines.push(`${month.month}|${month.debit.toFixed(2)}|${month.credit.toFixed(2)}|${month.count}`);
    }
  }

  return lines.join('\n');
}
