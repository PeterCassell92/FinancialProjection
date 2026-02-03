'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Calendar, Repeat } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
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

interface RecurringEventsPanelProps {
  onEditRule: (ruleId: string) => void;
  onRuleDeleted?: () => void;
}

export function RecurringEventsPanel({ onEditRule, onRuleDeleted }: RecurringEventsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rules, setRules] = useState<RecurringEventRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (isExpanded && rules.length === 0) {
      fetchRules();
    }
  }, [isExpanded]);

  const handleDelete = async (rule: RecurringEventRule) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Recurring Event Rule',
      description: `Are you sure you want to delete "${rule.name}"? This will remove all ${rule.eventsCount || 'generated'} projection events created by this rule. This action cannot be undone.`,
      confirmText: 'Delete',
      confirmVariant: 'destructive',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));

        try {
          const response = await fetch(`/api/recurring-event-rules/${rule.id}`, {
            method: 'DELETE',
          });

          const data = await response.json();

          if (data.success) {
            // Remove from local state
            setRules(prev => prev.filter(r => r.id !== rule.id));
            setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));

            // Notify parent to refresh projections
            if (onRuleDeleted) {
              onRuleDeleted();
            }
          } else {
            alert(data.error || 'Failed to delete recurring rule');
            setConfirmModal(prev => ({ ...prev, isLoading: false }));
          }
        } catch (err) {
          alert('Failed to delete recurring rule');
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const handleDoubleClick = (ruleId: string) => {
    onEditRule(ruleId);
  };

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
      <div
        className={`fixed top-0 right-0 h-full bg-white border-l border-gray-200 shadow-lg transition-all duration-300 ease-in-out z-40 ${
          isExpanded ? 'w-96' : 'w-12'
        }`}
        data-testid="recurring-events-panel"
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-1/2 -left-6 transform -translate-y-1/2 bg-white border border-gray-200 rounded-l-lg p-2 shadow-md hover:bg-gray-50 transition-colors"
          data-testid="recurring-events-panel-toggle"
          aria-label={isExpanded ? 'Collapse recurring events panel' : 'Expand recurring events panel'}
        >
          {isExpanded ? (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          )}
        </button>

        {/* Panel Content */}
        {isExpanded && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Repeat className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Recurring Events</h2>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Double-click to edit, click bin to delete
              </p>
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

              {!loading && !error && rules.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <Calendar className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No recurring events yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Create one from the calendar
                  </p>
                </div>
              )}

              {!loading && !error && rules.length > 0 && (
                <div className="space-y-2">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      onDoubleClick={() => handleDoubleClick(rule.id)}
                      className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
                      data-testid={`recurring-rule-${rule.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-sm text-gray-900 truncate">
                              {rule.name}
                            </h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${getCertaintyColor(rule.certainty)}`}
                            >
                              {rule.certainty.toLowerCase()}
                            </span>
                          </div>

                          <p className="text-sm font-semibold mb-1 text-gray-900">
                            {rule.type === 'EXPENSE' ? '-' : '+'}
                            {formatCurrency(rule.value, currency)}
                          </p>

                          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                            <Repeat className="h-3 w-3" />
                            <span>{getFrequencyLabel(rule.frequency)}</span>
                          </div>

                          <div className="text-xs text-gray-500">
                            {formatDate(new Date(rule.startDate), dateFormat)} →{' '}
                            {formatDate(new Date(rule.endDate), dateFormat)}
                          </div>

                          {rule.description && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {rule.description}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(rule);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                          data-testid={`delete-recurring-rule-${rule.id}`}
                          aria-label="Delete recurring rule"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
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
