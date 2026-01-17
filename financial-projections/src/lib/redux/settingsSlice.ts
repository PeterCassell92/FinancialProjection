import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Currency, DateFormat } from '@prisma/client';

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
  error: string | null;
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
  async () => {
    const response = await fetch('/api/settings');
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch settings');
    }

    return data.data;
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
  }) => {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update settings');
    }

    return data.data;
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
        state.error = action.error.message || 'Failed to fetch settings';
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
        state.error = action.error.message || 'Failed to update settings';
      });
  },
});

export const { clearError } = settingsSlice.actions;
export default settingsSlice.reducer;
