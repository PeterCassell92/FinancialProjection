import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Currency, DateFormat } from '@prisma/client';
import { AppError, ErrorType } from '@/lib/errors/types';

export interface SettingsState {
  id: string | null;
  initialBankBalance: number | null;
  initialBalanceDate: string | null;
  currency: Currency;
  dateFormat: DateFormat;
  defaultBankAccountId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  loading: boolean;
  error: AppError | null;
}

const initialState: SettingsState = {
  id: null,
  initialBankBalance: null,
  initialBalanceDate: null,
  currency: 'GBP' as Currency,
  dateFormat: 'UK' as DateFormat,
  defaultBankAccountId: null,
  createdAt: null,
  updatedAt: null,
  loading: true,  // Start as loading - fetchSettings is triggered on mount
  error: null,
};

// Async thunks for API calls
export const fetchSettings = createAsyncThunk(
  'settings/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();

      if (!data.success) {
        // Return the structured error from the API
        return rejectWithValue(data.error);
      }

      return data.data;
    } catch (error) {
      // Network or other error
      return rejectWithValue({
        type: ErrorType.NETWORK,
        message: 'Network error',
        userMessage: 'Failed to connect to the server. Please check your connection.',
        retryable: true,
        timestamp: new Date(),
      });
    }
  }
);

export const updateSettings = createAsyncThunk(
  'settings/update',
  async (updates: {
    initialBankBalance?: number;
    initialBalanceDate?: string;
    currency?: Currency;
    dateFormat?: DateFormat;
    defaultBankAccountId?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error);
      }

      return data.data;
    } catch (error) {
      return rejectWithValue({
        type: ErrorType.NETWORK,
        message: 'Network error',
        userMessage: 'Failed to connect to the server. Please check your connection.',
        retryable: true,
        timestamp: new Date(),
      });
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch settings
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.id = action.payload.id;
        state.initialBankBalance = action.payload.initialBankBalance;
        state.initialBalanceDate = action.payload.initialBalanceDate;
        state.currency = action.payload.currency;
        state.dateFormat = action.payload.dateFormat;
        state.defaultBankAccountId = action.payload.defaultBankAccountId;
        state.createdAt = action.payload.createdAt;
        state.updatedAt = action.payload.updatedAt;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as AppError) || {
          type: ErrorType.UNKNOWN,
          message: action.error.message || 'Failed to fetch settings',
          userMessage: 'Failed to fetch settings. Please try again.',
          retryable: true,
          timestamp: new Date(),
        };
      })
      // Update settings
      .addCase(updateSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.id = action.payload.id;
        state.initialBankBalance = action.payload.initialBankBalance;
        state.initialBalanceDate = action.payload.initialBalanceDate;
        state.currency = action.payload.currency;
        state.dateFormat = action.payload.dateFormat;
        state.defaultBankAccountId = action.payload.defaultBankAccountId;
        state.createdAt = action.payload.createdAt;
        state.updatedAt = action.payload.updatedAt;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as AppError) || {
          type: ErrorType.UNKNOWN,
          message: action.error.message || 'Failed to update settings',
          userMessage: 'Failed to update settings. Please try again.',
          retryable: true,
          timestamp: new Date(),
        };
      });
  },
});

export const { clearError } = settingsSlice.actions;

// Selectors
export const selectSettings = (state: { settings: SettingsState }) => state.settings;
export const selectDefaultBankAccountId = (state: { settings: SettingsState }) => state.settings.defaultBankAccountId;
export const selectSettingsLoading = (state: { settings: SettingsState }) => state.settings.loading;
export const selectCurrency = (state: { settings: SettingsState }) => state.settings.currency;
export const selectDateFormat = (state: { settings: SettingsState }) => state.settings.dateFormat;

export default settingsSlice.reducer;
