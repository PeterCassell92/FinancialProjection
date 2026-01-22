import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/lib/redux/hooks';
import {
  upsertActivity,
  setStreaming,
  type ActivityLog,
} from '@/lib/redux/activityLogSlice';

/**
 * Hook to establish SSE connection for activity log updates
 * Should be called once at the app root level
 */
export function useActivityLogSSE() {
  const dispatch = useAppDispatch();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const connectSSE = () => {
      // Clean up any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Clear any pending reconnect
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      try {
        console.log('[ActivityLog SSE] Connecting...');
        const eventSource = new EventSource('/api/activity-log/stream?userId=HumanUser');
        eventSourceRef.current = eventSource;

        eventSource.addEventListener('connected', (event) => {
          console.log('✅ [ActivityLog SSE] Connected', JSON.parse(event.data));
          dispatch(setStreaming(true));
        });

        eventSource.addEventListener('activity-update', (event) => {
          console.log('📥 [ActivityLog SSE] Activity update:', event.data);
          const activity: ActivityLog = JSON.parse(event.data);
          dispatch(upsertActivity(activity));
        });

        eventSource.addEventListener('error', (event) => {
          console.error('❌ [ActivityLog SSE] Error:', event);
          console.log('[ActivityLog SSE] ReadyState:', eventSource.readyState);
          dispatch(setStreaming(false));

          // EventSource automatically reconnects, but if it closes we need to manually reconnect
          if (eventSource.readyState === EventSource.CLOSED) {
            console.log('[ActivityLog SSE] Connection closed, will reconnect in 5s');
            eventSource.close();
            reconnectTimeoutRef.current = setTimeout(connectSSE, 5000);
          }
        });

        eventSource.onopen = () => {
          console.log('🔌 [ActivityLog SSE] Connection opened');
        };

        eventSource.onerror = (event) => {
          console.error('🔥 [ActivityLog SSE] OnError event:', event);
        };
      } catch (error) {
        console.error('[ActivityLog SSE] Failed to connect:', error);
        dispatch(setStreaming(false));

        // Retry connection after 5 seconds
        reconnectTimeoutRef.current = setTimeout(connectSSE, 5000);
      }
    };

    // Establish initial connection
    connectSSE();

    // Cleanup on unmount
    return () => {
      console.log('[ActivityLog SSE] Cleaning up connection');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      dispatch(setStreaming(false));
    };
  }, [dispatch]);
}
