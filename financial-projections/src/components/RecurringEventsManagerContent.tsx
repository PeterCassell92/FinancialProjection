'use client';

import { useState, useEffect } from 'react';
import { Calendar, Repeat } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import SidebarPanelCard from './SidebarPanelCard';
import { formatDate } from '@/lib/utils/date-format';
import { useAppSelector } from '@/lib/redux/hooks';

interface RecurringEventRule {
  id: string;
  name: string;
  description: string | null;
  value: number;
  type: 'EXPENSE' | 'INCOMING';
  certainty: string;
  payTo: string | null;
  paidBy: string | null;
  startDate: string;
  endDate: string;
  frequency: string;
  eventsCount?: number;
}

interface RecurringEventsManagerContentProps {
  onEditRule: (ruleId: string) => void;
  onRuleDeleted?: () => void;
  onCreateRule?: () => void;
}

export default function RecurringEventsManagerContent({
  onEditRule,
  onRuleDeleted,
  onCreateRule,
}: RecurringEventsManagerContentProps) {
  const [rules, setRules] = useState<RecurringEventRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExpired, setShowExpired] = useState(true);

  const currency = useAppSelector((state) => state.settings.currency);
  const dateFormat = useAppSelector((state) => state.settings.dateFormat);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmVariant?: 'default' | 'destructive';
    isLoading?: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/recurring-event-rules');
      const data = await response.json();

      if (data.success) {
        setRules(data.data);
      } else {
        setError(data.error || 'Failed to load recurring rules');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rules.length === 0) {
      fetchRules();
    }
  }, []);

  const handleDelete = async (rule: RecurringEventRule) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Recurring Event Rule',
      description: `Are you sure you want to delete "${rule.name}"? This will remove all ${rule.eventsCount || 'generated'} projection events created by this rule. This action cannot be undone.`,
      confirmText: 'Delete',
      confirmVariant: 'destructive',
      onConfirm: async () => {
        // Optimistic update: Remove from local state immediately
        setRules(prev => prev.filter(r => r.id !== rule.id));

        // Close modal immediately
        setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));

        // Call API in the background
        try {
          const response = await fetch(`/api/recurring-event-rules/${rule.id}`, {
            method: 'DELETE',
          });

          const data = await response.json();

          if (data.success) {
            // Notify parent to refresh projections
            if (onRuleDeleted) {
              onRuleDeleted();
            }
          } else {
            // Rollback: Restore the rule if API call failed
            setRules(prev => [...prev, rule].sort((a, b) => a.name.localeCompare(b.name)));
            alert(data.error || 'Failed to delete recurring rule');
          }
        } catch (err) {
          // Rollback: Restore the rule if API call failed
          setRules(prev => [...prev, rule].sort((a, b) => a.name.localeCompare(b.name)));
          alert('Failed to delete recurring rule');
        }
      },
    });
  };

  const handleDoubleClick = (ruleId: string) => {
    onEditRule(ruleId);
  };

  const isRuleExpired = (rule: RecurringEventRule): boolean => {
    const endDate = new Date(rule.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day for comparison
    return endDate < today;
  };

  // Filter rules based on the showExpired toggle
  const filteredRules = showExpired
    ? rules
    : rules.filter(rule => !isRuleExpired(rule));

  const getFrequencyLabel = (frequency: string): string => {
    const labels: Record<string, string> = {
      DAILY: 'Daily',
      WEEKLY: 'Weekly',
      MONTHLY: 'Monthly',
      QUARTERLY: 'Quarterly',
      BIANNUAL: 'Bi-annual',
      ANNUAL: 'Annual',
    };
    return labels[frequency] || frequency;
  };

  const getCertaintyColor = (certainty: string): string => {
    const colors: Record<string, string> = {
      UNLIKELY: 'bg-gray-100 text-gray-700',
      POSSIBLE: 'bg-yellow-100 text-yellow-800',
      LIKELY: 'bg-blue-100 text-blue-800',
      CERTAIN: 'bg-green-100 text-green-800',
    };
    return colors[certainty] || 'bg-gray-100 text-gray-700';
  };

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Repeat className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Recurring Events</h2>
            </div>
            {onCreateRule && (
              <button
                onClick={onCreateRule}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                data-testid="create-recurring-rule-button"
              >
                Create
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600">
            Double-click to edit, click bin to delete
          </p>
        </div>

        {/* Filter Bar */}
        <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Filters</span>
            <label className="flex items-center gap-2 cursor-pointer" data-testid="show-expired-toggle">
              <span className="text-sm text-gray-600">Show Expired</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showExpired}
                  onChange={(e) => setShowExpired(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>
          </div>
        </div>

        {/* Rules List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-gray-500">Loading...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={fetchRules}
                className="mt-2 text-xs text-red-700 hover:text-red-900 font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredRules.length === 0 && rules.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Calendar className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">No recurring events yet</p>
              <p className="text-xs text-gray-400 mt-1">
                {onCreateRule ? 'Click Create to add one' : 'Create one from the calendar'}
              </p>
            </div>
          )}

          {!loading && !error && filteredRules.length === 0 && rules.length > 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Calendar className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">No active recurring events</p>
              <p className="text-xs text-gray-400 mt-1">
                All rules are expired. Toggle "Show Expired" to see them.
              </p>
            </div>
          )}

          {!loading && !error && filteredRules.length > 0 && (
            <div className="space-y-2">
              {filteredRules.map((rule) => {
                const badges = [
                  {
                    text: rule.certainty.toLowerCase(),
                    color: getCertaintyColor(rule.certainty),
                  },
                ];

                if (isRuleExpired(rule)) {
                  badges.push({
                    text: 'expired',
                    color: 'bg-gray-200 text-gray-600',
                  });
                }

                return (
                  <SidebarPanelCard
                    key={rule.id}
                    title={rule.name}
                    value={rule.value}
                    valueType={rule.type}
                    currency={currency}
                    description={rule.description}
                    badges={badges}
                    metadata={
                      <>
                        <div className="flex items-center gap-1 mb-1">
                          <Repeat className="h-3 w-3" />
                          <span>{getFrequencyLabel(rule.frequency)}</span>
                        </div>
                        <div>
                          {formatDate(new Date(rule.startDate), dateFormat)} →{' '}
                          {formatDate(new Date(rule.endDate), dateFormat)}
                        </div>
                      </>
                    }
                    onDoubleClick={() => handleDoubleClick(rule.id)}
                    onDelete={() => handleDelete(rule)}
                    testId={`recurring-rule-${rule.id}`}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        {!loading && !error && rules.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={fetchRules}
              className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
              data-testid="refresh-recurring-rules"
            >
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText={confirmModal.confirmText}
        confirmVariant={confirmModal.confirmVariant}
        isLoading={confirmModal.isLoading}
      />
    </>
  );
}
