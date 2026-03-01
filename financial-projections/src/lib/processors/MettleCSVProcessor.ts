import {
  DataFormatProcessor,
  ParsedTransaction,
  ParseResult,
  ValidationResult,
  PreflightCheckResult,
} from './DataFormatProcessor';
import {
  parseMettleCSV,
  validateMettleCSVFormat,
  ParsedMettleTransaction,
} from '../parsers/mettle-csv-parser';

/**
 * Mettle CSV Format Processor
 * Handles Mettle bank CSV exports
 *
 * Key differences from Halifax:
 * - No sort code or account number in CSV (user must select account)
 * - Single "Amount in GBP" column (positive = credit, negative = debit)
 * - Balance only on first row (calculated for rest)
 * - Descriptive transaction types ("Bank transfer", "Direct debit")
 */
export class MettleCSVProcessor extends DataFormatProcessor {
  readonly formatId = 'mettle_csv_v1';
  readonly formatName = 'Mettle CSV Format v1';

  /**
   * Perform preflight check on Mettle CSV
   * Returns empty strings for accountNumber and sortCode since Mettle CSVs don't contain these
   */
  preflightCheck(csvContent: string): PreflightCheckResult {
    const validation = this.validate(csvContent);
    if (!validation.valid) {
      return {
        valid: false,
        error: validation.error,
        accountNumber: '',
        sortCode: '',
        earliestDate: new Date(),
        latestDate: new Date(),
        transactionCount: 0,
      };
    }

    const parseResult = parseMettleCSV(csvContent);

    if (!parseResult.success || parseResult.transactions.length === 0) {
      return {
        valid: false,
        error: parseResult.errors.join('; ') || 'No valid transactions found in CSV',
        accountNumber: '',
        sortCode: '',
        earliestDate: new Date(),
        latestDate: new Date(),
        transactionCount: 0,
      };
    }

    // Find earliest and latest dates
    const dates = parseResult.transactions.map((tx) => tx.transactionDate);
    const earliestDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const latestDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    return {
      valid: true,
      accountNumber: '',
      sortCode: '',
      earliestDate,
      latestDate,
      transactionCount: parseResult.transactions.length,
    };
  }

  /**
   * Validate Mettle CSV format
   */
  validate(csvContent: string): ValidationResult {
    return validateMettleCSVFormat(csvContent);
  }

  /**
   * Parse Mettle CSV into transaction records
   */
  parse(csvContent: string): ParseResult {
    const mettleResult = parseMettleCSV(csvContent);

    const transactions: ParsedTransaction[] = mettleResult.transactions.map(
      (tx: ParsedMettleTransaction) => ({
        transactionDate: tx.transactionDate,
        transactionType: tx.transactionType,
        transactionDescription: tx.transactionDescription,
        debitAmount: tx.debitAmount ?? null,
        creditAmount: tx.creditAmount ?? null,
        balance: tx.balance,
        sortCode: '',
        accountNumber: '',
      })
    );

    return {
      success: mettleResult.success,
      transactions,
      errors: mettleResult.errors,
      metadata: {
        totalRows: mettleResult.metadata.totalRows,
        parsedRows: mettleResult.metadata.validRows,
        skippedRows: mettleResult.metadata.invalidRows,
      },
    };
  }

  /**
   * Get a sample CSV template for Mettle format
   */
  getSampleTemplate(): string {
    return `Date,Amount in GBP,Balance,Reference,Description,Transaction Type,Invoices,Receipts,Note,Category
10/06/2024,35.00,79.79,PAYMENT : J Smith,J Smith,Bank transfer,,,,
27/04/2024,-33.79,,DD/REF123 : Insurance Co,Insurance Co,Direct debit,,,,`;
  }
}
