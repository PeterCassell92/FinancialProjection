import { NextRequest } from 'next/server';
import { getRecentActivityLogs, type ActivityLogOutput } from '@/lib/dal/activity-log';
import { activityEventEmitter } from '@/lib/services/activity-event-emitter';

/**
 * GET /api/activity-log/stream
 *
 * Server-Sent Events (SSE) endpoint for real-time activity log updates
 *
 * Query parameters:
 * - userId: Filter by user ID (optional, defaults to "HumanUser")
 * - includeRecent: If 'true', sends recent activities on connection (default: true)
 *
 * The client receives activity log updates in real-time as they occur.
 * No polling - uses event-driven architecture.
 *
 * Events are sent in the following format:
 *
 * event: activity-update
 * data: {"id": "...", "activityType": "...", "status": "...", ...}
 *
 * Client usage example:
 * const eventSource = new EventSource('/api/activity-log/stream?userId=HumanUser');
 * eventSource.addEventListener('activity-update', (e) => {
 *   const activity = JSON.parse(e.data);
 *   console.log('Activity update:', activity);
 * });
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId') || 'HumanUser';
  const includeRecent = searchParams.get('includeRecent') !== 'false'; // default true

  // Create a TransformStream for SSE
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Track if the connection is still alive
  let isAlive = true;

  // Helper function to send SSE message
  const sendEvent = async (event: string, data: any) => {
    if (!isAlive) return;

    try {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(message));
    } catch (error) {
      console.error('Error sending SSE event:', error);
      isAlive = false;
    }
  };

  // Helper function to send heartbeat
  const sendHeartbeat = async () => {
    if (!isAlive) return;

    try {
      const message = `: heartbeat\n\n`;
      await writer.write(encoder.encode(message));
    } catch (error) {
      console.error('Error sending heartbeat:', error);
      isAlive = false;
    }
  };

  // Event listener for real-time updates (no polling!)
  const activityUpdateHandler = async (activity: ActivityLogOutput) => {
    if (!isAlive) return;

    // Filter by userId if needed (for future multi-user support)
    if (userId && activity.userId !== userId) return;

    await sendEvent('activity-update', activity);
  };

  // Subscribe to activity updates
  activityEventEmitter.onActivityUpdate(activityUpdateHandler);

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeatInterval = setInterval(sendHeartbeat, 30000);

  // Cleanup on connection close
  request.signal.addEventListener('abort', () => {
    isAlive = false;
    clearInterval(heartbeatInterval);
    activityEventEmitter.offActivityUpdate(activityUpdateHandler);
    writer.close();
  });

  // Send initial data AFTER returning the response (async)
  // This allows the connection to be established first
  (async () => {
    // Send initial connection message
    await sendEvent('connected', { userId, timestamp: new Date().toISOString() });

    // Send recent activities on initial connection (if requested)
    if (includeRecent) {
      try {
        const recentActivities = await getRecentActivityLogs(5);
        for (const activity of recentActivities) {
          await sendEvent('activity-update', activity);
        }
      } catch (error) {
        console.error('Error fetching recent activities:', error);
        await sendEvent('error', {
          message: 'Error fetching recent activities',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  })();

  // Return SSE response immediately
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
