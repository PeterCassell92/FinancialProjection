'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  fetchSpendingTypes,
  fetchTransactions,
  updateTransaction,
  deleteTransaction as deleteTransactionAction,
  selectSpendingTypes,
  selectSpendingTypesLoading,
  selectTransactions,
  selectTransactionsLoading,
  setSelectedBankAccountId,
  selectSelectedBankAccountId,
  selectEnableTransactionDeletion,
  selectPagination,
  setCurrentPage,
  setRecordsPerPage,
} from '@/lib/redux/bankRecordsSlice';
import {
  fetchBankAccounts,
  selectBankAccounts,
  selectBankAccountsLoading,
} from '@/lib/redux/bankAccountsSlice';
import {
  fetchSettings,
  selectDefaultBankAccountId,
} from '@/lib/redux/settingsSlice';
import Header from '@/components/Header';
import SpendingTypeManagement from '@/components/SpendingTypeManagement';
import CategorizationRulesManagement from '@/components/CategorizationRulesManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, Save, X, Trash2, Settings, Upload } from 'lucide-react';
import AccountSettingsModal from '@/components/AccountSettingsModal';
import TransactionRecordsTableFilters from '@/components/TransactionRecordsTableFilters';

interface SpendingType {
  id: string;
  name: string;
  description: string | null;
}

interface TransactionRecord {
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

export default function TransactionsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Redux state
  const transactions = useAppSelector(selectTransactions);
  const spendingTypes = useAppSelector(selectSpendingTypes);
  const spendingTypesLoading = useAppSelector(selectSpendingTypesLoading);
  const transactionsLoading = useAppSelector(selectTransactionsLoading);
  const selectedBankAccount = useAppSelector(selectSelectedBankAccountId);
  const bankAccounts = useAppSelector(selectBankAccounts);
  const bankAccountsLoading = useAppSelector(selectBankAccountsLoading);
  const defaultBankAccountId = useAppSelector(selectDefaultBankAccountId);
  const enableTransactionDeletion = useAppSelector(selectEnableTransactionDeletion);
  const pagination = useAppSelector(selectPagination);

  // Local state
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editSpendingTypes, setEditSpendingTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  // Fetch initial data from Redux
  useEffect(() => {
    // Fetch settings if not already loaded
    if (defaultBankAccountId === null) {
      dispatch(fetchSettings());
    }

    // Fetch bank accounts if not already loaded
    if (bankAccounts.length === 0) {
      dispatch(fetchBankAccounts());
    }

    // Fetch spending types if not already loaded
    if (spendingTypes.length === 0) {
      dispatch(fetchSpendingTypes());
    }
  }, [dispatch, spendingTypes.length, bankAccounts.length, defaultBankAccountId]);

  // Auto-select default bank account when available
  useEffect(() => {
    if (defaultBankAccountId && !selectedBankAccount) {
      dispatch(setSelectedBankAccountId(defaultBankAccountId));
    }
  }, [dispatch, defaultBankAccountId, selectedBankAccount]);

  // Fetch transactions when bank account or pagination changes
  useEffect(() => {
    if (selectedBankAccount) {
      dispatch(fetchTransactions(selectedBankAccount));
    }
  }, [dispatch, selectedBankAccount, pagination.currentPage, pagination.recordsPerPage]);

  const handleEdit = (transaction: TransactionRecord) => {
    setEditingTransaction(transaction.id);
    setEditNotes(transaction.notes || '');
    setEditSpendingTypes(transaction.spendingTypes.map((st) => st.spendingType.id));
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setEditNotes('');
    setEditSpendingTypes([]);
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return;
    }

    setDeleting(transactionId);
    try {
      await dispatch(deleteTransactionAction(transactionId)).unwrap();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      alert('Failed to delete transaction');
    } finally {
      setDeleting(null);
    }
  };

  const handleSave = async (transactionId: string) => {
    setSaving(true);
    try {
      await dispatch(updateTransaction({
        id: transactionId,
        notes: editNotes || undefined,
        spendingTypeIds: editSpendingTypes.length > 0 ? editSpendingTypes : undefined,
      })).unwrap();

      // No need to refetch - optimistic update handles it
      handleCancelEdit();
    } catch (error) {
      console.error('Failed to save transaction:', error);
      alert('Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return `£${value.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onOpenSettings={() => {}} onOpenInfo={() => {}} />

      <div className="max-w-[1600px] mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => router.push('/bank-records')}
              className="text-blue-600 hover:text-blue-800"
              data-testid="back-to-bank-records"
            >
              ← Back to Bank Records
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
            Transaction Records
          </h1>
          <p className="text-gray-600 mt-2">
            View and enhance imported bank transactions with notes and spending categories
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Main content - transactions table */}
          <div>{/* Transactions content will go here */}

        {/* Bank Account Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-8" data-testid="filter-section">
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="bank-account-filter">Select Bank Account</Label>
              <Select value={selectedBankAccount || ''} onValueChange={(value) => dispatch(setSelectedBankAccountId(value))}>
                <SelectTrigger id="bank-account-filter" data-testid="bank-account-filter">
                  <SelectValue placeholder="Choose a bank account..." />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.sortCode} - {account.accountNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedBankAccount && (
              <button
                onClick={() => setShowAccountSettings(true)}
                className="mt-8 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Account settings"
                data-testid="account-settings-button"
              >
                <Settings className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Transactions Table */}
        {selectedBankAccount && (
          <div className="bg-white rounded-lg shadow overflow-hidden" data-testid="transactions-section">
            {transactionsLoading ? (
              <div className="text-center py-12 text-gray-500">
                Loading transactions...
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="max-w-md mx-auto">
                  <div className="text-gray-400 mb-4">
                    <Upload className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Transactions Found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Upload a bank statement to get started with tracking your transactions
                  </p>
                  <Button
                    onClick={() => router.push('/bank-records')}
                    size="lg"
                    className="gap-2"
                    data-testid="upload-csv-cta"
                  >
                    <Upload className="h-5 w-5" />
                    Upload Bank Statement
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="transactions-table">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Paid Out</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Paid In</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900" title="Balance After Transaction">Balance</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Spending Types</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Notes</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky right-0 bg-gray-50 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                          {formatDate(transaction.transactionDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                          {transaction.transactionDescription}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {transaction.transactionType}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600 whitespace-nowrap">
                          {formatCurrency(transaction.debitAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600 whitespace-nowrap">
                          {formatCurrency(transaction.creditAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 whitespace-nowrap font-medium">
                          {formatCurrency(transaction.balance)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {editingTransaction === transaction.id ? (
                            <Select
                              value={editSpendingTypes[0] || ''}
                              onValueChange={(value) => {
                                if (value && !editSpendingTypes.includes(value)) {
                                  setEditSpendingTypes([...editSpendingTypes, value]);
                                }
                              }}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Add type..." />
                              </SelectTrigger>
                              <SelectContent>
                                {spendingTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.id}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : transaction.spendingTypes.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {transaction.spendingTypes.map((st) => (
                                <span
                                  key={st.spendingType.id}
                                  className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded"
                                >
                                  {st.spendingType.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                          {editingTransaction === transaction.id && editSpendingTypes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {editSpendingTypes.map((typeId) => {
                                const type = spendingTypes.find((st) => st.id === typeId);
                                return type ? (
                                  <span
                                    key={typeId}
                                    className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded flex items-center gap-1"
                                  >
                                    {type.name}
                                    <button
                                      onClick={() =>
                                        setEditSpendingTypes((prev) =>
                                          prev.filter((id) => id !== typeId)
                                        )
                                      }
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {editingTransaction === transaction.id ? (
                            <Input
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="Add notes..."
                              className="w-40"
                            />
                          ) : transaction.notes ? (
                            <span>{transaction.notes}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap sticky right-0 bg-white shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)]">
                          {editingTransaction === transaction.id ? (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleSave(transaction.id)}
                                disabled={saving}
                                title="Save changes"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                disabled={saving}
                                title="Cancel editing"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(transaction)}
                                disabled={deleting === transaction.id}
                                title="Edit transaction"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {enableTransactionDeletion && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(transaction.id)}
                                  disabled={deleting === transaction.id}
                                  title="Delete transaction"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!transactionsLoading && transactions.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((pagination.currentPage - 1) * pagination.recordsPerPage) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.currentPage * pagination.recordsPerPage, pagination.totalRecords)}
                    </span> of{' '}
                    <span className="font-medium">{pagination.totalRecords}</span> transactions
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="page-size" className="text-sm text-gray-700 whitespace-nowrap">Per page:</Label>
                    <Select
                      value={pagination.recordsPerPage.toString()}
                      onValueChange={(value) => dispatch(setRecordsPerPage(parseInt(value)))}
                    >
                      <SelectTrigger id="page-size" className="w-20" data-testid="page-size-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch(setCurrentPage(1))}
                    disabled={pagination.currentPage === 1}
                    data-testid="first-page-button"
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch(setCurrentPage(pagination.currentPage - 1))}
                    disabled={pagination.currentPage === 1}
                    data-testid="prev-page-button"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-2 px-4">
                    <span className="text-sm text-gray-700">
                      Page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                      <span className="font-medium">{pagination.totalPages}</span>
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch(setCurrentPage(pagination.currentPage + 1))}
                    disabled={pagination.currentPage >= pagination.totalPages}
                    data-testid="next-page-button"
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch(setCurrentPage(pagination.totalPages))}
                    disabled={pagination.currentPage >= pagination.totalPages}
                    data-testid="last-page-button"
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {!selectedBankAccount && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-blue-800">
              Select a bank account above to view its transaction records
            </p>
          </div>
        )}
          </div>

          {/* Sidebar - Filters and Management */}
          <div className="space-y-6">
            {/* Filters Section */}
            <TransactionRecordsTableFilters />

            {/* Categorization Rules Management */}
            <CategorizationRulesManagement
              spendingTypes={spendingTypes}
              selectedBankAccountId={selectedBankAccount}
              onRuleCreated={() => {
                // Optionally refresh something when a rule is created
                console.log('Categorization rule created');
              }}
              onRuleApplied={() => {
                // Refresh transactions after applying rule
                if (selectedBankAccount) {
                  dispatch(fetchTransactions(selectedBankAccount));
                }
              }}
            />

            {/* Spending Type Management */}
            <SpendingTypeManagement
              spendingTypes={spendingTypes}
              onSpendingTypeCreated={() => dispatch(fetchSpendingTypes())}
            />
          </div>
        </div>
      </div>

      {/* Account Settings Modal */}
      {selectedBankAccount && (
        <AccountSettingsModal
          isOpen={showAccountSettings}
          onClose={() => setShowAccountSettings(false)}
          accountId={selectedBankAccount}
          accountName={
            bankAccounts.find((acc) => acc.id === selectedBankAccount)?.name || 'Unknown Account'
          }
        />
      )}
    </div>
  );
}
