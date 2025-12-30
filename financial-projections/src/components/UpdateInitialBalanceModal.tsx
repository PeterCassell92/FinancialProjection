'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface UpdateInitialBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  currentDate?: string;
  onUpdate: (balance: number, date: string) => Promise<void>;
}

export default function UpdateInitialBalanceModal({
  isOpen,
  onClose,
  currentBalance,
  currentDate,
  onUpdate,
}: UpdateInitialBalanceModalProps) {
  const [balance, setBalance] = useState(currentBalance.toString());
  const [date, setDate] = useState(
    currentDate || format(new Date(), 'yyyy-MM-dd')
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setBalance(currentBalance.toString());
      setDate(currentDate || format(new Date(), 'yyyy-MM-dd'));
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
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      setError('Initial balance date cannot be in the future');
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(balanceNum, date);
      onClose();
    } catch (err) {
      setError('Failed to update initial balance');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      data-testid="update-initial-balance-modal"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        data-testid="update-initial-balance-modal-content"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4" data-testid="modal-title">
          Update Initial Bank Balance
        </h2>

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
            <input
              type="date"
              id="date"
              value={date}
              max={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="date-input"
              required
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
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              data-testid="cancel-button"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
              data-testid="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Balance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
