'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  fetchTransactions,
  deleteTransaction,
  selectTransactions,
  selectTransactionsLoading,
  selectEnableTransactionDeletion,
  selectPagination,
  selectSelectedBankAccountId,
  setCurrentPage,
} from '@/lib/redux/bankRecordsSlice';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date-format';
import { useAppSelector as useSettingsSelector } from '@/lib/redux/hooks';
import { selectCurrency, selectDateFormat } from '@/lib/redux/settingsSlice';

interface TransactionRecordsTableViewProps {
  onTransactionClick?: (transactionId: string) => void;
}

export default function TransactionRecordsTableView({
  onTransactionClick,
}: TransactionRecordsTableViewProps) {
  const dispatch = useAppDispatch();

  const transactions = useAppSelector(selectTransactions);
  const loading = useAppSelector(selectTransactionsLoading);
  const enableTransactionDeletion = useAppSelector(selectEnableTransactionDeletion);
  const pagination = useAppSelector(selectPagination);
  const selectedBankAccountId = useAppSelector(selectSelectedBankAccountId);

  const currency = useSettingsSelector(selectCurrency);
  const dateFormat = useSettingsSelector(selectDateFormat);

  // Fetch transactions when pagination changes
  useEffect(() => {
    if (selectedBankAccountId) {
      dispatch(fetchTransactions(selectedBankAccountId));
    }
  }, [dispatch, selectedBankAccountId, pagination.currentPage]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await dispatch(deleteTransaction(id)).unwrap();
        // Refresh the current page
        if (selectedBankAccountId) {
          dispatch(fetchTransactions(selectedBankAccountId));
        }
      } catch (error) {
        console.error('Failed to delete transaction:', error);
        alert('Failed to delete transaction');
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      dispatch(setCurrentPage(newPage));
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-gray-600">Loading transactions...</div>
      </div>
    );
  }

  if (!selectedBankAccountId) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-gray-600">Please select a bank account</div>
      </div>
    );
  }

  if (transactions.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-gray-600">No transactions found</div>
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol(currency);

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              <TableHead className="text-right" title="Balance After Transaction">
                Balance
              </TableHead>
              {enableTransactionDeletion && <TableHead className="w-[80px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow
                key={transaction.id}
                className={onTransactionClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                onClick={() => onTransactionClick?.(transaction.id)}
                data-testid={`transaction-row-${transaction.id}`}
              >
                <TableCell className="font-medium">
                  {formatDate(new Date(transaction.transactionDate), dateFormat)}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {transaction.transactionDescription}
                </TableCell>
                <TableCell>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                    {transaction.transactionType}
                  </span>
                </TableCell>
                <TableCell className="text-right text-red-600">
                  {transaction.debitAmount
                    ? formatCurrency(transaction.debitAmount, currency)
                    : '-'}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {transaction.creditAmount
                    ? formatCurrency(transaction.creditAmount, currency)
                    : '-'}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(transaction.balance, currency)}
                </TableCell>
                {enableTransactionDeletion && (
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(transaction.id);
                      }}
                      title="Delete transaction"
                      data-testid={`delete-transaction-${transaction.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-gray-600">
          Showing {transactions.length > 0 ? (pagination.currentPage - 1) * pagination.recordsPerPage + 1 : 0} to{' '}
          {Math.min(pagination.currentPage * pagination.recordsPerPage, pagination.totalRecords)} of{' '}
          {pagination.totalRecords} transactions
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1 || loading}
            data-testid="previous-page-button"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="text-sm">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages || loading}
            data-testid="next-page-button"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
