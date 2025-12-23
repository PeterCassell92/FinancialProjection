'use client';

import { format } from 'date-fns';
import { useState } from 'react';
import ProjectionEventForm from './ProjectionEventForm';

interface ProjectionEvent {
  id: string;
  name: string;
  description?: string;
  value: number;
  type: 'EXPENSE' | 'INCOMING';
  certainty: 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'CERTAIN';
  payTo?: string;
  paidBy?: string;
  date: string;
}

interface DailyBalance {
  id: string;
  date: string;
  expectedBalance: number;
  actualBalance: number | null;
}

interface DayDetailModalProps {
  date: Date;
  events: ProjectionEvent[];
  balance: DailyBalance | null;
  onClose: () => void;
  onRefresh: () => void;
}

const certaintyColors = {
  UNLIKELY: 'bg-gray-100 text-gray-800',
  POSSIBLE: 'bg-yellow-100 text-yellow-800',
  LIKELY: 'bg-orange-100 text-orange-800',
  CERTAIN: 'bg-green-100 text-green-800',
};

const typeColors = {
  EXPENSE: 'text-red-700',
  INCOMING: 'text-green-700',
};

export default function DayDetailModal({
  date,
  events,
  balance,
  onClose,
  onRefresh,
}: DayDetailModalProps) {
  const [showEventForm, setShowEventForm] = useState(false);
  const [settingActualBalance, setSettingActualBalance] = useState(false);
  const [actualBalanceInput, setActualBalanceInput] = useState(
    balance?.actualBalance?.toString() || ''
  );

  const handleSetActualBalance = async () => {
    const value = parseFloat(actualBalanceInput);
    if (isNaN(value)) {
      alert('Please enter a valid number');
      return;
    }

    try {
      const response = await fetch('/api/daily-balance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: format(date, 'yyyy-MM-dd'),
          actualBalance: value,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSettingActualBalance(false);
        onRefresh();
      } else {
        alert(data.error || 'Failed to set actual balance');
      }
    } catch (err) {
      alert('Failed to set actual balance');
    }
  };

  const handleClearActualBalance = async () => {
    if (!confirm('Are you sure you want to clear the actual balance?')) return;

    try {
      const response = await fetch(
        `/api/daily-balance?date=${format(date, 'yyyy-MM-dd')}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        setActualBalanceInput('');
        onRefresh();
      } else {
        alert(data.error || 'Failed to clear actual balance');
      }
    } catch (err) {
      alert('Failed to clear actual balance');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`/api/projection-events/${eventId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        onRefresh();
      } else {
        alert(data.error || 'Failed to delete event');
      }
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      data-testid="day-modal-overlay"
    >
      <div
        className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        data-testid="day-modal"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900" data-testid="day-modal-title">
              {format(date, 'EEEE, MMMM d, yyyy')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              data-testid="close-day-modal"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Balance Section */}
          <div className="mb-6 bg-blue-50 rounded-lg p-4" data-testid="balance-section">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Balance</h3>
              {!settingActualBalance ? (
                <button
                  onClick={() => setSettingActualBalance(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  data-testid="set-actual-balance-button"
                >
                  {balance?.actualBalance !== null ? 'Edit Actual' : 'Set Actual'}
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Expected Balance</p>
                <p className="text-xl font-bold text-gray-900" data-testid="expected-balance">
                  ${balance?.expectedBalance.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Actual Balance</p>
                {!settingActualBalance ? (
                  <p className="text-xl font-bold text-green-700" data-testid="actual-balance">
                    {balance?.actualBalance !== null && balance?.actualBalance !== undefined
                      ? `$${balance.actualBalance.toFixed(2)}`
                      : 'Not set'}
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={actualBalanceInput}
                      onChange={(e) => setActualBalanceInput(e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded"
                      placeholder="0.00"
                      data-testid="actual-balance-input"
                    />
                    <button
                      onClick={handleSetActualBalance}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      data-testid="save-actual-balance"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setSettingActualBalance(false)}
                      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                      data-testid="cancel-actual-balance"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {balance?.actualBalance !== null && !settingActualBalance && (
              <button
                onClick={handleClearActualBalance}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
                data-testid="clear-actual-balance"
              >
                Clear Actual Balance
              </button>
            )}
          </div>

          {/* Events Section */}
          <div data-testid="events-section">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Events ({events.length})
              </h3>
              <button
                onClick={() => setShowEventForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                data-testid="add-event-button"
              >
                + Add Event
              </button>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-500" data-testid="no-events-message">
                No events for this day
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event, index) => (
                  <div
                    key={event.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    data-testid={`event-item__${index}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{event.name}</h4>
                          <span
                            className={`text-xs px-2 py-1 rounded ${certaintyColors[event.certainty]}`}
                          >
                            {event.certainty}
                          </span>
                        </div>

                        {event.description && (
                          <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-sm">
                          <span className={`font-bold ${typeColors[event.type]}`}>
                            {event.type === 'EXPENSE' ? '-' : '+'}$
                            {event.value.toFixed(2)}
                          </span>

                          {event.type === 'EXPENSE' && event.payTo && (
                            <span className="text-gray-600">Pay to: {event.payTo}</span>
                          )}

                          {event.type === 'INCOMING' && event.paidBy && (
                            <span className="text-gray-600">From: {event.paidBy}</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-600 hover:text-red-800 ml-4"
                        data-testid={`delete-event__${index}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Event Form */}
          {showEventForm && (
            <div className="mt-6 border-t pt-6" data-testid="event-form-container">
              <h3 className="text-lg font-semibold mb-4">Add New Event</h3>
              <ProjectionEventForm
                date={date}
                onCancel={() => setShowEventForm(false)}
                onSuccess={() => {
                  setShowEventForm(false);
                  onRefresh();
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
