/**
 * Base interface for all data format processors
 * Each supported CSV format must implement this interface
 */

export interface ParsedTransaction {
  transactionDate: Date;
  transactionType: string;
  transactionDescription: string;
  debitAmount: number | null;
  creditAmount: number | null;
  balance: number;
  sortCode: string;
  accountNumber: string;
}

export interface ParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  errors: string[];
  metadata: {
    totalRows: number;
    parsedRows: number;
    skippedRows: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface PreflightCheckResult {
  valid: boolean;
  error?: string;
  accountNumber: string;
  sortCode: string;
  earliestDate: Date;
  latestDate: Date;
  transactionCount: number;
}

/**
 * Abstract base class for data format processors
 */
export abstract class DataFormatProcessor {
  /**
   * The unique identifier for this data format (must match DataFormat.name in database)
   */
  abstract readonly formatId: string;

  /**
   * Human-readable name for this data format
   */
  abstract readonly formatName: string;

  /**
   * Perform preflight validation and extract metadata from CSV
   * This is called before actual processing to validate the file and extract key information
   * @param csvContent The raw CSV content as string
   * @returns PreflightCheckResult with validity status and metadata
   */
  abstract preflightCheck(csvContent: string): PreflightCheckResult;

  /**
   * Validate the format of the CSV content
   * @param csvContent The raw CSV content as string
   * @returns ValidationResult indicating if format is valid
   */
  abstract validate(csvContent: string): ValidationResult;

  /**
   * Parse the CSV content into structured transaction data
   * @param csvContent The raw CSV content as string
   * @returns ParseResult with transactions and any errors
   */
  abstract parse(csvContent: string): ParseResult;

  /**
   * Get a sample CSV template for this format (optional, for documentation/help)
   */
  getSampleTemplate?(): string;
}
