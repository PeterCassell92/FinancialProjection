'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '@/lib/redux/hooks';

interface DecisionPathAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function DecisionPathAutocomplete({
  value,
  onChange,
  placeholder = 'Select or create a decision path',
  className = '',
}: DecisionPathAutocompleteProps) {
  const { allDecisionPaths } = useAppSelector((state) => state.scenario);
  const [inputValue, setInputValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredPaths, setFilteredPaths] = useState(allDecisionPaths);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync input value with prop value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

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
    onChange(newValue);
    setShowDropdown(true);
  };

  const handleSelectPath = (pathName: string) => {
    setInputValue(pathName);
    onChange(pathName);
    setShowDropdown(false);
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
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        data-testid="decision-path-autocomplete-input"
        autoComplete="off"
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
              onClick={() => handleSelectPath(path.name)}
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
              onClick={() => handleSelectPath(inputValue)}
              className="w-full text-left px-4 py-2 border-t border-gray-200 bg-blue-50 hover:bg-blue-100 focus:bg-blue-100 focus:outline-none"
              data-testid="decision-path-create-option"
            >
              <div className="text-sm font-medium text-blue-700">
                Create new: "{inputValue}"
              </div>
              <div className="text-xs text-blue-600 mt-0.5">
                A new decision path will be created
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
