import { AppError, ErrorType, RecoveryOption } from './types';

/**
 * Factory for creating standardized application errors with consistent messaging
 */
export class AppErrorFactory {
  /**
   * Create a database connection error
   */
  static createDatabaseConnectionError(technicalDetails?: string): AppError {
    const recoveryOptions: RecoveryOption[] = [
      {
        label: 'Retry Connection',
        action: 'retry',
      },
    ];

    return {
      type: ErrorType.DATABASE_CONNECTION,
      message: 'Cannot connect to database',
      userMessage: 'Unable to connect to the database. Please check that the database is running.',
      technicalDetails: technicalDetails || 'Database connection failed',
      retryable: true,
      timestamp: new Date(),
      recoveryOptions,
    };
  }

  /**
   * Create a database query error
   */
  static createDatabaseQueryError(query: string, error: unknown): AppError {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      type: ErrorType.DATABASE_QUERY,
      message: 'Database query failed',
      userMessage: 'Failed to retrieve data from the database. Please try again.',
      technicalDetails: `Query failed: ${query}\nError: ${errorMessage}`,
      retryable: true,
      timestamp: new Date(),
      recoveryOptions: [
        {
          label: 'Retry',
          action: 'retry',
        },
      ],
    };
  }

  /**
   * Create a network error
   */
  static createNetworkError(url?: string, error?: unknown): AppError {
    const errorMessage = error instanceof Error ? error.message : 'Network request failed';

    return {
      type: ErrorType.NETWORK,
      message: 'Network error',
      userMessage: 'Failed to connect to the server. Please check your internet connection.',
      technicalDetails: url ? `URL: ${url}\nError: ${errorMessage}` : errorMessage,
      retryable: true,
      timestamp: new Date(),
      recoveryOptions: [
        {
          label: 'Retry',
          action: 'retry',
        },
      ],
    };
  }

  /**
   * Create a validation error
   */
  static createValidationError(field: string, message: string): AppError {
    return {
      type: ErrorType.VALIDATION,
      message: `Validation failed for ${field}`,
      userMessage: message,
      technicalDetails: `Field: ${field}`,
      retryable: false,
      timestamp: new Date(),
    };
  }

  /**
   * Create a not found error
   */
  static createNotFoundError(resource: string, id?: string | number): AppError {
    return {
      type: ErrorType.NOT_FOUND,
      message: `${resource} not found`,
      userMessage: `The requested ${resource.toLowerCase()} could not be found.`,
      technicalDetails: id ? `Resource: ${resource}, ID: ${id}` : `Resource: ${resource}`,
      retryable: false,
      timestamp: new Date(),
      recoveryOptions: [
        {
          label: 'Go Back',
          action: 'navigate',
          target: '/',
        },
      ],
    };
  }

  /**
   * Create a permission error
   */
  static createPermissionError(action: string): AppError {
    return {
      type: ErrorType.PERMISSION,
      message: 'Permission denied',
      userMessage: `You don't have permission to ${action}.`,
      retryable: false,
      timestamp: new Date(),
    };
  }

  /**
   * Create an unknown error from a caught exception
   */
  static createUnknownError(error: unknown): AppError {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;

    return {
      type: ErrorType.UNKNOWN,
      message: errorMessage,
      userMessage: 'Something went wrong. Please try again.',
      technicalDetails: errorStack || errorMessage,
      retryable: true,
      timestamp: new Date(),
      recoveryOptions: [
        {
          label: 'Retry',
          action: 'retry',
        },
      ],
    };
  }
}
