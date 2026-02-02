'use client';

import { useEffect, useState } from 'react';
import { Database, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface DiagnosticsState {
  dockerRunning?: boolean;
  portAccessible?: boolean;
  checking: boolean;
}

interface DatabaseConnectionErrorProps {
  onRetry?: () => void | Promise<void>;
  technicalDetails?: string;
}

/**
 * Specialized error page for database connection failures with diagnostics
 */
export function DatabaseConnectionError({ onRetry, technicalDetails }: DatabaseConnectionErrorProps) {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsState>({ checking: true });

  useEffect(() => {
    // Run diagnostics on mount
    checkDiagnostics();
  }, []);

  const checkDiagnostics = async () => {
    setDiagnostics({ checking: true });

    try {
      const response = await fetch('/api/health');
      const data = await response.json();

      setDiagnostics({
        dockerRunning: data.database?.isConnected ?? false,
        portAccessible: true,
        checking: false,
      });
    } catch (error) {
      // If we can't even reach the health endpoint, we have bigger problems
      setDiagnostics({
        dockerRunning: false,
        portAccessible: false,
        checking: false,
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4" data-testid="database-connection-error">
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

        {technicalDetails && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              Technical Error Details
            </summary>
            <pre className="mt-2 max-h-32 overflow-auto rounded bg-gray-100 p-3 text-xs text-gray-800">
              {technicalDetails}
            </pre>
          </details>
        )}

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
              <code className="rounded bg-blue-100 px-2 py-0.5 font-mono text-xs">
                docker ps
              </code>
            </li>
            <li>
              Start the database container:{' '}
              <code className="rounded bg-blue-100 px-2 py-0.5 font-mono text-xs">
                docker start financial-projections-db
              </code>
            </li>
            <li>
              Check container logs for errors:{' '}
              <code className="rounded bg-blue-100 px-2 py-0.5 font-mono text-xs">
                docker logs financial-projections-db
              </code>
            </li>
            <li>
              If the container doesn&apos;t exist, see the{' '}
              <a
                href="https://github.com/yourusername/financial-projections#database-setup-docker"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline"
              >
                README.md setup instructions
              </a>
            </li>
          </ol>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              checkDiagnostics();
            }}
            className="flex items-center gap-2 rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 transition-colors"
            data-testid="run-diagnostics-button"
          >
            <RefreshCw className="h-4 w-4" />
            Run Diagnostics Again
          </button>
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
              data-testid="retry-connection-button"
            >
              Retry Connection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface DiagnosticItemProps {
  label: string;
  status?: boolean;
  checking: boolean;
}

function DiagnosticItem({ label, status, checking }: DiagnosticItemProps) {
  return (
    <div className="flex items-center gap-2" data-testid={`diagnostic-${label.toLowerCase().replace(/\s+/g, '-')}`}>
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
