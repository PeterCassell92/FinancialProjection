'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { createDecisionPath } from '@/lib/redux/scenarioSlice';

interface DecisionPathAutocompleteProps {
  value: string; // This is the decision path ID
  onChange: (value: string) => void; // Callback receives decision path ID
  placeholder?: string;
  className?: string;
}

export default function DecisionPathAutocomplete({
  value,
  onChange,
  placeholder = 'Select or create a decision path',
  className = '',
}: DecisionPathAutocompleteProps) {
  const dispatch = useAppDispatch();
  const { allDecisionPaths } = useAppSelector((state) => state.scenario);
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredPaths, setFilteredPaths] = useState(allDecisionPaths);
  const [creating, setCreating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync input value with the selected decision path name (derived from ID)
  useEffect(() => {
    if (value) {
      const selectedPath = allDecisionPaths.find(p => p.id === value);
      if (selectedPath) {
        setInputValue(selectedPath.name);
      }
    } else {
      setInputValue('');
    }
  }, [value, allDecisionPaths]);

  // Filter decision paths based on input
  useEffect(() => {
    if (inputValue) {
      const filtered = allDecisionPaths.filter((path) =>
        path.name.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredPaths(filtered);
    } else {
      setFilteredPaths(allDecisionPaths);
    }
  }, [inputValue, allDecisionPaths]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    // Clear selection when user types
    if (newValue !== inputValue) {
      onChange('');
    }
    setShowDropdown(true);
  };

  const handleSelectPath = (pathId: string, pathName: string) => {
    setInputValue(pathName);
    onChange(pathId);
    setShowDropdown(false);
  };

  const handleCreateDecisionPath = async () => {
    if (!inputValue.trim() || creating) return;

    // Check if it already exists
    const existingPath = allDecisionPaths.find(
      p => p.name.toLowerCase() === inputValue.trim().toLowerCase()
    );
    if (existingPath) {
      handleSelectPath(existingPath.id, existingPath.name);
      return;
    }

    setCreating(true);
    try {
      // Use the Redux thunk to create the decision path
      const result = await dispatch(createDecisionPath({
        name: inputValue.trim(),
        description: undefined,
      })).unwrap();

      // Select the newly created decision path
      handleSelectPath(result.id, result.name);
    } catch (error) {
      console.error('Error creating decision path:', error);
      alert('Failed to create decision path. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      e.stopPropagation(); // Stop event propagation

      // If there's a matching path, select it
      const exactMatch = allDecisionPaths.find(
        p => p.name.toLowerCase() === inputValue.trim().toLowerCase()
      );
      if (exactMatch) {
        handleSelectPath(exactMatch.id, exactMatch.name);
      } else if (inputValue.trim()) {
        // Create new decision path
        handleCreateDecisionPath();
      }
    }
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const showCreateOption = inputValue && !allDecisionPaths.some(
    (path) => path.name.toLowerCase() === inputValue.toLowerCase()
  );

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        data-testid="decision-path-autocomplete-input"
        autoComplete="off"
        disabled={creating}
      />

      {showDropdown && (filteredPaths.length > 0 || showCreateOption) && (
        <div
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          data-testid="decision-path-dropdown"
        >
          {/* Existing decision paths */}
          {filteredPaths.map((path) => (
            <button
              key={path.id}
              type="button"
              onClick={() => handleSelectPath(path.id, path.name)}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
              data-testid={`decision-path-option__${path.id}`}
            >
              <div className="font-medium text-gray-900">{path.name}</div>
              {path.description && (
                <div className="text-xs text-gray-600 mt-0.5">{path.description}</div>
              )}
            </button>
          ))}

          {/* Create new option */}
          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreateDecisionPath}
              className="w-full text-left px-4 py-2 border-t border-gray-200 bg-blue-50 hover:bg-blue-100 focus:bg-blue-100 focus:outline-none"
              data-testid="decision-path-create-option"
              disabled={creating}
            >
              <div className="text-sm font-medium text-blue-700">
                {creating ? 'Creating...' : `Create new: "${inputValue}"`}
              </div>
              <div className="text-xs text-blue-600 mt-0.5">
                {creating ? 'Please wait...' : 'Press Enter or click to create'}
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
