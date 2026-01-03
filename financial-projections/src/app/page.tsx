'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format, addMonths, startOfMonth } from 'date-fns';
import Header from '@/components/Header';
import FullScreenSettingsModal from '@/components/FullScreenSettingsModal';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { updateSettings } from '@/lib/redux/settingsSlice';
import { formatCurrency } from '@/lib/utils/currency';
import { Currency, DateFormat } from '@prisma/client';

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);

  const [monthOffset, setMonthOffset] = useState(0); // 0 for months 0-5, 6 for months 6-11
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [hasCompletedWelcome, setHasCompletedWelcome] = useState(false);

  // Derive welcome mode from settings state - first-time users have no initial balance
  const isWelcomeMode = !settings.loading &&
                        settings.initialBankBalance == null &&
                        !hasCompletedWelcome;

  // Open settings modal automatically for first-time users
  useEffect(() => {
    if (isWelcomeMode && !isSettingsModalOpen) {
      setIsSettingsModalOpen(true);
    }
  }, [isWelcomeMode, isSettingsModalOpen]);

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

  if (settings.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" data-testid="dashboard-loading">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="dashboard">
      {/* Header with Burger Menu */}
      <Header
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenInfo={() => setIsInfoModalOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {settings.error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4" data-testid="dashboard-error">
            <p className="text-red-800">{settings.error}</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Monthly Projections Card */}
          <div className="bg-white rounded-lg shadow p-6" data-testid="monthly-projections-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Monthly Projections</h2>
              <div className="flex gap-2">
                {monthOffset > 0 && (
                  <button
                    onClick={handleShowFirstSix}
                    className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                    data-testid="show-first-six-button"
                  >
                    First 6
                  </button>
                )}
                {monthOffset === 0 && (
                  <button
                    onClick={handleShowNextSix}
                    className="text-sm px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
                    data-testid="show-next-six-button"
                  >
                    Next 6 →
                  </button>
                )}
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              {monthOffset === 0
                ? 'Viewing months 1-6'
                : 'Viewing months 7-12'}
            </p>
            <div className="space-y-2">
              {monthLinks.map((month, index) => (
                <Link
                  key={month.path}
                  href={month.path}
                  className="block px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
                  data-testid={`month-link__${index}`}
                >
                  <span className="text-gray-900 font-medium">{month.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Data Views Card */}
          <div className="bg-white rounded-lg shadow p-6" data-testid="data-views-card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Views</h2>
            <p className="text-gray-600 mb-4">
              Visualize your financial data with charts and analytics
            </p>
            <Link
              href="/data-views"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              data-testid="data-views-link"
            >
              View Analytics
            </Link>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-6" data-testid="info-card__projections">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Projection Events</h3>
            <p className="text-blue-700 text-sm">
              Track expected expenses and incoming payments with different certainty levels
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-6" data-testid="info-card__balance">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Daily Balances</h3>
            <p className="text-green-700 text-sm">
              Set actual balances and see calculated projections for each day
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-6" data-testid="info-card__recurring">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Recurring Events</h3>
            <p className="text-purple-700 text-sm">
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
              setIsSettingsModalOpen(false);
            }
          }}
          currentSettings={{
            id: settings.id,
            initialBankBalance: settings.initialBankBalance ?? 0,
            initialBalanceDate: settings.initialBalanceDate || new Date().toISOString(),
            currency: settings.currency,
            dateFormat: settings.dateFormat,
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
