# Financial Projections App

A Next.js application for personal finance projections, tracking day-by-day bank balance over time with support for recurring events, certainty levels, and actual balance tracking.

## Features

- **Day-by-Day Balance Projections**: View your projected bank balance for each day over the next 6 months
- **Recurring Events**: Support for both manual recurring dates and "same date each month until target" patterns
- **Actual Balance Tracking**: Override calculated balances with actual values for specific days
- **Certainty Levels**: Filter events by certainty (Unlikely events are excluded from balance calculations)
- **Event Management**: Track both expenses (paid to) and incoming payments (paid by)
- **Data Visualization**: Monthly income vs expenses bar chart and balance over time line chart
- **Responsive Design**: Built with Tailwind CSS for mobile and desktop

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Validation**: Zod
- **Date Utilities**: date-fns
- **Package Manager**: Yarn

## Prerequisites

- Node.js 18+ (managed via Volta)
- Yarn (configured via Volta)
- PostgreSQL (see Database Setup options below)

## Getting Started

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd financial-projections

# Install dependencies
yarn install
```

### 2. Database Setup

Choose one of the following options:

#### Option A: Prisma's Built-in Local Postgres (Recommended for Development)

```bash
npx prisma dev
```

This will start a local PostgreSQL instance and automatically configure your `.env` file.

#### Option B: Docker PostgreSQL

```bash
# Run PostgreSQL container
docker run --name financial-projections-db \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=financial_projections \
  -p 5432:5432 \
  -d postgres:15

# Update .env file
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/financial_projections"
```

#### Option C: Local PostgreSQL Installation

Install PostgreSQL locally, create a database, and update your `.env` file:

```bash
# Create database
createdb financial_projections

# Update .env file
DATABASE_URL="postgresql://username:password@localhost:5432/financial_projections"
```

### 3. Run Database Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Start Development Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
financial-projections/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js app router pages
│   ├── components/            # React components
│   ├── lib/
│   │   ├── dal/              # Database Access Layer
│   │   ├── calculations/     # Balance calculation engine
│   │   └── utils/            # Utility functions
│   └── types/                # TypeScript type definitions
├── .env                       # Environment variables (not committed)
├── .gitignore
├── package.json
└── tsconfig.json
```

## Database Schema

### Models

- **Settings**: Stores initial bank balance configuration
- **ProjectionEvent**: Financial events (expenses and incoming payments) with recurring support
- **EventRecurringDate**: Junction table for recurring event dates
- **DailyBalance**: Daily balance projections with actual balance override capability

### Key Fields

- `ProjectionEvent.certainty`: UNLIKELY | POSSIBLE | LIKELY | CERTAIN (Unlikely excluded from calculations)
- `ProjectionEvent.isRecurring`: Boolean flag for recurring events
- `ProjectionEvent.onTheSameDateEachMonth`: Monthly recurrence pattern
- `DailyBalance.actualBalance`: User-set actual balance (overrides calculated value)

## Key Features

### Actual Balance Override

Click "Set Actual Balance" on any day to override the calculated balance with your actual bank balance. This helps correct projections when reality differs from expectations.

### Recurring Events

Two types of recurring patterns:

1. **Manual Dates**: Specify exact dates via `EventRecurringDate` records
2. **Monthly Same Date**: Automatically recur on the same day each month until a target date

### Certainty Filtering

Balance calculations automatically exclude events marked as "UNLIKELY" while including POSSIBLE, LIKELY, and CERTAIN events.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/financial_projections"
```

**Important**: Never commit `.env` files to version control.

## Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma generate` - Generate Prisma client

## Testing

All components include `data-testid` attributes with differentiating suffixes for easy testing:

```typescript
// Example
<div data-testid="day-cell__14">Day 14</div>
<button data-testid="set-actual-balance-btn__14">Set Actual Balance</button>
```

## Development Guidelines

### Database Access Layer (DAL)

All database operations must go through DAL functions. Never use Prisma client directly in components or API routes.

```typescript
// Good
import { getProjectionEvents } from '@/lib/dal/projectionEvents';
const events = await getProjectionEvents(startDate, endDate);

// Bad
const events = await prisma.projectionEvent.findMany(...);
```

### Balance Calculation

The balance calculation engine runs day-by-day, cascading from the initial bank balance:

1. Start with initial balance or previous day's actual/expected balance
2. Apply all events for the day (excluding UNLIKELY events)
3. Check for actual balance override
4. Store result in `DailyBalance` table

## Documentation

- [CLAUDE.md](./CLAUDE.md) - High-level project documentation
- [ImplementationPlan.md](./ImplementationPlan.md) - Detailed 8-phase implementation plan

## Troubleshooting

### Prisma Client Not Found

```bash
npx prisma generate
```

### Migration Errors

```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Apply migrations
npx prisma migrate dev
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
yarn dev -p 3001
```

## License

Private personal project.
