'use client';

import { Calendar } from 'lucide-react';

interface ThisMonthsEventsManagerContentProps {
  // Placeholder for future props
}

export default function ThisMonthsEventsManagerContent({}: ThisMonthsEventsManagerContentProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">This Month's Events</h2>
        </div>
        <p className="text-sm text-gray-600">
          Manage projection events for the current month
        </p>
      </div>

      {/* Placeholder Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-sm text-gray-600 max-w-sm">
            This feature will allow you to view and manage all projection events for the current month in one convenient location.
          </p>
        </div>
      </div>
    </div>
  );
}
