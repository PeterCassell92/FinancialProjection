'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit2, Check, X, Tag } from 'lucide-react';

interface SpendingType {
  id: string;
  name: string;
  description: string | null;
}

interface CategorizationRule {
  id: string;
  descriptionString: string;
  exactMatch: boolean;
  spendingTypes: Array<{
    id: string;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface CategorizationRulesManagementProps {
  spendingTypes: SpendingType[];
  selectedBankAccountId: string | null;
  onRuleCreated?: () => void;
  onRuleApplied?: () => void;
}

export default function CategorizationRulesManagement({
  spendingTypes,
  selectedBankAccountId,
  onRuleCreated,
  onRuleApplied,
}: CategorizationRulesManagementProps) {
  const [rules, setRules] = useState<CategorizationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [applyingRuleId, setApplyingRuleId] = useState<string | null>(null);

  // Create/Edit form state
  const [descriptionString, setDescriptionString] = useState('');
  const [exactMatch, setExactMatch] = useState(false);
  const [selectedSpendingTypes, setSelectedSpendingTypes] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch rules on mount
  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/categorization-rules');
      const data = await response.json();
      if (data.success) {
        setRules(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categorization rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescriptionString('');
    setExactMatch(false);
    setSelectedSpendingTypes([]);
    setFormError('');
    setShowCreateForm(false);
    setEditingRuleId(null);
  };

  const startEdit = (rule: CategorizationRule) => {
    setDescriptionString(rule.descriptionString);
    setExactMatch(rule.exactMatch);
    setSelectedSpendingTypes(rule.spendingTypes.map((st) => st.id));
    setEditingRuleId(rule.id);
    setShowCreateForm(false);
  };

  const handleSubmit = async () => {
    setFormError('');

    // Validation
    if (!descriptionString.trim()) {
      setFormError('Description string is required');
      return;
    }

    if (selectedSpendingTypes.length === 0) {
      setFormError('At least one spending type must be selected');
      return;
    }

    setSubmitting(true);

    try {
      const body = {
        descriptionString: descriptionString.trim(),
        exactMatch,
        spendingTypeIds: selectedSpendingTypes,
      };

      let response;
      if (editingRuleId) {
        // Update existing rule
        response = await fetch(`/api/categorization-rules/${editingRuleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        // Create new rule
        response = await fetch('/api/categorization-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      const data = await response.json();

      if (data.success) {
        await fetchRules();
        resetForm();
        onRuleCreated?.();
      } else {
        setFormError(data.error || 'Failed to save rule');
      }
    } catch (error) {
      console.error('Failed to save categorization rule:', error);
      setFormError('Failed to save rule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this categorization rule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/categorization-rules/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchRules();
      } else {
        alert(data.error || 'Failed to delete rule');
      }
    } catch (error) {
      console.error('Failed to delete categorization rule:', error);
      alert('Failed to delete rule');
    }
  };

  const handleApplyToExisting = async (ruleId: string) => {
    if (!selectedBankAccountId) {
      alert('Please select a bank account first');
      return;
    }

    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;

    const message = `Apply rule "${rule.descriptionString}" to all existing transactions in this account?\n\nThis will add the spending type(s): ${rule.spendingTypes.map((st) => st.name).join(', ')}\n\nMatching transactions: ${rule.exactMatch ? 'Exact match only' : 'Contains pattern'}`;

    if (!confirm(message)) {
      return;
    }

    setApplyingRuleId(ruleId);

    try {
      const response = await fetch(`/api/categorization-rules/${ruleId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankAccountId: selectedBankAccountId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Successfully applied rule to ${data.data?.transactionsUpdated || 0} transactions`);
        onRuleApplied?.();
      } else {
        alert(data.error || 'Failed to apply rule');
      }
    } catch (error) {
      console.error('Failed to apply categorization rule:', error);
      alert('Failed to apply rule');
    } finally {
      setApplyingRuleId(null);
    }
  };

  const toggleSpendingType = (spendingTypeId: string) => {
    setSelectedSpendingTypes((prev) =>
      prev.includes(spendingTypeId)
        ? prev.filter((id) => id !== spendingTypeId)
        : [...prev, spendingTypeId]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6" data-testid="categorization-rules-section">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Auto-Categorization Rules</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreateForm(!showCreateForm)}
          data-testid="toggle-create-rule-button"
        >
          {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Automatically tag transactions during CSV import based on description matching
      </p>

      {/* Create/Edit Form */}
      {(showCreateForm || editingRuleId) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            {editingRuleId ? 'Edit Rule' : 'Create New Rule'}
          </h4>

          <div className="space-y-3">
            {/* Description String */}
            <div>
              <Label htmlFor="description-string" className="text-xs">
                Description Pattern
              </Label>
              <Input
                id="description-string"
                value={descriptionString}
                onChange={(e) => setDescriptionString(e.target.value)}
                placeholder="e.g., TESCO, AMAZON"
                className="text-sm"
                data-testid="description-string-input"
              />
              <p className="text-xs text-gray-500 mt-1">
                The string to match in transaction descriptions
              </p>
            </div>

            {/* Exact Match Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="exact-match"
                checked={exactMatch}
                onChange={(e) => setExactMatch(e.target.checked)}
                className="rounded border-gray-300"
                data-testid="exact-match-checkbox"
              />
              <Label htmlFor="exact-match" className="text-xs font-normal cursor-pointer">
                Exact match only (case-insensitive)
              </Label>
            </div>
            <p className="text-xs text-gray-500 -mt-1 ml-6">
              {exactMatch
                ? 'Description must exactly match the pattern'
                : 'Description can contain the pattern anywhere'}
            </p>

            {/* Spending Types Selection */}
            <div>
              <Label className="text-xs mb-2 block">Apply Spending Types</Label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {spendingTypes.map((st) => (
                  <div key={st.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`spending-type-${st.id}`}
                      checked={selectedSpendingTypes.includes(st.id)}
                      onChange={() => toggleSpendingType(st.id)}
                      className="rounded border-gray-300"
                      data-testid={`spending-type-checkbox-${st.name}`}
                    />
                    <Label
                      htmlFor={`spending-type-${st.id}`}
                      className="text-xs font-normal cursor-pointer"
                    >
                      {st.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {formError && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded" data-testid="form-error">
                {formError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting}
                data-testid="save-rule-button"
              >
                <Check className="h-4 w-4 mr-1" />
                {submitting ? 'Saving...' : editingRuleId ? 'Update' : 'Create'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={resetForm}
                disabled={submitting}
                data-testid="cancel-rule-button"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      {loading ? (
        <div className="text-center py-8 text-sm text-gray-500">Loading rules...</div>
      ) : rules.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-2">No categorization rules yet</p>
          <p className="text-xs text-gray-400">
            Create rules to automatically tag transactions during import
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              data-testid={`rule-${rule.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      "{rule.descriptionString}"
                    </span>
                    {rule.exactMatch && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                        Exact
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {rule.spendingTypes.map((st) => (
                      <span
                        key={st.id}
                        className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded"
                      >
                        {st.name}
                      </span>
                    ))}
                  </div>
                  {selectedBankAccountId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplyToExisting(rule.id)}
                      disabled={applyingRuleId === rule.id}
                      className="text-xs h-7"
                      data-testid={`apply-rule-${rule.id}`}
                    >
                      {applyingRuleId === rule.id ? 'Applying...' : 'Apply To Existing'}
                    </Button>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(rule)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit rule"
                    data-testid={`edit-rule-${rule.id}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete rule"
                    data-testid={`delete-rule-${rule.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      {rules.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <strong>How it works:</strong> When you import CSV files, transactions are automatically
            matched against these rules and tagged with the associated spending types.
          </p>
        </div>
      )}
    </div>
  );
}
