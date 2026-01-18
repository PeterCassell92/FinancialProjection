# Architecture Documentation

## Overview

The Financial Projections application follows a modern full-stack architecture using Next.js 14+ with the App Router, TypeScript, Prisma ORM, and Redux Toolkit for state management.

## Technology Decisions

### Why Next.js?
- Server-side rendering and static generation capabilities
- Built-in API routes for backend functionality
- File-based routing system
- Excellent TypeScript support
- Great developer experience with hot reload

### Why Prisma?
- Type-safe database queries
- Automatic TypeScript type generation
- Migration system for version control
- Excellent PostgreSQL support
- Developer-friendly query API

### Why Redux Toolkit?
- Centralized state management for complex UI state
- Excellent TypeScript support
- Built-in async handling with createAsyncThunk
- DevTools for debugging
- Scalable architecture for future features

### Why PostgreSQL?
- Robust ACID compliance for financial data
- Excellent date/time handling
- Support for complex queries
- JSON support for flexible data
- Wide adoption and community support

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  (React Components, Pages, UI State Management)         │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                   Application Layer                      │
│         (Redux Slices, Business Logic, Utils)           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                      API Layer                           │
│        (Next.js API Routes, Validation, Errors)         │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                 Data Access Layer (DAL)                  │
│       (Prisma Queries, Business Logic, Calculations)    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                   Database Layer                         │
│              (PostgreSQL, Prisma Schema)                 │
└──────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (Backend)
│   │   ├── bank-accounts/
│   │   ├── projection-events/
│   │   ├── recurring-event-rules/
│   │   ├── daily-balance/
│   │   ├── settings/
│   │   └── ...
│   ├── projections/       # Monthly projection pages
│   ├── data-views/        # Data visualization
│   ├── bank-records/      # Bank import features
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard
│
├── components/            # React Components
│   ├── ui/               # shadcn/ui primitives
│   ├── Header.tsx        # App header with menu
│   ├── DayDetailModal.tsx
│   ├── ProjectionEventForm.tsx
│   ├── FullScreenSettingsModal.tsx
│   └── ...
│
├── lib/                   # Core Libraries
│   ├── dal/              # Data Access Layer
│   │   ├── projection-events.ts
│   │   ├── recurring-event-rules.ts
│   │   ├── daily-balance.ts
│   │   ├── settings.ts
│   │   └── ...
│   │
│   ├── calculations/     # Business Logic
│   │   └── balance-calculator.ts
│   │
│   ├── parsers/          # File Parsers
│   │   └── halifax-csv-parser.ts
│   │
│   ├── redux/            # State Management
│   │   ├── store.ts
│   │   ├── settingsSlice.ts
│   │   ├── scenarioSlice.ts
│   │   ├── bankRecordsSlice.ts
│   │   └── hooks.ts
│   │
│   ├── schemas/          # Zod Validation
│   │   ├── index.ts
│   │   ├── projection-events.ts
│   │   ├── settings.ts
│   │   └── ...
│   │
│   ├── utils/            # Utilities
│   │   ├── currency.ts
│   │   ├── date-format.ts
│   │   └── recurring-date-generator.ts
│   │
│   └── prisma.ts         # Prisma Client Singleton
│
└── types/                # TypeScript Types
    └── index.ts
```

## Data Flow

### Reading Data (Example: Monthly Projection View)

```
User clicks month
       ↓
Page component loads
       ↓
useEffect calls fetchData()
       ↓
Parallel API calls:
  - GET /api/projection-events?startDate=...&endDate=...&bankAccountId=...
  - GET /api/daily-balance?startDate=...&endDate=...&bankAccountId=...
       ↓
API Routes validate query params (Zod)
       ↓
DAL functions query database (Prisma)
  - getProjectionEvents(startDate, endDate, bankAccountId)
  - getDailyBalances(startDate, endDate, bankAccountId)
       ↓
Prisma executes SQL queries
       ↓
DAL returns typed data
       ↓
API routes serialize data (Decimal → number, Date → ISO string)
       ↓
Response sent to client
       ↓
Component updates state
       ↓
React renders calendar with events and balances
```

### Writing Data (Example: Creating Projection Event)

```
User fills form and clicks Save
       ↓
Form validation (client-side)
       ↓
POST /api/projection-events
  Body: { name, value, type, date, ... }
       ↓
API route validates with Zod schema
       ↓
DAL function creates event
  - createProjectionEvent(data)
       ↓
Prisma inserts into database
       ↓
Balance recalculation triggered
  - recalculateBalancesFrom(eventDate, endDate, bankAccountId)
       ↓
DAL updates all affected daily balances
       ↓
API returns created event + updated balances
       ↓
Component refetches data or updates Redux state
       ↓
UI updates to show new event
```

## Key Components

### Balance Calculation Engine

Located in: `src/lib/calculations/balance-calculator.ts`

**Algorithm:**
1. Find starting balance (actual balance or initial from settings)
2. For each day in range:
   - Start with previous day's balance
   - Add INCOMING events (excluding UNLIKELY)
   - Subtract EXPENSE events (excluding UNLIKELY)
   - If actual balance exists, use it instead
   - Store expected balance in database
3. Return calculated balances

**Triggers:**
- Creating/updating/deleting projection events
- Setting actual balances
- Creating/updating recurring rules
- Changing initial balance in settings

### Recurring Event System

Located in: `src/lib/dal/recurring-event-rules.ts`

**How it works:**
1. User creates a `RecurringProjectionEventRule`
2. System calls `generateRecurringDates()` based on frequency
3. Creates individual `ProjectionEvent` records
4. Links events to rule via `recurringRuleId`
5. When rule is updated, deletes old events and regenerates
6. When rule is deleted, cascades to delete all events

**Date Generation:**
- `DAILY`: Every day from start to end
- `WEEKLY`: Every 7 days
- `MONTHLY`: Same day of month (adjusts for short months)
- `ANNUAL`: Same date each year

### Scenario Planning

**Concept:**
- `DecisionPath`: Represents a financial decision (e.g., "Buy House")
- `ProjectionEvent`: Can be tagged with a `decisionPathId`
- `ScenarioSet`: Collection of decision path states (on/off)
- `ScenarioSetDecisionPath`: Join table for many-to-many relationship

**Flow:**
1. User creates decision paths
2. Tags events with decision paths
3. Creates scenario sets with different combinations
4. System filters events based on active scenario
5. Recalculates balances with filtered events

### State Management (Redux)

**Slices:**

1. **settingsSlice**: Global settings (currency, date format, initial balance)
2. **scenarioSlice**: Active scenario set and decision path states
3. **bankRecordsSlice**: Transaction records and filters
4. **bankAccountsSlice**: Available bank accounts

**Why Redux for this app?**
- Settings need to be accessible across many components
- Scenario state affects multiple pages and components
- Transaction filters and pagination state
- Avoids prop drilling through component tree
- Provides single source of truth for app state

## Database Design

### Key Design Decisions

1. **Soft Deletes**: Not implemented - we use cascade deletes for data integrity
2. **Audit Trail**: All tables have `createdAt` and `updatedAt`
3. **Foreign Keys**: Strict relationships with cascading deletes where appropriate
4. **Decimal Type**: Used for all monetary values to avoid floating-point errors
5. **Date Storage**: Stored as `DateTime` in UTC, converted for display

### Relationships

```
Settings ──1:1──▶ BankAccount (defaultBankAccount)

BankAccount ──1:N──▶ ProjectionEvent
BankAccount ──1:N──▶ DailyBalance
BankAccount ──1:N──▶ RecurringProjectionEventRule
BankAccount ──1:N──▶ TransactionRecord

RecurringProjectionEventRule ──1:N──▶ ProjectionEvent

DecisionPath ──1:N──▶ ProjectionEvent
DecisionPath ──1:N──▶ RecurringProjectionEventRule
DecisionPath ──N:M──▶ ScenarioSet (via ScenarioSetDecisionPath)

TransactionRecord ──N:M──▶ SpendingType (via TransactionRecordSpendingType)

UploadOperation ──1:N──▶ TransactionRecord
```

### Indexes

Key indexes for performance:
- `ProjectionEvent.date` - for date range queries
- `ProjectionEvent.bankAccountId` - for filtering by account
- `DailyBalance.date` + `DailyBalance.bankAccountId` - compound index
- `TransactionRecord.bankAccountId` + `TransactionRecord.transactionDate`

## Security Architecture

### Input Validation

**Three-layer approach:**
1. **Client-side**: Form validation with HTML5 + React
2. **Schema validation**: Zod schemas on API routes
3. **Database**: Prisma type checking + DB constraints

**Example:**
```typescript
// Zod schema
const ProjectionEventCreateRequestSchema = z.object({
  name: z.string().min(1).max(255),
  value: z.number().positive(),
  date: z.string().datetime(),
  // ...
});

// API route
const validation = ProjectionEventCreateRequestSchema.safeParse(body);
if (!validation.success) {
  return NextResponse.json({ error: validation.error }, { status: 400 });
}

// DAL uses Prisma types
export async function createProjectionEvent(
  input: CreateProjectionEventInput  // Type-safe
) { /* ... */ }
```

### SQL Injection Prevention

- All queries use Prisma's parameterized queries
- No raw SQL except where absolutely necessary
- Prisma Client provides type-safe query building

### XSS Prevention

- React automatically escapes content
- All user input is sanitized before rendering
- No use of `dangerouslySetInnerHTML`

### Current Limitations

- No authentication (single-user local app)
- No authorization checks
- No rate limiting
- No CORS restrictions (local only)

**Future enhancements for multi-user:**
- Add NextAuth.js for authentication
- Implement user-based data isolation
- Add API rate limiting
- Implement RBAC (Role-Based Access Control)

## Performance Considerations

### Database Queries

**Optimizations:**
- Use `select` to fetch only needed fields
- Use `include` judiciously (avoid N+1 queries)
- Batch operations where possible
- Indexes on frequently queried fields

**Example:**
```typescript
// Bad - N+1 query
for (const event of events) {
  const account = await prisma.bankAccount.findUnique({
    where: { id: event.bankAccountId }
  });
}

// Good - Single query with include
const events = await prisma.projectionEvent.findMany({
  include: { bankAccount: true }
});
```

### Balance Calculation

**Optimization strategies:**
- Only recalculate affected date ranges
- Batch updates for daily balances
- Use transactions for consistency
- Cache frequently accessed data in Redux

### Frontend Performance

- Code splitting with Next.js dynamic imports
- Lazy loading of heavy components
- Memoization of expensive calculations
- Virtual scrolling for large lists (transaction records)

## Testing Strategy

### Current Testing

All components include `data-testid` attributes for E2E testing.

### Planned Testing

1. **Unit Tests**: Business logic, utilities, calculations
2. **Integration Tests**: API routes, DAL functions
3. **E2E Tests**: Critical user flows (Playwright)
4. **Performance Tests**: Balance calculation with large datasets

## Deployment Architecture

### Local Development

```
┌─────────────┐
│  Developer  │
│   Machine   │
└──────┬──────┘
       │
       ├─▶ PostgreSQL (localhost:5432)
       ├─▶ Next.js Dev Server (localhost:3000)
       └─▶ Prisma Studio (localhost:5555)
```

### Test Environment (Planned)

```
Docker Compose
├─▶ postgres:14 (with seed data)
├─▶ app:test (Next.js)
└─▶ Volume mounts for persistence
```

### Production (Planned)

```
Docker Compose
├─▶ postgres:14 (with backups)
├─▶ app:prod (Next.js optimized build)
├─▶ nginx (reverse proxy)
└─▶ Volume mounts for data persistence
```

## Future Architecture Enhancements

1. **Authentication**: Add NextAuth.js for multi-user support
2. **Real-time Updates**: WebSocket for live balance updates
3. **Caching**: Redis for frequently accessed data
4. **File Storage**: S3-compatible storage for attachments
5. **Background Jobs**: Queue system for long-running tasks
6. **API Rate Limiting**: Protect against abuse
7. **Monitoring**: Error tracking (Sentry), analytics
8. **Mobile App**: React Native with shared business logic

## Conventions and Best Practices

### Naming

- **Files**: kebab-case (`projection-events.ts`)
- **Components**: PascalCase (`DayDetailModal.tsx`)
- **Functions**: camelCase (`calculateBalance()`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_EVENTS_PER_DAY`)
- **Types/Interfaces**: PascalCase (`ProjectionEvent`)

### Code Organization

- Keep components under 300 lines
- Extract business logic to separate files
- Use custom hooks for reusable logic
- Prefer composition over inheritance
- Keep API routes thin (delegate to DAL)

### TypeScript

- Always define return types
- Avoid `any` type
- Use strict mode
- Leverage Prisma's generated types
- Use Zod for runtime validation

### Commits

- Use conventional commits
- One feature per commit
- Write descriptive messages
- Reference issues when applicable

## Troubleshooting

### Common Issues

1. **Prisma Client Out of Sync**
   ```bash
   npx prisma generate
   ```

2. **Migration Conflicts**
   ```bash
   npx prisma migrate resolve --rolled-back <migration-name>
   ```

3. **Type Errors After Schema Change**
   ```bash
   npx prisma generate && npx tsc --noEmit
   ```

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Zod Documentation](https://zod.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
