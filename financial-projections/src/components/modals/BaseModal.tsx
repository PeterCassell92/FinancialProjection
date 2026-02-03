'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: ModalSize;
  fullscreen?: boolean;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  showOverlay?: boolean;
  testId?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  '2xl': 'max-w-6xl',
  '3xl': 'max-w-7xl',
};

export default function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'lg',
  fullscreen = false,
  showCloseButton = true,
  closeOnOverlayClick = true,
  showOverlay = true,
  testId = 'modal',
}: BaseModalProps) {
  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  const containerClasses = fullscreen
    ? 'w-full h-full'
    : `w-full ${sizeClasses[size]}`;

  const overlayClasses = showOverlay
    ? 'bg-black/6'
    : 'bg-transparent';

  return (
    <div
      className={`fixed inset-0 ${overlayClasses} flex items-center justify-center p-4 z-50`}
      onClick={handleOverlayClick}
      data-testid={`${testId}-overlay`}
    >
      <div
        className={`bg-white rounded-lg border border-gray-500 shadow-lg flex flex-col max-h-[90vh] ${containerClasses}`}
        onClick={(e) => e.stopPropagation()}
        data-testid={testId}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              {title && (
                <h2 className="text-2xl font-bold text-gray-900" data-testid={`${testId}-title`}>
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="ml-auto text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                  data-testid={`${testId}-close`}
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
