'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  addMonths,
  subMonths,
  parseISO,
  isSameDay,
} from 'date-fns';
import DayDetailModal from '@/components/DayDetailModal';
import ScenarioPanel from '@/components/ScenarioPanel';
import SaveScenarioModal from '@/components/SaveScenarioModal';
import { RecurringEventsPanel } from '@/components/RecurringEventsPanel';
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

interface DayData {
  date: Date;
  events: ProjectionEvent[];
  balance: DailyBalance | null;
  isCurrentMonth: boolean;
}

export default function MonthlyProjection() {
  const params = useParams();
  const router = useRouter();
  const monthId = params.monthId as string;
  const currency = useAppSelector((state) => state.settings.currency);
  const defaultBankAccountId = useAppSelector((state) => state.settings.defaultBankAccountId);
  const currentDecisionPathStates = useAppSelector((state) => state.scenario.currentDecisionPathStates);

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ProjectionEvent[]>([]);
  const [balances, setBalances] = useState<DailyBalance[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Parse monthId (format: YYYY-MM)
  const currentMonth = parseISO(`${monthId}-01`);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  useEffect(() => {
    fetchData();
  }, [monthId]);

  // Recalculate balances when decision path states change
  useEffect(() => {
    if (Object.keys(currentDecisionPathStates).length > 0) {
      recalculateBalances();
    }
  }, [currentDecisionPathStates]);

  const recalculateBalances = async () => {
    if (!defaultBankAccountId) {
      console.error('No default bank account set');
      return;
    }

    try {
      // Get enabled decision path IDs
      const enabledDecisionPathIds = Object.entries(currentDecisionPathStates)
        .filter(([_, enabled]) => enabled)
        .map(([id, _]) => id);

      // Trigger balance recalculation for the default bank account
      await fetch('/api/calculate-balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: format(monthStart, 'yyyy-MM-dd'),
          endDate: format(monthEnd, 'yyyy-MM-dd'),
          bankAccountId: defaultBankAccountId,
          enabledDecisionPathIds,
        }),
      });

      // Refresh balances
      const balancesResponse = await fetch(
        `/api/daily-balance?startDate=${format(monthStart, 'yyyy-MM-dd')}&endDate=${format(monthEnd, 'yyyy-MM-dd')}&bankAccountId=${defaultBankAccountId}`
      );
      const balancesData = await balancesResponse.json();

      if (balancesData.success) {
        setBalances(balancesData.data || []);
      }
    } catch (err) {
      console.error('Failed to recalculate balances:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch events for this month
      const eventsResponse = await fetch(
        `/api/projection-events?startDate=${format(monthStart, 'yyyy-MM-dd')}&endDate=${format(monthEnd, 'yyyy-MM-dd')}`
      );
      const eventsData = await eventsResponse.json();

      // Set events data
      if (eventsData.success) {
        setEvents(eventsData.data || []);
      }

      // Fetch balances for this month (only if we have a default bank account)
      if (defaultBankAccountId) {
        const balancesResponse = await fetch(
          `/api/daily-balance?startDate=${format(monthStart, 'yyyy-MM-dd')}&endDate=${format(monthEnd, 'yyyy-MM-dd')}&bankAccountId=${defaultBankAccountId}`
        );
        const balancesData = await balancesResponse.json();

        if (balancesData.success) {
          setBalances(balancesData.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate calendar grid (including padding days)
  const generateCalendar = (): DayData[] => {
    const days: DayData[] = [];
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Add padding days for start of month
    const startDay = getDay(monthStart);
    for (let i = 0; i < startDay; i++) {
      const paddingDate = new Date(monthStart);
      paddingDate.setDate(paddingDate.getDate() - (startDay - i));
      days.push({
        date: paddingDate,
        events: [],
        balance: null,
        isCurrentMonth: false,
      });
    }

    // Add actual month days
    monthDays.forEach((date) => {
      const dayEvents = events.filter((e) => isSameDay(parseISO(e.date), date));
      const dayBalance = balances.find((b) => isSameDay(parseISO(b.date), date)) || null;

      days.push({
        date,
        events: dayEvents,
        balance: dayBalance,
        isCurrentMonth: true,
      });
    });

    // Add padding days for end of month
    const endDay = getDay(monthEnd);
    const remainingDays = 6 - endDay;
    for (let i = 1; i <= remainingDays; i++) {
      const paddingDate = new Date(monthEnd);
      paddingDate.setDate(paddingDate.getDate() + i);
      days.push({
        date: paddingDate,
        events: [],
        balance: null,
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const handleDayClick = (dayData: DayData) => {
    if (!dayData.isCurrentMonth) return;
    setSelectedDay(dayData);
    setShowDayModal(true);
  };

  const handlePreviousMonth = () => {
    const prevMonth = subMonths(currentMonth, 1);
    router.push(`/projections/${format(prevMonth, 'yyyy-MM')}`);
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    router.push(`/projections/${format(nextMonth, 'yyyy-MM')}`);
  };

  const calendarDays = generateCalendar();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" data-testid="projection-loading">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" data-testid="monthly-projection">
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
              data-testid="back-to-dashboard"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="month-title">
              {format(currentMonth, 'MMMM yyyy')}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousMonth}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              data-testid="prev-month-button"
            >
              ← Previous
            </button>
            <button
              onClick={handleNextMonth}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              data-testid="next-month-button"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow overflow-hidden" data-testid="calendar">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="py-3 text-center text-sm font-semibold text-gray-700"
                data-testid={`day-header__${day.toLowerCase()}`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((dayData, index) => {
              const hasEvents = dayData.events.length > 0;
              const hasActualBalance = dayData.balance?.actualBalance != null;
              const actualBalance = dayData.balance?.actualBalance || 0;
              const expectedBalance = dayData.balance?.expectedBalance || 0;

              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(dayData)}
                  className={`
                    min-h-[120px] border-b border-r p-2 cursor-pointer transition-colors
                    ${dayData.isCurrentMonth ? 'bg-white hover:bg-blue-50' : 'bg-gray-50'}
                    ${!dayData.isCurrentMonth && 'cursor-default'}
                  `}
                  data-testid={`day-cell__${format(dayData.date, 'd')}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span
                      className={`text-sm font-medium ${
                        dayData.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      }`}
                      data-testid={`day-number__${format(dayData.date, 'd')}`}
                    >
                      {format(dayData.date, 'd')}
                    </span>
                  </div>

                  {dayData.isCurrentMonth && (
                    <>
                      {/* Events indicator */}
                      {hasEvents && (
                        <div className="mb-1">
                          <div className="text-xs text-gray-600" data-testid={`events-count__${format(dayData.date, 'd')}`}>
                            {dayData.events.length} event{dayData.events.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      )}

                      {/* Actual Balance - Orange pill */}
                      {hasActualBalance && (
                        <div className="mb-1">
                          <span
                            className="inline-block bg-orange-500 text-black font-bold text-xs px-2 py-1 rounded-full"
                            data-testid={`actual-balance__${format(dayData.date, 'd')}`}
                          >
                            {formatCurrency(actualBalance, currency).replace(/\.\d+$/, '')}
                          </span>
                        </div>
                      )}

                      {/* Expected Balance */}
                      {dayData.balance && !hasActualBalance && (
                        <div className="text-xs">
                          <span
                            className={`font-semibold ${
                              expectedBalance >= 0 ? 'text-green-700' : 'text-red-700'
                            }`}
                            data-testid={`expected-balance__${format(dayData.date, 'd')}`}
                          >
                            {formatCurrency(expectedBalance, currency).replace(/\.\d+$/, '')}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4" data-testid="summary-events">
            <div className="text-sm text-gray-600">Total Events</div>
            <div className="text-2xl font-bold text-gray-900">{events.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4" data-testid="summary-expenses">
            <div className="text-sm text-gray-600">Total Expenses</div>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(events.filter((e) => e.type === 'EXPENSE').reduce((sum, e) => sum + e.value, 0), currency)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4" data-testid="summary-income">
            <div className="text-sm text-gray-600">Total Income</div>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(events.filter((e) => e.type === 'INCOMING').reduce((sum, e) => sum + e.value, 0), currency)}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Scenario Panel */}
      <ScenarioPanel />

      {/* Recurring Events Panel */}
      <RecurringEventsPanel
        onEditRule={(ruleId) => {
          // TODO: Open edit modal for recurring rule
          setEditingRuleId(ruleId);
          console.log('Edit recurring rule:', ruleId);
        }}
        onRuleDeleted={() => {
          // Refresh events and balances after rule deletion
          fetchData();
        }}
      />

      {/* Day Detail Modal */}
      {showDayModal && selectedDay && (
        <DayDetailModal
          date={selectedDay.date}
          events={selectedDay.events}
          balance={selectedDay.balance}
          onClose={() => setShowDayModal(false)}
          onRefresh={fetchData}
        />
      )}

      {/* Save Scenario Modal */}
      <SaveScenarioModal />
    </div>
  );
}
