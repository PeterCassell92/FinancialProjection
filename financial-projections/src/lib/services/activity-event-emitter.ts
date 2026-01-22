import { EventEmitter } from 'events';
import type { ActivityLogOutput } from '@/lib/dal/activity-log';

/**
 * Activity Event Emitter
 *
 * Centralized event emitter for broadcasting activity log updates to SSE clients.
 * This enables real-time updates without polling the database.
 */

class ActivityEventEmitter extends EventEmitter {
  private static instance: ActivityEventEmitter;

  private constructor() {
    super();
    // Increase max listeners for production (each SSE connection is a listener)
    this.setMaxListeners(100);
  }

  public static getInstance(): ActivityEventEmitter {
    if (!ActivityEventEmitter.instance) {
      ActivityEventEmitter.instance = new ActivityEventEmitter();
    }
    return ActivityEventEmitter.instance;
  }

  /**
   * Emit an activity update to all connected SSE clients
   */
  public emitActivityUpdate(activity: ActivityLogOutput): void {
    this.emit('activity-update', activity);
  }

  /**
   * Subscribe to activity updates
   */
  public onActivityUpdate(callback: (activity: ActivityLogOutput) => void): void {
    this.on('activity-update', callback);
  }

  /**
   * Unsubscribe from activity updates
   */
  public offActivityUpdate(callback: (activity: ActivityLogOutput) => void): void {
    this.off('activity-update', callback);
  }
}

export const activityEventEmitter = ActivityEventEmitter.getInstance();
