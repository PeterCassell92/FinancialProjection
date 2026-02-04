'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import BaseModal from './BaseModal';
import ConfirmationModal from './ConfirmationModal';
import ProjectionEventForm from '../ProjectionEventForm';

interface ProjectionEventEditModalProps {
  eventId: string | null;
  onClose: () => void;
  onSuccess: () => void;
  date: Date;
}

export default function ProjectionEventEditModal({
  eventId,
  onClose,
  onSuccess,
  date,
}: ProjectionEventEditModalProps) {
  const isCreating = !eventId;

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmVariant?: 'default' | 'destructive';
    isLoading?: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Handle delete event
  const handleDelete = () => {
    if (!eventId) return;

    setConfirmModal({
      isOpen: true,
      title: 'Delete Event',
      description: 'Are you sure you want to delete this event? This action cannot be undone.',
      confirmText: 'Delete',
      confirmVariant: 'destructive',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));

        try {
          const response = await fetch(`/api/projection-events/${eventId}`, {
            method: 'DELETE',
          });

          const data = await response.json();

          if (data.success) {
            setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
            onSuccess(); // Refresh the parent list
            onClose();  // Close the modal
          } else {
            console.error('Failed to delete event:', data.error);
            setConfirmModal(prev => ({ ...prev, isLoading: false }));
            alert('Failed to delete event: ' + data.error);
          }
        } catch (error) {
          console.error('Error deleting event:', error);
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
          alert('Failed to delete event. Please try again.');
        }
      },
    });
  };

  return (
    <>
      <BaseModal
        isOpen={true}
        onClose={onClose}
        title={isCreating ? 'Create Projection Event' : 'Edit Projection Event'}
        size="lg"
        testId="projection-event-edit-modal"
      >
        <ProjectionEventForm
          date={date}
          onCancel={onClose}
          onSuccess={() => {
            onSuccess();
            onClose();
          }}
          initialRecurringMode={false}
          editingEventId={eventId}
        />

        {/* Delete Button - Only show when editing */}
        {!isCreating && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              data-testid="delete-event-button"
            >
              <Trash2 className="h-4 w-4" />
              Delete Event
            </button>
          </div>
        )}
      </BaseModal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText={confirmModal.confirmText}
        confirmVariant={confirmModal.confirmVariant}
        isLoading={confirmModal.isLoading}
      />
    </>
  );
}
