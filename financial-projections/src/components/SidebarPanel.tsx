'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

export interface SidebarView {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface SidebarPanelProps {
  views: SidebarView[];
  defaultViewId?: string;
  isExpanded?: boolean;
  onToggleExpand?: (expanded: boolean) => void;
}

export default function SidebarPanel({
  views,
  defaultViewId,
  isExpanded: controlledIsExpanded,
  onToggleExpand,
}: SidebarPanelProps) {
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const [activeViewId, setActiveViewId] = useState(defaultViewId || views[0]?.id);

  // Use controlled state if provided, otherwise use internal state
  const isExpanded = controlledIsExpanded !== undefined ? controlledIsExpanded : internalIsExpanded;
  const setIsExpanded = (value: boolean) => {
    if (onToggleExpand) {
      onToggleExpand(value);
    } else {
      setInternalIsExpanded(value);
    }
  };

  const activeView = views.find(v => v.id === activeViewId);

  return (
    <div
      className={`fixed top-0 right-0 h-full bg-white border-l border-gray-200 shadow-lg transition-all duration-300 ease-in-out z-40 ${
        isExpanded ? 'w-96' : 'w-12'
      }`}
      data-testid="sidebar-panel"
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute top-1/2 -left-6 transform -translate-y-1/2 bg-white border border-gray-200 rounded-l-lg p-2 shadow-md hover:bg-gray-50 transition-colors"
        data-testid="sidebar-panel-toggle"
        aria-label={isExpanded ? 'Collapse sidebar panel' : 'Expand sidebar panel'}
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
          {/* Header with Tabs and Fullscreen Toggle */}
          <div className="border-b border-gray-200">
            {/* Tab Buttons */}
            <div className="flex items-center">
              <div className="flex-1 flex">
                {views.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setActiveViewId(view.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                      activeViewId === view.id
                        ? 'border-blue-600 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    data-testid={`sidebar-tab__${view.id}`}
                  >
                    {view.icon}
                    <span>{view.label}</span>
                  </button>
                ))}
              </div>

              {/* Fullscreen Toggle (disabled for now) */}
              <button
                disabled
                className="p-3 text-gray-400 cursor-not-allowed"
                data-testid="sidebar-fullscreen-toggle"
                aria-label="Toggle fullscreen (coming soon)"
                title="Fullscreen mode (coming soon)"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Active View Content */}
          <div className="flex-1 overflow-hidden">
            {activeView?.content}
          </div>
        </div>
      )}
    </div>
  );
}
