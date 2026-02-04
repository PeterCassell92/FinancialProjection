'use client';

import { useState } from 'react';
import Header from './Header';
import FullScreenSettingsModal from './FullScreenSettingsModal';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { updateSettings } from '@/lib/redux/settingsSlice';
import { Currency, DateFormat } from '@prisma/client';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const handleUpdateSettings = async (updates: {
    initialBankBalance?: number;
    initialBalanceDate?: string;
    currency?: Currency;
    dateFormat?: DateFormat;
  }) => {
    await dispatch(updateSettings(updates)).unwrap();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenInfo={() => setIsInfoModalOpen(true)}
      />

      {/* Main Content */}
      <main>{children}</main>

      {/* Full-Screen Settings Modal */}
      {settings.id && (
        <FullScreenSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          currentSettings={{
            id: settings.id,
            initialBankBalance: settings.initialBankBalance ?? 0,
            initialBalanceDate: settings.initialBalanceDate || new Date().toISOString(),
            currency: settings.currency,
            dateFormat: settings.dateFormat,
            defaultBankAccountId: settings.defaultBankAccountId,
          }}
          onUpdate={handleUpdateSettings}
        />
      )}

      {/* Info Modal */}
      {isInfoModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsInfoModalOpen(false)}
          data-testid="info-modal-overlay"
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
            data-testid="info-modal"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">About Financial Projections</h2>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                data-testid="info-modal-close-button"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="prose max-w-none">
              <p className="text-gray-600 mb-4">
                This application helps you project your bank balance forward through time by tracking expected expenses and income.
              </p>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Features:</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Track projection events with different certainty levels (unlikely, possible, likely, certain)</li>
                <li>Create recurring events that automatically generate across date ranges</li>
                <li>View daily balance projections in a calendar format</li>
                <li>Set actual balances to override calculated projections</li>
                <li>Visualize financial trends with charts and analytics</li>
                <li>Customize currency and date format preferences</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
