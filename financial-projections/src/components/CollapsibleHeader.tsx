'use client';

import { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleHeaderProps {
  /** The content to display in the header (title, icon, badges, etc.) */
  children: ReactNode;
  /** Whether the section is currently collapsed */
  collapsed: boolean;
  /** Callback when the header is clicked to toggle collapse state */
  onToggle: () => void;
  /** Optional size variant for the component */
  size?: 'sm' | 'md' | 'lg';
  /** Optional data-testid for testing */
  testId?: string;
  /** Optional aria-label for accessibility */
  ariaLabel?: string;
}

/**
 * CollapsibleHeader - A reusable header component for collapsible sections
 *
 * Features:
 * - Entire header is clickable (including text and icons)
 * - Animated chevron that rotates based on collapsed state
 * - Flexible content via children prop
 * - Multiple size variants for different use cases
 * - Accessible with proper ARIA labels
 *
 * @example
 * ```tsx
 * <CollapsibleHeader
 *   collapsed={collapsed}
 *   onToggle={() => setCollapsed(!collapsed)}
 *   size="lg"
 *   ariaLabel="Expand filters section"
 * >
 *   <Filter className="h-5 w-5 text-gray-600" />
 *   <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
 *   <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
 *     Active
 *   </span>
 * </CollapsibleHeader>
 * ```
 */
export default function CollapsibleHeader({
  children,
  collapsed,
  onToggle,
  size = 'md',
  testId,
  ariaLabel,
}: CollapsibleHeaderProps) {
  // Size-specific styles
  const sizeStyles = {
    sm: {
      container: 'gap-2 mb-3',
      chevron: 'h-4 w-4',
    },
    md: {
      container: 'gap-2 mb-4',
      chevron: 'h-5 w-5',
    },
    lg: {
      container: 'gap-2 mb-4',
      chevron: 'h-5 w-5',
    },
  };

  const styles = sizeStyles[size];

  return (
    <button
      onClick={onToggle}
      className={`flex items-center w-full hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors cursor-pointer ${styles.container}`}
      aria-label={ariaLabel || (collapsed ? 'Expand section' : 'Collapse section')}
      aria-expanded={!collapsed}
      data-testid={testId}
      type="button"
    >
      {/* Content area - takes up remaining space */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {children}
      </div>

      {/* Chevron indicator */}
      <ChevronDown
        className={`${styles.chevron} text-gray-600 transition-transform flex-shrink-0 ${
          collapsed ? '-rotate-90' : ''
        }`}
        aria-hidden="true"
      />
    </button>
  );
}
