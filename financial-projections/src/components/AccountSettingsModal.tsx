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

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAllTransactions = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deleteAllTransactions(accountId)).unwrap();
      // Refresh transactions to reflect the deletion
      await dispatch(fetchTransactions(accountId));
      setShowDeleteConfirmation(false);
      onClose();
    } catch (error) {
      console.error('Failed to delete all transactions:', error);
      alert('Failed to delete all transactions');
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

              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-red-900">
                      Delete All Transaction Records
                    </h4>
                    <p className="text-sm text-red-700 mt-1">
                      This will permanently delete all transaction records for this account.
                      This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirmation(true)}
                    className="ml-4"
                    data-testid="delete-all-transactions-button"
                  >
                    Delete All
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeleteAllTransactions}
        title="Delete All Transaction Records?"
        description={`Are you sure you want to delete ALL transaction records for ${accountName}? This action cannot be undone and will permanently remove all transaction data from the database.`}
        confirmText="Delete All Transactions"
        cancelText="Cancel"
        confirmVariant="destructive"
        isLoading={isDeleting}
      />
    </>
  );
}
