'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  fetchRecentActivities,
  markAllAsRead,
  selectRecentActivities,
  selectIsLoading,
  selectError,
  selectUnreadCount,
  selectIsStreaming,
} from '@/lib/redux/activityLogSlice';
import ActivityLogItem from './ActivityLogItem';
import { X, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActivityLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ActivityLogPanel - Dropdown panel for displaying activity logs
 *
 * Features:
 * - Displays recent activity logs in a scrollable panel
 * - Real-time updates via SSE connection
 * - Auto-reconnect on connection loss
 * - Unread count indicator
 * - Manual refresh capability
 * - Filter by status (all, ongoing, success, failed)
 */
export default function ActivityLogPanel({ isOpen, onClose }: ActivityLogPanelProps) {
  const dispatch = useAppDispatch();
  const activities = useAppSelector(selectRecentActivities);
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectError);
  const unreadCount = useAppSelector(selectUnreadCount);
  const isStreaming = useAppSelector(selectIsStreaming);

  const [filter, setFilter] = useState<'all' | 'ongoing' | 'success' | 'failed'>('all');
  const panelRef = useRef<HTMLDivElement>(null);

  // Filter activities based on selected filter
  const filteredActivities = activities.filter((activity) => {
    if (filter === 'all') return true;
    if (filter === 'ongoing') return activity.status === 'ONGOING';
    if (filter === 'success') return activity.status === 'SUCCESS';
    if (filter === 'failed') return activity.status === 'FAILED';
    return true;
  });

  // Fetch initial activities when panel opens (if not already loaded)
  useEffect(() => {
    if (!isOpen) return;

    // Fetch recent activities if we don't have any yet
    if (activities.length === 0) {
      dispatch(fetchRecentActivities(50));
    }

    // Mark all as read when panel opens
    if (unreadCount > 0) {
      setTimeout(() => dispatch(markAllAsRead()), 1000);
    }
  }, [isOpen, dispatch, unreadCount, activities.length]);

  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Handle manual refresh
  const handleRefresh = () => {
    dispatch(fetchRecentActivities(50));
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
      data-testid="activity-log-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
          {isStreaming ? (
            <span title="Connected">
              <Wifi className="h-4 w-4 text-green-500" />
            </span>
          ) : (
            <span title="Disconnected">
              <WifiOff className="h-4 w-4 text-red-500" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            data-testid="activity-log-refresh-button"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="activity-log-close-button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'all', label: 'All' },
          { key: 'ongoing', label: 'Ongoing' },
          { key: 'success', label: 'Success' },
          { key: 'failed', label: 'Failed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            data-testid={`activity-log-filter__${tab.key}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading && activities.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Loading activities...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No {filter !== 'all' ? filter : ''} activities found</p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <ActivityLogItem key={activity.id} activity={activity} />
          ))
        )}
      </div>

      {/* Footer */}
      {filteredActivities.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600 text-center">
          Showing {filteredActivities.length} {filter !== 'all' ? filter : ''} activities
        </div>
      )}
    </div>
  );
}
