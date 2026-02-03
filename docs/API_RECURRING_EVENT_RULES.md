# Recurring Event Rules API Documentation

## Overview

The Recurring Event Rules API allows you to create, read, update, and delete recurring financial events (expenses and income). When a recurring rule is created or updated, the system automatically generates individual projection events for each occurrence based on the specified frequency.

**Base URL**: `/api/recurring-event-rules`

**Authentication**: None (local-only application)

---

## Endpoints

### 1. List All Recurring Event Rules

Get all recurring event rules with their event counts.

**Endpoint**: `GET /api/recurring-event-rules`

**Request**:
```http
GET /api/recurring-event-rules HTTP/1.1
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "cml5tbfyw004m3rjhk625zqy4",
      "name": "Monthly Rent",
      "description": "Apartment rent payment",
      "value": 1200.00,
      "type": "EXPENSE",
      "certainty": "CERTAIN",
      "payTo": "Landlord Inc",
      "paidBy": null,
      "decisionPathId": null,
      "bankAccountId": "cmkly0o6y000148jhc01s810j",
      "startDate": "2026-02-01T00:00:00.000Z",
      "endDate": "2027-12-31T00:00:00.000Z",
      "frequency": "MONTHLY",
      "createdAt": "2026-02-02T23:40:12.823Z",
      "updatedAt": "2026-02-02T23:40:12.823Z"
    }
  ]
}
```

**Error Response** (500):
```json
{
  "success": false,
  "error": {
    "type": "DATABASE_CONNECTION",
    "message": "Cannot connect to database",
    "userMessage": "Unable to connect to the database. Please check that the database is running.",
    "retryable": true,
    "timestamp": "2026-02-02T23:45:00.000Z"
  }
}
```

---

### 2. Get Single Recurring Event Rule

Get a specific recurring event rule by ID, including all its generated projection events.

**Endpoint**: `GET /api/recurring-event-rules/{id}`

**Parameters**:
- `id` (path parameter, string, required) - The unique identifier of the recurring rule

**Request**:
```http
GET /api/recurring-event-rules/cml5tbfyw004m3rjhk625zqy4 HTTP/1.1
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "cml5tbfyw004m3rjhk625zqy4",
    "name": "Monthly Rent",
    "description": "Apartment rent payment",
    "value": 1200.00,
    "type": "EXPENSE",
    "certainty": "CERTAIN",
    "payTo": "Landlord Inc",
    "paidBy": null,
    "decisionPathId": null,
    "bankAccountId": "cmkly0o6y000148jhc01s810j",
    "startDate": "2026-02-01T00:00:00.000Z",
    "endDate": "2027-12-31T00:00:00.000Z",
    "frequency": "MONTHLY",
    "createdAt": "2026-02-02T23:40:12.823Z",
    "updatedAt": "2026-02-02T23:40:12.823Z",
    "projectionEvents": [
      {
        "id": "event1",
        "date": "2026-02-01T00:00:00.000Z",
        "value": 1200.00
      },
      {
        "id": "event2",
        "date": "2026-03-01T00:00:00.000Z",
        "value": 1200.00
      }
    ]
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "type": "NOT_FOUND",
    "message": "Recurring event rule not found",
    "userMessage": "The requested recurring event rule could not be found.",
    "technicalDetails": "Resource: Recurring event rule, ID: invalid-id",
    "retryable": false,
    "timestamp": "2026-02-02T23:45:00.000Z"
  }
}
```

---

### 3. Create New Recurring Event Rule

Create a new recurring event rule and automatically generate all projection events.

**Endpoint**: `POST /api/recurring-event-rules`

**Request Body**:
```json
{
  "name": "Monthly Rent",
  "description": "Apartment rent payment",
  "value": 1200.00,
  "type": "EXPENSE",
  "certainty": "CERTAIN",
  "payTo": "Landlord Inc",
  "paidBy": null,
  "bankAccountId": "cmkly0o6y000148jhc01s810j",
  "decisionPathId": null,
  "startDate": "2026-02-01",
  "endDate": "2027-12-31",
  "frequency": "MONTHLY"
}
```

**Field Descriptions**:
- `name` (string, required) - Name of the recurring event
- `description` (string, optional) - Detailed description
- `value` (number, required) - Amount (positive number)
- `type` (enum, required) - Either `"EXPENSE"` or `"INCOMING"`
- `certainty` (enum, required) - One of: `"UNLIKELY"`, `"POSSIBLE"`, `"LIKELY"`, `"CERTAIN"`
- `payTo` (string, optional) - Who receives the payment (for expenses)
- `paidBy` (string, optional) - Who makes the payment (for income)
- `bankAccountId` (string, required) - ID of the bank account
- `decisionPathId` (string, optional) - ID of the decision path/scenario
- `startDate` (ISO date string, required) - First occurrence date
- `endDate` (ISO date string, required) - Last possible occurrence date
- `frequency` (enum, required) - One of: `"DAILY"`, `"WEEKLY"`, `"MONTHLY"`, `"QUARTERLY"`, `"BIANNUAL"`, `"ANNUAL"`

**Frequency Options**:
- `DAILY` - Every day
- `WEEKLY` - Every week (same day of week)
- `MONTHLY` - Every month (same day of month)
- `QUARTERLY` - Every 3 months
- `BIANNUAL` - Every 6 months (twice per year)
- `ANNUAL` - Every year (same date)

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "rule": {
      "id": "cml5tbfyw004m3rjhk625zqy4",
      "name": "Monthly Rent",
      "description": "Apartment rent payment",
      "value": 1200.00,
      "type": "EXPENSE",
      "certainty": "CERTAIN",
      "payTo": "Landlord Inc",
      "paidBy": null,
      "decisionPathId": null,
      "bankAccountId": "cmkly0o6y000148jhc01s810j",
      "startDate": "2026-02-01T00:00:00.000Z",
      "endDate": "2027-12-31T00:00:00.000Z",
      "frequency": "MONTHLY",
      "createdAt": "2026-02-02T23:40:12.823Z",
      "updatedAt": "2026-02-02T23:40:12.823Z"
    },
    "generatedEventsCount": 23
  },
  "message": "Recurring event rule created successfully with 23 events"
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "Validation failed for body",
    "userMessage": "name: Required, value: Must be a positive number",
    "technicalDetails": "Field: body",
    "retryable": false,
    "timestamp": "2026-02-02T23:45:00.000Z"
  }
}
```

**Side Effects**:
- Creates the recurring rule in the database
- Generates individual `ProjectionEvent` records for each occurrence
- Triggers balance recalculation for the affected date range

---

### 4. Update Recurring Event Rule

Update an existing recurring event rule and regenerate all projection events.

**Endpoint**: `PATCH /api/recurring-event-rules/{id}`

**Parameters**:
- `id` (path parameter, string, required) - The unique identifier of the recurring rule

**Request Body** (all fields optional):
```json
{
  "name": "Monthly Rent - Updated",
  "value": 1250.00,
  "certainty": "LIKELY",
  "endDate": "2028-12-31"
}
```

**Field Descriptions**: Same as POST, but all fields are optional. Only include fields you want to update.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "rule": {
      "id": "cml5tbfyw004m3rjhk625zqy4",
      "name": "Monthly Rent - Updated",
      "description": "Apartment rent payment",
      "value": 1250.00,
      "type": "EXPENSE",
      "certainty": "LIKELY",
      "payTo": "Landlord Inc",
      "paidBy": null,
      "decisionPathId": null,
      "bankAccountId": "cmkly0o6y000148jhc01s810j",
      "startDate": "2026-02-01T00:00:00.000Z",
      "endDate": "2028-12-31T00:00:00.000Z",
      "frequency": "MONTHLY",
      "createdAt": "2026-02-02T23:40:12.823Z",
      "updatedAt": "2026-02-03T10:15:30.123Z"
    },
    "generatedEventsCount": 35
  },
  "message": "Recurring event rule updated successfully with 35 events"
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "type": "NOT_FOUND",
    "message": "Recurring event rule not found",
    "userMessage": "The requested recurring event rule could not be found.",
    "retryable": false,
    "timestamp": "2026-02-02T23:45:00.000Z"
  }
}
```

**Side Effects**:
- Deletes ALL existing projection events generated by this rule
- Updates the rule with new values
- Regenerates ALL projection events with new values
- Triggers balance recalculation for the affected date range

**Important Notes**:
- When you update a rule, ALL generated events are replaced with new ones
- This ensures consistency - all events will have the updated values
- If you change the date range or frequency, the number of generated events may change

---

### 5. Delete Recurring Event Rule

Delete a recurring event rule and all its generated projection events.

**Endpoint**: `DELETE /api/recurring-event-rules/{id}`

**Parameters**:
- `id` (path parameter, string, required) - The unique identifier of the recurring rule

**Request**:
```http
DELETE /api/recurring-event-rules/cml5tbfyw004m3rjhk625zqy4 HTTP/1.1
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Recurring event rule and all generated events deleted successfully"
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "type": "NOT_FOUND",
    "message": "Recurring event rule not found",
    "userMessage": "The requested recurring event rule could not be found.",
    "retryable": false,
    "timestamp": "2026-02-02T23:45:00.000Z"
  }
}
```

**Side Effects**:
- Deletes ALL projection events generated by this rule
- Deletes the recurring rule itself
- Triggers balance recalculation for the affected date range

---

## Common Error Types

All endpoints use the standardized error response format:

### Database Connection Error (503)
```json
{
  "success": false,
  "error": {
    "type": "DATABASE_CONNECTION",
    "message": "Cannot connect to database",
    "userMessage": "Unable to connect to the database. Please check that the database is running.",
    "technicalDetails": "Connection refused on port 5434",
    "retryable": true,
    "timestamp": "2026-02-02T23:45:00.000Z",
    "recoveryOptions": [
      {
        "label": "Retry Connection",
        "action": "retry"
      }
    ]
  }
}
```

### Validation Error (400)
```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "Validation failed for value",
    "userMessage": "value must be a positive number",
    "technicalDetails": "Field: value",
    "retryable": false,
    "timestamp": "2026-02-02T23:45:00.000Z"
  }
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "error": {
    "type": "NOT_FOUND",
    "message": "Recurring event rule not found",
    "userMessage": "The requested recurring event rule could not be found.",
    "technicalDetails": "Resource: Recurring event rule, ID: invalid-id",
    "retryable": false,
    "timestamp": "2026-02-02T23:45:00.000Z",
    "recoveryOptions": [
      {
        "label": "Go Back",
        "action": "navigate",
        "target": "/"
      }
    ]
  }
}
```

---

## Business Logic

### Event Generation

When a recurring rule is created or updated, the system:

1. **Generates Dates**: Based on frequency and date range
   - `MONTHLY`: Same day each month (e.g., 1st of every month)
   - `QUARTERLY`: Every 3 months (e.g., Jan 1, Apr 1, Jul 1, Oct 1)
   - `BIANNUAL`: Every 6 months (e.g., Jan 1, Jul 1)
   - Handles edge cases like Feb 29 on non-leap years

2. **Working Day Adjustment**: For `INCOMING` type events only
   - If the date falls on a weekend or UK bank holiday, it's moved to the next working day
   - `EXPENSE` events are NOT adjusted (they're due when they're due)

3. **Creates Projection Events**: Each occurrence becomes a `ProjectionEvent` record
   - Links to the parent rule via `recurringRuleId`
   - Inherits all properties from the rule (name, value, type, certainty, etc.)

4. **Recalculates Balances**: Triggers balance recalculation for the entire date range

### Certainty Levels

- `UNLIKELY` - Events are created but excluded from balance calculations
- `POSSIBLE` - Included in balance calculations with lower weight
- `LIKELY` - Included in balance calculations with high weight
- `CERTAIN` - Included in balance calculations with full weight

### Deletion Behavior

When a recurring rule is deleted:
- All generated projection events are deleted (cascade delete)
- Balances are recalculated for the affected date range
- The operation is atomic - if deletion fails, nothing is deleted

---

## Examples

### Example 1: Monthly Salary (INCOMING)

```bash
# Create monthly salary
POST /api/recurring-event-rules
Content-Type: application/json

{
  "name": "Salary",
  "description": "Monthly salary payment",
  "value": 5000.00,
  "type": "INCOMING",
  "certainty": "CERTAIN",
  "paidBy": "Employer Corp",
  "bankAccountId": "account-123",
  "startDate": "2026-01-25",
  "endDate": "2026-12-25",
  "frequency": "MONTHLY"
}

# Response: Creates 12 events (Jan-Dec)
# Events on weekends/bank holidays will be moved to next working day
```

### Example 2: Quarterly Insurance (EXPENSE)

```bash
# Create quarterly insurance payment
POST /api/recurring-event-rules
Content-Type: application/json

{
  "name": "Car Insurance",
  "description": "Quarterly insurance premium",
  "value": 250.00,
  "type": "EXPENSE",
  "certainty": "CERTAIN",
  "payTo": "Insurance Co",
  "bankAccountId": "account-123",
  "startDate": "2026-03-01",
  "endDate": "2027-12-01",
  "frequency": "QUARTERLY"
}

# Response: Creates 8 events (Mar, Jun, Sep, Dec 2026 + Mar, Jun, Sep, Dec 2027)
```

### Example 3: Update Rent Amount

```bash
# Update monthly rent amount
PATCH /api/recurring-event-rules/rule-123
Content-Type: application/json

{
  "value": 1300.00,
  "description": "Rent increased"
}

# Response: Deletes old events, creates new ones with updated value
# All future rent payments will now be £1,300
```

### Example 4: Delete Subscription

```bash
# Delete Netflix subscription
DELETE /api/recurring-event-rules/rule-456

# Response: Removes rule and all 12 monthly payment events
# Balances are recalculated
```

---

## Integration with MCP Server

The MCP server (Model Context Protocol) exposes these endpoints as tools for AI assistants:

- `get_recurring_event_rules` - List all rules
- `get_recurring_event_rule` - Get single rule
- `create_recurring_event_rule` - Create new rule
- `update_recurring_event_rule` - Update existing rule
- `delete_recurring_event_rule` - Delete rule

This allows Claude and other AI assistants to help users manage recurring financial events through natural language.

---

## Testing

### Testing the API

```bash
# 1. List all rules
curl http://localhost:3000/api/recurring-event-rules

# 2. Create a rule
curl -X POST http://localhost:3000/api/recurring-event-rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Event",
    "value": 100,
    "type": "EXPENSE",
    "certainty": "CERTAIN",
    "bankAccountId": "your-account-id",
    "startDate": "2026-03-01",
    "endDate": "2026-12-01",
    "frequency": "MONTHLY"
  }'

# 3. Get specific rule
curl http://localhost:3000/api/recurring-event-rules/{id}

# 4. Update rule
curl -X PATCH http://localhost:3000/api/recurring-event-rules/{id} \
  -H "Content-Type: application/json" \
  -d '{"value": 150}'

# 5. Delete rule
curl -X DELETE http://localhost:3000/api/recurring-event-rules/{id}
```

---

## Version History

- **v1.0** (2026-02-02) - Initial release
  - GET, POST endpoints for recurring rules
  - MONTHLY, ANNUAL frequencies

- **v1.1** (2026-02-03) - Enhanced functionality
  - Added GET /[id], PATCH /[id], DELETE /[id] endpoints
  - Added QUARTERLY and BIANNUAL frequencies
  - Implemented structured error responses
  - Added working day adjustment for INCOMING events
