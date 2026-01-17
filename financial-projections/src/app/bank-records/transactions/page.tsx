'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import SpendingTypeManagement from '@/components/SpendingTypeManagement';
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
import { Pencil, Save, X, Trash2 } from 'lucide-react';

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

interface BankAccount {
  id: string;
  name: string;
  sortCode: string;
  accountNumber: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [spendingTypes, setSpendingTypes] = useState<SpendingType[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editSpendingTypes, setEditSpendingTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch bank accounts
        const accountsResponse = await fetch('/api/bank-accounts');
        const accountsData = await accountsResponse.json();
        if (accountsData.success) {
          setBankAccounts(accountsData.data || []);
        }

        // Fetch spending types
        const typesResponse = await fetch('/api/spending-types');
        const typesData = await typesResponse.json();
        if (typesData.success) {
          setSpendingTypes(typesData.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch transactions when bank account changes
  useEffect(() => {
    if (selectedBankAccount) {
      fetchTransactions(selectedBankAccount);
    } else {
      setTransactions([]);
    }
  }, [selectedBankAccount]);

  const fetchTransactions = async (bankAccountId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/transaction-records?bankAccountId=${bankAccountId}`);
      const data = await response.json();

      if (data.success) {
        setTransactions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpendingTypes = async () => {
    try {
      const typesResponse = await fetch('/api/spending-types');
      const typesData = await typesResponse.json();
      if (typesData.success) {
        setSpendingTypes(typesData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch spending types:', error);
    }
  };

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
      const response = await fetch(`/api/transaction-records?id=${transactionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Refresh transactions from server
        if (selectedBankAccount) {
          await fetchTransactions(selectedBankAccount);
        }
      } else {
        alert(data.error || 'Failed to delete transaction');
      }
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
      const response = await fetch('/api/transaction-records', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: transactionId,
          notes: editNotes || undefined,
          spendingTypeIds: editSpendingTypes.length > 0 ? editSpendingTypes : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh transactions from server to ensure consistency
        if (selectedBankAccount) {
          await fetchTransactions(selectedBankAccount);
        }
        handleCancelEdit();
      } else {
        alert(data.error || 'Failed to update transaction');
      }
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content - transactions table */}
          <div className="lg:col-span-2">{/* Transactions content will go here */}

        {/* Bank Account Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-8" data-testid="filter-section">
          <div className="space-y-2">
            <Label htmlFor="bank-account-filter">Select Bank Account</Label>
            <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
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
        </div>

        {/* Transactions Table */}
        {selectedBankAccount && (
          <div className="bg-white rounded-lg shadow overflow-hidden" data-testid="transactions-section">
            {loading ? (
              <div className="text-center py-12 text-gray-500">
                Loading transactions...
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No transactions found for this account. Upload a bank statement to get started.
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
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Balance</th>
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
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(transaction.id)}
                                disabled={deleting === transaction.id}
                                title="Delete transaction"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

          {/* Sidebar - Spending Type Management */}
          <div className="lg:col-span-1">
            <SpendingTypeManagement
              spendingTypes={spendingTypes}
              onSpendingTypeCreated={fetchSpendingTypes}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
