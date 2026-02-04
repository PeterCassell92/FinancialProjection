'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectUnreadCount } from '@/lib/redux/activityLogSlice';
import { selectHasRightSidebar, selectIsRightSidebarExpanded } from '@/lib/redux/layoutSlice';
import ActivityLogPanel from '@/components/ActivityLog/ActivityLogPanel';
import { Bell } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenInfo: () => void;
}

export default function Header({ onOpenSettings, onOpenInfo }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const activityLogRef = useRef<HTMLDivElement>(null);
  const unreadCount = useAppSelector(selectUnreadCount);
  const hasRightSidebar = useAppSelector(selectHasRightSidebar);
  const isRightSidebarExpanded = useAppSelector(selectIsRightSidebarExpanded);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleSettingsClick = () => {
    setIsMenuOpen(false);
    onOpenSettings();
  };

  const handleInfoClick = () => {
    setIsMenuOpen(false);
    onOpenInfo();
  };

  // Calculate right padding based on sidebar state
  // Expanded sidebar is typically 384px (w-96), collapsed is 64px (w-16)
  const rightPaddingClass = hasRightSidebar
    ? isRightSidebarExpanded
      ? 'pr-[400px]' // Expanded sidebar width + base padding
      : 'pr-20' // Collapsed sidebar width + base padding
    : '';

  return (
    <header className="bg-white shadow-sm border-b border-gray-200" data-testid="app-header">
      <div className={`flex items-center justify-between h-16 px-2 sm:px-3 lg:px-4 transition-all duration-300 ${rightPaddingClass}`}>
        {/* Logo */}
        <Link href="/" className="flex items-center" data-testid="header-logo">
            <Image
              src="/VividMinimalistLongLogoLessVerticalPadding.png"
              alt="Vivid Account Insights"
              width={200}
              height={40}
              priority
              className="h-10 w-auto"
            />
          </Link>

          <div className="flex items-center gap-2">
            {/* Activity Log Bell */}
            <div className="relative" ref={activityLogRef}>
              <button
                onClick={() => setIsActivityLogOpen(!isActivityLogOpen)}
                className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="activity-log-button"
                aria-label="Activity Log"
                aria-expanded={isActivityLogOpen}
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Activity Log Panel */}
              <ActivityLogPanel
                isOpen={isActivityLogOpen}
                onClose={() => setIsActivityLogOpen(false)}
              />
            </div>

            {/* Burger Menu */}
            <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="burger-menu-button"
              aria-label="Menu"
              aria-expanded={isMenuOpen}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                data-testid="burger-menu-dropdown"
              >
                <button
                  onClick={handleSettingsClick}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  data-testid="menu-settings-button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Settings
                </button>

                <button
                  onClick={handleInfoClick}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  data-testid="menu-info-button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Info
                </button>
              </div>
            )}
            </div>
          </div>
      </div>
    </header>
  );
}
