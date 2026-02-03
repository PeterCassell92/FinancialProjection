'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, addMonths, startOfMonth } from 'date-fns';
import Header from '@/components/Header';
import FullScreenSettingsModal from '@/components/FullScreenSettingsModal';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { updateSettings, fetchSettings } from '@/lib/redux/settingsSlice';
import { formatCurrency } from '@/lib/utils/currency';
import { Currency, DateFormat } from '@prisma/client';
import { ErrorType } from '@/lib/errors/types';
import { DatabaseConnectionError } from '@/components/DatabaseConnectionError';
import { ErrorDisplay } from '@/components/ErrorDisplay';

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);

  const [monthOffset, setMonthOffset] = useState(0); // 0 for months 0-5, 6 for months 6-11
  const [isSettingsModalOpenManually, setIsSettingsModalOpenManually] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [hasCompletedWelcome, setHasCompletedWelcome] = useState(false);

  // Derive welcome mode from settings state - first-time users have no initial balance
  const isWelcomeMode = !settings.loading &&
                        settings.initialBankBalance == null &&
                        !hasCompletedWelcome;

  // Modal should be open if in welcome mode OR manually opened via burger menu
  const isSettingsModalOpen = isWelcomeMode || isSettingsModalOpenManually;

  const handleUpdateSettings = async (updates: {
    initialBankBalance?: number;
    initialBalanceDate?: string;
    currency?: Currency;
    dateFormat?: DateFormat;
  }) => {
    await dispatch(updateSettings(updates)).unwrap();
    // Mark welcome as completed when settings are saved for the first time
    if (isWelcomeMode) {
      setHasCompletedWelcome(true);
    }
  };

  // Generate links for the next 6 months based on offset
  const currentMonth = startOfMonth(new Date());
  const monthLinks = Array.from({ length: 6 }, (_, i) => {
    const month = addMonths(currentMonth, monthOffset + i);
    return {
      date: month,
      label: format(month, 'MMMM yyyy'),
      path: `/projections/${format(month, 'yyyy-MM')}`,
    };
  });

  const handleShowNextSix = () => {
    setMonthOffset(6);
  };

  const handleShowFirstSix = () => {
    setMonthOffset(0);
  };

  const handleRetryFetchSettings = () => {
    dispatch(fetchSettings());
  };

  // Show loading state
  if (settings.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" data-testid="dashboard-loading">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Show database connection error as full-page error
  if (settings.error?.type === ErrorType.DATABASE_CONNECTION) {
    return (
      <DatabaseConnectionError
        onRetry={handleRetryFetchSettings}
        technicalDetails={settings.error.technicalDetails}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="dashboard">
      {/* Header with Burger Menu */}
      <Header
        onOpenSettings={() => setIsSettingsModalOpenManually(true)}
        onOpenInfo={() => setIsInfoModalOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display - show other errors inline */}
        {settings.error && (
          <div className="mb-6" data-testid="dashboard-error">
            <ErrorDisplay
              error={settings.error}
              onRetry={handleRetryFetchSettings}
              variant="inline"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Monthly Projections Card */}
          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6" data-testid="monthly-projections-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Monthly Projections</h2>
              <div className="flex gap-2">
                {monthOffset > 0 && (
                  <button
                    onClick={handleShowFirstSix}
                    className="text-sm px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                    data-testid="show-first-six-button"
                  >
                    First 6
                  </button>
                )}
                {monthOffset === 0 && (
                  <button
                    onClick={handleShowNextSix}
                    className="text-sm px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors font-medium"
                    data-testid="show-next-six-button"
                  >
                    Next 6 →
                  </button>
                )}
              </div>
            </div>
            <p className="text-slate-600 mb-4 text-sm">
              {monthOffset === 0
                ? 'Viewing months 1-6'
                : 'Viewing months 7-12'}
            </p>
            <div className="space-y-2">
              {monthLinks.map((month, index) => (
                <Link
                  key={month.path}
                  href={month.path}
                  className="block px-4 py-3 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-md transition-all"
                  data-testid={`month-link__${index}`}
                >
                  <span className="text-slate-900 font-medium">{month.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Column: Data Views & Bank Records */}
          <div className="space-y-6">
            {/* Data Views Card */}
            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6" data-testid="data-views-card">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Data Views</h2>
              <p className="text-slate-600 mb-4">
                Visualize your financial data with charts and analytics
              </p>
              <Link
                href="/data-views"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                data-testid="data-views-link"
              >
                View Analytics
              </Link>
            </div>

            {/* Bank Records Card */}
            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6" data-testid="bank-records-card">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Bank Records</h2>
              <p className="text-slate-600 mb-6">
                Import and manage actual bank statement data
              </p>
              <div className="space-y-3">
                <Link
                  href="/bank-records"
                  className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                  data-testid="manage-transaction-records-link"
                >
                  Manage Transaction Records
                </Link>
                <Link
                  href="/bank-records/transactions"
                  className="block w-full text-center px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors border border-slate-300 font-medium"
                  data-testid="view-transaction-records-link"
                >
                  View Transaction Records
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-6 shadow-sm" data-testid="info-card__projections">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Projection Events</h3>
            <p className="text-blue-800 text-sm leading-relaxed">
              Track expected expenses and incoming payments with different certainty levels
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-lg p-6 shadow-sm" data-testid="info-card__balance">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Daily Balances</h3>
            <p className="text-slate-700 text-sm leading-relaxed">
              Set actual balances and see calculated projections for each day
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 rounded-lg p-6 shadow-sm" data-testid="info-card__recurring">
            <h3 className="text-lg font-semibold text-indigo-900 mb-2">Recurring Events</h3>
            <p className="text-indigo-800 text-sm leading-relaxed">
              Create recurring events that repeat monthly or on specific dates
            </p>
          </div>
        </div>
      </div>

      {/* Full-Screen Settings Modal */}
      {settings.id && (
        <FullScreenSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => {
            // In welcome mode, don't allow closing without setting balance
            if (!isWelcomeMode) {
              setIsSettingsModalOpenManually(false);
            }
          }}
          currentSettings={{
            id: settings.id,
            initialBankBalance: settings.initialBankBalance ?? 0,
            initialBalanceDate: settings.initialBalanceDate || new Date().toISOString(),
            currency: settings.currency,
            dateFormat: settings.dateFormat,
            defaultBankAccountId: settings.defaultBankAccountId,
          }}
          onUpdate={handleUpdateSettings}
        />
      )}

      {/* Info Modal (placeholder) */}
      {isInfoModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsInfoModalOpen(false)}
          data-testid="info-modal-overlay"
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
            data-testid="info-modal"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">About Financial Projections</h2>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                data-testid="info-modal-close-button"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="prose max-w-none">
              <p className="text-gray-600 mb-4">
                This application helps you project your bank balance forward through time by tracking expected expenses and income.
              </p>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Features:</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Track projection events with different certainty levels (unlikely, possible, likely, certain)</li>
                <li>Create recurring events that automatically generate across date ranges</li>
                <li>View daily balance projections in a calendar format</li>
                <li>Set actual balances to override calculated projections</li>
                <li>Visualize financial trends with charts and analytics</li>
                <li>Customize currency and date format preferences</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
