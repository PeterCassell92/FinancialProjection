# Financial Projections App - Claude Code Documentation

## Project Overview

A Next.js application for personal financial projections, allowing users to project their bank balance forward through time by tracking expected expenses and income across a 6-month rolling window.

## Technology Stack

- **Frontend**: Next.js 14+ with TypeScript
- **UI Framework**: React 18+
- **Database**: PostgreSQL (local)
- **ORM**: Prisma
- **Styling**: Tailwind CSS (recommended) or CSS Modules
- **State Management**: React Context API or Zustand (TBD based on complexity)

## Project Goals

1. Enable detailed day-by-day financial projections for the next 6 months
2. Track both expenses and incoming payments with varying certainty levels
3. Visualize projected bank balances on a calendar interface
4. Support recurring financial events
5. Provide data visualization capabilities for financial insights
6. Maintain local data storage for privacy and security

## Core Concepts

### Data Model Hierarchy

```
User Session (implicit - no auth initially)
  └── Months (6 rolling months from current)
      └── Days (all days in each month)
          ├── Expected Bank Balance (calculated)
          └── Projection Events (multiple per day)
              ├── Type: Expense | Incoming
              ├── Certainty: unlikely | possible | likely | certain
              └── Recurrence pattern (optional)
```

### Key Features

1. **Dashboard**: Central navigation hub
2. **Monthly Projection View**: Calendar-based visualization
3. **Projection Event Management**: CRUD operations for financial events
4. **Data Views**: Visualization and analysis tools
5. **Recurring Events**: Template-based event replication

## Development Approach

This project follows a structured implementation approach:

1. **Phase 1**: Database schema and DAL setup
2. **Phase 2**: Core Next.js structure and routing
3. **Phase 3**: UI components and state management
4. **Phase 4**: Business logic and calculations
5. **Phase 5**: Data visualization
6. **Phase 6**: Testing and refinement

## File Structure

```
/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── page.tsx (Dashboard)
│   │   ├── projections/
│   │   │   └── [monthId]/
│   │   │       └── page.tsx (Monthly Projection)
│   │   └── data-views/
│   │       └── page.tsx (Data Visualizations)
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── Projections.tsx
│   │   ├── MonthlyCalendar.tsx
│   │   ├── ProjectionEventModal.tsx
│   │   ├── DataViews.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── dal/
│   │   │   ├── projection-events.ts
│   │   │   ├── monthly-data.ts
│   │   │   └── ...
│   │   ├── calculations/
│   │   │   └── balance-calculator.ts
│   │   └── prisma.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── ...
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── .env.local
```

## Key Technical Decisions

### Database Access Layer (DAL)

All database operations will go through a dedicated DAL to:
- Centralize data access logic
- Ensure consistent error handling
- Facilitate testing and mocking
- Enable future caching strategies

### Prisma Schema Design

The database schema will prioritize:
- Data integrity through proper relationships
- Efficient queries for calendar views
- Support for recurring event patterns via `EventRecurringDate` junction table
- Audit trails for financial data
- Cascade deletes for data consistency

### Calculation Engine

Bank balance calculations will:
- Start from a user-defined initial balance
- Process events chronologically day-by-day
- Support actual balance overrides (user-set values that supersede calculated values)
- Exclude events with "unlikely" certainty from calculations
- Cascade changes through subsequent days
- Recalculate affected ranges on event changes

### Recurring Events Architecture

Recurring events use a flexible one-to-many relationship:
- Base `ProjectionEvent` contains event details and pattern metadata
- `EventRecurringDate` table stores each occurrence date
- Pattern metadata (`onTheSameDateEachMonth`, `monthlyEventDay`, `untilTargetDate`) enables UI repopulation
- Supports both manual date entry and automatic pattern generation

### Testing Infrastructure

All components implement `data-testid` attributes:
- Enables robust E2E and integration testing
- Unique identifiers for all interactive elements
- Differentiating suffixes for repeated elements (e.g., `day-cell__14`)
- Consistent naming convention throughout application

## Security Considerations

- Local-only PostgreSQL instance (no external access)
- Input validation on all forms
- SQL injection prevention via Prisma parameterization
- XSS prevention through React's default escaping
- No authentication initially (single-user local app)

## Future Enhancement Possibilities

- Multi-user support with authentication
- Export/import capabilities
- Budget categories and tracking
- Mobile-responsive design
- PWA capabilities for offline use
- Data backup and restore features

## Getting Started

See [ImplementationPlan.md](./ImplementationPlan.md) for detailed step-by-step implementation instructions.

## Confirmed Requirements

All requirements have been clarified and confirmed:

1. **Actual Balance Feature**: Users can set actual balance for any day, overriding calculated values
2. **Recurring Events**: One-to-many relationship with pattern storage and manual date support
3. **Day Interaction**: Click day cells to open detailed day view modal
4. **Data Visualizations**: Monthly income vs expense (default) and balance over time charts
5. **Certainty Impact**: All events EXCEPT "unlikely" affect balance calculations
6. **Pagination**: "Show Next Six Months" navigates to months 7-12
7. **Data Scope**: Future months only initially
8. **Package Manager**: yarn
9. **Testing**: Comprehensive data-testid attributes on all components

For detailed implementation steps, see [ImplementationPlan.md](./ImplementationPlan.md).
