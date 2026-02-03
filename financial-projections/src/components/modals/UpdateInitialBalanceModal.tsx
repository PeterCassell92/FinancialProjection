'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import BaseModal from './BaseModal';
import { DatePicker } from '../DatePicker';

interface UpdateInitialBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  currentDate?: string;
  onUpdate: (balance: number, date: string) => Promise<void>;
  welcomeMode?: boolean;
}

export default function UpdateInitialBalanceModal({
  isOpen,
  onClose,
  currentBalance,
  currentDate,
  onUpdate,
  welcomeMode = false,
}: UpdateInitialBalanceModalProps) {
  const [balance, setBalance] = useState(currentBalance.toString());
  const [date, setDate] = useState<Date>(
    currentDate ? new Date(currentDate) : new Date()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setBalance(currentBalance.toString());
      setDate(currentDate ? new Date(currentDate) : new Date());
      setError(null);
    }
  }, [isOpen, currentBalance, currentDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const balanceNum = parseFloat(balance);
    if (isNaN(balanceNum)) {
      setError('Please enter a valid number for the balance');
      return;
    }

    // Validate date is not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date > today) {
      setError('Initial balance date cannot be in the future');
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert Date object to string for API
      const dateString = format(date, 'yyyy-MM-dd');
      await onUpdate(balanceNum, dateString);
      onClose();
    } catch (err) {
      setError('Failed to update initial balance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={!welcomeMode}
      closeOnOverlayClick={!welcomeMode}
      testId="update-initial-balance-modal"
    >
      {welcomeMode ? (
        <>
          <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="modal-title">
            Welcome to Financial Projections!
          </h2>
          <p className="text-gray-600 mb-6" data-testid="welcome-message">
            To get started, please enter your current bank balance and the date it was accurate.
            This will serve as the starting point for all your financial projections going forward.
          </p>
        </>
      ) : (
        <h2 className="text-2xl font-bold text-gray-900 mb-4" data-testid="modal-title">
          Update Initial Bank Balance
        </h2>
      )}

      <form onSubmit={handleSubmit}>
        {/* Balance Input */}
        <div className="mb-4">
          <label
            htmlFor="balance"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Balance Amount ($)
          </label>
          <input
            type="number"
            id="balance"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="balance-input"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Date Input */}
        <div className="mb-6">
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Balance Date
          </label>
          <DatePicker
            value={date}
            onChange={(selectedDate) => selectedDate && setDate(selectedDate)}
            placeholder="Select date"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-500">
            The date this balance was accurate (defaults to today)
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div
            className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3"
            data-testid="modal-error"
          >
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          {!welcomeMode && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              data-testid="cancel-button"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            data-testid="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Saving...'
              : welcomeMode
                ? 'Get Started'
                : 'Update Balance'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
