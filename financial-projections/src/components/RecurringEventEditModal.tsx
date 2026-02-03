'use client';

import ProjectionEventForm from './ProjectionEventForm';

interface RecurringEventEditModalProps {
  ruleId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecurringEventEditModal({
  ruleId,
  onClose,
  onSuccess,
}: RecurringEventEditModalProps) {
  const isCreating = !ruleId;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      data-testid="recurring-event-edit-modal-overlay"
    >
      <div
        className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        data-testid="recurring-event-edit-modal"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900" data-testid="edit-modal-title">
              {isCreating ? 'Create Recurring Event Rule' : 'Edit Recurring Event Rule'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              data-testid="close-edit-modal"
            >
              ×
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <ProjectionEventForm
            date={new Date()} // Date is not used when editing recurring rules
            onCancel={onClose}
            onSuccess={() => {
              onSuccess();
              onClose();
            }}
            initialRecurringMode={true}
            editingRuleId={ruleId}
          />
        </div>
      </div>
    </div>
  );
}
