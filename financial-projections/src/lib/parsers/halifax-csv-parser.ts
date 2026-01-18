import { TransactionType } from '@prisma/client';
import { parse } from 'csv-parse/sync';

interface HalifaxCSVRow {
  'Transaction Date': string;
  'Transaction Type': string;
  'Sort Code': string;
  'Account Number': string;
  'Transaction Description': string;
  'Debit Amount': string;
  'Credit Amount': string;
  'Balance': string;
}

export interface ParsedHalifaxTransaction {
  transactionDate: Date;
  transactionType: TransactionType;
  sortCode: string;
  accountNumber: string;
  transactionDescription: string;
  debitAmount?: number;
  creditAmount?: number;
  balance: number;
}

export interface HalifaxCSVParseResult {
  success: boolean;
  transactions: ParsedHalifaxTransaction[];
  errors: string[];
  metadata: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    sortCode?: string;
    accountNumber?: string;
  };
}

/**
 * Map Halifax transaction type codes to our TransactionType enum
 */
function mapTransactionType(halifaxType: string): TransactionType {
  const typeMap: Record<string, TransactionType> = {
    'DEB': TransactionType.DEB,
    'DD': TransactionType.DD,
    'CHG': TransactionType.CHG,
    'CR': TransactionType.CR,
    'SO': TransactionType.SO,
    'BP': TransactionType.BP,
    'TFR': TransactionType.TFR,
    'FPI': TransactionType.FPI,
    'FPO': TransactionType.FPO,
    'ATM': TransactionType.ATM,
    'DEP': TransactionType.DEP,
    'INT': TransactionType.INT,
    'FEE': TransactionType.FEE,
  };

  return typeMap[halifaxType.toUpperCase()] || TransactionType.OTHER;
}

/**
 * Parse a date string in DD/MM/YYYY format
 */
function parseHalifaxDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Clean sort code (remove quotes and ensure format)
 */
function cleanSortCode(sortCode: string): string {
  // Remove quotes and any whitespace
  return sortCode.replace(/['"]/g, '').trim();
}

/**
 * Parse Halifax CSV content
 *
 * Expected format:
 * Transaction Date,Transaction Type,Sort Code,Account Number,Transaction Description,Debit Amount,Credit Amount,Balance
 * 16/01/2026,DEB,'22-33-44,19292930, THE WHITE BULL,8,,-1055.7
 */
export function parseHalifaxCSV(csvContent: string): HalifaxCSVParseResult {
  const result: HalifaxCSVParseResult = {
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
    // Parse CSV with csv-parse
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as HalifaxCSVRow[];

    result.metadata.totalRows = records.length;

    // Extract sort code and account number from first row (they should be consistent)
    if (records.length > 0) {
      result.metadata.sortCode = cleanSortCode(records[0]['Sort Code']);
      result.metadata.accountNumber = records[0]['Account Number'].toString().trim();
    }

    // Parse each transaction
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        // Parse transaction date
        const transactionDate = parseHalifaxDate(row['Transaction Date']);

        // Parse transaction type
        const transactionType = mapTransactionType(row['Transaction Type']);

        // Parse amounts
        const debitStr = row['Debit Amount']?.trim();
        const creditStr = row['Credit Amount']?.trim();
        const balanceStr = row['Balance']?.trim();

        const debitAmount = debitStr && debitStr !== '' ? parseFloat(debitStr) : undefined;
        const creditAmount = creditStr && creditStr !== '' ? parseFloat(creditStr) : undefined;
        const balance = parseFloat(balanceStr);

        // Validate required fields
        if (isNaN(balance)) {
          throw new Error('Invalid balance value');
        }

        if (isNaN(transactionDate.getTime())) {
          throw new Error('Invalid date format');
        }

        // Create parsed transaction
        const transaction: ParsedHalifaxTransaction = {
          transactionDate,
          transactionType,
          sortCode: cleanSortCode(row['Sort Code']),
          accountNumber: row['Account Number'].toString().trim(),
          transactionDescription: row['Transaction Description'].trim(),
          debitAmount,
          creditAmount,
          balance,
        };

        result.transactions.push(transaction);
        result.metadata.validRows++;
      } catch (error) {
        result.metadata.invalidRows++;
        result.errors.push(
          `Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // If we have no valid transactions, mark as failed
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
 * Validate Halifax CSV format
 * Checks if the CSV has the expected headers
 */
export function validateHalifaxCSVFormat(csvContent: string): {
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
      'Transaction Date',
      'Transaction Type',
      'Sort Code',
      'Account Number',
      'Transaction Description',
      'Debit Amount',
      'Credit Amount',
      'Balance',
    ];

    // Check if all expected headers are present (case-insensitive)
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
