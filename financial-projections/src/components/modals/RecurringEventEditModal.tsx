'use client';

import BaseModal from './BaseModal';
import ProjectionEventForm from '../ProjectionEventForm';

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
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={isCreating ? 'Create Recurring Event Rule' : 'Edit Recurring Event Rule'}
      size="lg"
      testId="recurring-event-edit-modal"
    >
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
    </BaseModal>
  );
}
