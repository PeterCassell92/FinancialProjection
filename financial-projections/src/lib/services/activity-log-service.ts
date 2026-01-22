import type { ActivityType } from '@prisma/client';
import {
  createActivityLog,
  updateActivityLog,
  completeActivityLog,
  failActivityLog,
  updateActivityProgress,
  getActivityLogs,
  getRecentActivityLogs,
  getOngoingActivities,
  type CreateActivityLogInput,
  type ActivityLogOutput,
} from '@/lib/dal/activity-log';

/**
 * Activity Log Service
 *
 * High-level service for managing activity logs.
 * Provides simplified methods for common activity logging patterns.
 */

// =============================================================================
// Activity Name Mapping
// =============================================================================

/**
 * Maps ActivityType enums to kebab-case activity names and display names
 */
const ACTIVITY_TYPE_CONFIG: Record<
  ActivityType,
  { name: string; displayName: string }
> = {
  CATEGORIZATION_RULE_CREATED: {
    name: 'categorization-rule-created',
    displayName: 'Categorization Rule Created',
  },
  CATEGORIZATION_RULE_UPDATED: {
    name: 'categorization-rule-updated',
    displayName: 'Categorization Rule Updated',
  },
  CATEGORIZATION_RULE_DELETED: {
    name: 'categorization-rule-deleted',
    displayName: 'Categorization Rule Deleted',
  },
  CATEGORIZATION_RULE_APPLIED: {
    name: 'categorization-rule-applied',
    displayName: 'Categorization Rule Applied',
  },
  CATEGORIZATION_RULES_APPLIED_ALL: {
    name: 'categorization-rules-applied-all',
    displayName: 'All Categorization Rules Applied',
  },
  SPENDING_TYPE_CREATED: {
    name: 'spending-type-created',
    displayName: 'Spending Type Created',
  },
  SPENDING_TYPE_UPDATED: {
    name: 'spending-type-updated',
    displayName: 'Spending Type Updated',
  },
  SPENDING_TYPE_DELETED: {
    name: 'spending-type-deleted',
    displayName: 'Spending Type Deleted',
  },
  SPENDING_TYPES_REMOVED: {
    name: 'spending-types-removed',
    displayName: 'Spending Types Removed',
  },
  TRANSACTION_CREATED: {
    name: 'transaction-created',
    displayName: 'Transaction Created',
  },
  TRANSACTION_UPDATED: {
    name: 'transaction-updated',
    displayName: 'Transaction Updated',
  },
  TRANSACTION_DELETED: {
    name: 'transaction-deleted',
    displayName: 'Transaction Deleted',
  },
  TRANSACTIONS_BULK_DELETED: {
    name: 'transactions-bulk-deleted',
    displayName: 'Transactions Bulk Deleted',
  },
  TRANSACTIONS_MASS_UPDATED: {
    name: 'transactions-mass-updated',
    displayName: 'Transactions Mass Updated',
  },
  CSV_UPLOAD_STARTED: {
    name: 'csv-upload-started',
    displayName: 'CSV Upload Started',
  },
  CSV_UPLOAD_COMPLETED: {
    name: 'csv-upload-completed',
    displayName: 'CSV Upload Completed',
  },
  CSV_UPLOAD_FAILED: {
    name: 'csv-upload-failed',
    displayName: 'CSV Upload Failed',
  },
  BANK_ACCOUNT_CREATED: {
    name: 'bank-account-created',
    displayName: 'Bank Account Created',
  },
  BANK_ACCOUNT_UPDATED: {
    name: 'bank-account-updated',
    displayName: 'Bank Account Updated',
  },
  BANK_ACCOUNT_DELETED: {
    name: 'bank-account-deleted',
    displayName: 'Bank Account Deleted',
  },
};

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Start tracking an activity
 * Creates an activity log entry with ONGOING status
 *
 * @param activityType - The type of activity being performed
 * @param options - Additional options for the activity log
 * @returns The created activity log entry
 *
 * @example
 * const activity = await startActivity('CATEGORIZATION_RULE_APPLIED', {
 *   entityType: 'CategorizationRule',
 *   entityId: ruleId,
 *   metadata: { ruleDescription: 'Amazon' },
 * });
 */
export async function startActivity(
  activityType: ActivityType,
  options: {
    userId?: string;
    message?: string;
    metadata?: Record<string, any>;
    entityType?: string;
    entityId?: string;
    totalItems?: number;
  } = {}
): Promise<ActivityLogOutput> {
  const config = ACTIVITY_TYPE_CONFIG[activityType];

  const input: CreateActivityLogInput = {
    userId: options.userId,
    activityName: config.name,
    activityDisplayName: config.displayName,
    activityType,
    status: 'ONGOING',
    message: options.message,
    metadata: options.metadata,
    entityType: options.entityType,
    entityId: options.entityId,
    totalItems: options.totalItems,
    processedItems: 0,
    progress: 0,
  };

  return await createActivityLog(input);
}

/**
 * Complete an activity successfully
 *
 * @param activityId - The ID of the activity log to complete
 * @param message - Optional success message
 * @param metadata - Optional additional metadata to store
 * @returns The updated activity log entry
 *
 * @example
 * await completeActivity(activity.id, 'Rule applied to 15 transactions', {
 *   transactionsAffected: 15,
 * });
 */
export async function completeActivity(
  activityId: string,
  message?: string,
  metadata?: Record<string, any>
): Promise<ActivityLogOutput> {
  return await completeActivityLog(activityId, message, metadata);
}

/**
 * Mark an activity as failed
 *
 * @param activityId - The ID of the activity log to fail
 * @param errorMessage - Error message describing what went wrong
 * @param errorDetails - Optional detailed error information (e.g., stack trace)
 * @param metadata - Optional additional metadata to store
 * @returns The updated activity log entry
 *
 * @example
 * await failActivity(activity.id, 'Rule application failed', error.stack, {
 *   attemptedTransactions: 15,
 *   failedAt: 'validation',
 * });
 */
export async function failActivity(
  activityId: string,
  errorMessage: string,
  errorDetails?: string,
  metadata?: Record<string, any>
): Promise<ActivityLogOutput> {
  return await failActivityLog(activityId, errorMessage, errorDetails, metadata);
}

/**
 * Update progress for a long-running activity
 *
 * @param activityId - The ID of the activity log to update
 * @param processedItems - Number of items processed so far
 * @param totalItems - Total number of items to process (optional)
 * @param message - Optional progress message
 * @returns The updated activity log entry
 *
 * @example
 * await updateProgress(activity.id, 10, 50, 'Processing transaction 10 of 50');
 */
export async function updateProgress(
  activityId: string,
  processedItems: number,
  totalItems?: number,
  message?: string
): Promise<ActivityLogOutput> {
  return await updateActivityProgress(activityId, processedItems, totalItems, message);
}

/**
 * Log a quick activity (create, complete immediately)
 * Use this for simple operations that don't require progress tracking
 *
 * @param activityType - The type of activity being performed
 * @param options - Options for the activity log
 * @returns The completed activity log entry
 *
 * @example
 * await logQuickActivity('SPENDING_TYPE_CREATED', {
 *   message: 'Created spending type "Groceries"',
 *   entityType: 'SpendingType',
 *   entityId: newSpendingType.id,
 *   metadata: { name: 'Groceries' },
 * });
 */
export async function logQuickActivity(
  activityType: ActivityType,
  options: {
    userId?: string;
    message?: string;
    metadata?: Record<string, any>;
    entityType?: string;
    entityId?: string;
  } = {}
): Promise<ActivityLogOutput> {
  const config = ACTIVITY_TYPE_CONFIG[activityType];

  const input: CreateActivityLogInput = {
    userId: options.userId,
    activityName: config.name,
    activityDisplayName: config.displayName,
    activityType,
    status: 'SUCCESS',
    message: options.message,
    metadata: options.metadata,
    entityType: options.entityType,
    entityId: options.entityId,
    progress: 100,
  };

  // Create with immediate completion
  const activity = await createActivityLog(input);

  // Update to set endTime
  return await updateActivityLog({
    id: activity.id,
    endTime: new Date(),
  });
}

/**
 * Wrap an async operation with automatic activity logging
 * Creates an activity log, executes the operation, and marks it as SUCCESS or FAILED
 *
 * @param activityType - The type of activity being performed
 * @param operation - The async operation to execute
 * @param options - Options for the activity log
 * @returns The result of the operation
 * @throws Re-throws any error from the operation after logging it
 *
 * @example
 * const result = await withActivityLog(
 *   'CATEGORIZATION_RULE_APPLIED',
 *   async (activityId) => {
 *     // Perform the operation
 *     const result = await applyRule(ruleId);
 *
 *     // Optionally update progress during operation
 *     await updateProgress(activityId, result.processedCount, result.totalCount);
 *
 *     return result;
 *   },
 *   {
 *     entityType: 'CategorizationRule',
 *     entityId: ruleId,
 *     metadata: { ruleDescription: 'Amazon' },
 *   }
 * );
 */
export async function withActivityLog<T>(
  activityType: ActivityType,
  operation: (activityId: string) => Promise<T>,
  options: {
    userId?: string;
    message?: string;
    metadata?: Record<string, any>;
    entityType?: string;
    entityId?: string;
    totalItems?: number;
  } = {}
): Promise<T> {
  // Start the activity
  const activity = await startActivity(activityType, options);

  try {
    // Execute the operation
    const result = await operation(activity.id);

    // Mark as successful
    await completeActivity(
      activity.id,
      options.message || `${ACTIVITY_TYPE_CONFIG[activityType].displayName} completed successfully`,
      options.metadata
    );

    return result;
  } catch (error) {
    // Mark as failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? error.stack : String(error);

    await failActivity(activity.id, errorMessage, errorDetails, options.metadata);

    // Re-throw the error
    throw error;
  }
}

/**
 * Get recent activity logs
 *
 * @param limit - Maximum number of logs to return (default: 50)
 * @returns Array of recent activity logs
 */
export async function getRecentActivities(limit: number = 50): Promise<ActivityLogOutput[]> {
  return await getRecentActivityLogs(limit);
}

/**
 * Get ongoing activities
 *
 * @param userId - Optional user ID to filter by
 * @returns Array of ongoing activity logs
 */
export async function getOngoingActivitiesForUser(userId?: string): Promise<ActivityLogOutput[]> {
  return await getOngoingActivities(userId);
}

/**
 * Get activities by type
 *
 * @param activityType - The type of activity to filter by
 * @param limit - Maximum number of logs to return (default: 100)
 * @returns Array of activity logs matching the type
 */
export async function getActivitiesByType(
  activityType: ActivityType,
  limit: number = 100
): Promise<ActivityLogOutput[]> {
  return await getActivityLogs({ activityType, limit });
}
