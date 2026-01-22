'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  fetchTransactions,
  setFilters,
  clearFilters,
  selectFilters,
  selectSelectedBankAccountId,
  selectSpendingTypes,
} from '@/lib/redux/bankRecordsSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, X, Filter } from 'lucide-react';
import CollapsibleHeader from '@/components/CollapsibleHeader';

interface TransactionRecordsTableFiltersProps {
  onSpendingTypeFilterEnabledChange?: (enabled: boolean) => void;
}

export default function TransactionRecordsTableFilters({
  onSpendingTypeFilterEnabledChange,
}: TransactionRecordsTableFiltersProps = {}) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);
  const selectedBankAccountId = useAppSelector(selectSelectedBankAccountId);
  const spendingTypes = useAppSelector(selectSpendingTypes);

  // Local state for form inputs
  const [collapsed, setCollapsed] = useState(false);
  const [showDescriptionFilter, setShowDescriptionFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showSpendingTypeFilter, setShowSpendingTypeFilter] = useState(false);
  const [showAmountFilter, setShowAmountFilter] = useState(false);
  const [startDate, setStartDate] = useState(filters.startDate || '');
  const [endDate, setEndDate] = useState(filters.endDate || '');
  const [description, setDescription] = useState(filters.description || '');
  const [amountOperator, setAmountOperator] = useState<'lessThan' | 'greaterThan'>(filters.amountOperator || 'greaterThan');
  const [amountValue, setAmountValue] = useState(filters.amountValue?.toString() || '');

  // Sync local state with Redux filters when they change
  useEffect(() => {
    setStartDate(filters.startDate || '');
    setEndDate(filters.endDate || '');
    setDescription(filters.description || '');
    setAmountOperator(filters.amountOperator || 'greaterThan');
    setAmountValue(filters.amountValue?.toString() || '');
  }, [filters]);

  const handleApply = () => {
    // Update Redux filters - only apply filters that are enabled
    dispatch(setFilters({
      startDate: showDateFilter && startDate ? startDate : null,
      endDate: showDateFilter && endDate ? endDate : null,
      description: showDescriptionFilter && description ? description : null,
      amountOperator: showAmountFilter && amountValue ? amountOperator : null,
      amountValue: showAmountFilter && amountValue ? parseFloat(amountValue) : null,
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
    setShowDescriptionFilter(false);
    setShowDateFilter(false);
    setShowSpendingTypeFilter(false);
    setShowAmountFilter(false);
    setAmountOperator('greaterThan');
    setAmountValue('');

    // Clear Redux filters and fetch unfiltered transactions
    dispatch(clearFilters());
    if (selectedBankAccountId) {
      dispatch(fetchTransactions(selectedBankAccountId));
    }
  };

  const hasActiveFilters = filters.startDate || filters.endDate || filters.description || filters.spendingTypeIds.length > 0 || (filters.amountOperator && filters.amountValue !== null);

  // Get spending type names for display
  const getSpendingTypeName = (id: string) => {
    const type = spendingTypes.find(t => t.id === id);
    return type?.name || 'Unknown';
  };

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
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show-description-filter"
              checked={showDescriptionFilter}
              onChange={(e) => {
                setShowDescriptionFilter(e.target.checked);
                if (!e.target.checked) {
                  setDescription('');
                }
              }}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              data-testid="show-description-filter-checkbox"
            />
            <Label
              htmlFor="show-description-filter"
              className={`cursor-pointer ${!showDescriptionFilter ? 'line-through text-gray-400' : 'text-gray-900'}`}
            >
              Filter by Description
            </Label>
          </div>

          {showDescriptionFilter && (
            <>
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
            </>
          )}
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show-date-filter"
              checked={showDateFilter}
              onChange={(e) => {
                setShowDateFilter(e.target.checked);
                if (!e.target.checked) {
                  setStartDate('');
                  setEndDate('');
                }
              }}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              data-testid="show-date-filter-checkbox"
            />
            <Label
              htmlFor="show-date-filter"
              className={`cursor-pointer ${!showDateFilter ? 'line-through text-gray-400' : 'text-gray-900'}`}
            >
              Filter by Date Range
            </Label>
          </div>

          {showDateFilter && (
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
          )}
        </div>

        {/* Spending Type Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show-spending-type-filter"
              checked={showSpendingTypeFilter}
              onChange={(e) => {
                const isEnabled = e.target.checked;
                setShowSpendingTypeFilter(isEnabled);
                // Notify parent component
                if (onSpendingTypeFilterEnabledChange) {
                  onSpendingTypeFilterEnabledChange(isEnabled);
                }
                // When unchecked, clear all spending type filters
                if (!isEnabled && filters.spendingTypeIds.length > 0) {
                  // Clear spending type IDs from filters
                  dispatch(setFilters({
                    ...filters,
                    spendingTypeIds: [],
                  }));
                }
              }}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              data-testid="show-spending-type-filter-checkbox"
            />
            <Label
              htmlFor="show-spending-type-filter"
              className={`cursor-pointer ${!showSpendingTypeFilter ? 'line-through text-gray-400' : 'text-gray-900'}`}
            >
              Filter by Selected Spending Types
            </Label>
          </div>

          {showSpendingTypeFilter && (
            <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-xs text-gray-600 mb-2">
                Double-click spending types in the "Manage Spending Types" section below to add them to this filter.
              </p>
              {filters.spendingTypeIds.length === 0 ? (
                <p className="text-xs text-gray-500 italic">
                  No spending types selected
                </p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {filters.spendingTypeIds.map(id => (
                    <span
                      key={id}
                      className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs"
                    >
                      {getSpendingTypeName(id)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Amount Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show-amount-filter"
              checked={showAmountFilter}
              onChange={(e) => {
                setShowAmountFilter(e.target.checked);
                if (!e.target.checked) {
                  setAmountValue('');
                }
              }}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              data-testid="show-amount-filter-checkbox"
            />
            <Label
              htmlFor="show-amount-filter"
              className={`cursor-pointer ${!showAmountFilter ? 'line-through text-gray-400' : 'text-gray-900'}`}
            >
              Filter by Transaction Amount
            </Label>
          </div>

          {showAmountFilter && (
            <>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={amountOperator === 'greaterThan' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAmountOperator('greaterThan')}
                  className="flex-1"
                  data-testid="amount-operator-greater-than"
                >
                  Greater Than
                </Button>
                <Button
                  type="button"
                  variant={amountOperator === 'lessThan' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAmountOperator('lessThan')}
                  className="flex-1"
                  data-testid="amount-operator-less-than"
                >
                  Less Than
                </Button>
              </div>
              <Input
                id="amount-value"
                type="number"
                placeholder="e.g., 100.00"
                value={amountValue}
                onChange={(e) => setAmountValue(e.target.value)}
                step="0.01"
                min="0"
                data-testid="amount-value-filter-input"
              />
              <p className="text-xs text-gray-500">
                Filters by absolute value (magnitude)
              </p>
            </>
          )}
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

        </div>
      )}
    </div>
  );
}
