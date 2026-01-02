'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, addMonths, eachMonthOfInterval, parseISO } from 'date-fns';
import { useAppSelector } from '@/lib/redux/hooks';
import { formatCurrency } from '@/lib/utils/currency';

interface ProjectionEvent {
  id: string;
  name: string;
  value: number;
  type: 'EXPENSE' | 'INCOMING';
  certainty: 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'CERTAIN';
  date: string;
}

interface DailyBalance {
  id: string;
  date: string;
  expectedBalance: number;
  actualBalance: number | null;
}

interface MonthlyData {
  month: string;
  expenses: number;
  income: number;
}

export default function DataViews() {
  const currency = useAppSelector((state) => state.settings.currency);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ProjectionEvent[]>([]);
  const [balances, setBalances] = useState<DailyBalance[]>([]);
  const [viewType, setViewType] = useState<'monthly-comparison' | 'balance-over-time'>('monthly-comparison');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch events for the next 6 months
      const today = new Date();
      const startDate = startOfMonth(today);
      const endDate = endOfMonth(addMonths(today, 5));

      const eventsResponse = await fetch(
        `/api/projection-events?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
      );
      const eventsData = await eventsResponse.json();

      const balancesResponse = await fetch(
        `/api/daily-balance?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
      );
      const balancesData = await balancesResponse.json();

      if (eventsData.success) {
        setEvents(eventsData.data || []);
      }

      if (balancesData.success) {
        setBalances(balancesData.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate monthly aggregated data
  const getMonthlyData = (): MonthlyData[] => {
    const today = new Date();
    const months = eachMonthOfInterval({
      start: startOfMonth(today),
      end: addMonths(startOfMonth(today), 5),
    });

    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthEvents = events.filter((e) => {
        const eventDate = parseISO(e.date);
        return eventDate >= monthStart && eventDate <= monthEnd && e.certainty !== 'UNLIKELY';
      });

      const expenses = monthEvents
        .filter((e) => e.type === 'EXPENSE')
        .reduce((sum, e) => sum + e.value, 0);

      const income = monthEvents
        .filter((e) => e.type === 'INCOMING')
        .reduce((sum, e) => sum + e.value, 0);

      return {
        month: format(month, 'MMM yyyy'),
        expenses,
        income,
      };
    });
  };

  const monthlyData = getMonthlyData();

  // Find max value for chart scaling
  const maxValue = Math.max(...monthlyData.flatMap((d) => [d.expenses, d.income]), 1);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" data-testid="data-views-loading">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="data-views">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
            data-testid="back-to-dashboard"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
            Data Views & Analytics
          </h1>
          <p className="mt-2 text-gray-600">
            Visualize your financial projections over the next 6 months
          </p>
        </div>

        {/* View Selector */}
        <div className="mb-6 flex gap-2" data-testid="view-selector">
          <button
            onClick={() => setViewType('monthly-comparison')}
            className={`px-4 py-2 rounded-lg ${
              viewType === 'monthly-comparison'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
            data-testid="monthly-comparison-button"
          >
            Monthly Income vs Expenses
          </button>
          <button
            onClick={() => setViewType('balance-over-time')}
            className={`px-4 py-2 rounded-lg ${
              viewType === 'balance-over-time'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
            data-testid="balance-over-time-button"
          >
            Balance Over Time
          </button>
        </div>

        {/* Charts */}
        {viewType === 'monthly-comparison' && (
          <div className="bg-white rounded-lg shadow p-6" data-testid="monthly-comparison-chart">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Monthly Income vs Expenses
            </h2>

            {monthlyData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No data available. Add some projection events to see charts.
              </div>
            ) : (
              <div className="space-y-6">
                {monthlyData.map((data, index) => {
                  const expensePercent = (data.expenses / maxValue) * 100;
                  const incomePercent = (data.income / maxValue) * 100;
                  const netAmount = data.income - data.expenses;

                  return (
                    <div key={index} data-testid={`month-comparison__${index}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{data.month}</span>
                        <span
                          className={`text-sm font-semibold ${
                            netAmount >= 0 ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          Net: {netAmount >= 0 ? '+' : ''}{formatCurrency(netAmount, currency)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {/* Expenses bar */}
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Expenses</span>
                            <span className="text-red-700 font-semibold">
                              {formatCurrency(data.expenses, currency)}
                            </span>
                          </div>
                          <div className="h-8 bg-gray-100 rounded overflow-hidden">
                            <div
                              className="h-full bg-red-500 transition-all"
                              style={{ width: `${expensePercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Income bar */}
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Income</span>
                            <span className="text-green-700 font-semibold">
                              {formatCurrency(data.income, currency)}
                            </span>
                          </div>
                          <div className="h-8 bg-gray-100 rounded overflow-hidden">
                            <div
                              className="h-full bg-green-500 transition-all"
                              style={{ width: `${incomePercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {viewType === 'balance-over-time' && (
          <div className="bg-white rounded-lg shadow p-6" data-testid="balance-over-time-chart">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Expected Balance Over Time
            </h2>

            {balances.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No balance data available. Balances are calculated when you add events.
              </div>
            ) : (
              <div className="h-64 relative">
                {/* Simple line chart using SVG */}
                <svg className="w-full h-full" viewBox="0 0 800 300">
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={i * 60}
                      x2="800"
                      y2={i * 60}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Data line */}
                  {balances.length > 1 && (() => {
                    const minBalance = Math.min(...balances.map((b) => b.expectedBalance));
                    const maxBalance = Math.max(...balances.map((b) => b.expectedBalance));
                    const range = maxBalance - minBalance || 1;

                    const points = balances.map((balance, index) => {
                      const x = (index / (balances.length - 1)) * 800;
                      const y = 250 - ((balance.expectedBalance - minBalance) / range) * 200;
                      return `${x},${y}`;
                    }).join(' ');

                    return (
                      <polyline
                        points={points}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                      />
                    );
                  })()}
                </svg>

                <div className="mt-4 text-sm text-gray-600 text-center">
                  {format(parseISO(balances[0].date), 'MMM d')} to{' '}
                  {format(parseISO(balances[balances.length - 1].date), 'MMM d, yyyy')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4" data-testid="stat-total-events">
            <div className="text-sm text-gray-600">Total Events</div>
            <div className="text-2xl font-bold text-gray-900">{events.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4" data-testid="stat-total-expenses">
            <div className="text-sm text-gray-600">Total Expenses</div>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(
                events
                  .filter((e) => e.type === 'EXPENSE' && e.certainty !== 'UNLIKELY')
                  .reduce((sum, e) => sum + e.value, 0),
                currency
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4" data-testid="stat-total-income">
            <div className="text-sm text-gray-600">Total Income</div>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(
                events
                  .filter((e) => e.type === 'INCOMING' && e.certainty !== 'UNLIKELY')
                  .reduce((sum, e) => sum + e.value, 0),
                currency
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4" data-testid="stat-net-total">
            <div className="text-sm text-gray-600">Net Total</div>
            <div
              className={`text-2xl font-bold ${
                events
                  .filter((e) => e.certainty !== 'UNLIKELY')
                  .reduce(
                    (sum, e) => sum + (e.type === 'INCOMING' ? e.value : -e.value),
                    0
                  ) >= 0
                  ? 'text-green-700'
                  : 'text-red-700'
              }`}
            >
              {formatCurrency(
                events
                  .filter((e) => e.certainty !== 'UNLIKELY')
                  .reduce(
                    (sum, e) => sum + (e.type === 'INCOMING' ? e.value : -e.value),
                    0
                  ),
                currency
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
