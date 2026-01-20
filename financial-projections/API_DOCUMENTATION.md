# API Documentation

This document provides detailed information about all API endpoints in the Financial Projections application.

## Response Format

All API endpoints return JSON responses with a consistent format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## Authentication

Currently, the application does not require authentication as it's designed for single-user local use.

## Base URL

All API routes are prefixed with `/api`

---

## Projection Events

### GET /api/projection-events

Get projection events within a date range for a specific bank account.

**Query Parameters:**
- `startDate` (required): ISO date string (YYYY-MM-DD)
- `endDate` (required): ISO date string (YYYY-MM-DD)
- `bankAccountId` (required): UUID of bank account
- `decisionPathId` (optional): Filter by decision path UUID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Rent Payment",
      "description": "Monthly rent",
      "value": 1500.00,
      "type": "EXPENSE",
      "certainty": "CERTAIN",
      "payTo": "Landlord",
      "paidBy": null,
      "date": "2026-02-01T00:00:00.000Z",
      "bankAccountId": "uuid",
      "decisionPathId": null,
      "recurringRuleId": "uuid",
      "createdAt": "2026-01-18T00:00:00.000Z",
      "updatedAt": "2026-01-18T00:00:00.000Z"
    }
  ]
}
```

### POST /api/projection-events

Create a new projection event.

**Request Body:**
```json
{
  "name": "Grocery Shopping",
  "description": "Weekly groceries",
  "value": 150.00,
  "type": "EXPENSE",
  "certainty": "LIKELY",
  "payTo": "Supermarket",
  "paidBy": null,
  "date": "2026-02-05",
  "bankAccountId": "uuid",
  "decisionPathId": null
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Created event object */ },
  "message": "Projection event created successfully"
}
```

### GET /api/projection-events/[id]

Get a single projection event by ID.

**Response:**
```json
{
  "success": true,
  "data": { /* Event object */ }
}
```

### PUT /api/projection-events/[id]

Update a projection event.

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "value": 200.00,
  "certainty": "CERTAIN"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Updated event object */ },
  "message": "Projection event updated successfully"
}
```

### DELETE /api/projection-events/[id]

Delete a projection event.

**Response:**
```json
{
  "success": true,
  "message": "Projection event deleted successfully"
}
```

---

## Recurring Event Rules

### GET /api/recurring-event-rules

Get all recurring event rules.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Monthly Salary",
      "description": "Salary payment",
      "value": 5000.00,
      "type": "INCOMING",
      "certainty": "CERTAIN",
      "payTo": null,
      "paidBy": "Employer",
      "bankAccountId": "uuid",
      "decisionPathId": null,
      "startDate": "2026-01-31T00:00:00.000Z",
      "endDate": "2026-12-31T00:00:00.000Z",
      "frequency": "MONTHLY",
      "createdAt": "2026-01-18T00:00:00.000Z",
      "updatedAt": "2026-01-18T00:00:00.000Z"
    }
  ]
}
```

### POST /api/recurring-event-rules

Create a new recurring event rule and generate projection events.

**Request Body:**
```json
{
  "name": "Monthly Gym Membership",
  "description": "Gym subscription",
  "value": 50.00,
  "type": "EXPENSE",
  "certainty": "CERTAIN",
  "payTo": "Gym",
  "paidBy": null,
  "bankAccountId": "uuid",
  "decisionPathId": null,
  "startDate": "2026-02-01",
  "endDate": "2026-12-31",
  "frequency": "MONTHLY"
}
```

**Frequency Options:**
- `DAILY`: Every day
- `WEEKLY`: Every 7 days
- `MONTHLY`: Same day each month (or last day if not available)
- `ANNUAL`: Same day each year

**Response:**
```json
{
  "success": true,
  "data": {
    "rule": { /* Created rule object */ },
    "generatedEventsCount": 11
  },
  "message": "Recurring event rule created successfully with 11 events"
}
```

### GET /api/recurring-event-rules/[id]

Get a recurring event rule by ID including all generated events.

**Response:**
```json
{
  "success": true,
  "data": {
    /* Rule object with projectionEvents array */
  }
}
```

### PATCH /api/recurring-event-rules/[id]

Update a recurring event rule and regenerate events.

**Request Body:** (all fields optional)
```json
{
  "value": 60.00,
  "endDate": "2027-12-31"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rule": { /* Updated rule */ },
    "generatedEventsCount": 23
  },
  "message": "Recurring event rule updated successfully"
}
```

### DELETE /api/recurring-event-rules/[id]

Delete a recurring event rule (cascades to delete all generated events).

**Response:**
```json
{
  "success": true,
  "message": "Recurring event rule deleted successfully"
}
```

---

## Daily Balances

### GET /api/daily-balance

Get daily balances for a date range or specific date.

**Query Parameters (Option 1 - Range):**
- `startDate` (required): ISO date string
- `endDate` (required): ISO date string
- `bankAccountId` (required): UUID

**Query Parameters (Option 2 - Single Date):**
- `date` (required): ISO date string
- `bankAccountId` (required): UUID

**Response (Range):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "date": "2026-02-01T00:00:00.000Z",
      "expectedBalance": 5234.56,
      "actualBalance": null,
      "bankAccountId": "uuid",
      "createdAt": "2026-01-18T00:00:00.000Z",
      "updatedAt": "2026-01-18T00:00:00.000Z"
    }
  ]
}
```

### PUT /api/daily-balance

Set actual balance for a specific date.

**Request Body:**
```json
{
  "date": "2026-02-01",
  "bankAccountId": "uuid",
  "actualBalance": 5240.00
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Updated balance object */ },
  "message": "Actual balance set successfully"
}
```

**Note:** Setting an actual balance triggers recalculation of all subsequent balances for the next 6 months.

### DELETE /api/daily-balance

Clear actual balance for a specific date.

**Query Parameters:**
- `date` (required): ISO date string
- `bankAccountId` (required): UUID

**Response:**
```json
{
  "success": true,
  "message": "Actual balance cleared successfully"
}
```

---

## Bank Accounts

### GET /api/bank-accounts

Get all bank accounts.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Current Account",
      "description": "Main checking account",
      "sortCode": "12-34-56",
      "accountNumber": "12345678",
      "provider": "HALIFAX",
      "createdAt": "2026-01-18T00:00:00.000Z",
      "updatedAt": "2026-01-18T00:00:00.000Z"
    }
  ]
}
```

### POST /api/bank-accounts

Create a new bank account.

**Request Body:**
```json
{
  "name": "Savings Account",
  "description": "Emergency fund",
  "sortCode": "12-34-56",
  "accountNumber": "87654321",
  "provider": "NATWEST"
}
```

**Provider Options:**
- `HALIFAX`
- `NATWEST`
- `BARCLAYS`
- `HSBC`
- `LLOYDS`
- `SANTANDER`
- `OTHER`

**Response:**
```json
{
  "success": true,
  "data": { /* Created account */ },
  "message": "Bank account created successfully"
}
```

### GET /api/bank-accounts/[id]

Get a single bank account.

### PATCH /api/bank-accounts/[id]

Update a bank account.

### DELETE /api/bank-accounts/[id]

Delete a bank account, with optional cascade deletion of all associated records.

**Query Parameters:**
- `deleteAll` (optional): Set to `true` to delete the bank account AND all associated records (transactions, projection events, recurring rules, daily balances, upload operations). If omitted or `false`, will only delete the bank account itself (fails if it has related records).

**Response (without deleteAll):**
```json
{
  "success": true,
  "message": "Bank account deleted successfully"
}
```

**Response (with deleteAll=true):**
```json
{
  "success": true,
  "message": "Bank account and all associated records deleted successfully (561 transactions)"
}
```

**Error Response (409 - without deleteAll when records exist):**
```json
{
  "success": false,
  "error": "Cannot delete bank account with existing transactions or events. Use deleteAll=true to delete all associated records."
}
```

**Note:** When `deleteAll=true`, the following data is permanently deleted:
1. All projection events for the account
2. All recurring projection event rules for the account
3. All daily balance calculations for the account
4. All upload operations for the account (and their junction table entries)
5. All transaction records for the account (and their spending type associations)
6. The bank account itself

### POST /api/bank-accounts/merge

Merge one bank account into another by moving all associated data.

**Request Body:**
```json
{
  "fromBankAccountId": "uuid",
  "toBankAccountId": "uuid",
  "deleteSourceAccount": true
}
```

**Fields:**
- `fromBankAccountId` (required): UUID of the source bank account to merge from
- `toBankAccountId` (required): UUID of the target bank account to merge into
- `deleteSourceAccount` (optional): Whether to delete the source account after merge (default: true)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionsMoved": 3564,
    "projectionEventsMoved": 527,
    "recurringRulesMoved": 12,
    "dailyBalancesMoved": 180,
    "uploadOperationsMoved": 3,
    "sourceAccountDeleted": true,
    "fromAccount": "Account 0REDACTED",
    "toAccount": "Main Current Account"
  },
  "message": "Successfully merged \"Account 0REDACTED\" into \"Main Current Account\""
}
```

**Note:** This operation moves all transactions, projection events, recurring rules, daily balances, and upload operations from the source account to the target account in a single atomic transaction.

---

## Settings

### GET /api/settings

Get application settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "initialBankBalance": 10000.00,
    "initialBalanceDate": "2026-01-01T00:00:00.000Z",
    "currency": "GBP",
    "dateFormat": "UK",
    "defaultBankAccountId": "uuid",
    "defaultBankAccount": {
      "id": "uuid",
      "name": "Current Account"
    },
    "createdAt": "2026-01-18T00:00:00.000Z",
    "updatedAt": "2026-01-18T00:00:00.000Z"
  }
}
```

### PUT /api/settings

Update all settings (full update).

**Request Body:**
```json
{
  "initialBankBalance": 12000.00,
  "initialBalanceDate": "2026-01-01",
  "currency": "USD",
  "dateFormat": "US",
  "defaultBankAccountId": "uuid"
}
```

### PATCH /api/settings

Partially update settings.

**Request Body:** (all fields optional)
```json
{
  "currency": "USD",
  "dateFormat": "US"
}
```

**Note:** Changing initial balance triggers recalculation of all balances.

---

## Decision Paths

### GET /api/decision-paths

Get all decision paths.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Buy House",
      "description": "Scenario where we purchase a property",
      "createdAt": "2026-01-18T00:00:00.000Z",
      "updatedAt": "2026-01-18T00:00:00.000Z"
    }
  ]
}
```

### POST /api/decision-paths

Create or get existing decision path.

**Request Body:**
```json
{
  "name": "Keep Renting"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Decision path object */ },
  "message": "Decision path created successfully"
}
```

**Note:** If a decision path with the same name exists, it returns the existing one.

---

## Scenario Sets

### GET /api/scenario-sets

Get all scenario sets.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "House Purchase Scenario",
      "description": "Comparing house purchase vs renting",
      "isDefault": false,
      "decisionPaths": [
        {
          "id": "uuid",
          "decisionPathId": "uuid",
          "enabled": true,
          "decisionPath": {
            "id": "uuid",
            "name": "Buy House",
            "description": "Purchase scenario"
          }
        }
      ],
      "createdAt": "2026-01-18T00:00:00.000Z",
      "updatedAt": "2026-01-18T00:00:00.000Z"
    }
  ]
}
```

### POST /api/scenario-sets

Create a new scenario set.

**Request Body:**
```json
{
  "name": "My Scenario",
  "description": "Comparing options",
  "decisionPathStates": {
    "decision-path-uuid-1": true,
    "decision-path-uuid-2": false
  }
}
```

### PATCH /api/scenario-sets/[id]

Update a scenario set.

**Request Body (Update metadata):**
```json
{
  "name": "Updated Name",
  "description": "New description"
}
```

**Request Body (Update decision paths):**
```json
{
  "decisionPaths": [
    {
      "decisionPathId": "uuid",
      "enabled": true
    }
  ]
}
```

---

## Transaction Records

### GET /api/transaction-records

Get transaction records with pagination and filtering.

**Query Parameters:**
- `bankAccountId` (required): UUID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 50)
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date
- `description` (optional): Search in description
- `format` (optional): Response format - `json` (default) or `toon` (compact format, 60-70% fewer tokens)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "bankAccountId": "uuid",
        "transactionDate": "2026-01-15T00:00:00.000Z",
        "transactionType": "DEB",
        "transactionDescription": "TESCO STORES",
        "debitAmount": 45.67,
        "creditAmount": null,
        "balance": 1234.56,
        "notes": null,
        "spendingTypes": [
          {
            "spendingType": {
              "id": "uuid",
              "name": "Groceries",
              "color": "#4CAF50"
            }
          }
        ]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "recordsPerPage": 50,
      "totalRecords": 150,
      "totalPages": 3
    }
  }
}
```

### POST /api/transaction-records/upload-csv

Upload and import bank statement CSV.

**Request Body:** (multipart/form-data)
- `file`: CSV file
- `bankAccountId`: UUID
- `provider`: Bank provider (HALIFAX, etc.)
- `allowDuplicates`: boolean (optional, default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "operationId": "uuid",
    "recordsCreated": 45
  },
  "message": "45 transactions imported successfully"
}
```

### DELETE /api/transaction-records/bulk-delete

Delete multiple transaction records.

**Request Body:**
```json
{
  "transactionIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deletedCount": 3
  },
  "message": "3 transactions deleted successfully"
}
```

### PATCH /api/transaction-records/mass-update

Mass update multiple transaction records with the same notes and/or spending types.

**Request Body:**
```json
{
  "transactionIds": ["uuid1", "uuid2", "uuid3"],
  "notes": "Weekly grocery shopping",
  "spendingTypeIds": ["spending-type-uuid-1", "spending-type-uuid-2"]
}
```

**Fields:**
- `transactionIds` (required): Array of transaction record UUIDs to update
- `notes` (optional): Notes to apply to all selected transactions
- `spendingTypeIds` (optional): Array of spending type UUIDs to assign to all selected transactions

**Note:** At least one of `notes` or `spendingTypeIds` must be provided.

**Response:**
```json
{
  "success": true,
  "data": {
    "updatedCount": 3
  },
  "message": "Successfully updated 3 transactions"
}
```

### PATCH /api/transaction-records/reassign-account

Reassign transaction records from one bank account to another.

**Request Body (Option 1 - Specific Transactions):**
```json
{
  "transactionIds": ["uuid1", "uuid2", "uuid3"],
  "toBankAccountId": "target-account-uuid"
}
```

**Request Body (Option 2 - All Transactions from Account):**
```json
{
  "fromBankAccountId": "source-account-uuid",
  "toBankAccountId": "target-account-uuid"
}
```

**Fields:**
- `transactionIds` (optional): Array of specific transaction record UUIDs to reassign
- `fromBankAccountId` (optional): UUID of source bank account (reassigns all transactions from this account)
- `toBankAccountId` (required): UUID of target bank account to reassign transactions to

**Note:** Must provide either `transactionIds` or `fromBankAccountId`.

**Response:**
```json
{
  "success": true,
  "data": {
    "updatedCount": 3564,
    "toBankAccountName": "Main Current Account"
  },
  "message": "Successfully reassigned 3564 transactions to Main Current Account"
}
```

### GET /api/transaction-records/analytics

Get transaction analytics grouped by spending categories and monthly trends.

**Query Parameters:**
- `bankAccountId` (required): UUID of the bank account
- `startDate` (optional): ISO date string (YYYY-MM-DD) for filtering from date
- `endDate` (optional): ISO date string (YYYY-MM-DD) for filtering to date
- `format` (optional): Response format - `json` (default) or `toon` (compact format, 60-70% fewer tokens)

**Response:**
```json
{
  "success": true,
  "data": {
    "byCategory": [
      {
        "id": "uuid",
        "name": "Groceries",
        "color": "#4CAF50",
        "totalDebit": 1234.56,
        "totalCredit": 0,
        "count": 45
      },
      {
        "id": "uncategorized",
        "name": "Uncategorized",
        "color": "#9CA3AF",
        "totalDebit": 567.89,
        "totalCredit": 0,
        "count": 12
      }
    ],
    "totals": {
      "totalDebit": 5234.56,
      "totalCredit": 6789.12,
      "transactionCount": 150
    },
    "monthlySpending": [
      {
        "month": "2025-01",
        "debit": 1234.56,
        "credit": 2345.67,
        "count": 45
      },
      {
        "month": "2025-02",
        "debit": 1456.78,
        "credit": 2678.90,
        "count": 52
      }
    ]
  }
}
```

**Notes:**
- Transactions with multiple spending types have their amounts split proportionally across categories
- Uncategorized transactions (with no spending types) are grouped under "Uncategorized"
- Monthly spending data is sorted chronologically by month
- Category data is sorted by total debit amount (expenses) in descending order

---

## Spending Types

### GET /api/spending-types

Get all spending type categories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Groceries",
      "description": "Food and household items",
      "color": "#4CAF50",
      "createdAt": "2026-01-18T00:00:00.000Z",
      "updatedAt": "2026-01-18T00:00:00.000Z"
    }
  ]
}
```

### POST /api/spending-types

Create a new spending type.

**Request Body:**
```json
{
  "name": "Entertainment",
  "description": "Movies, games, etc.",
  "color": "#9C27B0"
}
```

---

## Transaction Categorization Rules

Transaction categorization rules enable automatic tagging of transactions with spending types during CSV import based on description string matching.

### GET /api/categorization-rules

Get all categorization rules with their associated spending types.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "descriptionString": "TESCO",
      "exactMatch": false,
      "spendingTypes": [
        {
          "id": "uuid",
          "name": "Groceries"
        }
      ],
      "createdAt": "2026-01-20T00:00:00.000Z",
      "updatedAt": "2026-01-20T00:00:00.000Z"
    }
  ]
}
```

### GET /api/categorization-rules/[id]

Get a specific categorization rule by ID.

**Path Parameters:**
- `id` (required): UUID of the categorization rule

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "descriptionString": "AMAZON",
    "exactMatch": false,
    "spendingTypes": [
      {
        "id": "uuid",
        "name": "Shopping"
      }
    ],
    "createdAt": "2026-01-20T00:00:00.000Z",
    "updatedAt": "2026-01-20T00:00:00.000Z"
  }
}
```

### POST /api/categorization-rules

Create a new categorization rule.

**Request Body:**
```json
{
  "descriptionString": "SPOTIFY",
  "exactMatch": true,
  "spendingTypeIds": ["uuid1", "uuid2"]
}
```

**Fields:**
- `descriptionString` (required): The string to match against transaction descriptions
- `exactMatch` (required): `true` for exact match (case-insensitive), `false` for partial/contains match
- `spendingTypeIds` (required): Array of spending type UUIDs to associate with matching transactions

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "descriptionString": "SPOTIFY",
    "exactMatch": true,
    "spendingTypes": [
      {
        "id": "uuid",
        "name": "Entertainment"
      }
    ],
    "createdAt": "2026-01-20T00:00:00.000Z",
    "updatedAt": "2026-01-20T00:00:00.000Z"
  },
  "message": "Categorization rule created successfully"
}
```

### PATCH /api/categorization-rules/[id]

Update a categorization rule. All fields are optional.

**Path Parameters:**
- `id` (required): UUID of the categorization rule

**Request Body:**
```json
{
  "descriptionString": "NETFLIX",
  "exactMatch": true,
  "spendingTypeIds": ["uuid1"]
}
```

**Note:** When `spendingTypeIds` is provided, it replaces all existing spending type associations.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "descriptionString": "NETFLIX",
    "exactMatch": true,
    "spendingTypes": [
      {
        "id": "uuid",
        "name": "Entertainment"
      }
    ],
    "createdAt": "2026-01-20T00:00:00.000Z",
    "updatedAt": "2026-01-20T00:00:00.000Z"
  },
  "message": "Categorization rule updated successfully"
}
```

### DELETE /api/categorization-rules/[id]

Delete a categorization rule. This will cascade delete all spending type associations for the rule.

**Path Parameters:**
- `id` (required): UUID of the categorization rule

**Response:**
```json
{
  "success": true,
  "message": "Categorization rule deleted successfully"
}
```

### POST /api/categorization-rules/[id]/apply

Apply a categorization rule to all existing transactions for a specific bank account. This will add the rule's spending types to transactions that match the rule's pattern.

**Path Parameters:**
- `id` (required): UUID of the categorization rule

**Request Body:**
```json
{
  "bankAccountId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionsMatched": 45,
    "transactionsUpdated": 42,
    "spendingTypesAdded": 42
  },
  "message": "Applied rule to 42 transaction(s)"
}
```

**Note:** Only adds spending types that aren't already associated with each transaction. Transactions that already have the spending type(s) are skipped.

### POST /api/transaction-records/remove-spending-types

Remove specific spending types from transactions matching a description pattern and optional date range. Useful for undoing incorrect categorizations or cleaning up data.

**Request Body:**
```json
{
  "bankAccountId": "uuid",
  "descriptionString": "SPOTIFY",
  "exactMatch": true,
  "spendingTypeIds": ["uuid1", "uuid2"],
  "dateRange": {
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-01-31T23:59:59.999Z"
  }
}
```

**Fields:**
- `bankAccountId` (required): UUID of the bank account to search in
- `descriptionString` (required): Description pattern to match against transaction descriptions
- `exactMatch` (optional, default: false): `true` for exact match, `false` for contains/partial match
- `spendingTypeIds` (required): Array of spending type UUIDs to remove from matching transactions
- `dateRange` (optional): Filter transactions by date range
  - `startDate` (optional): ISO datetime string for start of range
  - `endDate` (optional): ISO datetime string for end of range

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionsMatched": 45,
    "spendingTypesRemoved": 42
  },
  "message": "Removed 42 spending type association(s) from 45 matching transaction(s)"
}
```

**Note:** Only removes the specified spending types from matching transactions. Other spending types on those transactions remain untouched.

**How Categorization Rules Work:**

1. **During CSV Import:** When transactions are imported from CSV, the system automatically checks each transaction description against all categorization rules.

2. **Matching Logic:**
   - **Exact Match** (`exactMatch: true`): Transaction description must exactly match the rule's `descriptionString` (case-insensitive)
   - **Partial Match** (`exactMatch: false`): Transaction description must contain the rule's `descriptionString` (case-insensitive)

3. **Priority:** Exact match rules take priority over partial match rules when multiple rules match the same transaction.

4. **Multiple Rules:** If multiple rules match a transaction, all associated spending types from all matching rules are applied.

5. **Existing Tags:** Rules are only applied to transactions that don't already have spending types assigned.

**Example Use Cases:**

- Create exact match rule for `"SPOTIFY"` → automatically tag as "Entertainment"
- Create partial match rule for `"TESCO"` → automatically tag as "Groceries" (matches "TESCO STORES", "TESCO EXPRESS", etc.)
- Create partial match rule for `"AMAZON"` → automatically tag as "Shopping"

---

## Error Codes

- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (duplicate entries)
- `500` - Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented as this is a local application.

## Changelog

### v1.0.0 (2026-01-18)
- Initial API release
- All core endpoints implemented
- Zod validation on all inputs
- Consistent response format
