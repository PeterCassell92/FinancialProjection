'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import SidebarPanelCard from './SidebarPanelCard';
import { useAppSelector } from '@/lib/redux/hooks';
import { formatDate } from '@/lib/utils/date-format';
import { ProjectionEvent } from '@/lib/redux/projectionEventsSlice';

interface ThisMonthsEventsManagerContentProps {
  monthId: string; // Format: YYYY-MM
}

export default function ThisMonthsEventsManagerContent({ monthId }: ThisMonthsEventsManagerContentProps) {
  const events = useAppSelector((state) => state.projectionEvents.eventsByMonth[monthId] || []);
  const loading = useAppSelector((state) => state.projectionEvents.loading);
  const currency = useAppSelector((state) => state.settings.currency);
  const dateFormat = useAppSelector((state) => state.settings.dateFormat);
  const allDecisionPaths = useAppSelector((state) => state.scenario.allDecisionPaths);
  const currentDecisionPathStates = useAppSelector((state) => state.scenario.currentDecisionPathStates);

  // Filter state
  const [selectedDecisionPathId, setSelectedDecisionPathId] = useState<string>('all');

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
                  testId={`projection-event-${event.id}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
