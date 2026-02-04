'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import SidebarPanelCard from './SidebarPanelCard';
import ProjectionEventEditModal from './modals/ProjectionEventEditModal';
import ConfirmationModal from './modals/ConfirmationModal';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { formatDate } from '@/lib/utils/date-format';
import { ProjectionEvent, fetchProjectionEventsForMonth } from '@/lib/redux/projectionEventsSlice';

interface ThisMonthsEventsManagerContentProps {
  monthId: string; // Format: YYYY-MM
}

export default function ThisMonthsEventsManagerContent({ monthId }: ThisMonthsEventsManagerContentProps) {
  const dispatch = useAppDispatch();
  const events = useAppSelector((state) => state.projectionEvents.eventsByMonth[monthId] || []);
  const loading = useAppSelector((state) => state.projectionEvents.loading);
  const currency = useAppSelector((state) => state.settings.currency);
  const dateFormat = useAppSelector((state) => state.settings.dateFormat);
  const allDecisionPaths = useAppSelector((state) => state.scenario.allDecisionPaths);
  const currentDecisionPathStates = useAppSelector((state) => state.scenario.currentDecisionPathStates);

  // Filter state
  const [selectedDecisionPathId, setSelectedDecisionPathId] = useState<string>('all');

  // Edit modal state
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingEventDate, setEditingEventDate] = useState<Date>(new Date());

  // Confirmation modal state
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

  // Handle successful edit - refresh events and close modal
  const handleEditSuccess = () => {
    // Convert monthId (YYYY-MM) to startDate and endDate
    const [year, month] = monthId.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month

    dispatch(fetchProjectionEventsForMonth({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }));
    setEditingEventId(null);
  };

  // Handle delete event
  const handleDeleteEvent = (eventId: string, eventName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Event',
      description: `Are you sure you want to delete "${eventName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmVariant: 'destructive',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));

        try {
          const response = await fetch(`/api/projection-events/${eventId}`, {
            method: 'DELETE',
          });

          const data = await response.json();

          if (data.success) {
            // Refresh events after successful delete
            const [year, month] = monthId.split('-').map(Number);
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);

            dispatch(fetchProjectionEventsForMonth({
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
            }));

            setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
          } else {
            // Handle error - could show error modal here
            console.error('Failed to delete event:', data.error);
            setConfirmModal(prev => ({ ...prev, isLoading: false }));
            alert('Failed to delete event: ' + data.error);
          }
        } catch (error) {
          console.error('Error deleting event:', error);
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
          alert('Failed to delete event. Please try again.');
        }
      },
    });
  };

  // Get certainty color
  const getCertaintyColor = (certainty: string): string => {
    const colors: Record<string, string> = {
      UNLIKELY: 'bg-gray-100 text-gray-700',
      POSSIBLE: 'bg-yellow-100 text-yellow-800',
      LIKELY: 'bg-blue-100 text-blue-800',
      CERTAIN: 'bg-green-100 text-green-800',
    };
    return colors[certainty] || 'bg-gray-100 text-gray-700';
  };

  // Filter events by decision path
  const filteredEvents = events.filter((event) => {
    // Filter by decision path
    if (selectedDecisionPathId !== 'all') {
      if (selectedDecisionPathId === 'none') {
        // Show only events without a decision path
        if (event.decisionPathId !== null) {
          return false;
        }
      } else {
        // Show only events with the selected decision path
        if (event.decisionPathId !== selectedDecisionPathId) {
          return false;
        }
      }
    }
    return true;
  });

  // Sort events chronologically
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">This Month's Events</h2>
        </div>
        <p className="text-sm text-gray-600">
          All projection events for this month
        </p>
      </div>

      {/* Filter Bar */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="space-y-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-1 block">Decision Path</span>
            <select
              value={selectedDecisionPathId}
              onChange={(e) => setSelectedDecisionPathId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="decision-path-filter"
            >
              <option value="all">All Decision Paths</option>
              <option value="none">No Decision Path</option>
              {allDecisionPaths.map((path) => (
                <option key={path.id} value={path.id}>
                  {path.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        )}

        {!loading && sortedEvents.length === 0 && events.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Calendar className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">No projection events for this month</p>
            <p className="text-xs text-gray-400 mt-1">
              Events will appear here as you add them
            </p>
          </div>
        )}

        {!loading && sortedEvents.length === 0 && events.length > 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Calendar className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">No events match your filters</p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your filter selections
            </p>
          </div>
        )}

        {!loading && sortedEvents.length > 0 && (
          <div className="space-y-2">
            {sortedEvents.map((event) => {
              // Check if event is on a disabled decision path
              const isDisabled = event.decisionPathId
                ? currentDecisionPathStates[event.decisionPathId] === false
                : false;

              // Build badges
              const badges = [
                {
                  text: event.certainty.toLowerCase(),
                  color: getCertaintyColor(event.certainty),
                },
              ];

              // Add decision path badge if present
              if (event.decisionPathId) {
                const decisionPath = allDecisionPaths.find((dp) => dp.id === event.decisionPathId);
                if (decisionPath) {
                  badges.push({
                    text: decisionPath.name,
                    color: 'bg-purple-100 text-purple-800',
                  });
                }
              }

              return (
                <SidebarPanelCard
                  key={event.id}
                  title={event.name}
                  value={event.value}
                  valueType={event.type}
                  currency={currency}
                  description={event.description}
                  badges={badges}
                  metadata={
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(new Date(event.date), dateFormat)}</span>
                    </div>
                  }
                  isDisabled={isDisabled}
                  onDoubleClick={() => {
                    setEditingEventId(event.id);
                    setEditingEventDate(new Date(event.date));
                  }}
                  onDelete={() => handleDeleteEvent(event.id, event.name)}
                  testId={`projection-event-${event.id}`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingEventId && (
        <ProjectionEventEditModal
          eventId={editingEventId}
          date={editingEventDate}
          onClose={() => setEditingEventId(null)}
          onSuccess={handleEditSuccess}
        />
      )}

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
    </div>
  );
}
