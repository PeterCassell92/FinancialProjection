'use client';

import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import {
  saveScenarioSet,
  closeSaveModal,
} from '@/lib/redux/scenarioSlice';
import BaseModal from './BaseModal';

export default function SaveScenarioModal() {
  const dispatch = useAppDispatch();
  const { isSaveModalOpen, currentDecisionPathStates, loading } = useAppSelector(
    (state) => state.scenario
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    dispatch(closeSaveModal());
    setName('');
    setDescription('');
    setError('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a scenario name');
      return;
    }

    try {
      await dispatch(
        saveScenarioSet({
          name: name.trim(),
          description: description.trim() || undefined,
          decisionPathStates: currentDecisionPathStates,
        })
      ).unwrap();

      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save scenario');
    }
  };

  return (
    <BaseModal
      isOpen={isSaveModalOpen}
      onClose={handleClose}
      title="Save Scenario"
      size="sm"
      testId="save-scenario-modal"
    >
      <p className="text-sm text-gray-600 mb-4">
        Save the current decision path configuration as a new scenario
      </p>

      {error && (
        <div
          className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700"
          data-testid="save-scenario-error"
        >
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Name Input */}
        <div>
          <label
            htmlFor="scenario-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Scenario Name *
          </label>
          <input
            id="scenario-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="e.g., Take New Job, Stay at Current Role"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            data-testid="scenario-name-input"
            autoFocus
          />
        </div>

        {/* Description Input */}
        <div>
          <label
            htmlFor="scenario-description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description (Optional)
          </label>
          <textarea
            id="scenario-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add notes about this scenario..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
            data-testid="scenario-description-input"
          />
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-md p-3">
          <div className="text-sm text-gray-700">
            <span className="font-medium">
              {Object.values(currentDecisionPathStates).filter(Boolean).length}
            </span>{' '}
            decision path(s) enabled in this scenario
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={handleClose}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          data-testid="save-scenario-cancel-button"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          data-testid="save-scenario-save-button"
        >
          {loading ? 'Saving...' : 'Save Scenario'}
        </button>
      </div>
    </BaseModal>
  );
}
