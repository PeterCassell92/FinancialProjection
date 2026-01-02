'use client';

import { useState, useEffect } from 'react';
import { Currency, DateFormat } from '@prisma/client';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: {
    currency: Currency;
    dateFormat: DateFormat;
  };
  onUpdate: (settings: { currency: Currency; dateFormat: DateFormat }) => Promise<void>;
}

export default function SettingsModal({
  isOpen,
  onClose,
  currentSettings,
  onUpdate,
}: SettingsModalProps) {
  const [currency, setCurrency] = useState<Currency>(currentSettings.currency);
  const [dateFormat, setDateFormat] = useState<DateFormat>(currentSettings.dateFormat);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update local state when currentSettings changes
  useEffect(() => {
    setCurrency(currentSettings.currency);
    setDateFormat(currentSettings.dateFormat);
  }, [currentSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onUpdate({ currency, dateFormat });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset to current settings on cancel
      setCurrency(currentSettings.currency);
      setDateFormat(currentSettings.dateFormat);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      data-testid="settings-modal-overlay"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        data-testid="settings-modal"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900" data-testid="settings-modal-title">
              Application Settings
            </h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              data-testid="settings-modal-close-button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3" data-testid="settings-error">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Currency Selection */}
            <div className="mb-6">
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                disabled={isSubmitting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                data-testid="currency-select"
              >
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="USD">USD ($) - US Dollar</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                This will affect how all monetary values are displayed throughout the application.
              </p>
            </div>

            {/* Date Format Selection */}
            <div className="mb-6">
              <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 mb-2">
                Date Format
              </label>
              <select
                id="dateFormat"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value as DateFormat)}
                disabled={isSubmitting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                data-testid="date-format-select"
              >
                <option value="UK">UK Format (DD/MM/YYYY)</option>
                <option value="US">US Format (MM/DD/YYYY)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                This will affect how dates are displayed and entered throughout the application.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="settings-cancel-button"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="settings-save-button"
              >
                {isSubmitting ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
