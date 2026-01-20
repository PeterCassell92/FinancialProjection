'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  deleteAllTransactions,
  fetchTransactions,
  setEnableTransactionDeletion,
  selectEnableTransactionDeletion,
} from '@/lib/redux/bankRecordsSlice';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import ConfirmationModal from '@/components/ConfirmationModal';
import { X } from 'lucide-react';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  accountName: string;
}

export default function AccountSettingsModal({
  isOpen,
  onClose,
  accountId,
  accountName,
}: AccountSettingsModalProps) {
  const dispatch = useAppDispatch();
  const enableTransactionDeletion = useAppSelector(selectEnableTransactionDeletion);

  const [showDeleteTransactionsConfirmation, setShowDeleteTransactionsConfirmation] = useState(false);
  const [showDeleteAccountConfirmation, setShowDeleteAccountConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAllTransactions = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deleteAllTransactions(accountId)).unwrap();
      // Refresh transactions to reflect the deletion
      await dispatch(fetchTransactions(accountId));
      setShowDeleteTransactionsConfirmation(false);
      alert('All transactions deleted successfully');
    } catch (error) {
      console.error('Failed to delete all transactions:', error);
      alert('Failed to delete all transactions');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteBankAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/bank-accounts/${accountId}?deleteAll=true`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete bank account');
      }

      setShowDeleteAccountConfirmation(false);
      alert(data.message || 'Bank account and all data deleted successfully');
      onClose();
      // Optionally reload the page or redirect
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete bank account:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete bank account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleDeletionEnabled = () => {
    dispatch(setEnableTransactionDeletion(!enableTransactionDeletion));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Full screen modal */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
        data-testid="account-settings-modal-overlay"
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900" data-testid="account-settings-title">
              Account Settings: {accountName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              data-testid="close-account-settings"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-8">
            {/* Transaction Deletion Toggle */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Transaction Management</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Control transaction deletion permissions
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <Label htmlFor="enable-deletion" className="text-base font-medium">
                    Enable Transaction Row Deletion
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    When enabled, the delete button will be available in the transaction table
                  </p>
                </div>
                <div className="flex items-center">
                  <button
                    id="enable-deletion"
                    onClick={handleToggleDeletionEnabled}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enableTransactionDeletion ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    data-testid="toggle-transaction-deletion"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enableTransactionDeletion ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Irreversible actions that permanently delete data
                </p>
              </div>

              {/* Delete All Transactions */}
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-yellow-900">
                      Delete All Transaction Records
                    </h4>
                    <p className="text-sm text-yellow-800 mt-1">
                      This will permanently delete all transaction records for this account.
                      The bank account itself will remain.
                    </p>
                    <p className="text-sm text-yellow-900 font-semibold mt-2">
                      This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteTransactionsConfirmation(true)}
                    className="ml-4"
                    data-testid="delete-all-transactions-button"
                  >
                    Delete Transactions
                  </Button>
                </div>
              </div>

              {/* Delete Bank Account */}
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-red-900">
                      Delete Bank Account and All Data
                    </h4>
                    <p className="text-sm text-red-700 mt-1">
                      This will permanently delete:
                    </p>
                    <ul className="text-sm text-red-700 mt-2 ml-4 list-disc space-y-1">
                      <li>All transaction records</li>
                      <li>All projection events and recurring rules</li>
                      <li>All daily balance calculations</li>
                      <li>All upload operation history</li>
                      <li><strong>The bank account itself</strong></li>
                    </ul>
                    <p className="text-sm text-red-800 font-semibold mt-2">
                      This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteAccountConfirmation(true)}
                    className="ml-4 bg-red-700 hover:bg-red-800"
                    data-testid="delete-bank-account-button"
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
            <Button onClick={onClose} data-testid="close-button">
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Transactions Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteTransactionsConfirmation}
        onClose={() => setShowDeleteTransactionsConfirmation(false)}
        onConfirm={handleDeleteAllTransactions}
        title="Delete All Transaction Records?"
        description={`Are you sure you want to delete ALL transaction records for ${accountName}? The bank account itself will remain, but all transaction data will be permanently removed. This action cannot be undone.`}
        confirmText="Delete Transactions"
        cancelText="Cancel"
        confirmVariant="destructive"
        isLoading={isDeleting}
      />

      {/* Delete Bank Account Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteAccountConfirmation}
        onClose={() => setShowDeleteAccountConfirmation(false)}
        onConfirm={handleDeleteBankAccount}
        title="Delete Bank Account and All Data?"
        description={`Are you sure you want to delete ${accountName} and ALL associated data? This will permanently remove the bank account, all transaction records, all projection events and rules, all daily balance calculations, and all upload history. This action cannot be undone.`}
        confirmText="Delete Everything"
        cancelText="Cancel"
        confirmVariant="destructive"
        isLoading={isDeleting}
      />
    </>
  );
}
