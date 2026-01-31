# Error Handling Implementation Plan

## Current Problem

When the database is unavailable or connection fails, users only see a vague "Failed to fetch settings" error message. This provides:
- No actionable information
- No recovery options
- No indication of what went wrong
- Poor user experience

## Goals

1. **Informative**: Tell users what went wrong in plain language
2. **Actionable**: Provide steps to resolve the issue
3. **Graceful**: Degrade gracefully rather than breaking the entire app
4. **Diagnostic**: Help users diagnose connection issues
5. **Consistent**: Handle errors consistently across the app

## Implementation Plan

### Phase 1: Error Classification & Detection

#### 1.1 Create Error Types & Utilities

**File**: `/src/lib/errors/types.ts`

```typescript
export enum ErrorType {
  DATABASE_CONNECTION = 'DATABASE_CONNECTION',
  DATABASE_QUERY = 'DATABASE_QUERY',
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  technicalDetails?: string;
  recoveryOptions?: RecoveryOption[];
  retryable: boolean;
  timestamp: Date;
}

export interface RecoveryOption {
  label: string;
  action: 'retry' | 'navigate' | 'external' | 'custom';
  target?: string;
  customHandler?: () => void;
}
```

**File**: `/src/lib/errors/error-factory.ts`

```typescript
export class AppErrorFactory {
  static createDatabaseConnectionError(technicalDetails?: string): AppError {
    return {
      type: ErrorType.DATABASE_CONNECTION,
      message: 'Cannot connect to database',
      userMessage: 'Unable to connect to the database. Please check that the database is running.',
      technicalDetails,
      retryable: true,
      timestamp: new Date(),
      recoveryOptions: [
        {
          label: 'Retry Connection',
          action: 'retry',
        },
        {
          label: 'Check Database Status',
          action: 'custom',
          customHandler: () => {
            // Could open a modal with diagnostic info
          },
        },
        {
          label: 'View Setup Guide',
          action: 'external',
          target: '/README.md#database-setup',
        },
      ],
    };
  }

  static createDatabaseQueryError(query: string, error: unknown): AppError {
    // Similar pattern for query errors
  }

  // ... other error factory methods
}
```

#### 1.2 Database Connection Health Check

**File**: `/src/lib/dal/health-check.ts`

```typescript
import { prisma } from '@/lib/prisma';

export interface DatabaseHealthStatus {
  isConnected: boolean;
  latencyMs?: number;
  error?: string;
  lastChecked: Date;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  const startTime = Date.now();

  try {
    // Simple query to check connection
    await prisma.$queryRaw`SELECT 1`;

    return {
      isConnected: true,
      latencyMs: Date.now() - startTime,
      lastChecked: new Date(),
    };
  } catch (error) {
    return {
      isConnected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date(),
    };
  }
}

export function isDatabaseConnectionError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('econnrefused') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('can\'t reach database')
    );
  }
  return false;
}
```

### Phase 2: API Route Error Handling

#### 2.1 Create API Error Response Helpers

**File**: `/src/lib/api/error-response.ts`

```typescript
import { NextResponse } from 'next/server';
import { AppError, ErrorType } from '@/lib/errors/types';
import { AppErrorFactory } from '@/lib/errors/error-factory';
import { isDatabaseConnectionError } from '@/lib/dal/health-check';

export function handleApiError(error: unknown): NextResponse {
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

  // Handle other error types...

  // Default unknown error
  return NextResponse.json(
    {
      success: false,
      error: {
        type: ErrorType.UNKNOWN,
        message: 'An unexpected error occurred',
        userMessage: 'Something went wrong. Please try again.',
        retryable: true,
        timestamp: new Date(),
      },
    },
    { status: 500 }
  );
}
```

#### 2.2 Update API Routes to Use Error Handling

**Example - Update `/src/app/api/settings/route.ts`:**

```typescript
import { handleApiError } from '@/lib/api/error-response';

export async function GET() {
  try {
    const settings = await getSettings();

    if (!settings) {
      return NextResponse.json(
        {
          success: false,
          error: AppErrorFactory.createNotFoundError('Settings'),
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Phase 3: Frontend Error Handling

#### 3.1 Create Error Display Components

**File**: `/src/components/ErrorDisplay.tsx`

```typescript
import { AppError } from '@/lib/errors/types';
import { AlertCircle, Database, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  error: AppError;
  onRetry?: () => void;
  variant?: 'inline' | 'page' | 'modal';
}

export function ErrorDisplay({ error, onRetry, variant = 'inline' }: ErrorDisplayProps) {
  const getIcon = () => {
    switch (error.type) {
      case 'DATABASE_CONNECTION':
        return <Database className="h-8 w-8 text-red-500" />;
      default:
        return <AlertCircle className="h-8 w-8 text-red-500" />;
    }
  };

  if (variant === 'page') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="mx-auto max-w-md rounded-lg bg-white p-8 shadow-lg">
          <div className="flex flex-col items-center text-center">
            {getIcon()}
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              {error.userMessage}
            </h1>

            {error.technicalDetails && (
              <details className="mt-4 w-full">
                <summary className="cursor-pointer text-sm text-gray-600">
                  Technical Details
                </summary>
                <pre className="mt-2 rounded bg-gray-100 p-2 text-left text-xs">
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
                    onClick={() => handleRecoveryAction(option)}
                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {error.retryable && onRetry && (
              <button
                onClick={onRetry}
                className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Inline variant (for use within components)
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <div className="flex-1">
          <p className="font-medium text-red-900">{error.userMessage}</p>
          {error.retryable && onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-red-700 hover:text-red-900"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**File**: `/src/components/DatabaseConnectionError.tsx`

Specialized component for database errors with diagnostic info:

```typescript
import { useEffect, useState } from 'react';
import { Database, CheckCircle, XCircle } from 'lucide-react';

export function DatabaseConnectionError({ onRetry }: { onRetry?: () => void }) {
  const [diagnostics, setDiagnostics] = useState<{
    dockerRunning?: boolean;
    portAccessible?: boolean;
    checking: boolean;
  }>({ checking: true });

  useEffect(() => {
    // Run diagnostics
    checkDiagnostics();
  }, []);

  const checkDiagnostics = async () => {
    // Could call a diagnostic API endpoint
    // For now, just check health endpoint
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setDiagnostics({
        dockerRunning: data.database?.isConnected ?? false,
        portAccessible: true,
        checking: false,
      });
    } catch {
      setDiagnostics({
        dockerRunning: false,
        portAccessible: false,
        checking: false,
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-lg">
        <div className="flex items-center gap-3 border-b pb-4">
          <Database className="h-8 w-8 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">
            Database Connection Failed
          </h1>
        </div>

        <p className="mt-4 text-gray-700">
          The application cannot connect to the PostgreSQL database. This is
          required for the app to function.
        </p>

        <div className="mt-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Diagnostics</h2>

          <div className="space-y-2">
            <DiagnosticItem
              label="Database Container Running"
              status={diagnostics.dockerRunning}
              checking={diagnostics.checking}
            />
            <DiagnosticItem
              label="Port 5434 Accessible"
              status={diagnostics.portAccessible}
              checking={diagnostics.checking}
            />
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <h3 className="font-semibold text-blue-900">How to Fix</h3>
          <ol className="mt-2 list-inside list-decimal space-y-2 text-sm text-blue-800">
            <li>
              Check if Docker is running:{' '}
              <code className="rounded bg-blue-100 px-1">docker ps</code>
            </li>
            <li>
              Start the database container:{' '}
              <code className="rounded bg-blue-100 px-1">
                docker start financial-projections-db
              </code>
            </li>
            <li>
              If container doesn't exist, see{' '}
              <a href="#" className="underline">
                README.md setup instructions
              </a>
            </li>
          </ol>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              setDiagnostics({ checking: true });
              checkDiagnostics();
            }}
            className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Run Diagnostics Again
          </button>
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Retry Connection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DiagnosticItem({
  label,
  status,
  checking,
}: {
  label: string;
  status?: boolean;
  checking: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {checking ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      ) : status ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500" />
      )}
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
}
```

#### 3.2 Create Health Check API Endpoint

**File**: `/src/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/dal/health-check';

export async function GET() {
  const dbHealth = await checkDatabaseHealth();

  const overallHealth = dbHealth.isConnected;

  return NextResponse.json(
    {
      status: overallHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: dbHealth,
    },
    { status: overallHealth ? 200 : 503 }
  );
}
```

#### 3.3 Update Dashboard to Handle Errors

**File**: `/src/app/page.tsx` (Dashboard)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { AppError } from '@/lib/errors/types';
import { DatabaseConnectionError } from '@/components/DatabaseConnectionError';
import { ErrorDisplay } from '@/components/ErrorDisplay';

export default function Dashboard() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/settings');
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError({
        type: 'NETWORK',
        message: 'Network error',
        userMessage: 'Failed to connect to the server',
        retryable: true,
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Show database connection error page
  if (error?.type === 'DATABASE_CONNECTION') {
    return <DatabaseConnectionError onRetry={fetchSettings} />;
  }

  // Show other errors inline
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <ErrorDisplay error={error} onRetry={fetchSettings} variant="page" />
      </div>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  // Normal dashboard render
  return (
    <div>
      {/* ... dashboard content ... */}
    </div>
  );
}
```

### Phase 4: Global Error Boundary

#### 4.1 Create React Error Boundary

**File**: `/src/components/ErrorBoundary.tsx`

```typescript
'use client';

import React from 'react';
import { ErrorDisplay } from './ErrorDisplay';
import { ErrorType } from '@/lib/errors/types';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);

    // Could send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorDisplay
          error={{
            type: ErrorType.UNKNOWN,
            message: this.state.error?.message || 'Unknown error',
            userMessage: 'Something went wrong. Please refresh the page.',
            retryable: true,
            timestamp: new Date(),
          }}
          onRetry={() => {
            this.setState({ hasError: false, error: undefined });
            window.location.reload();
          }}
          variant="page"
        />
      );
    }

    return this.props.children;
  }
}
```

#### 4.2 Wrap App in Error Boundary

**File**: `/src/app/layout.tsx`

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### Phase 5: Dedicated Error Route (Optional)

**File**: `/src/app/error/page.tsx`

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { ErrorType } from '@/lib/errors/types';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') as ErrorType || ErrorType.UNKNOWN;
  const message = searchParams.get('message') || 'An error occurred';

  return (
    <ErrorDisplay
      error={{
        type,
        message,
        userMessage: message,
        retryable: true,
        timestamp: new Date(),
      }}
      variant="page"
    />
  );
}
```

### Phase 6: Monitoring & Logging

#### 6.1 Error Logging Service

**File**: `/src/lib/logging/error-logger.ts`

```typescript
import { AppError } from '@/lib/errors/types';

export class ErrorLogger {
  static log(error: AppError, context?: Record<string, unknown>) {
    const logEntry = {
      ...error,
      context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorLogger]', logEntry);
    }

    // In production, could send to external service
    // - Sentry
    // - LogRocket
    // - Custom logging endpoint

    // For now, store in localStorage for debugging
    if (typeof window !== 'undefined') {
      const logs = JSON.parse(localStorage.getItem('error-logs') || '[]');
      logs.push(logEntry);
      // Keep last 50 errors
      if (logs.length > 50) logs.shift();
      localStorage.setItem('error-logs', JSON.stringify(logs));
    }
  }

  static getLogs(): AppError[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('error-logs') || '[]');
  }

  static clearLogs() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('error-logs');
    }
  }
}
```

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create error types and interfaces (`/src/lib/errors/types.ts`)
- [ ] Create error factory (`/src/lib/errors/error-factory.ts`)
- [ ] Create database health check (`/src/lib/dal/health-check.ts`)
- [ ] Create health API endpoint (`/src/app/api/health/route.ts`)

### Phase 2: API Error Handling
- [ ] Create API error response helpers (`/src/lib/api/error-response.ts`)
- [ ] Update `/api/settings/route.ts` to use error handling
- [ ] Update `/api/projection-events/route.ts` to use error handling
- [ ] Update all other API routes to use error handling

### Phase 3: Frontend Components
- [ ] Create `ErrorDisplay` component
- [ ] Create `DatabaseConnectionError` component
- [ ] Update Dashboard (`/src/app/page.tsx`) to handle errors
- [ ] Update other key pages to handle errors

### Phase 4: Global Error Handling
- [ ] Create `ErrorBoundary` component
- [ ] Wrap app in error boundary in `layout.tsx`

### Phase 5: Optional Enhancements
- [ ] Create dedicated `/error` route
- [ ] Add error logging service
- [ ] Add error log viewer (debug page)

### Phase 6: Testing
- [ ] Test database connection failure scenario
- [ ] Test API query errors
- [ ] Test network errors
- [ ] Test error boundary with component crashes
- [ ] Test recovery actions (retry, diagnostics)

## Future Enhancements

1. **Error Analytics Dashboard**
   - Track error frequency
   - Identify patterns
   - Monitor error trends

2. **External Error Tracking**
   - Integrate Sentry or similar
   - Automated error reporting
   - Stack trace capture

3. **Automatic Recovery**
   - Auto-retry with exponential backoff
   - Graceful degradation
   - Offline mode support

4. **User Feedback**
   - Allow users to report errors
   - Include reproduction steps
   - Screenshot capture

5. **Development Tools**
   - Error simulation mode
   - Force specific error types
   - Error log viewer in dev tools

## Success Metrics

- Reduce "vague error messages" to 0%
- Provide actionable recovery steps for 90%+ of errors
- Enable users to self-diagnose database issues without developer help
- Track error resolution time (should decrease significantly)

## Migration Strategy

1. **Phase 1-2**: Can be implemented without breaking changes
2. **Phase 3**: Update components gradually, one at a time
3. **Phase 4**: Add error boundary without disrupting existing functionality
4. **Phase 5-6**: Optional additions, no breaking changes

Can implement incrementally over multiple sessions.
