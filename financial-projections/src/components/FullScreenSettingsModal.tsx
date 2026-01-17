'use client';

import { useState, useEffect } from 'react';
import { Currency, DateFormat } from '@prisma/client';
import { useAppDispatch } from '@/lib/redux/hooks';
import { updateSettings } from '@/lib/redux/settingsSlice';
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
import { DatePicker } from '@/components/DatePicker';

interface BankAccount {
  id: string;
  name: string;
  sortCode: string;
  accountNumber: string;
  provider: string;
}

interface FullScreenSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: {
    id: string;
    initialBankBalance: number;
    initialBalanceDate: Date | string;
    currency: Currency;
    dateFormat: DateFormat;
    defaultBankAccountId?: string | null;
  };
  onUpdate: (settings: {
    initialBankBalance?: number;
    initialBalanceDate?: string;
    currency?: Currency;
    dateFormat?: DateFormat;
    defaultBankAccountId?: string;
  }) => Promise<void>;
}

type CountryPreset = 'UK' | 'US';

export default function FullScreenSettingsModal({
  isOpen,
  onClose,
  currentSettings,
  onUpdate,
}: FullScreenSettingsModalProps) {
  const dispatch = useAppDispatch();
  const [initialBankBalance, setInitialBankBalance] = useState<string>(
    currentSettings.initialBankBalance?.toString() || '0'
  );
  const [initialBalanceDate, setInitialBalanceDate] = useState<Date | undefined>();
  const [currency, setCurrency] = useState<Currency>(currentSettings.currency);
  const [dateFormat, setDateFormat] = useState<DateFormat>(currentSettings.dateFormat);
  const [defaultBankAccountId, setDefaultBankAccountId] = useState<string | undefined>(
    currentSettings.defaultBankAccountId || undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(true);

  // Initialize fields when currentSettings changes
  useEffect(() => {
    if (currentSettings.initialBalanceDate) {
      const date = typeof currentSettings.initialBalanceDate === 'string'
        ? new Date(currentSettings.initialBalanceDate)
        : currentSettings.initialBalanceDate;
      setInitialBalanceDate(date);
    }
    setInitialBankBalance(currentSettings.initialBankBalance?.toString() || '0');
    setCurrency(currentSettings.currency);
    setDateFormat(currentSettings.dateFormat);
    setDefaultBankAccountId(currentSettings.defaultBankAccountId || undefined);
  }, [currentSettings]);

  // Fetch bank accounts when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchBankAccounts = async () => {
        try {
          const response = await fetch('/api/bank-accounts');
          const data = await response.json();

          if (data.success && data.data) {
            setBankAccounts(data.data);
          }
        } catch (error) {
          console.error('Failed to fetch bank accounts:', error);
        } finally {
          setLoadingBankAccounts(false);
        }
      };

      fetchBankAccounts();
    }
  }, [isOpen]);

  const handleCountryPreset = (country: CountryPreset) => {
    if (country === 'UK') {
      setCurrency('GBP' as Currency);
      setDateFormat('UK' as DateFormat);
    } else {
      setCurrency('USD' as Currency);
      setDateFormat('US' as DateFormat);
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
        initialBalanceDate: initialBalanceDate.toISOString().split('T')[0],
        currency,
        dateFormat,
        defaultBankAccountId,
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
      setInitialBalanceDate(date);
    }
    setCurrency(currentSettings.currency);
    setDateFormat(currentSettings.dateFormat);
    setDefaultBankAccountId(currentSettings.defaultBankAccountId || undefined);
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
              <Button
                type="button"
                variant="outline"
                onClick={() => handleCountryPreset('UK')}
                disabled={isSubmitting}
                className="flex-1 h-auto py-3"
                data-testid="uk-preset-button"
              >
                <div className="text-center w-full">
                  <div className="text-2xl mb-1">🇬🇧</div>
                  <div className="font-semibold text-gray-900">United Kingdom</div>
                  <div className="text-xs text-gray-600 mt-1">GBP • DD/MM/YYYY</div>
                </div>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleCountryPreset('US')}
                disabled={isSubmitting}
                className="flex-1 h-auto py-3"
                data-testid="us-preset-button"
              >
                <div className="text-center w-full">
                  <div className="text-2xl mb-1">🇺🇸</div>
                  <div className="font-semibold text-gray-900">United States</div>
                  <div className="text-xs text-gray-600 mt-1">USD • MM/DD/YYYY</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Initial Balance Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Initial Balance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initial-balance">Initial Bank Balance</Label>
                <Input
                  id="initial-balance"
                  type="number"
                  step="0.01"
                  value={initialBankBalance}
                  onChange={(e) => setInitialBankBalance(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="0.00"
                  data-testid="initial-balance-input"
                />
                <p className="text-sm text-gray-500">
                  The starting balance for your financial projections
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="initial-balance-date">Initial Balance Date</Label>
                <DatePicker
                  value={initialBalanceDate}
                  onChange={setInitialBalanceDate}
                  disabled={isSubmitting}
                  placeholder="Select date"
                />
                <p className="text-sm text-gray-500">
                  The date when this balance was/will be set
                </p>
              </div>
            </div>
          </div>

          {/* Display Preferences Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Display Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)} disabled={isSubmitting}>
                  <SelectTrigger id="currency" data-testid="currency-select">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                    <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Currency used for all monetary values
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-format">Date Format</Label>
                <Select value={dateFormat} onValueChange={(value) => setDateFormat(value as DateFormat)} disabled={isSubmitting}>
                  <SelectTrigger id="date-format" data-testid="date-format-select">
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UK">UK Format (DD/MM/YYYY)</SelectItem>
                    <SelectItem value="US">US Format (MM/DD/YYYY)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Format used for displaying dates
                </p>
              </div>
            </div>
          </div>

          {/* Bank Accounts Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Accounts</h3>

            {loadingBankAccounts ? (
              <div className="text-center py-8 text-gray-500">
                Loading bank accounts...
              </div>
            ) : bankAccounts.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  No bank accounts found. Bank accounts will be automatically created when you import bank statements.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Default Bank Account Selector */}
                <div className="space-y-2">
                  <Label htmlFor="default-bank-account">Default Bank Account</Label>
                  <Select
                    value={defaultBankAccountId || 'none'}
                    onValueChange={(value) => setDefaultBankAccountId(value === 'none' ? undefined : value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="default-bank-account" data-testid="default-bank-account-select">
                      <SelectValue placeholder="Select default bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (select each time)</SelectItem>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({account.sortCode} - {account.accountNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    This account will be pre-selected when creating new events
                  </p>
                </div>

                {/* Bank Accounts List */}
                <div className="space-y-2">
                  <Label>Your Bank Accounts</Label>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                    {bankAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="p-4 flex items-center justify-between hover:bg-gray-50"
                        data-testid={`bank-account-item-${account.id}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{account.name}</h4>
                            {defaultBankAccountId === account.id && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex gap-4 mt-1 text-sm text-gray-600">
                            <span>Sort Code: {account.sortCode}</span>
                            <span>Account: {account.accountNumber}</span>
                            <span>Provider: {account.provider}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    Bank accounts are created automatically when importing CSV statements. Visit the Bank Records page to upload statements.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            data-testid="settings-cancel-button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            data-testid="settings-save-button"
          >
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
