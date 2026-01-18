import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export interface BankAccount {
  id: string;
  name: string;
  sortCode: string;
  accountNumber: string;
  createdAt: string;
  updatedAt: string;
}

interface BankAccountsState {
  accounts: BankAccount[];
  loading: boolean;
  error: string | null;
}

const initialState: BankAccountsState = {
  accounts: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchBankAccounts = createAsyncThunk(
  'bankAccounts/fetchBankAccounts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/bank-accounts');
      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to fetch bank accounts');
      }

      return data.data as BankAccount[];
    } catch (error) {
      return rejectWithValue('Failed to fetch bank accounts');
    }
  }
);

const bankAccountsSlice = createSlice({
  name: 'bankAccounts',
  initialState,
  reducers: {
    clearBankAccounts: (state) => {
      state.accounts = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBankAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBankAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload;
      })
      .addCase(fetchBankAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearBankAccounts } = bankAccountsSlice.actions;

// Selectors - type will be inferred when imported with RootState
export const selectBankAccounts = (state: { bankAccounts: BankAccountsState }) => state.bankAccounts.accounts;
export const selectBankAccountsLoading = (state: { bankAccounts: BankAccountsState }) => state.bankAccounts.loading;
export const selectBankAccountsError = (state: { bankAccounts: BankAccountsState }) => state.bankAccounts.error;

export default bankAccountsSlice.reducer;
