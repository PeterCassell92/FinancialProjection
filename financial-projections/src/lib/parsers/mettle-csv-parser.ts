import { TransactionType } from '@prisma/client';
import { parse } from 'csv-parse/sync';

interface MettleCSVRow {
  'Date': string;
  'Amount in GBP': string;
  'Balance': string;
  'Reference': string;
  'Description': string;
  'Transaction Type': string;
  'Invoices': string;
  'Receipts': string;
  'Note': string;
  'Category': string;
}

export interface ParsedMettleTransaction {
  transactionDate: Date;
  transactionType: TransactionType;
  transactionDescription: string;
  reference: string;
  debitAmount?: number;
  creditAmount?: number;
  balance: number;
}

export interface MettleCSVParseResult {
  success: boolean;
  transactions: ParsedMettleTransaction[];
  errors: string[];
  metadata: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
}

/**
 * Map Mettle descriptive transaction types to our TransactionType enum
 */
function mapMettleTransactionType(mettleType: string): TransactionType {
  const typeMap: Record<string, TransactionType> = {
    'bank transfer': TransactionType.TFR,
    'direct debit': TransactionType.DD,
    'standing order': TransactionType.SO,
    'card payment': TransactionType.DEB,
    'faster payment': TransactionType.FPI, // Could be FPI or FPO, default to FPI
    'interest': TransactionType.INT,
    'fee': TransactionType.FEE,
    'charge': TransactionType.CHG,
    'atm': TransactionType.ATM,
    'deposit': TransactionType.DEP,
  };

  return typeMap[mettleType.toLowerCase()] || TransactionType.OTHER;
}

/**
 * Parse a date string in DD/MM/YYYY format
 */
function parseMettleDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Parse Mettle CSV content
 *
 * Expected format:
 * Date,Amount in GBP,Balance,Reference,Description,Transaction Type,Invoices,Receipts,Note,Category
 * 10/06/2024,35.00,79.79,INITIALFLOAT7 : J Jeffries,J Jeffries,Bank transfer,,,,
 *
 * Key differences from Halifax:
 * - Single "Amount in GBP" column (positive = credit, negative = debit)
 * - Balance only on some rows (typically the first/most recent)
 * - No sort code or account number
 * - Descriptive transaction types instead of codes
 * - Data sorted newest-first
 */
export function parseMettleCSV(csvContent: string): MettleCSVParseResult {
  const result: MettleCSVParseResult = {
    success: true,
    transactions: [],
    errors: [],
    metadata: {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
    },
  };

  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as MettleCSVRow[];

    result.metadata.totalRows = records.length;

    // First pass: parse all rows, collecting known balances
    const parsedRows: {
      row: MettleCSVRow;
      index: number;
      amount: number;
      balance: number | null;
      transactionDate: Date;
      transactionType: TransactionType;
    }[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        const transactionDate = parseMettleDate(row['Date']);
        if (isNaN(transactionDate.getTime())) {
          throw new Error('Invalid date format');
        }

        const amountStr = row['Amount in GBP']?.trim();
        if (!amountStr || amountStr === '') {
          throw new Error('Missing amount');
        }
        const amount = parseFloat(amountStr);
        if (isNaN(amount)) {
          throw new Error('Invalid amount value');
        }

        const balanceStr = row['Balance']?.trim();
        const balance = balanceStr && balanceStr !== '' ? parseFloat(balanceStr) : null;

        const transactionType = mapMettleTransactionType(row['Transaction Type'] || '');

        parsedRows.push({ row, index: i, amount, balance, transactionDate, transactionType });
      } catch (error) {
        result.metadata.invalidRows++;
        result.errors.push(
          `Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Second pass: calculate missing balances
    // Data is newest-first. Walk forward through the array (newest to oldest).
    // If row N has a known balance, row N+1's balance = row_N_balance - row_N_amount
    let lastKnownBalance: number | null = null;

    for (let i = 0; i < parsedRows.length; i++) {
      const parsed = parsedRows[i];

      if (parsed.balance !== null) {
        lastKnownBalance = parsed.balance;
      } else if (lastKnownBalance !== null) {
        // Calculate: this row's balance is what the balance was BEFORE the previous transaction
        // Since data is newest-first, the previous entry (i-1) is newer.
        // balance_before_previous = previous_balance - previous_amount
        const prevParsed = parsedRows[i - 1];
        parsed.balance = Math.round((prevParsed.balance! - prevParsed.amount) * 100) / 100;
        lastKnownBalance = parsed.balance;
      }
    }

    // Build final transactions
    for (const parsed of parsedRows) {
      if (parsed.balance === null) {
        // No balance could be calculated (no anchor balance found)
        parsed.balance = 0;
        result.errors.push(
          `Row ${parsed.index + 2}: Balance could not be calculated, set to 0`
        );
      }

      const debitAmount = parsed.amount < 0 ? Math.abs(parsed.amount) : undefined;
      const creditAmount = parsed.amount > 0 ? parsed.amount : undefined;

      const description = parsed.row['Description']?.trim() || parsed.row['Reference']?.trim() || '';

      const transaction: ParsedMettleTransaction = {
        transactionDate: parsed.transactionDate,
        transactionType: parsed.transactionType,
        transactionDescription: description,
        reference: parsed.row['Reference']?.trim() || '',
        debitAmount,
        creditAmount,
        balance: parsed.balance,
      };

      result.transactions.push(transaction);
      result.metadata.validRows++;
    }

    if (result.metadata.validRows === 0 && result.metadata.totalRows > 0) {
      result.success = false;
    }
  } catch (error) {
    result.success = false;
    result.errors.push(
      `CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return result;
}

/**
 * Validate Mettle CSV format
 * Checks if the CSV has the expected headers
 */
export function validateMettleCSVFormat(csvContent: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const lines = csvContent.trim().split('\n');
    if (lines.length === 0) {
      return { valid: false, error: 'Empty CSV file' };
    }

    const header = lines[0];
    const expectedHeaders = [
      'Date',
      'Amount in GBP',
      'Balance',
      'Reference',
      'Description',
      'Transaction Type',
    ];

    const headerLower = header.toLowerCase();
    const missingHeaders = expectedHeaders.filter(
      (h) => !headerLower.includes(h.toLowerCase())
    );

    if (missingHeaders.length > 0) {
      return {
        valid: false,
        error: `Missing required headers: ${missingHeaders.join(', ')}`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
