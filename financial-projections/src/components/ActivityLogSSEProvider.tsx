'use client';

import { useActivityLogSSE } from '@/hooks/useActivityLogSSE';

/**
 * ActivityLogSSEProvider
 *
 * Establishes SSE connection for activity log real-time updates
 * Should be mounted once at the app root level
 */
export default function ActivityLogSSEProvider() {
  useActivityLogSSE();
  return null; // This component doesn't render anything
}
