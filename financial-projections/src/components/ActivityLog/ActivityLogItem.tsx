'use client';

import type { ActivityLog } from '@/lib/redux/activityLogSlice';
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';

interface ActivityLogItemProps {
  activity: ActivityLog;
}

/**
 * ActivityLogItem - Displays a single activity log entry
 *
 * Features:
 * - Status-based icon (ongoing, success, failed)
 * - Progress bar for ongoing activities
 * - Timestamp display
 * - Error details for failed activities
 * - Metadata display (collapsible)
 */
export default function ActivityLogItem({ activity }: ActivityLogItemProps) {
  // Format timestamp
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate duration if completed
  const getDuration = () => {
    if (!activity.endTime) return null;

    const start = new Date(activity.startTime);
    const end = new Date(activity.endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 1) return '<1s';
    if (diffSecs < 60) return `${diffSecs}s`;

    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m`;

    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m`;
  };

  // Status icon and color
  const getStatusDisplay = () => {
    switch (activity.status) {
      case 'ONGOING':
        return {
          icon: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        };
      case 'SUCCESS':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        };
      case 'FAILED':
        return {
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        };
      case 'CANCELLED':
        return {
          icon: <XCircle className="h-5 w-5 text-gray-500" />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        };
      default:
        return {
          icon: <Clock className="h-5 w-5 text-gray-500" />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const duration = getDuration();

  return (
    <div
      className={`p-3 border rounded-lg ${statusDisplay.bgColor} ${statusDisplay.borderColor} transition-colors`}
      data-testid={`activity-log-item__${activity.id}`}
    >
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className="flex-shrink-0 mt-0.5">{statusDisplay.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium text-gray-900">
              {activity.activityDisplayName}
            </h4>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatTime(activity.startTime)}
            </span>
          </div>

          {/* Message */}
          {activity.message && (
            <p className="text-sm text-gray-700 mt-1">{activity.message}</p>
          )}

          {/* Progress Bar (for ongoing activities) */}
          {activity.status === 'ONGOING' && activity.progress !== null && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{activity.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${activity.progress}%` }}
                />
              </div>
              {activity.processedItems !== null && activity.totalItems !== null && (
                <p className="text-xs text-gray-500 mt-1">
                  {activity.processedItems} / {activity.totalItems} items
                </p>
              )}
            </div>
          )}

          {/* Duration (for completed activities) */}
          {duration && (
            <p className="text-xs text-gray-500 mt-1">
              Duration: {duration}
            </p>
          )}

          {/* Error Details (for failed activities) */}
          {activity.status === 'FAILED' && activity.errorDetails && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 cursor-pointer hover:text-red-700">
                Show error details
              </summary>
              <pre className="text-xs text-red-800 bg-red-100 p-2 rounded mt-1 overflow-x-auto">
                {activity.errorDetails}
              </pre>
            </details>
          )}

          {/* Metadata (for all activities with metadata) */}
          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-700">
                Show details
              </summary>
              <pre className="text-xs text-gray-700 bg-white p-2 rounded mt-1 overflow-x-auto border border-gray-200">
                {JSON.stringify(activity.metadata, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
