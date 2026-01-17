import {
  DataFormatProcessor,
  ParsedTransaction,
  ParseResult,
  ValidationResult,
  PreflightCheckResult,
} from './DataFormatProcessor';
import {
  parseHalifaxCSV,
  validateHalifaxCSVFormat,
  ParsedHalifaxTransaction,
} from '../parsers/halifax-csv-parser';

/**
 * Halifax CSV Format Processor
 * Handles Halifax bank CSV exports
 */
export class HalifaxCSVProcessor extends DataFormatProcessor {
  readonly formatId = 'halifax_csv_v1';
  readonly formatName = 'Halifax CSV Format v1';

  /**
   * Perform preflight check on Halifax CSV
   * Validates format and extracts metadata without full parsing
   */
  preflightCheck(csvContent: string): PreflightCheckResult {
    // First validate the format
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

    // Parse the CSV to extract metadata
    const parseResult = parseHalifaxCSV(csvContent);

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

    // Extract account details from metadata
    const accountNumber = parseResult.metadata.accountNumber || '';
    const sortCode = parseResult.metadata.sortCode || '';

    if (!accountNumber || !sortCode) {
      return {
        valid: false,
        error: 'Unable to detect account number or sort code from CSV',
        accountNumber,
        sortCode,
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
      accountNumber,
      sortCode,
      earliestDate,
      latestDate,
      transactionCount: parseResult.transactions.length,
    };
  }

  /**
   * Validate Halifax CSV format
   */
  validate(csvContent: string): ValidationResult {
    return validateHalifaxCSVFormat(csvContent);
  }

  /**
   * Parse Halifax CSV into transaction records
   */
  parse(csvContent: string): ParseResult {
    const halifaxResult = parseHalifaxCSV(csvContent);

    // Convert Halifax-specific format to generic ParsedTransaction format
    const transactions: ParsedTransaction[] = halifaxResult.transactions.map(
      (tx: ParsedHalifaxTransaction) => ({
        transactionDate: tx.transactionDate,
        transactionType: tx.transactionType,
        transactionDescription: tx.transactionDescription,
        debitAmount: tx.debitAmount ?? null,
        creditAmount: tx.creditAmount ?? null,
        balance: tx.balance,
        sortCode: tx.sortCode,
        accountNumber: tx.accountNumber,
      })
    );

    return {
      success: halifaxResult.success,
      transactions,
      errors: halifaxResult.errors,
      metadata: {
        totalRows: halifaxResult.metadata.totalRows,
        parsedRows: halifaxResult.metadata.validRows,
        skippedRows: halifaxResult.metadata.invalidRows,
      },
    };
  }

  /**
   * Get a sample CSV template for Halifax format
   */
  getSampleTemplate(): string {
    return `Transaction Date,Transaction Type,Sort Code,Account Number,Transaction Description,Debit Amount,Credit Amount,Balance
16/01/2026,DEB,'22-33-44,REDACTED,TESCO STORES,50.00,,950.00
15/01/2026,CR,'22-33-44,REDACTED,SALARY PAYMENT,,2000.00,1000.00
14/01/2026,DD,'22-33-44,REDACTED,ELECTRIC COMPANY,75.50,,-1000.00`;
  }
}
