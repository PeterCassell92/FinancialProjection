import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ActivityType, ActivityStatus } from '@prisma/client';
import { activityEventEmitter } from '@/lib/services/activity-event-emitter';

/**
 * Activity Log DAL (Data Access Layer)
 *
 * Handles all database operations for the ActivityLog model.
 * Emits events for real-time SSE updates.
 */

// =============================================================================
// Types
// =============================================================================

export interface CreateActivityLogInput {
  userId?: string;
  activityName: string;
  activityDisplayName: string;
  activityType: ActivityType;
  status?: ActivityStatus;
  message?: string;
  metadata?: Record<string, any>;
  errorDetails?: string;
  progress?: number;
  totalItems?: number;
  processedItems?: number;
  entityType?: string;
  entityId?: string;
}

export interface UpdateActivityLogInput {
  id: string;
  status?: ActivityStatus;
  message?: string;
  metadata?: Record<string, any>;
  errorDetails?: string;
  progress?: number;
  totalItems?: number;
  processedItems?: number;
  endTime?: Date;
}

export interface GetActivityLogsInput {
  userId?: string;
  activityType?: ActivityType;
  status?: ActivityStatus;
  startTimeFrom?: Date;
  startTimeTo?: Date;
  limit?: number;
  offset?: number;
}

export interface ActivityLogOutput {
  id: string;
  userId: string;
  activityName: string;
  activityDisplayName: string;
  activityType: ActivityType;
  status: ActivityStatus;
  startTime: Date;
  endTime: Date | null;
  message: string | null;
  metadata: Record<string, any> | null;
  errorDetails: string | null;
  progress: number | null;
  totalItems: number | null;
  processedItems: number | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Create Operations
// =============================================================================

/**
 * Create a new activity log entry
 */
export async function createActivityLog(
  input: CreateActivityLogInput
): Promise<ActivityLogOutput> {
  const activityLog = await prisma.activityLog.create({
    data: {
      userId: input.userId,
      activityName: input.activityName,
      activityDisplayName: input.activityDisplayName,
      activityType: input.activityType,
      status: input.status || 'ONGOING',
      message: input.message,
      metadata: input.metadata ? input.metadata as Prisma.InputJsonValue : undefined,
      errorDetails: input.errorDetails,
      progress: input.progress,
      totalItems: input.totalItems,
      processedItems: input.processedItems,
      entityType: input.entityType,
      entityId: input.entityId,
    },
  });

  const output = activityLog as ActivityLogOutput;

  // Emit event for SSE clients
  activityEventEmitter.emitActivityUpdate(output);

  return output;
}

// =============================================================================
// Read Operations
// =============================================================================

/**
 * Get activity logs with optional filtering
 */
export async function getActivityLogs(
  input: GetActivityLogsInput = {}
): Promise<ActivityLogOutput[]> {
  const where: Prisma.ActivityLogWhereInput = {};

  if (input.userId) {
    where.userId = input.userId;
  }

  if (input.activityType) {
    where.activityType = input.activityType;
  }

  if (input.status) {
    where.status = input.status;
  }

  if (input.startTimeFrom || input.startTimeTo) {
    where.startTime = {};
    if (input.startTimeFrom) {
      where.startTime.gte = input.startTimeFrom;
    }
    if (input.startTimeTo) {
      where.startTime.lte = input.startTimeTo;
    }
  }

  const activityLogs = await prisma.activityLog.findMany({
    where,
    orderBy: {
      startTime: 'desc',
    },
    take: input.limit || 100,
    skip: input.offset || 0,
  });

  return activityLogs as ActivityLogOutput[];
}

/**
 * Get a single activity log by ID
 */
export async function getActivityLogById(id: string): Promise<ActivityLogOutput | null> {
  const activityLog = await prisma.activityLog.findUnique({
    where: { id },
  });

  return activityLog as ActivityLogOutput | null;
}

/**
 * Get recent activity logs (last 50 by default)
 */
export async function getRecentActivityLogs(limit: number = 50): Promise<ActivityLogOutput[]> {
  const activityLogs = await prisma.activityLog.findMany({
    orderBy: {
      startTime: 'desc',
    },
    take: limit,
  });

  return activityLogs as ActivityLogOutput[];
}

/**
 * Get ongoing (in-progress) activity logs
 */
export async function getOngoingActivities(userId?: string): Promise<ActivityLogOutput[]> {
  const where: Prisma.ActivityLogWhereInput = {
    status: 'ONGOING',
  };

  if (userId) {
    where.userId = userId;
  }

  const activityLogs = await prisma.activityLog.findMany({
    where,
    orderBy: {
      startTime: 'desc',
    },
  });

  return activityLogs as ActivityLogOutput[];
}

/**
 * Count activity logs matching criteria
 */
export async function countActivityLogs(input: GetActivityLogsInput = {}): Promise<number> {
  const where: Prisma.ActivityLogWhereInput = {};

  if (input.userId) {
    where.userId = input.userId;
  }

  if (input.activityType) {
    where.activityType = input.activityType;
  }

  if (input.status) {
    where.status = input.status;
  }

  if (input.startTimeFrom || input.startTimeTo) {
    where.startTime = {};
    if (input.startTimeFrom) {
      where.startTime.gte = input.startTimeFrom;
    }
    if (input.startTimeTo) {
      where.startTime.lte = input.startTimeTo;
    }
  }

  return await prisma.activityLog.count({ where });
}

// =============================================================================
// Update Operations
// =============================================================================

/**
 * Update an activity log entry (typically to update status, progress, or add error details)
 */
export async function updateActivityLog(
  input: UpdateActivityLogInput
): Promise<ActivityLogOutput> {
  const updateData: Prisma.ActivityLogUpdateInput = {};

  if (input.status !== undefined) {
    updateData.status = input.status;
  }

  if (input.message !== undefined) {
    updateData.message = input.message;
  }

  if (input.metadata !== undefined) {
    updateData.metadata = input.metadata as Prisma.InputJsonValue;
  }

  if (input.errorDetails !== undefined) {
    updateData.errorDetails = input.errorDetails;
  }

  if (input.progress !== undefined) {
    updateData.progress = input.progress;
  }

  if (input.totalItems !== undefined) {
    updateData.totalItems = input.totalItems;
  }

  if (input.processedItems !== undefined) {
    updateData.processedItems = input.processedItems;
  }

  if (input.endTime !== undefined) {
    updateData.endTime = input.endTime;
  }

  const activityLog = await prisma.activityLog.update({
    where: { id: input.id },
    data: updateData,
  });

  const output = activityLog as ActivityLogOutput;

  // Emit event for SSE clients
  activityEventEmitter.emitActivityUpdate(output);

  return output;
}

/**
 * Mark an activity as completed with SUCCESS status
 */
export async function completeActivityLog(
  id: string,
  message?: string,
  metadata?: Record<string, any>
): Promise<ActivityLogOutput> {
  return updateActivityLog({
    id,
    status: 'SUCCESS',
    endTime: new Date(),
    message,
    metadata,
    progress: 100,
  });
}

/**
 * Mark an activity as failed with FAILED status
 */
export async function failActivityLog(
  id: string,
  errorMessage: string,
  errorDetails?: string,
  metadata?: Record<string, any>
): Promise<ActivityLogOutput> {
  return updateActivityLog({
    id,
    status: 'FAILED',
    endTime: new Date(),
    message: errorMessage,
    errorDetails,
    metadata,
  });
}

/**
 * Update progress for a long-running activity
 */
export async function updateActivityProgress(
  id: string,
  processedItems: number,
  totalItems?: number,
  message?: string
): Promise<ActivityLogOutput> {
  const progress = totalItems ? Math.round((processedItems / totalItems) * 100) : undefined;

  return updateActivityLog({
    id,
    processedItems,
    totalItems,
    progress,
    message,
  });
}

// =============================================================================
// Delete Operations
// =============================================================================

/**
 * Delete activity logs older than a specific date
 * Useful for implementing retention policies (e.g., delete logs older than 90 days)
 */
export async function deleteActivityLogsOlderThan(date: Date): Promise<number> {
  const result = await prisma.activityLog.deleteMany({
    where: {
      startTime: {
        lt: date,
      },
    },
  });

  return result.count;
}

/**
 * Delete a specific activity log by ID
 */
export async function deleteActivityLog(id: string): Promise<void> {
  await prisma.activityLog.delete({
    where: { id },
  });
}
