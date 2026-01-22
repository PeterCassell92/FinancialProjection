/**
 * Tool Call Handlers
 *
 * Handles execution of MCP tool calls by mapping them to API requests.
 */

import { apiRequest } from './api-client.js';

/**
 * Handle tool execution
 */
export async function handleToolCall(name: string, args: any): Promise<any> {
  switch (name) {
    // ========== Projection Events ==========
    case 'get_projection_events':
      return await apiRequest('/projection-events', {
        params: {
          startDate: args.startDate,
          endDate: args.endDate,
          bankAccountId: args.bankAccountId,
          ...(args.decisionPathId && { decisionPathId: args.decisionPathId }),
        },
      });

    case 'create_projection_event':
      return await apiRequest('/projection-events', {
        method: 'POST',
        body: args,
      });

    case 'get_projection_event':
      return await apiRequest(`/projection-events/${args.id}`);

    case 'update_projection_event': {
      const { id, ...updateData } = args;
      return await apiRequest(`/projection-events/${id}`, {
        method: 'PUT',
        body: updateData,
      });
    }

    case 'delete_projection_event':
      return await apiRequest(`/projection-events/${args.id}`, {
        method: 'DELETE',
      });

    // ========== Recurring Event Rules ==========
    case 'get_recurring_event_rules':
      return await apiRequest('/recurring-event-rules');

    case 'create_recurring_event_rule':
      return await apiRequest('/recurring-event-rules', {
        method: 'POST',
        body: args,
      });

    case 'update_recurring_event_rule': {
      const { id, ...updateData } = args;
      return await apiRequest(`/recurring-event-rules/${id}`, {
        method: 'PATCH',
        body: updateData,
      });
    }

    case 'delete_recurring_event_rule':
      return await apiRequest(`/recurring-event-rules/${args.id}`, {
        method: 'DELETE',
      });

    // ========== Daily Balance ==========
    case 'get_daily_balances':
      return await apiRequest('/daily-balance', {
        params: {
          startDate: args.startDate,
          endDate: args.endDate,
          bankAccountId: args.bankAccountId,
        },
      });

    case 'set_actual_balance':
      return await apiRequest('/daily-balance', {
        method: 'PUT',
        body: args,
      });

    case 'clear_actual_balance':
      return await apiRequest('/daily-balance', {
        method: 'DELETE',
        params: {
          date: args.date,
          bankAccountId: args.bankAccountId,
        },
      });

    // ========== Bank Accounts ==========
    case 'get_bank_accounts':
      return await apiRequest('/bank-accounts');

    case 'create_bank_account':
      return await apiRequest('/bank-accounts', {
        method: 'POST',
        body: args,
      });

    case 'get_bank_account':
      return await apiRequest(`/bank-accounts/${args.id}`);

    case 'update_bank_account': {
      const { id, ...updateData } = args;
      return await apiRequest(`/bank-accounts/${id}`, {
        method: 'PATCH',
        body: updateData,
      });
    }

    case 'delete_bank_account':
      return await apiRequest(`/bank-accounts/${args.id}`, {
        method: 'DELETE',
        params: args.deleteAll ? { deleteAll: 'true' } : {},
      });

    case 'merge_bank_accounts':
      return await apiRequest('/bank-accounts/merge', {
        method: 'POST',
        body: args,
      });

    // ========== Settings ==========
    case 'get_settings':
      return await apiRequest('/settings');

    case 'update_settings':
      return await apiRequest('/settings', {
        method: 'PATCH',
        body: args,
      });

    // ========== Decision Paths ==========
    case 'get_decision_paths':
      return await apiRequest('/decision-paths');

    case 'create_decision_path':
      return await apiRequest('/decision-paths', {
        method: 'POST',
        body: args,
      });

    // ========== Scenario Sets ==========
    case 'get_scenario_sets':
      return await apiRequest('/scenario-sets');

    case 'create_scenario_set':
      return await apiRequest('/scenario-sets', {
        method: 'POST',
        body: args,
      });

    case 'update_scenario_set': {
      const { id, ...updateData } = args;
      return await apiRequest(`/scenario-sets/${id}`, {
        method: 'PATCH',
        body: updateData,
      });
    }

    // ========== Transaction Records ==========
    case 'get_transaction_records': {
      const params: Record<string, string> = {
        bankAccountId: args.bankAccountId,
      };
      if (args.startDate) params.startDate = args.startDate;
      if (args.endDate) params.endDate = args.endDate;
      if (args.description) params.description = args.description;
      if (args.spendingTypeIds) params.spendingTypeIds = args.spendingTypeIds;
      if (args.spendingTypeNames) params.spendingTypeNames = args.spendingTypeNames;
      if (args.amountOperator) params.amountOperator = args.amountOperator;
      if (args.amountValue !== undefined) params.amountValue = args.amountValue.toString();
      if (args.page) params.page = args.page.toString();
      if (args.pageSize) params.pageSize = args.pageSize.toString();

      return await apiRequest('/transaction-records', { params });
    }

    case 'mass_update_transactions':
      return await apiRequest('/transaction-records/mass-update', {
        method: 'PATCH',
        body: args,
      });

    case 'reassign_transactions':
      return await apiRequest('/transaction-records/reassign-account', {
        method: 'PATCH',
        body: args,
      });

    case 'get_transaction_analytics': {
      const params: Record<string, string> = {
        bankAccountId: args.bankAccountId,
      };
      if (args.startDate) params.startDate = args.startDate;
      if (args.endDate) params.endDate = args.endDate;

      return await apiRequest('/transaction-records/analytics', { params });
    }

    // ========== Spending Types ==========
    case 'get_spending_types':
      return await apiRequest('/spending-types');

    case 'create_spending_type':
      return await apiRequest('/spending-types', {
        method: 'POST',
        body: args,
      });

    case 'update_spending_type': {
      const { id, ...updateData } = args;
      return await apiRequest(`/spending-types/${id}`, {
        method: 'PATCH',
        body: updateData,
      });
    }

    case 'delete_spending_type':
      return await apiRequest(`/spending-types/${args.id}`, {
        method: 'DELETE',
      });

    // ========== Transaction Categorization Rules ==========
    case 'get_categorization_rules':
      return await apiRequest('/categorization-rules');

    case 'get_categorization_rule':
      return await apiRequest(`/categorization-rules/${args.id}`);

    case 'create_categorization_rule':
      return await apiRequest('/categorization-rules', {
        method: 'POST',
        body: args,
      });

    case 'update_categorization_rule': {
      const { id, ...updateData } = args;
      return await apiRequest(`/categorization-rules/${id}`, {
        method: 'PATCH',
        body: updateData,
      });
    }

    case 'delete_categorization_rule':
      return await apiRequest(`/categorization-rules/${args.id}`, {
        method: 'DELETE',
      });

    case 'apply_categorization_rule':
      return await apiRequest(`/categorization-rules/${args.id}/apply`, {
        method: 'POST',
        body: {
          bankAccountId: args.bankAccountId,
        },
      });

    case 'apply_all_categorization_rules':
      return await apiRequest(`/categorization-rules/apply-all`, {
        method: 'POST',
        body: {
          bankAccountId: args.bankAccountId,
        },
      });

    case 'remove_spending_type_by_condition':
      return await apiRequest(`/transaction-records/remove-spending-types`, {
        method: 'POST',
        body: {
          bankAccountId: args.bankAccountId,
          descriptionString: args.descriptionString,
          exactMatch: args.exactMatch ?? false,
          spendingTypeIds: args.spendingTypeIds,
          dateRange: args.dateRange,
        },
      });

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
