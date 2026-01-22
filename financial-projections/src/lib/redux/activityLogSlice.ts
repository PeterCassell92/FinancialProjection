import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './store';
import type { ActivityType, ActivityStatus } from '@prisma/client';

/**
 * Activity Log Redux Slice
 *
 * Manages activity log state and provides actions for fetching and updating activity logs.
 * Supports real-time updates via SSE connection.
 */

// =============================================================================
// Types
// =============================================================================

export interface ActivityLog {
  id: string;
  userId: string;
  activityName: string;
  activityDisplayName: string;
  activityType: ActivityType;
  status: ActivityStatus;
  startTime: string;
  endTime: string | null;
  message: string | null;
  metadata: Record<string, any> | null;
  errorDetails: string | null;
  progress: number | null;
  totalItems: number | null;
  processedItems: number | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogState {
  activities: ActivityLog[];
  recentActivities: ActivityLog[];
  ongoingActivities: ActivityLog[];
  isLoading: boolean;
  error: string | null;
  isStreaming: boolean;
  lastUpdate: string | null;
  unreadCount: number;
}

// =============================================================================
// Async Thunks
// =============================================================================

/**
 * Fetch activity logs with optional filters
 */
export const fetchActivityLogs = createAsyncThunk(
  'activityLog/fetchActivityLogs',
  async (
    params: {
      userId?: string;
      activityType?: ActivityType;
      status?: ActivityStatus;
      startTimeFrom?: string;
      startTimeTo?: string;
      limit?: number;
      offset?: number;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const searchParams = new URLSearchParams();

      if (params.userId) searchParams.set('userId', params.userId);
      if (params.activityType) searchParams.set('activityType', params.activityType);
      if (params.status) searchParams.set('status', params.status);
      if (params.startTimeFrom) searchParams.set('startTimeFrom', params.startTimeFrom);
      if (params.startTimeTo) searchParams.set('startTimeTo', params.startTimeTo);
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.offset) searchParams.set('offset', params.offset.toString());

      const response = await fetch(`/api/activity-log?${searchParams.toString()}`);
      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to fetch activity logs');
      }

      return data.data as ActivityLog[];
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch activity logs'
      );
    }
  }
);

/**
 * Fetch recent activity logs
 */
export const fetchRecentActivities = createAsyncThunk(
  'activityLog/fetchRecentActivities',
  async (limit: number = 50, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/activity-log?recent=true&limit=${limit}`);
      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to fetch recent activities');
      }

      return data.data as ActivityLog[];
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch recent activities'
      );
    }
  }
);

// =============================================================================
// Slice Definition
// =============================================================================

const initialState: ActivityLogState = {
  activities: [],
  recentActivities: [],
  ongoingActivities: [],
  isLoading: false,
  error: null,
  isStreaming: false,
  lastUpdate: null,
  unreadCount: 0,
};

const activityLogSlice = createSlice({
  name: 'activityLog',
  initialState,
  reducers: {
    /**
     * Add or update a single activity (typically from SSE stream)
     */
    upsertActivity: (state, action: PayloadAction<ActivityLog>) => {
      const activity = action.payload;
      const existingIndex = state.recentActivities.findIndex((a) => a.id === activity.id);

      if (existingIndex >= 0) {
        // Update existing activity
        state.recentActivities[existingIndex] = activity;
      } else {
        // Add new activity to the beginning
        state.recentActivities.unshift(activity);

        // Increment unread count
        state.unreadCount += 1;

        // Limit to 100 recent activities in memory
        if (state.recentActivities.length > 100) {
          state.recentActivities.pop();
        }
      }

      // Update ongoing activities
      if (activity.status === 'ONGOING') {
        const ongoingIndex = state.ongoingActivities.findIndex((a) => a.id === activity.id);
        if (ongoingIndex >= 0) {
          state.ongoingActivities[ongoingIndex] = activity;
        } else {
          state.ongoingActivities.push(activity);
        }
      } else {
        // Remove from ongoing if status changed to completed/failed
        state.ongoingActivities = state.ongoingActivities.filter((a) => a.id !== activity.id);
      }

      state.lastUpdate = new Date().toISOString();
    },

    /**
     * Mark all activities as read (clear unread count)
     */
    markAllAsRead: (state) => {
      state.unreadCount = 0;
    },

    /**
     * Clear error state
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Set streaming status
     */
    setStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
    },

    /**
     * Clear all activities
     */
    clearActivities: (state) => {
      state.activities = [];
      state.recentActivities = [];
      state.ongoingActivities = [];
      state.unreadCount = 0;
    },

    /**
     * Remove old completed activities (retention policy)
     */
    removeOldActivities: (state, action: PayloadAction<string>) => {
      const cutoffDate = action.payload;
      state.recentActivities = state.recentActivities.filter(
        (activity) =>
          activity.status === 'ONGOING' || activity.startTime >= cutoffDate
      );
    },
  },
  extraReducers: (builder) => {
    // fetchActivityLogs
    builder.addCase(fetchActivityLogs.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchActivityLogs.fulfilled, (state, action) => {
      state.isLoading = false;
      state.activities = action.payload;
      state.lastUpdate = new Date().toISOString();
    });
    builder.addCase(fetchActivityLogs.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // fetchRecentActivities
    builder.addCase(fetchRecentActivities.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchRecentActivities.fulfilled, (state, action) => {
      state.isLoading = false;
      state.recentActivities = action.payload;

      // Update ongoing activities
      state.ongoingActivities = action.payload.filter(
        (activity) => activity.status === 'ONGOING'
      );

      state.lastUpdate = new Date().toISOString();
    });
    builder.addCase(fetchRecentActivities.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

// =============================================================================
// Actions
// =============================================================================

export const {
  upsertActivity,
  markAllAsRead,
  clearError,
  setStreaming,
  clearActivities,
  removeOldActivities,
} = activityLogSlice.actions;

// =============================================================================
// Selectors
// =============================================================================

export const selectActivities = (state: RootState) => state.activityLog.activities;
export const selectRecentActivities = (state: RootState) => state.activityLog.recentActivities;
export const selectOngoingActivities = (state: RootState) => state.activityLog.ongoingActivities;
export const selectIsLoading = (state: RootState) => state.activityLog.isLoading;
export const selectError = (state: RootState) => state.activityLog.error;
export const selectIsStreaming = (state: RootState) => state.activityLog.isStreaming;
export const selectLastUpdate = (state: RootState) => state.activityLog.lastUpdate;
export const selectUnreadCount = (state: RootState) => state.activityLog.unreadCount;

// Derived selectors
export const selectHasOngoingActivities = (state: RootState) =>
  state.activityLog.ongoingActivities.length > 0;

export const selectActivityById = (activityId: string) => (state: RootState) =>
  state.activityLog.recentActivities.find((a) => a.id === activityId) ||
  state.activityLog.activities.find((a) => a.id === activityId);

export const selectActivitiesByType = (activityType: ActivityType) => (state: RootState) =>
  state.activityLog.recentActivities.filter((a) => a.activityType === activityType);

export const selectActivitiesByStatus = (status: ActivityStatus) => (state: RootState) =>
  state.activityLog.recentActivities.filter((a) => a.status === status);

// =============================================================================
// Reducer Export
// =============================================================================

export default activityLogSlice.reducer;
