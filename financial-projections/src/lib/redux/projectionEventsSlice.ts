import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface ProjectionEvent {
  id: string;
  name: string;
  description: string | null;
  value: number;
  type: 'EXPENSE' | 'INCOMING';
  certainty: 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'CERTAIN';
  payTo: string | null;
  paidBy: string | null;
  date: string;
  decisionPathId: string | null;
  bankAccountId: string;
  recurringRuleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectionEventsState {
  // Events indexed by month (YYYY-MM)
  eventsByMonth: Record<string, ProjectionEvent[]>;

  // Currently active month
  activeMonth: string | null;

  // UI state
  loading: boolean;
  error: string | null;
}

const initialState: ProjectionEventsState = {
  eventsByMonth: {},
  activeMonth: null,
  loading: false,
  error: null,
};

/**
 * Fetch projection events for a specific month
 */
export const fetchProjectionEventsForMonth = createAsyncThunk(
  'projectionEvents/fetchForMonth',
  async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
    const response = await fetch(
      `/api/projection-events?startDate=${startDate}&endDate=${endDate}`
    );
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch projection events');
    }

    return { monthKey: startDate.substring(0, 7), events: data.data };
  }
);

const projectionEventsSlice = createSlice({
  name: 'projectionEvents',
  initialState,
  reducers: {
    /**
     * Set the active month
     */
    setActiveMonth: (state, action: PayloadAction<string>) => {
      state.activeMonth = action.payload;
    },

    /**
     * Clear events for a specific month (useful for refreshing)
     */
    clearMonthEvents: (state, action: PayloadAction<string>) => {
      delete state.eventsByMonth[action.payload];
    },

    /**
     * Clear error
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch events for month
      .addCase(fetchProjectionEventsForMonth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectionEventsForMonth.fulfilled, (state, action) => {
        state.loading = false;
        state.eventsByMonth[action.payload.monthKey] = action.payload.events;
        state.activeMonth = action.payload.monthKey;
      })
      .addCase(fetchProjectionEventsForMonth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch projection events';
      });
  },
});

export const {
  setActiveMonth,
  clearMonthEvents,
  clearError,
} = projectionEventsSlice.actions;

export default projectionEventsSlice.reducer;
