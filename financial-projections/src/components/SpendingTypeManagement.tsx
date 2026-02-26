'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { toggleSpendingTypeFilter, selectFilters } from '@/lib/redux/bankRecordsSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import CollapsibleHeader from '@/components/CollapsibleHeader';

interface SpendingType {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
}

interface SpendingTypeManagementProps {
  spendingTypes: SpendingType[];
  onSpendingTypeCreated: () => void;
  filterEnabled?: boolean;
}

export default function SpendingTypeManagement({
  spendingTypes,
  onSpendingTypeCreated,
  filterEnabled = false,
}: SpendingTypeManagementProps) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);

  const [collapsed, setCollapsed] = useState(false);
  const [createFormCollapsed, setCreateFormCollapsed] = useState(spendingTypes.length > 10);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState('#3B82F6');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) {
      setError('Name is required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const response = await fetch('/api/spending-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || undefined,
          color: newColor,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewName('');
        setNewDescription('');
        setNewColor('#3B82F6');
        onSpendingTypeCreated();
      } else {
        setError(data.error || 'Failed to create spending type');
      }
    } catch (err) {
      console.error('Failed to create spending type:', err);
      setError('Failed to create spending type');
    } finally {
      setCreating(false);
    }
  };

  const handleDoubleClick = (spendingTypeId: string) => {
    if (filterEnabled) {
      dispatch(toggleSpendingTypeFilter(spendingTypeId));
    }
  };

  const isFilterActive = (spendingTypeId: string) => {
    return filters.spendingTypeIds.includes(spendingTypeId);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6" data-testid="spending-type-management">
      <CollapsibleHeader
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        size="lg"
        testId="collapse-spending-types-button"
        ariaLabel={collapsed ? 'Expand spending types' : 'Collapse spending types'}
      >
        <h2 className="text-xl font-semibold text-gray-900">
          Manage Spending Types
        </h2>
      </CollapsibleHeader>

      {!collapsed && (
        <>
          {/* Create Form */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <CollapsibleHeader
              collapsed={createFormCollapsed}
              onToggle={() => setCreateFormCollapsed(!createFormCollapsed)}
              size="sm"
              testId="collapse-create-form-button"
              ariaLabel={createFormCollapsed ? 'Expand create form' : 'Collapse create form'}
            >
              <Plus className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-700">Create New Spending Type</h3>
            </CollapsibleHeader>

            {!createFormCollapsed && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="spending-type-name">Name *</Label>
                  <Input
                    id="spending-type-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., Groceries"
                    data-testid="spending-type-name-input"
                  />
                </div>

                <div>
                  <Label htmlFor="spending-type-description">Description</Label>
                  <Input
                    id="spending-type-description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Optional description"
                    data-testid="spending-type-description-input"
                  />
                </div>

                <div>
                  <Label htmlFor="spending-type-color">Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="spending-type-color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                      data-testid="spending-type-color-input"
                    />
                    <Input
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1 font-mono"
                      data-testid="spending-type-color-text-input"
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-600" data-testid="error-message">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  className="w-full"
                  data-testid="create-spending-type-button"
                >
                  {creating ? 'Creating...' : 'Create Spending Type'}
                </Button>
              </div>
            )}
          </div>

      {/* Existing Spending Types List */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Existing Types ({spendingTypes.length})
        </h3>
        {spendingTypes.length === 0 ? (
          <p className="text-sm text-gray-500">
            No spending types yet. Create one above.
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {spendingTypes.map((type) => {
              const isActive = isFilterActive(type.id);
              return (
                <div
                  key={type.id}
                  data-spending-type-name={type.name}
                  className={`p-3 bg-gray-50 rounded-md border-2 transition-colors ${
                    filterEnabled ? 'cursor-pointer hover:bg-gray-100' : 'cursor-not-allowed opacity-60'
                  } ${
                    isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  data-testid={`spending-type-item__${type.id}`}
                  onDoubleClick={() => handleDoubleClick(type.id)}
                  title={filterEnabled ? 'Double-click to toggle filter' : 'Enable "Filter by Selected Spending Types" in the Filters section to use this feature'}
                >
                  <div className="flex items-center gap-2">
                    {type.color && (
                      <div
                        className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: type.color }}
                        title={type.color}
                      />
                    )}
                    <div className="font-medium text-gray-900">{type.name}</div>
                    {isActive && (
                      <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        Filtered
                      </span>
                    )}
                  </div>
                  {type.description && (
                    <div className="text-sm text-gray-600 mt-1">
                      {type.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </div>
        </>
      )}
    </div>
  );
}
