'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { DatePicker } from '@/components/DatePicker';
import DecisionPathAutocomplete from '@/components/DecisionPathAutocomplete';

interface ProjectionEventFormProps {
  date: Date;
  onCancel: () => void;
  onSuccess: () => void;
  initialRecurringMode?: boolean;
  editingRuleId?: string | null;
}

interface BankAccount {
  id: string;
  name: string;
  sortCode: string;
  accountNumber: string;
  provider: string;
}

export default function ProjectionEventForm({
  date,
  onCancel,
  onSuccess,
  initialRecurringMode = false,
  editingRuleId = null,
}: ProjectionEventFormProps) {
  const isEditMode = !!editingRuleId;
  const [recurrentMode, setRecurrentMode] = useState(initialRecurringMode || isEditMode);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    value: '',
    type: 'EXPENSE' as 'EXPENSE' | 'INCOMING',
    certainty: 'CERTAIN' as 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'CERTAIN',
    payTo: '',
    paidBy: '',
    decisionPath: '',
    bankAccountId: '',
  });

  const [recurringData, setRecurringData] = useState({
    startDate: date,
    endDate: undefined as Date | undefined,
    frequency: 'MONTHLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'ANNUAL',
  });

  const [submitting, setSubmitting] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(true);
  const [loadingRule, setLoadingRule] = useState(false);

  // Fetch bank accounts and settings on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch bank accounts
        const accountsResponse = await fetch('/api/bank-accounts');
        const accountsData = await accountsResponse.json();

        if (accountsData.success && accountsData.data) {
          setBankAccounts(accountsData.data);
        }

        // Fetch settings to get default bank account
        const settingsResponse = await fetch('/api/settings');
        const settingsData = await settingsResponse.json();

        if (settingsData.success && settingsData.data?.defaultBankAccountId) {
          setFormData(prev => ({
            ...prev,
            bankAccountId: settingsData.data.defaultBankAccountId
          }));
        } else if (accountsData.success && accountsData.data?.length > 0) {
          // Fallback to first account if no default is set
          setFormData(prev => ({
            ...prev,
            bankAccountId: accountsData.data[0].id
          }));
        }
      } catch (error) {
        console.error('Failed to fetch bank accounts or settings:', error);
      } finally {
        setLoadingBankAccounts(false);
      }
    };

    fetchData();
  }, []);

  // Fetch recurring rule data when editing
  useEffect(() => {
    if (!editingRuleId) return;

    const fetchRule = async () => {
      setLoadingRule(true);
      try {
        const response = await fetch(`/api/recurring-event-rules/${editingRuleId}`);
        const data = await response.json();

        if (data.success && data.data) {
          const rule = data.data;
          setFormData({
            name: rule.name,
            description: rule.description || '',
            value: rule.value.toString(),
            type: rule.type,
            certainty: rule.certainty,
            payTo: rule.payTo || '',
            paidBy: rule.paidBy || '',
            decisionPath: rule.decisionPathId || '',
            bankAccountId: rule.bankAccountId,
          });
          setRecurringData({
            startDate: new Date(rule.startDate),
            endDate: new Date(rule.endDate),
            frequency: rule.frequency,
          });
        } else {
          alert(data.error || 'Failed to fetch recurring rule');
        }
      } catch (error) {
        console.error('Failed to fetch recurring rule:', error);
        alert('Failed to fetch recurring rule');
      } finally {
        setLoadingRule(false);
      }
    };

    fetchRule();
  }, [editingRuleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Determine endpoint and method based on mode
      let endpoint: string;
      let method: string;

      if (isEditMode) {
        endpoint = `/api/recurring-event-rules/${editingRuleId}`;
        method = 'PATCH';
      } else if (recurrentMode) {
        endpoint = '/api/recurring-event-rules';
        method = 'POST';
      } else {
        endpoint = '/api/projection-events';
        method = 'POST';
      }

      const baseData = {
        name: formData.name,
        description: formData.description || undefined,
        value: parseFloat(formData.value),
        type: formData.type,
        certainty: formData.certainty,
        payTo: formData.type === 'EXPENSE' ? formData.payTo || undefined : undefined,
        paidBy: formData.type === 'INCOMING' ? formData.paidBy || undefined : undefined,
        decisionPathId: formData.decisionPath || undefined,
        bankAccountId: formData.bankAccountId,
      };

      const body = recurrentMode || isEditMode
        ? {
            ...baseData,
            startDate: format(recurringData.startDate, 'yyyy-MM-dd'),
            endDate: recurringData.endDate ? format(recurringData.endDate, 'yyyy-MM-dd') : undefined,
            frequency: recurringData.frequency,
          }
        : {
            ...baseData,
            date: format(date, 'yyyy-MM-dd'),
          };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        const action = isEditMode ? 'update' : 'create';
        const itemType = recurrentMode || isEditMode ? 'recurring rule' : 'event';
        alert(data.error || `Failed to ${action} ${itemType}`);
      }
    } catch (err) {
      const action = isEditMode ? 'update' : 'create';
      const itemType = recurrentMode || isEditMode ? 'recurring rule' : 'event';
      alert(`Failed to ${action} ${itemType}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingRule) {
    return (
      <div className="flex items-center justify-center py-8" data-testid="loading-rule">
        <div className="text-gray-600">Loading recurring rule...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="projection-event-form">
      {/* Recurring Mode Toggle */}
      <div className="flex items-center gap-3 pb-3 border-b">
        <input
          id="recurring-mode"
          type="checkbox"
          checked={recurrentMode}
          onChange={(e) => setRecurrentMode(e.target.checked)}
          disabled={isEditMode}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="recurring-mode-checkbox"
        />
        <label htmlFor="recurring-mode" className="text-sm font-medium text-gray-700">
          Recurring Event
        </label>
        {recurrentMode && !isEditMode && (
          <span className="text-xs text-gray-500 ml-auto">
            This will create multiple events based on the schedule
          </span>
        )}
        {isEditMode && (
          <span className="text-xs text-blue-600 ml-auto">
            Editing recurring rule - changes will regenerate all future events
          </span>
        )}
      </div>

      {/* Event Name */}
      <div>
        <label htmlFor="event-name" className="block text-sm font-medium text-gray-700 mb-1">
          Event Name *
        </label>
        <input
          id="event-name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Rent Payment"
          required
          data-testid="event-name-input"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="event-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Optional description"
          rows={3}
          data-testid="event-description-input"
        />
      </div>

      {/* Type and Value */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="event-type" className="block text-sm font-medium text-gray-700 mb-1">
            Type *
          </label>
          <select
            id="event-type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'EXPENSE' | 'INCOMING' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="event-type-select"
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOMING">Incoming</option>
          </select>
        </div>

        <div>
          <label htmlFor="event-value" className="block text-sm font-medium text-gray-700 mb-1">
            Amount * ($)
          </label>
          <input
            id="event-value"
            type="number"
            step="0.01"
            min="0"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
            required
            data-testid="event-value-input"
          />
        </div>
      </div>

      {/* Certainty */}
      <div>
        <label htmlFor="event-certainty" className="block text-sm font-medium text-gray-700 mb-1">
          Certainty *
        </label>
        <select
          id="event-certainty"
          value={formData.certainty}
          onChange={(e) => setFormData({ ...formData, certainty: e.target.value as any })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          data-testid="event-certainty-select"
        >
          <option value="CERTAIN">Certain</option>
          <option value="LIKELY">Likely</option>
          <option value="POSSIBLE">Possible</option>
          <option value="UNLIKELY">Unlikely (won't affect balance)</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Note: Events marked as "Unlikely" won't be included in balance calculations
        </p>
      </div>

      {/* Decision Path */}
      <div>
        <label htmlFor="decision-path" className="block text-sm font-medium text-gray-700 mb-1">
          Decision Path (Optional)
        </label>
        <DecisionPathAutocomplete
          value={formData.decisionPath}
          onChange={(value) => setFormData({ ...formData, decisionPath: value })}
          placeholder="e.g., take-new-job, buy-house"
        />
        <p className="mt-1 text-xs text-gray-500">
          Use decision paths to model different scenarios. Events can be toggled on/off based on the active scenario.
        </p>
      </div>

      {/* Bank Account */}
      <div>
        <label htmlFor="bank-account" className="block text-sm font-medium text-gray-700 mb-1">
          Bank Account *
        </label>
        {loadingBankAccounts ? (
          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
            Loading bank accounts...
          </div>
        ) : bankAccounts.length === 0 ? (
          <div className="w-full px-3 py-2 border border-red-300 rounded-lg bg-red-50 text-red-600">
            No bank accounts found. Please add a bank account in Settings.
          </div>
        ) : (
          <select
            id="bank-account"
            value={formData.bankAccountId}
            onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            data-testid="bank-account-select"
          >
            <option value="">Select a bank account</option>
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.sortCode} - {account.accountNumber})
              </option>
            ))}
          </select>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Select the bank account this transaction will affect. You can set a default account in Settings.
        </p>
      </div>

      {/* Conditional fields based on type */}
      {formData.type === 'EXPENSE' && (
        <div>
          <label htmlFor="event-payto" className="block text-sm font-medium text-gray-700 mb-1">
            Pay To
          </label>
          <input
            id="event-payto"
            type="text"
            value={formData.payTo}
            onChange={(e) => setFormData({ ...formData, payTo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Landlord, Electric Company"
            data-testid="event-payto-input"
          />
        </div>
      )}

      {formData.type === 'INCOMING' && (
        <div>
          <label htmlFor="event-paidby" className="block text-sm font-medium text-gray-700 mb-1">
            Paid By
          </label>
          <input
            id="event-paidby"
            type="text"
            value={formData.paidBy}
            onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Employer, Client Name"
            data-testid="event-paidby-input"
          />
        </div>
      )}

      {/* Recurring Event Fields */}
      {recurrentMode && (
        <div className="space-y-4 pt-3 border-t">
          <h3 className="text-sm font-semibold text-gray-900">Recurrence Schedule</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <DatePicker
                value={recurringData.startDate}
                onChange={(date) => date && setRecurringData({ ...recurringData, startDate: date })}
                placeholder="Select start date"
              />
            </div>

            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <DatePicker
                value={recurringData.endDate}
                onChange={(date) => setRecurringData({ ...recurringData, endDate: date })}
                placeholder="Select end date"
              />
            </div>
          </div>

          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
              Frequency *
            </label>
            <select
              id="frequency"
              value={recurringData.frequency}
              onChange={(e) => setRecurringData({ ...recurringData, frequency: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="frequency-select"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly (every 3 months)</option>
              <option value="BIANNUAL">Biannual (every 6 months)</option>
              <option value="ANNUAL">Annual</option>
            </select>
          </div>

          {formData.type === 'INCOMING' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Incoming payments (salary, etc.) will automatically be adjusted to the next working day if they fall on weekends or UK bank holidays.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          data-testid="submit-event-button"
        >
          {submitting
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
            ? 'Update Recurring Rule'
            : recurrentMode
            ? 'Create Recurring Rule'
            : 'Create Event'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
          data-testid="cancel-event-button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
