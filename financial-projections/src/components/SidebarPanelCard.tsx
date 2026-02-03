'use client';

import { ReactNode } from 'react';
import { Trash2 } from 'lucide-react';

interface Badge {
  text: string;
  color: string; // Tailwind classes like "bg-green-100 text-green-800"
  testId?: string;
}

interface SidebarPanelCardProps {
  // Core data
  title: string;
  value: number;
  valueType: 'EXPENSE' | 'INCOMING';
  currency: string;

  // Optional metadata
  description?: string | null;
  badges?: Badge[];
  metadata?: ReactNode; // For date ranges, frequency, etc.

  // State
  isDisabled?: boolean; // For semi-transparent overlay

  // Actions
  onDoubleClick?: () => void;
  onDelete?: () => void;

  // Test IDs
  testId?: string;
}

export default function SidebarPanelCard({
  title,
  value,
  valueType,
  currency,
  description,
  badges = [],
  metadata,
  isDisabled = false,
  onDoubleClick,
  onDelete,
  testId,
}: SidebarPanelCardProps) {
  const valueColor = valueType === 'EXPENSE' ? 'text-red-700' : 'text-green-600';
  const valuePrefix = valueType === 'EXPENSE' ? '-' : '+';

  // Format currency value
  const formatCurrency = (val: number, curr: string): string => {
    const symbols: Record<string, string> = {
      GBP: '£',
      USD: '$',
    };
    const symbol = symbols[curr] || curr;
    return `${symbol}${val.toFixed(2)}`;
  };

  return (
    <div
      onDoubleClick={onDoubleClick}
      className={`
        relative bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group
        ${isDisabled ? 'opacity-50' : ''}
      `}
      data-testid={testId}
    >
      {/* Semi-transparent overlay when disabled */}
      {isDisabled && (
        <div className="absolute inset-0 bg-gray-400 bg-opacity-20 rounded-lg pointer-events-none" />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Title and Badges */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-medium text-sm text-gray-900 truncate">
              {title}
            </h3>
            {badges.map((badge, index) => (
              <span
                key={index}
                className={`text-xs px-2 py-0.5 rounded-full ${badge.color}`}
                data-testid={badge.testId}
              >
                {badge.text}
              </span>
            ))}
          </div>

          {/* Value */}
          <p className={`text-sm font-semibold mb-1 ${valueColor}`}>
            {valuePrefix}
            {formatCurrency(value, currency)}
          </p>

          {/* Metadata (dates, frequency, etc.) */}
          {metadata && (
            <div className="text-xs text-gray-600 mb-1">
              {metadata}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              {description}
            </p>
          )}
        </div>

        {/* Delete Button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
            data-testid={`${testId}-delete`}
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
