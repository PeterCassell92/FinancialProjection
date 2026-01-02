# Recurring Events and Decision Paths - Design Document

## Overview
This document outlines the redesign of recurring events to support:
1. A proper `RecurringProjectionEventRule` model for defining recurring event templates
2. Decision path tracking for scenario modeling
3. UK bank holiday and weekend awareness
4. Proper handling of edge cases (month-end dates, February, etc.)

## Database Schema Changes

### New Model: RecurringProjectionEventRule

```prisma
enum RecurrenceFrequency {
  DAILY
  WEEKLY
  MONTHLY
  ANNUAL
}

model RecurringProjectionEventRule {
  id          String                @id @default(cuid())
  name        String
  description String?
  value       Decimal               @db.Decimal(10, 2)
  type        EventType
  certainty   CertaintyLevel
  payTo       String?               // for expenses
  paidBy      String?               // for incoming

  // Decision path for scenario modeling
  decisionPath String?              // e.g., "take-new-job", "stay-current-role"

  // Recurrence definition
  startDate   DateTime              @db.Date
  endDate     DateTime?             @db.Date  // Optional limit
  frequency   RecurrenceFrequency   @default(MONTHLY)

  // Generated events
  projectionEvents ProjectionEvent[]

  createdAt   DateTime              @default(now())
  updatedAt   DateTime              @updatedAt

  @@index([decisionPath])
  @@index([startDate])
}
```

### Updated Model: ProjectionEvent

```prisma
model ProjectionEvent {
  id          String          @id @default(cuid())
  name        String
  description String?
  value       Decimal         @db.Decimal(10, 2)
  type        EventType
  certainty   CertaintyLevel
  payTo       String?
  paidBy      String?
  date        DateTime        @db.Date

  // Decision path for scenario modeling
  decisionPath String?

  // Link to recurring rule (if generated from one)
  recurringRuleId String?
  recurringRule   RecurringProjectionEventRule? @relation(fields: [recurringRuleId], references: [id], onDelete: Cascade)

  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([date])
  @@index([decisionPath])
  @@index([recurringRuleId])
}
```

### Removed Models
- `EventRecurringDate` - No longer needed with new architecture
- Remove `isRecurring`, `recurringEventId`, `onTheSameDateEachMonth`, `monthlyEventDay`, `untilTargetDate` fields from ProjectionEvent

## Recurrence Generation Logic

### Date Calculation Rules

1. **Monthly Recurrence**:
   - Start with `startDate`, increment by 1 month each iteration
   - For dates 29-31: If target month lacks that day, use last day of month
   - Example: Jan 31 → Feb 28 (or 29) → Mar 31 → Apr 30 → May 31

2. **Weekly Recurrence**:
   - Simple: add 7 days each iteration

3. **Annual Recurrence**:
   - Same day/month each year
   - Handle Feb 29 on non-leap years (use Feb 28)

4. **Daily Recurrence**:
   - Add 1 day each iteration

### UK Bank Holiday & Weekend Handling

For **INCOMING** type events (salary, payments TO the user):
- If calculated date falls on weekend or UK bank holiday, move to **next** working day
- This reflects real-world behavior where employers pay on the next working day

For **EXPENSE** type events:
- Generate on the actual date regardless of weekends/holidays
- Users typically still need to account for these

**Library**: Use `date-fns` for date math and find/create a UK bank holidays library or dataset

### Edge Cases

1. **February date normalization**:
   - Jan 31 → Feb 28/29 (not skipped)
   - This is the "last day of month" rule

2. **End date boundary**:
   - Generate events while `calculatedDate <= endDate`
   - If endDate is null, project forward indefinitely (or to app limit like 2 years)

3. **Weekend/holiday adjustment**:
   - Never adjust by more than 3 days forward (mon-wed adjustment window)
   - Log/warn if holidays push beyond this window

## API Design

### Endpoint: POST /api/recurring-event-rules

**Request Body**:
```typescript
{
  name: string;
  description?: string;
  value: number;
  type: 'EXPENSE' | 'INCOMING';
  certainty: 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'CERTAIN';
  payTo?: string;
  paidBy?: string;
  decisionPath?: string;
  startDate: string; // ISO date
  endDate?: string; // ISO date
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ANNUAL';
}
```

**Response**:
```typescript
{
  success: boolean;
  data?: {
    rule: RecurringProjectionEventRule;
    generatedEventsCount: number;
  };
  error?: string;
}
```

**Backend Logic**:
1. Validate inputs
2. Create `RecurringProjectionEventRule` record
3. Call generation function to create `ProjectionEvent` records
4. Return rule + count of generated events

### Endpoint: GET /api/recurring-event-rules

List all recurring rules (for future management UI)

### Endpoint: DELETE /api/recurring-event-rules/:id

Deletes rule and all associated generated events (cascade delete)

### Endpoint: PUT /api/recurring-event-rules/:id

Updates rule and regenerates events (delete old, create new)

## UI Changes

### ProjectionEventForm Component

**New State**:
```typescript
const [recurrentMode, setRecurrentMode] = useState(false);
const [recurringData, setRecurringData] = useState({
  startDate: format(date, 'yyyy-MM-dd'),
  endDate: '',
  frequency: 'MONTHLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ANNUAL',
});
```

**UI Flow**:
1. Add toggle at top: "One-time event" vs "Recurring event"
2. When `recurrentMode === true`:
   - Show `startDate` input (date picker)
   - Show `endDate` input (optional, date picker)
   - Show `frequency` dropdown (Daily/Weekly/Monthly/Annual)
   - Show explanation text about UK bank holiday handling
   - Change submit button to "Create Recurring Rule"

3. When `recurrentMode === false`:
   - Show current single-event form
   - Use `date` prop as the event date

**Form Submission**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);

  const endpoint = recurrentMode
    ? '/api/recurring-event-rules'
    : '/api/projection-events';

  const body = recurrentMode
    ? {
        ...formData,
        ...recurringData,
        value: parseFloat(formData.value),
      }
    : {
        ...formData,
        value: parseFloat(formData.value),
        date: format(date, 'yyyy-MM-dd'),
      };

  // ... fetch logic
};
```

### Decision Path UI (Future)

Not implementing in initial version, but schema supports it:
- Add `decisionPath` input field (text or dropdown)
- Future feature: UI to toggle decision paths on/off
- This filters which events are included in balance calculations

## Testing Strategy

### Unit Tests

**Date Generation Logic** (`lib/utils/recurring-date-generator.test.ts`):
- ✓ Monthly: Jan 31 → Feb 28 → Mar 31
- ✓ Monthly: Jan 30 → Feb 28 → Mar 30
- ✓ Annual: Feb 29 (leap) → Feb 28 (non-leap)
- ✓ Weekly: Simple 7-day increments
- ✓ Daily: Simple 1-day increments
- ✓ Respect endDate boundary
- ✓ UK bank holiday adjustment for INCOMING
- ✓ No adjustment for EXPENSE
- ✓ Weekend adjustment (Sat → Mon, Sun → Mon)

**DAL Functions** (`lib/dal/recurring-event-rules.test.ts`):
- ✓ Create recurring rule
- ✓ Generate projection events from rule
- ✓ Update rule (regenerate events)
- ✓ Delete rule (cascade delete events)
- ✓ Query by decision path

### Integration Tests

**API Endpoint Tests** (`app/api/recurring-event-rules/route.test.ts`):
- ✓ POST creates rule and events
- ✓ GET returns all rules
- ✓ PUT updates rule and regenerates events
- ✓ DELETE removes rule and events
- ✓ Validation errors handled

**Form Component Tests** (`components/ProjectionEventForm.test.tsx`):
- ✓ Toggle between one-time and recurring mode
- ✓ Recurring mode shows additional fields
- ✓ Submit creates recurring rule
- ✓ One-time mode creates single event
- ✓ Validation on required fields

### End-to-End Tests

**User Flows**:
1. Create monthly recurring expense (e.g., rent)
2. Verify correct events generated in calendar view
3. Verify Feb handling for Jan 31 start date
4. Verify weekend adjustment for salary (INCOMING)
5. Update recurring rule, verify regeneration
6. Delete recurring rule, verify events removed

## Implementation Checklist

### Phase 1: Schema & DAL
- [ ] Update Prisma schema
- [ ] Create migration
- [ ] Implement DAL for RecurringProjectionEventRule
- [ ] Create date generation utility with UK bank holiday support
- [ ] Unit tests for date generation

### Phase 2: API Layer
- [ ] Create POST /api/recurring-event-rules
- [ ] Create GET /api/recurring-event-rules
- [ ] Create DELETE /api/recurring-event-rules/:id
- [ ] Create PUT /api/recurring-event-rules/:id
- [ ] API integration tests

### Phase 3: UI Updates
- [ ] Update ProjectionEventForm with recurrentMode
- [ ] Add recurring fields (startDate, endDate, frequency)
- [ ] Update form submission logic
- [ ] Add data-testid attributes
- [ ] Component tests

### Phase 4: Integration & Testing
- [ ] Manual testing of full flow
- [ ] E2E tests
- [ ] Edge case verification
- [ ] Performance testing (large date ranges)

### Phase 5: Migration Path
- [ ] Script to migrate existing recurring events to new structure
- [ ] Cleanup old schema fields
- [ ] Documentation update

## UK Bank Holidays

For now, we'll use a hardcoded list or simple library. Future enhancement could fetch from gov.uk API.

**Option 1**: Use `date-holidays` npm package
**Option 2**: Hardcode known holidays + weekend detection

Initial implementation will use Option 2 with date-fns `isWeekend()` for simplicity.

## Notes

- Decision path feature is schema-ready but UI implementation deferred
- All generated events link back to their rule via `recurringRuleId`
- Cascade delete ensures data consistency
- Future: Add "preview" mode to show generated dates before confirming
