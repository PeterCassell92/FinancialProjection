/**
 * Error type classifications for the application
 */
export enum ErrorType {
  DATABASE_CONNECTION = 'DATABASE_CONNECTION',
  DATABASE_QUERY = 'DATABASE_QUERY',
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Recovery action types for error handling
 */
export type RecoveryAction = 'retry' | 'navigate' | 'external' | 'custom';

/**
 * Recovery option for user to resolve an error
 */
export interface RecoveryOption {
  label: string;
  action: RecoveryAction;
  target?: string;
  customHandler?: () => void | Promise<void>;
}

/**
 * Structured application error with user-friendly messaging and recovery options
 */
export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  technicalDetails?: string;
  recoveryOptions?: RecoveryOption[];
  retryable: boolean;
  timestamp: Date;
}
