import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface SpendingType {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
}

export interface TransactionRecord {
  id: string;
  bankAccountId: string;
  transactionDate: string;
  transactionType: string;
  transactionDescription: string;
  debitAmount: number | null;
  creditAmount: number | null;
  balance: number;
  notes: string | null;
  bankAccount: {
    id: string;
    name: string;
    sortCode: string;
    accountNumber: string;
  };
  spendingTypes: Array<{
    spendingType: SpendingType;
  }>;
}

interface TransactionFilters {
  startDate: string | null;    // ISO date string
  endDate: string | null;      // ISO date string
  description: string | null;  // Partial match search on transaction description
  spendingTypeIds: string[];   // Filter by spending type IDs
  amountOperator: 'lessThan' | 'greaterThan' | null;  // Amount comparison operator
  amountValue: number | null;  // Amount value to compare against (magnitude)
}

interface TransactionPagination {
  currentPage: number;
  recordsPerPage: number;
  totalRecords: number;
  totalPages: number;
}

interface BankRecordsState {
  spendingTypes: SpendingType[];
  spendingTypesLoading: boolean;
  spendingTypesError: string | null;
  transactions: TransactionRecord[];
  transactionsLoading: boolean;
  transactionsError: string | null;
  selectedBankAccountId: string | null;
  enableTransactionDeletion: boolean;
  filters: TransactionFilters;
  pagination: TransactionPagination;
}

const initialState: BankRecordsState = {
  spendingTypes: [],
  spendingTypesLoading: false,
  spendingTypesError: null,
  transactions: [],
  transactionsLoading: false,
  transactionsError: null,
  selectedBankAccountId: null,
  enableTransactionDeletion: false,
  filters: {
    startDate: null,
    endDate: null,
    description: null,
    spendingTypeIds: [],
    amountOperator: null,
    amountValue: null,
  },
  pagination: {
    currentPage: 1,
    recordsPerPage: 60,
    totalRecords: 0,
    totalPages: 0,
  },
};

// Async thunks
export const fetchSpendingTypes = createAsyncThunk(
  'bankRecords/fetchSpendingTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/spending-types');
      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to fetch spending types');
      }

      return data.data as SpendingType[];
    } catch (error) {
      return rejectWithValue('Failed to fetch spending types');
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'bankRecords/fetchTransactions',
  async (bankAccountId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { bankRecords: BankRecordsState };
      const { filters, pagination } = state.bankRecords;

      // Build query parameters
      const params = new URLSearchParams({
        bankAccountId,
        page: pagination.currentPage.toString(),
        pageSize: pagination.recordsPerPage.toString(),
      });

      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      if (filters.description) {
        params.append('description', filters.description);
      }
      if (filters.spendingTypeIds.length > 0) {
        filters.spendingTypeIds.forEach(id => params.append('spendingTypeIds', id));
      }
      if (filters.amountOperator && filters.amountValue !== null) {
        params.append('amountOperator', filters.amountOperator);
        params.append('amountValue', filters.amountValue.toString());
      }

      const response = await fetch(`/api/transaction-records?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to fetch transactions');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch transactions');
    }
  }
);

export const updateTransaction = createAsyncThunk(
  'bankRecords/updateTransaction',
  async (
    {
      id,
      notes,
      spendingTypeIds,
    }: {
      id: string;
      notes?: string;
      spendingTypeIds?: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch('/api/transaction-records', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          notes,
          spendingTypeIds,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to update transaction');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue('Failed to update transaction');
    }
  }
);

export const deleteTransaction = createAsyncThunk(
  'bankRecords/deleteTransaction',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/transaction-records?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to delete transaction');
      }

      return id;
    } catch (error) {
      return rejectWithValue('Failed to delete transaction');
    }
  }
);

export const deleteAllTransactions = createAsyncThunk(
  'bankRecords/deleteAllTransactions',
  async (bankAccountId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/transaction-records/bulk-delete?bankAccountId=${bankAccountId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to delete all transactions');
      }

      return bankAccountId;
    } catch (error) {
      return rejectWithValue('Failed to delete all transactions');
    }
  }
);

export const createSpendingType = createAsyncThunk(
  'bankRecords/createSpendingType',
  async (
    {
      name,
      description,
      color,
    }: {
      name: string;
      description?: string;
      color: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch('/api/spending-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          color,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to create spending type');
      }

      return data.data as SpendingType;
    } catch (error) {
      return rejectWithValue('Failed to create spending type');
    }
  }
);

const bankRecordsSlice = createSlice({
  name: 'bankRecords',
  initialState,
  reducers: {
    setSelectedBankAccountId: (state, action: PayloadAction<string | null>) => {
      state.selectedBankAccountId = action.payload;
    },
    clearTransactions: (state) => {
      state.transactions = [];
    },
    setEnableTransactionDeletion: (state, action: PayloadAction<boolean>) => {
      state.enableTransactionDeletion = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<TransactionFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1; // Reset to first page when filters change
    },
    clearFilters: (state) => {
      state.filters = {
        startDate: null,
        endDate: null,
        description: null,
        spendingTypeIds: [],
        amountOperator: null,
        amountValue: null
      };
      state.pagination.currentPage = 1;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
    setRecordsPerPage: (state, action: PayloadAction<number>) => {
      state.pagination.recordsPerPage = action.payload;
      state.pagination.currentPage = 1; // Reset to first page when page size changes
    },
    toggleSpendingTypeFilter: (state, action: PayloadAction<string>) => {
      const spendingTypeId = action.payload;
      const index = state.filters.spendingTypeIds.indexOf(spendingTypeId);

      if (index === -1) {
        // Add to filters
        state.filters.spendingTypeIds.push(spendingTypeId);
      } else {
        // Remove from filters
        state.filters.spendingTypeIds.splice(index, 1);
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch spending types
    builder
      .addCase(fetchSpendingTypes.pending, (state) => {
        state.spendingTypesLoading = true;
        state.spendingTypesError = null;
      })
      .addCase(fetchSpendingTypes.fulfilled, (state, action) => {
        state.spendingTypesLoading = false;
        state.spendingTypes = action.payload;
      })
      .addCase(fetchSpendingTypes.rejected, (state, action) => {
        state.spendingTypesLoading = false;
        state.spendingTypesError = action.payload as string;
      });

    // Fetch transactions
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.transactionsLoading = true;
        state.transactionsError = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactionsLoading = false;
        state.transactions = action.payload.transactions;
        // Update pagination metadata if present
        if (action.payload.pagination) {
          state.pagination = {
            ...state.pagination,
            totalRecords: action.payload.pagination.totalRecords,
            totalPages: action.payload.pagination.totalPages,
          };
        }
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.transactionsLoading = false;
        state.transactionsError = action.payload as string;
      });

    // Update transaction
    builder
      .addCase(updateTransaction.fulfilled, (state, action) => {
        // Optimistically update the transaction in the local state
        const index = state.transactions.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
      });

    // Delete transaction
    builder
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.transactions = state.transactions.filter(
          (t) => t.id !== action.payload
        );
      });

    // Delete all transactions for account
    builder
      .addCase(deleteAllTransactions.fulfilled, (state) => {
        state.transactions = [];
      });

    // Create spending type
    builder
      .addCase(createSpendingType.fulfilled, (state, action) => {
        state.spendingTypes.push(action.payload);
      });
  },
});

export const {
  setSelectedBankAccountId,
  clearTransactions,
  setEnableTransactionDeletion,
  setFilters,
  clearFilters,
  setCurrentPage,
  setRecordsPerPage,
  toggleSpendingTypeFilter,
} = bankRecordsSlice.actions;

// Selectors - type will be inferred when imported with RootState
export const selectSpendingTypes = (state: { bankRecords: BankRecordsState }) => state.bankRecords.spendingTypes;
export const selectSpendingTypesLoading = (state: { bankRecords: BankRecordsState }) => state.bankRecords.spendingTypesLoading;
export const selectTransactions = (state: { bankRecords: BankRecordsState }) => state.bankRecords.transactions;
export const selectTransactionsLoading = (state: { bankRecords: BankRecordsState }) => state.bankRecords.transactionsLoading;
export const selectSelectedBankAccountId = (state: { bankRecords: BankRecordsState }) => state.bankRecords.selectedBankAccountId;
export const selectEnableTransactionDeletion = (state: { bankRecords: BankRecordsState }) => state.bankRecords.enableTransactionDeletion;
export const selectFilters = (state: { bankRecords: BankRecordsState }) => state.bankRecords.filters;
export const selectPagination = (state: { bankRecords: BankRecordsState }) => state.bankRecords.pagination;

export default bankRecordsSlice.reducer;
