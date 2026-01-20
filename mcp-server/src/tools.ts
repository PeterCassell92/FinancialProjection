/**
 * MCP Tool Definitions
 *
 * Defines all available tools that expose the Financial Projections API endpoints.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const tools: Tool[] = [
  // ========== Projection Events ==========
  {
    name: 'get_projection_events',
    description: 'Get projection events within a date range for a specific bank account',
    inputSchema: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
        bankAccountId: { type: 'string', description: 'Bank account UUID' },
        decisionPathId: { type: 'string', description: 'Optional: Filter by decision path UUID' },
      },
      required: ['startDate', 'endDate', 'bankAccountId'],
    },
  },
  {
    name: 'create_projection_event',
    description: 'Create a new projection event (one-time expense or income)',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Event name' },
        description: { type: 'string', description: 'Event description' },
        value: { type: 'number', description: 'Amount' },
        type: { type: 'string', enum: ['EXPENSE', 'INCOMING'], description: 'Event type' },
        certainty: { type: 'string', enum: ['UNLIKELY', 'POSSIBLE', 'LIKELY', 'CERTAIN'], description: 'Certainty level' },
        payTo: { type: 'string', description: 'Who to pay (for expenses)' },
        paidBy: { type: 'string', description: 'Who pays (for income)' },
        date: { type: 'string', description: 'Event date (YYYY-MM-DD)' },
        bankAccountId: { type: 'string', description: 'Bank account UUID' },
        decisionPathId: { type: 'string', description: 'Optional: Decision path UUID' },
      },
      required: ['name', 'value', 'type', 'certainty', 'date', 'bankAccountId'],
    },
  },
  {
    name: 'get_projection_event',
    description: 'Get a single projection event by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Event UUID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'update_projection_event',
    description: 'Update an existing projection event',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Event UUID' },
        name: { type: 'string', description: 'Event name' },
        description: { type: 'string', description: 'Event description' },
        value: { type: 'number', description: 'Amount' },
        type: { type: 'string', enum: ['EXPENSE', 'INCOMING'], description: 'Event type' },
        certainty: { type: 'string', enum: ['UNLIKELY', 'POSSIBLE', 'LIKELY', 'CERTAIN'], description: 'Certainty level' },
        payTo: { type: 'string', description: 'Who to pay (for expenses)' },
        paidBy: { type: 'string', description: 'Who pays (for income)' },
        date: { type: 'string', description: 'Event date (YYYY-MM-DD)' },
        decisionPathId: { type: 'string', description: 'Decision path UUID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_projection_event',
    description: 'Delete a projection event',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Event UUID' },
      },
      required: ['id'],
    },
  },

  // ========== Recurring Event Rules ==========
  {
    name: 'get_recurring_event_rules',
    description: 'Get all recurring event rules',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_recurring_event_rule',
    description: 'Create a recurring event rule (generates multiple projection events)',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Rule name' },
        description: { type: 'string', description: 'Rule description' },
        value: { type: 'number', description: 'Amount per occurrence' },
        type: { type: 'string', enum: ['EXPENSE', 'INCOMING'], description: 'Event type' },
        certainty: { type: 'string', enum: ['UNLIKELY', 'POSSIBLE', 'LIKELY', 'CERTAIN'], description: 'Certainty level' },
        payTo: { type: 'string', description: 'Who to pay (for expenses)' },
        paidBy: { type: 'string', description: 'Who pays (for income)' },
        bankAccountId: { type: 'string', description: 'Bank account UUID' },
        decisionPathId: { type: 'string', description: 'Optional: Decision path UUID' },
        startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
        frequency: { type: 'string', enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL'], description: 'Recurrence frequency' },
      },
      required: ['name', 'value', 'type', 'certainty', 'bankAccountId', 'startDate', 'endDate', 'frequency'],
    },
  },
  {
    name: 'update_recurring_event_rule',
    description: 'Update a recurring event rule (regenerates all events)',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Rule UUID' },
        name: { type: 'string', description: 'Rule name' },
        description: { type: 'string', description: 'Rule description' },
        value: { type: 'number', description: 'Amount per occurrence' },
        certainty: { type: 'string', enum: ['UNLIKELY', 'POSSIBLE', 'LIKELY', 'CERTAIN'], description: 'Certainty level' },
        payTo: { type: 'string', description: 'Who to pay (for expenses)' },
        paidBy: { type: 'string', description: 'Who pays (for income)' },
        decisionPathId: { type: 'string', description: 'Decision path UUID' },
        endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_recurring_event_rule',
    description: 'Delete a recurring event rule (also deletes all generated events)',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Rule UUID' },
      },
      required: ['id'],
    },
  },

  // ========== Daily Balance ==========
  {
    name: 'get_daily_balances',
    description: 'Get calculated daily balances for a date range',
    inputSchema: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
        bankAccountId: { type: 'string', description: 'Bank account UUID' },
      },
      required: ['startDate', 'endDate', 'bankAccountId'],
    },
  },
  {
    name: 'set_actual_balance',
    description: 'Set the actual balance for a specific day (overrides calculated value)',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date (YYYY-MM-DD)' },
        actualBalance: { type: 'number', description: 'Actual balance amount' },
        bankAccountId: { type: 'string', description: 'Bank account UUID' },
      },
      required: ['date', 'actualBalance', 'bankAccountId'],
    },
  },
  {
    name: 'clear_actual_balance',
    description: 'Clear the actual balance for a specific day (reverts to calculated)',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date (YYYY-MM-DD)' },
        bankAccountId: { type: 'string', description: 'Bank account UUID' },
      },
      required: ['date', 'bankAccountId'],
    },
  },

  // ========== Bank Accounts ==========
  {
    name: 'get_bank_accounts',
    description: 'Get all bank accounts',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_bank_account',
    description: 'Create a new bank account',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Account name' },
        description: { type: 'string', description: 'Account description' },
        sortCode: { type: 'string', description: 'Sort code (XX-XX-XX)' },
        accountNumber: { type: 'string', description: 'Account number (8 digits)' },
        provider: { type: 'string', enum: ['HALIFAX', 'LLOYDS', 'BANK_OF_SCOTLAND', 'BARCLAYS', 'HSBC', 'NATIONWIDE', 'SANTANDER', 'NATWEST', 'RBS', 'TSB', 'OTHER'], description: 'Bank provider' },
      },
      required: ['name', 'sortCode', 'accountNumber'],
    },
  },
  {
    name: 'get_bank_account',
    description: 'Get a single bank account by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Account UUID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'update_bank_account',
    description: 'Update a bank account',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Account UUID' },
        name: { type: 'string', description: 'Account name' },
        description: { type: 'string', description: 'Account description' },
        provider: { type: 'string', description: 'Bank provider' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_bank_account',
    description: 'Delete a bank account. By default, fails if the account has any associated records (transactions, events, etc.). Use deleteAll=true to cascade delete all associated data.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Account UUID' },
        deleteAll: { type: 'boolean', description: 'If true, delete the bank account AND all associated records (transactions, projection events, recurring rules, daily balances, upload operations). If false/omitted, only delete the account itself (fails if it has related records).' },
      },
      required: ['id'],
    },
  },
  {
    name: 'merge_bank_accounts',
    description: 'Merge one bank account into another by moving all associated data (transactions, projection events, recurring rules, daily balances, upload operations)',
    inputSchema: {
      type: 'object',
      properties: {
        fromBankAccountId: { type: 'string', description: 'UUID of source bank account to merge from' },
        toBankAccountId: { type: 'string', description: 'UUID of target bank account to merge into' },
        deleteSourceAccount: { type: 'boolean', description: 'Whether to delete source account after merge (default: true)' },
      },
      required: ['fromBankAccountId', 'toBankAccountId'],
    },
  },

  // ========== Settings ==========
  {
    name: 'get_settings',
    description: 'Get application settings (currency, date format, initial balance)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'update_settings',
    description: 'Update application settings',
    inputSchema: {
      type: 'object',
      properties: {
        initialBankBalance: { type: 'number', description: 'Initial balance amount' },
        initialBalanceDate: { type: 'string', description: 'Initial balance date (YYYY-MM-DD)' },
        currency: { type: 'string', enum: ['GBP', 'USD'], description: 'Currency' },
        dateFormat: { type: 'string', enum: ['UK', 'US'], description: 'Date format' },
        defaultBankAccountId: { type: 'string', description: 'Default bank account UUID' },
      },
    },
  },

  // ========== Decision Paths ==========
  {
    name: 'get_decision_paths',
    description: 'Get all decision paths for scenario planning',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_decision_path',
    description: 'Create a new decision path',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Decision path name (e.g., "Buy House")' },
        description: { type: 'string', description: 'Description of the decision' },
      },
      required: ['name'],
    },
  },

  // ========== Scenario Sets ==========
  {
    name: 'get_scenario_sets',
    description: 'Get all scenario sets (combinations of decision paths)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_scenario_set',
    description: 'Create a new scenario set',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Scenario name' },
        description: { type: 'string', description: 'Scenario description' },
        decisionPaths: {
          type: 'object',
          description: 'Decision path states (key: decisionPathId, value: enabled boolean)',
          additionalProperties: { type: 'boolean' }
        },
      },
      required: ['name', 'decisionPaths'],
    },
  },
  {
    name: 'update_scenario_set',
    description: 'Update a scenario set',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Scenario set UUID' },
        name: { type: 'string', description: 'Scenario name' },
        description: { type: 'string', description: 'Scenario description' },
        decisionPaths: {
          type: 'object',
          description: 'Decision path states (key: decisionPathId, value: enabled boolean)',
          additionalProperties: { type: 'boolean' }
        },
      },
      required: ['id'],
    },
  },

  // ========== Transaction Records ==========
  {
    name: 'get_transaction_records',
    description: 'Get transaction records (imported from bank statements)',
    inputSchema: {
      type: 'object',
      properties: {
        bankAccountId: { type: 'string', description: 'Bank account UUID' },
        startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
        page: { type: 'number', description: 'Page number (1-based)' },
        pageSize: { type: 'number', description: 'Results per page' },
      },
      required: ['bankAccountId'],
    },
  },
  {
    name: 'mass_update_transactions',
    description: 'Update multiple transaction records at once with the same notes and/or spending types',
    inputSchema: {
      type: 'object',
      properties: {
        transactionIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of transaction record UUIDs to update',
          minItems: 1
        },
        notes: { type: 'string', description: 'Notes to apply to all transactions (optional)' },
        spendingTypeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Spending type UUIDs to assign to all transactions (optional)'
        },
      },
      required: ['transactionIds'],
    },
  },
  {
    name: 'reassign_transactions',
    description: 'Reassign transaction records from one bank account to another. Can reassign specific transactions or all transactions from an account.',
    inputSchema: {
      type: 'object',
      properties: {
        transactionIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of specific transaction record UUIDs to reassign (optional)'
        },
        fromBankAccountId: { type: 'string', description: 'UUID of source bank account - reassigns all transactions from this account (optional)' },
        toBankAccountId: { type: 'string', description: 'UUID of target bank account to reassign transactions to' },
      },
      required: ['toBankAccountId'],
    },
  },
  {
    name: 'get_transaction_analytics',
    description: 'Get transaction analytics grouped by spending categories and monthly trends. Returns category breakdowns, totals, and monthly spending data.',
    inputSchema: {
      type: 'object',
      properties: {
        bankAccountId: { type: 'string', description: 'Bank account UUID' },
        startDate: { type: 'string', description: 'Start date (YYYY-MM-DD) - optional, filters transactions from this date' },
        endDate: { type: 'string', description: 'End date (YYYY-MM-DD) - optional, filters transactions to this date' },
      },
      required: ['bankAccountId'],
    },
  },

  // ========== Spending Types ==========
  {
    name: 'get_spending_types',
    description: 'Get all spending types for transaction categorization',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_spending_type',
    description: 'Create a new spending type category',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Category name' },
        description: { type: 'string', description: 'Category description' },
        color: { type: 'string', description: 'Hex color code (e.g., #ff5733)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_spending_type',
    description: 'Update a spending type',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Spending type UUID' },
        name: { type: 'string', description: 'Category name' },
        description: { type: 'string', description: 'Category description' },
        color: { type: 'string', description: 'Hex color code' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_spending_type',
    description: 'Delete a spending type',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Spending type UUID' },
      },
      required: ['id'],
    },
  },

  // ========== Transaction Categorization Rules ==========
  {
    name: 'get_categorization_rules',
    description: 'Get all transaction categorization rules with their associated spending types. These rules automatically tag transactions during CSV import based on description string matching.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_categorization_rule',
    description: 'Get a specific transaction categorization rule by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Categorization rule UUID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_categorization_rule',
    description: 'Create a new transaction categorization rule. When transactions are imported, the system will automatically match transaction descriptions against this rule and apply the associated spending types.',
    inputSchema: {
      type: 'object',
      properties: {
        descriptionString: { type: 'string', description: 'String to match against transaction descriptions (e.g., "TESCO", "AMAZON", "SPOTIFY")' },
        exactMatch: { type: 'boolean', description: 'If true, requires exact match (case-insensitive). If false, does partial/contains match (case-insensitive)' },
        spendingTypeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of spending type UUIDs to associate with matching transactions'
        },
      },
      required: ['descriptionString', 'exactMatch', 'spendingTypeIds'],
    },
  },
  {
    name: 'update_categorization_rule',
    description: 'Update an existing categorization rule. When spendingTypeIds is provided, it replaces all existing spending type associations.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Categorization rule UUID' },
        descriptionString: { type: 'string', description: 'String to match against transaction descriptions' },
        exactMatch: { type: 'boolean', description: 'If true, requires exact match. If false, does partial match' },
        spendingTypeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of spending type UUIDs (replaces existing associations)'
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_categorization_rule',
    description: 'Delete a categorization rule. This will cascade delete all spending type associations for the rule.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Categorization rule UUID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'apply_categorization_rule',
    description: 'Apply a categorization rule to all existing transactions for a specific bank account. Adds the rule\'s spending types to matching transactions that don\'t already have them.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Categorization rule UUID' },
        bankAccountId: { type: 'string', description: 'Bank account UUID to apply the rule to' },
      },
      required: ['id', 'bankAccountId'],
    },
  },
];
