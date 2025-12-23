'use client';

import { useState } from 'react';
import { format } from 'date-fns';

interface ProjectionEventFormProps {
  date: Date;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function ProjectionEventForm({
  date,
  onCancel,
  onSuccess,
}: ProjectionEventFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    value: '',
    type: 'EXPENSE' as 'EXPENSE' | 'INCOMING',
    certainty: 'CERTAIN' as 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'CERTAIN',
    payTo: '',
    paidBy: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/projection-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          value: parseFloat(formData.value),
          type: formData.type,
          certainty: formData.certainty,
          payTo: formData.type === 'EXPENSE' ? formData.payTo || undefined : undefined,
          paidBy: formData.type === 'INCOMING' ? formData.paidBy || undefined : undefined,
          date: format(date, 'yyyy-MM-dd'),
          isRecurring: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        alert(data.error || 'Failed to create event');
      }
    } catch (err) {
      alert('Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="projection-event-form">
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

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          data-testid="submit-event-button"
        >
          {submitting ? 'Creating...' : 'Create Event'}
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
