'use client';

import { useState, useEffect } from 'react';
import { Currency, DateFormat } from '@prisma/client';
import { format } from 'date-fns';

interface FullScreenSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: {
    id: string;
    initialBankBalance: number;
    initialBalanceDate: Date | string;
    currency: Currency;
    dateFormat: DateFormat;
  };
  onUpdate: (settings: {
    initialBankBalance?: number;
    initialBalanceDate?: string;
    currency?: Currency;
    dateFormat?: DateFormat;
  }) => Promise<void>;
}

type CountryPreset = 'UK' | 'US';

export default function FullScreenSettingsModal({
  isOpen,
  onClose,
  currentSettings,
  onUpdate,
}: FullScreenSettingsModalProps) {
  const [initialBankBalance, setInitialBankBalance] = useState<string>(
    currentSettings.initialBankBalance?.toString() || '0'
  );
  const [initialBalanceDate, setInitialBalanceDate] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>(currentSettings.currency);
  const [dateFormat, setDateFormat] = useState<DateFormat>(currentSettings.dateFormat);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize date field when currentSettings changes
  useEffect(() => {
    if (currentSettings.initialBalanceDate) {
      const date = typeof currentSettings.initialBalanceDate === 'string'
        ? new Date(currentSettings.initialBalanceDate)
        : currentSettings.initialBalanceDate;
      setInitialBalanceDate(format(date, 'yyyy-MM-dd'));
    }
    setInitialBankBalance(currentSettings.initialBankBalance?.toString() || '0');
    setCurrency(currentSettings.currency);
    setDateFormat(currentSettings.dateFormat);
  }, [currentSettings]);

  const handleCountryPreset = (country: CountryPreset) => {
    if (country === 'UK') {
      setCurrency('GBP');
      setDateFormat('UK');
    } else {
      setCurrency('USD');
      setDateFormat('US');
    }
    setSuccessMessage(`${country} preset applied`);
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const handleSave = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const balance = parseFloat(initialBankBalance);
      if (isNaN(balance) || balance < 0) {
        throw new Error('Initial bank balance must be a valid positive number');
      }

      if (!initialBalanceDate) {
        throw new Error('Initial balance date is required');
      }

      await onUpdate({
        initialBankBalance: balance,
        initialBalanceDate,
        currency,
        dateFormat,
      });

      setSuccessMessage('Settings saved successfully');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset to current settings
    setInitialBankBalance(currentSettings.initialBankBalance?.toString() || '0');
    if (currentSettings.initialBalanceDate) {
      const date = typeof currentSettings.initialBalanceDate === 'string'
        ? new Date(currentSettings.initialBalanceDate)
        : currentSettings.initialBalanceDate;
      setInitialBalanceDate(format(date, 'yyyy-MM-dd'));
    }
    setCurrency(currentSettings.currency);
    setDateFormat(currentSettings.dateFormat);
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4"
      data-testid="fullscreen-settings-modal-overlay"
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        data-testid="fullscreen-settings-modal"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900" data-testid="settings-modal-title">
            Application Settings
          </h2>
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            data-testid="settings-close-button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-8">
          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="settings-error">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4" data-testid="settings-success">
              <p className="text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Country Presets Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Country Settings Preset</h3>
            <p className="text-sm text-gray-600 mb-4">
              Quickly set currency and date format based on your country
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleCountryPreset('UK')}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-white border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="uk-preset-button"
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">🇬🇧</div>
                  <div className="font-semibold text-gray-900">United Kingdom</div>
                  <div className="text-xs text-gray-600 mt-1">GBP • DD/MM/YYYY</div>
                </div>
              </button>
              <button
                onClick={() => handleCountryPreset('US')}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-white border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="us-preset-button"
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">🇺🇸</div>
                  <div className="font-semibold text-gray-900">United States</div>
                  <div className="text-xs text-gray-600 mt-1">USD • MM/DD/YYYY</div>
                </div>
              </button>
            </div>
          </div>

          {/* Initial Balance Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Initial Balance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="initial-balance" className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Bank Balance
                </label>
                <input
                  id="initial-balance"
                  type="number"
                  step="0.01"
                  value={initialBankBalance}
                  onChange={(e) => setInitialBankBalance(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  data-testid="initial-balance-input"
                  placeholder="0.00"
                />
                <p className="mt-1 text-sm text-gray-500">
                  The starting balance for your financial projections
                </p>
              </div>
              <div>
                <label htmlFor="initial-balance-date" className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Balance Date
                </label>
                <input
                  id="initial-balance-date"
                  type="date"
                  value={initialBalanceDate}
                  onChange={(e) => setInitialBalanceDate(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  data-testid="initial-balance-date-input"
                />
                <p className="mt-1 text-sm text-gray-500">
                  The date when this balance was/will be set
                </p>
              </div>
            </div>
          </div>

          {/* Display Preferences Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Display Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
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
                  Currency used for all monetary values
                </p>
              </div>
              <div>
                <label htmlFor="date-format" className="block text-sm font-medium text-gray-700 mb-2">
                  Date Format
                </label>
                <select
                  id="date-format"
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
                  Format used for displaying dates
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="settings-cancel-button"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="settings-save-button"
          >
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
