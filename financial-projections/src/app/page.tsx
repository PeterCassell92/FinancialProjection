'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format, addMonths, startOfMonth } from 'date-fns';
import UpdateInitialBalanceModal from '@/components/UpdateInitialBalanceModal';
import { SettingsResponseSchema } from '@/lib/schemas/api-responses';

interface Settings {
  id: string;
  initialBankBalance?: number | null;
  initialBalanceDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0); // 0 for months 0-5, 6 for months 6-11
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWelcomeMode, setIsWelcomeMode] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const rawData = await response.json();

      // Validate response with Zod
      const validationResult = SettingsResponseSchema.safeParse(rawData);

      if (!validationResult.success) {
        console.error('Invalid API response:', validationResult.error);
        setError('Received invalid data from server');
        return;
      }

      const data = validationResult.data;

      if (data.success && data.data) {
        setSettings(data.data);

        // Check if this is a first-time user (initial balance not set)
        // initialBankBalance will be null or undefined for first-time users
        const isFirstTime = data.data.initialBankBalance == null;
        if (isFirstTime) {
          setIsWelcomeMode(true);
          setIsModalOpen(true);
        }
      } else {
        setError(data.error || 'Failed to fetch settings');
      }
    } catch (err) {
      setError('Failed to connect to API');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = async (balance: number, date: string) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialBankBalance: balance,
          initialBalanceDate: date,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
      } else {
        throw new Error(data.error || 'Failed to update balance');
      }
    } catch (err) {
      throw err; // Re-throw to be handled by modal
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" data-testid="dashboard-loading">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="dashboard-title">
            Financial Projections
          </h1>
          <p className="mt-2 text-gray-600">
            Track your expected expenses and income over the next 6 months
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4" data-testid="dashboard-error">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Settings Card */}
        <div className="bg-white rounded-lg shadow mb-8 p-6" data-testid="settings-card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Initial Bank Balance</p>
              <p className="text-2xl font-bold text-gray-900" data-testid="initial-balance">
                ${settings?.initialBankBalance != null ? settings.initialBankBalance.toFixed(2) : 'Not Set'}
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              data-testid="update-balance-button"
            >
              Update Balance
            </button>
          </div>
        </div>

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

      {/* Update Initial Balance Modal */}
      {settings && (
        <UpdateInitialBalanceModal
          isOpen={isModalOpen}
          onClose={() => {
            // In welcome mode, don't allow closing without setting balance
            if (!isWelcomeMode) {
              setIsModalOpen(false);
            }
          }}
          currentBalance={settings.initialBankBalance ?? 0}
          currentDate={settings.initialBalanceDate ? format(new Date(settings.initialBalanceDate), 'yyyy-MM-dd') : undefined}
          onUpdate={handleUpdateBalance}
          welcomeMode={isWelcomeMode}
        />
      )}
    </div>
  );
}
