'use client';

import { AppError, ErrorType } from '@/lib/errors/types';
import { AlertCircle, Database, RefreshCw, Network, FileQuestion } from 'lucide-react';

interface ErrorDisplayProps {
  error: AppError;
  onRetry?: () => void | Promise<void>;
  variant?: 'inline' | 'page' | 'modal';
}

/**
 * Display an error with user-friendly messaging and recovery options
 */
export function ErrorDisplay({ error, onRetry, variant = 'inline' }: ErrorDisplayProps) {
  const getIcon = () => {
    const iconClass = 'h-8 w-8 text-red-500';
    switch (error.type) {
      case ErrorType.DATABASE_CONNECTION:
        return <Database className={iconClass} />;
      case ErrorType.NETWORK:
        return <Network className={iconClass} />;
      case ErrorType.NOT_FOUND:
        return <FileQuestion className={iconClass} />;
      default:
        return <AlertCircle className={iconClass} />;
    }
  };

  const handleRecoveryAction = (action: string, target?: string, handler?: () => void | Promise<void>) => {
    switch (action) {
      case 'retry':
        if (onRetry) {
          onRetry();
        }
        break;
      case 'navigate':
        if (target) {
          window.location.href = target;
        }
        break;
      case 'external':
        if (target) {
          window.open(target, '_blank');
        }
        break;
      case 'custom':
        if (handler) {
          handler();
        }
        break;
    }
  };

  if (variant === 'page') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="mx-auto max-w-md rounded-lg bg-white p-8 shadow-lg">
          <div className="flex flex-col items-center text-center">
            {getIcon()}
            <h1 className="mt-4 text-2xl font-bold text-gray-900" data-testid="error-title">
              {error.userMessage}
            </h1>

            {error.technicalDetails && (
              <details className="mt-4 w-full text-left">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  Technical Details
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded bg-gray-100 p-2 text-xs text-gray-700">
                  {error.technicalDetails}
                </pre>
              </details>
            )}

            {error.recoveryOptions && error.recoveryOptions.length > 0 && (
              <div className="mt-6 w-full space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  What you can do:
                </p>
                {error.recoveryOptions.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRecoveryAction(option.action, option.target, option.customHandler)}
                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
                    data-testid={`recovery-option-${idx}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {error.retryable && onRetry && (
              <button
                onClick={onRetry}
                className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                data-testid="retry-button"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            )}

            <p className="mt-4 text-xs text-gray-500">
              Error occurred at {error.timestamp.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Inline variant (for use within components)
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4" data-testid="error-display-inline">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-red-900" data-testid="error-message">
            {error.userMessage}
          </p>

          {error.technicalDetails && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-red-700 hover:text-red-900">
                Technical Details
              </summary>
              <pre className="mt-1 text-xs text-red-800 overflow-auto max-h-32 bg-red-100 p-2 rounded">
                {error.technicalDetails}
              </pre>
            </details>
          )}

          {error.retryable && onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium"
              data-testid="retry-button-inline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
