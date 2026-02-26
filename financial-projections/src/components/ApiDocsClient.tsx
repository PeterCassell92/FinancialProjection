'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactSwagger from '@/components/ReactSwagger';

type GenerationStatus = {
  state: 'idle' | 'generating' | 'complete' | 'failed';
  currentVersion: number | null;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
};

type PageState = 'loading' | 'generating' | 'ready' | 'failed';

const POLL_INTERVAL_MS = 3000;

export default function ApiDocsClient() {
  const [pageState, setPageState] = useState<PageState>('loading');
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState<GenerationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchSpec = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/openapi');
      if (res.status === 200) {
        const data = await res.json();
        setSpec(data);
        setPageState('ready');
        return true;
      }
      if (res.status === 202) {
        // Generation was auto-triggered or is in progress
        setPageState('generating');
        return false;
      }
      throw new Error(`Unexpected status ${res.status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch spec');
      setPageState('failed');
      return false;
    }
  }, []);

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/openapi/status');
      const data: GenerationStatus = await res.json();
      setStatus(data);

      if (data.state === 'complete') {
        stopPolling();
        // Fetch the newly generated spec
        await fetchSpec();
      } else if (data.state === 'failed') {
        stopPolling();
        setError(data.error || 'Generation failed');
        setPageState('failed');
      }
    } catch {
      // Polling error — keep trying
    }
  }, [stopPolling, fetchSpec]);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(pollStatus, POLL_INTERVAL_MS);
    // Also poll immediately
    pollStatus();
  }, [stopPolling, pollStatus]);

  // Initial load
  useEffect(() => {
    async function init() {
      const hasSpec = await fetchSpec();
      if (!hasSpec) {
        // Either auto-generating or failed — start polling if generating
        startPolling();
      }
    }
    init();

    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegenerate = async () => {
    setPageState('generating');
    setError(null);

    try {
      const res = await fetch('/api/openapi/generate', { method: 'POST' });
      if (res.status === 409) {
        // Already running — just start polling
        startPolling();
        return;
      }
      if (res.status === 202) {
        startPolling();
        return;
      }
      throw new Error(`Unexpected status ${res.status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start generation');
      setPageState('failed');
    }
  };

  return (
    <div>
      {/* Header bar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
          {status?.currentVersion && pageState === 'ready' && (
            <p className="mt-1 text-sm text-gray-500">
              Version {status.currentVersion}
              {status.completedAt && (
                <> &middot; Generated {new Date(status.completedAt).toLocaleString()}</>
              )}
            </p>
          )}
        </div>
        <Button
          onClick={handleRegenerate}
          disabled={pageState === 'generating'}
          variant="outline"
          data-testid="regenerate-openapi-button"
        >
          {pageState === 'generating' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {pageState === 'generating' ? 'Generating...' : 'Regenerate Spec'}
        </Button>
      </div>

      {/* Content area */}
      {pageState === 'loading' && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-4 text-lg font-medium text-gray-700">Loading API docs&hellip;</p>
        </div>
      )}

      {pageState === 'generating' && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className="mt-4 text-lg font-medium text-gray-700">
            Generating OpenAPI spec&hellip;
          </p>
          <p className="mt-1 text-sm text-gray-500">
            This scans all API routes and may take a couple of minutes
          </p>
          {status?.state === 'generating' && status.startedAt && (
            <ElapsedTimer since={status.startedAt} />
          )}
        </div>
      )}

      {pageState === 'failed' && (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="mt-4 text-lg font-medium text-red-600">Failed to load API documentation</p>
          {error && <p className="mt-1 text-sm text-gray-600">{error}</p>}
          <Button onClick={handleRegenerate} className="mt-4" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      )}

      {pageState === 'ready' && spec && <ReactSwagger spec={spec} />}
    </div>
  );
}

/**
 * Shows elapsed time since generation started, updating every second.
 */
function ElapsedTimer({ since }: { since: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const start = new Date(since).getTime();

    function update() {
      const seconds = Math.floor((Date.now() - start) / 1000);
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      setElapsed(m > 0 ? `${m}m ${s}s` : `${s}s`);
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [since]);

  return (
    <p className="mt-2 text-xs text-gray-400">Elapsed: {elapsed}</p>
  );
}
