'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  fetchTransactions,
  setFilters,
  clearFilters,
  selectFilters,
  selectSelectedBankAccountId,
} from '@/lib/redux/bankRecordsSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, X, Filter } from 'lucide-react';
import CollapsibleHeader from '@/components/CollapsibleHeader';

export default function TransactionRecordsTableFilters() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);
  const selectedBankAccountId = useAppSelector(selectSelectedBankAccountId);

  // Local state for form inputs
  const [collapsed, setCollapsed] = useState(false);
  const [startDate, setStartDate] = useState(filters.startDate || '');
  const [endDate, setEndDate] = useState(filters.endDate || '');
  const [description, setDescription] = useState(filters.description || '');

  // Sync local state with Redux filters when they change
  useEffect(() => {
    setStartDate(filters.startDate || '');
    setEndDate(filters.endDate || '');
    setDescription(filters.description || '');
  }, [filters]);

  const handleApply = () => {
    // Update Redux filters
    dispatch(setFilters({
      startDate: startDate || null,
      endDate: endDate || null,
      description: description || null,
    }));

    // Fetch transactions with new filters
    if (selectedBankAccountId) {
      dispatch(fetchTransactions(selectedBankAccountId));
    }
  };

  const handleClear = () => {
    // Clear local state
    setStartDate('');
    setEndDate('');
    setDescription('');

    // Clear Redux filters and fetch unfiltered transactions
    dispatch(clearFilters());
    if (selectedBankAccountId) {
      dispatch(fetchTransactions(selectedBankAccountId));
    }
  };

  const hasActiveFilters = filters.startDate || filters.endDate || filters.description;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6" data-testid="transaction-filters">
      <CollapsibleHeader
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        size="md"
        testId="collapse-filters-button"
        ariaLabel={collapsed ? 'Expand filters' : 'Collapse filters'}
      >
        <Filter className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            Active
          </span>
        )}
      </CollapsibleHeader>

      {!collapsed && (
        <div className="space-y-4">
        {/* Description Search */}
        <div className="space-y-2">
          <Label htmlFor="description-search">Search Description</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="description-search"
              type="text"
              placeholder="e.g., Amazon, Tesco..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="pl-10"
              data-testid="description-filter-input"
            />
          </div>
          <p className="text-xs text-gray-500">
            Case-insensitive partial match
          </p>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="grid grid-cols-1 gap-2">
            <div className="space-y-1">
              <Label htmlFor="start-date" className="text-xs text-gray-600">
                From
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="start-date-filter-input"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end-date" className="text-xs text-gray-600">
                To
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="end-date-filter-input"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleApply}
            className="flex-1"
            data-testid="apply-filters-button"
          >
            Apply Filters
          </Button>
          <Button
            onClick={handleClear}
            variant="outline"
            className="flex-1"
            data-testid="clear-filters-button"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-700 mb-2">Active Filters:</p>
            <div className="space-y-1">
              {filters.description && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Description:</span> "{filters.description}"
                </div>
              )}
              {filters.startDate && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">From:</span> {new Date(filters.startDate).toLocaleDateString()}
                </div>
              )}
              {filters.endDate && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">To:</span> {new Date(filters.endDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
