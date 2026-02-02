import { NextResponse } from 'next/server';
import { AppError, ErrorType } from '@/lib/errors/types';
import { AppErrorFactory } from '@/lib/errors/error-factory';
import { isDatabaseConnectionError, isDatabaseQueryError } from '@/lib/dal/health-check';

/**
 * API response structure for errors
 */
export interface ApiErrorResponse {
  success: false;
  error: AppError;
}

/**
 * API response structure for successful requests
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Generic API response type
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Handle errors in API routes and return appropriate NextResponse
 * @param error - The error that occurred
 * @returns NextResponse with error information
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error('[API Error]', error);

  // Detect database connection errors
  if (isDatabaseConnectionError(error)) {
    const appError = AppErrorFactory.createDatabaseConnectionError(
      error instanceof Error ? error.message : undefined
    );
    return NextResponse.json(
      {
        success: false,
        error: appError,
      },
      { status: 503 } // Service Unavailable
    );
  }

  // Detect database query errors
  if (isDatabaseQueryError(error)) {
    const appError = AppErrorFactory.createDatabaseQueryError(
      'Database query',
      error
    );
    return NextResponse.json(
      {
        success: false,
        error: appError,
      },
      { status: 500 } // Internal Server Error
    );
  }

  // Handle validation errors (if error has a type property)
  if (error && typeof error === 'object' && 'type' in error) {
    const typedError = error as { type?: ErrorType };
    if (typedError.type === ErrorType.VALIDATION) {
      return NextResponse.json(
        {
          success: false,
          error: error as AppError,
        },
        { status: 400 } // Bad Request
      );
    }
  }

  // Default unknown error
  const appError = AppErrorFactory.createUnknownError(error);
  return NextResponse.json(
    {
      success: false,
      error: appError,
    },
    { status: 500 } // Internal Server Error
  );
}

/**
 * Create a success response
 * @param data - The data to return
 * @returns NextResponse with success structure
 */
export function createSuccessResponse<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
  });
}

/**
 * Create a not found error response
 * @param resource - The resource type that was not found
 * @param id - Optional ID of the resource
 * @returns NextResponse with 404 error
 */
export function createNotFoundResponse(
  resource: string,
  id?: string | number
): NextResponse<ApiErrorResponse> {
  const error = AppErrorFactory.createNotFoundError(resource, id);
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status: 404 }
  );
}

/**
 * Create a validation error response
 * @param field - The field that failed validation
 * @param message - The validation error message
 * @returns NextResponse with 400 error
 */
export function createValidationErrorResponse(
  field: string,
  message: string
): NextResponse<ApiErrorResponse> {
  const error = AppErrorFactory.createValidationError(field, message);
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status: 400 }
  );
}
