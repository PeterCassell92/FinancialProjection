# Financial Projections App

A Next.js application for personal finance projections, tracking day-by-day bank balance over time with support for recurring events, certainty levels, and actual balance tracking.

## Features

- **Day-by-Day Balance Projections**: View your projected bank balance for each day over the next 6 months
- **Recurring Events**: Support for both manual recurring dates and "same date each month until target" patterns
- **Actual Balance Tracking**: Override calculated balances with actual values for specific days (supports negative balances)
- **Certainty Levels**: Filter events by certainty (Unlikely events are excluded from balance calculations)
- **Event Management**: Track both expenses (paid to) and incoming payments (paid by)
- **Data Visualization**: Monthly income vs expenses bar chart and balance over time line chart
- **Responsive Design**: Built with Tailwind CSS for mobile and desktop
- **Automatic Recalculation**: Balance projections automatically update when you add/edit/delete events or set actual balances

## Tech Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript
- **Database**: PostgreSQL 15 with Prisma ORM 7
- **Styling**: Tailwind CSS
- **Date Utilities**: date-fns
- **Package Manager**: yarn

## Prerequisites

- Node.js 18+
- yarn package manager
- Docker (for PostgreSQL database)

## Getting Started

### 1. Clone and Install Dependencies

```bash
# Navigate to the project directory
cd /home/pete/Documents/Projects/FinancialProjections/financial-projections

# Install dependencies
yarn install
```

### 2. Database Setup (Docker)

The application uses PostgreSQL running in a Docker container for local development.

#### First Time Setup

Create and start a PostgreSQL container. **Replace `YOUR_SECURE_PASSWORD` with your own password:**

```bash
docker run --name financial-projections-db \
  -e POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD \
  -e POSTGRES_DB=financial_projections \
  -p 5434:5432 \
  -d postgres:15
```

**Important**:
- Replace `YOUR_SECURE_PASSWORD` with a secure password of your choice
- The container maps PostgreSQL to port **5434** (not the default 5432) to avoid conflicts
- Remember the password you choose - you'll need it for the `.env` file

#### Check Container Status

```bash
# List all Docker containers (running and stopped)
docker ps -a

# List only running containers
docker ps

# View container logs
docker logs financial-projections-db
```

#### Starting/Stopping the Database

```bash
# Start the container (if stopped)
docker start financial-projections-db

# Stop the container
docker stop financial-projections-db

# Restart the container
docker restart financial-projections-db
```

### 3. Environment Configuration

Create a `.env` file in the `financial-projections` directory with your database connection string. **Use the same password you set in the Docker command:**

```bash
DATABASE_URL="postgresql://postgres:YOUR_SECURE_PASSWORD@localhost:5434/financial_projections"
```

**Replace `YOUR_SECURE_PASSWORD` with the actual password you chose when creating the Docker container.**

### 4. Run Database Migrations

After setting up the database container and `.env` file, apply the database schema:

```bash
cd financial-projections
npx prisma migrate deploy
npx prisma generate
```

This will:
- Apply all migrations to create the database tables
- Generate the Prisma client for TypeScript

### 5. Start Development Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Working with Prisma Migrations

### When to Use Migrations

You need to run Prisma migrations when:
- First setting up the project (see step 4 above)
- After pulling database schema changes from git
- After modifying the `prisma/schema.prisma` file

### Common Prisma Commands

```bash
# Generate Prisma client (run after any schema change)
npx prisma generate

# Create a new migration after changing schema.prisma
npx prisma migrate dev --name describe_your_change

# Apply migrations to database
npx prisma migrate deploy

# Open Prisma Studio (visual database editor)
npx prisma studio

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

### Typical Workflow for Schema Changes

1. Modify `prisma/schema.prisma`
2. Create and apply migration:
   ```bash
   npx prisma migrate dev --name your_change_description
   ```
3. Prisma will automatically run `prisma generate` for you

### Docker and Prisma

The Docker container runs your database server. Prisma connects to it just like any other PostgreSQL server. The fact that PostgreSQL is running in Docker makes **no difference** to how you use Prisma commands.

## Project Structure

```
financial-projections/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── app/
│   │   ├── page.tsx          # Dashboard
│   │   ├── api/              # API routes
│   │   ├── projections/
│   │   │   └── [monthId]/
│   │   │       └── page.tsx  # Monthly calendar view
│   │   └── data-views/
│   │       └── page.tsx      # Charts and analytics
│   ├── components/
│   │   ├── DayDetailModal.tsx
│   │   └── ProjectionEventForm.tsx
│   ├── lib/
│   │   ├── dal/              # Database Access Layer
│   │   │   ├── settings.ts
│   │   │   ├── projection-events.ts
│   │   │   └── daily-balance.ts
│   │   ├── calculations/
│   │   │   └── balance-calculator.ts
│   │   └── prisma.ts         # Prisma singleton
│   └── types/
│       └── index.ts          # TypeScript type definitions
├── .env                       # Environment variables (create this, not committed)
├── .gitignore
├── package.json
└── tsconfig.json
```

## Database Schema

### Models

- **Settings**: Stores initial bank balance configuration (singleton table)
- **ProjectionEvent**: Financial events (expenses and incoming payments) with recurring support
- **EventRecurringDate**: Junction table for recurring event dates
- **DailyBalance**: Daily balance projections with actual balance override capability

### Key Fields

- `ProjectionEvent.certainty`: UNLIKELY | POSSIBLE | LIKELY | CERTAIN (Unlikely excluded from calculations)
- `ProjectionEvent.isRecurring`: Boolean flag for recurring events
- `ProjectionEvent.onTheSameDateEachMonth`: Monthly recurrence pattern
- `DailyBalance.actualBalance`: User-set actual balance (overrides calculated value, can be negative)

## Key Features

### Dashboard

The main dashboard provides:
- Initial bank balance settings
- Quick links to monthly projection views (months 0-5)
- "Next 6" button to view months 6-11
- Link to data visualization page

### Monthly Calendar View

- Click any month to see a calendar view
- Each day shows expected balance and events
- Color-coded certainty levels
- Click any day cell to open detailed view

### Day Detail Modal

When you click a day, you can:
- View all events for that day
- See expected and actual balance
- Set or edit actual balance (supports negative values)
- Add new events
- Delete existing events

### Balance Calculation

The balance calculation engine:
1. Starts with initial balance from settings
2. For each day:
   - Uses previous day's actual balance (if set) or expected balance as starting point
   - Adds all INCOMING events (except UNLIKELY)
   - Subtracts all EXPENSE events (except UNLIKELY)
   - Calculates expected balance
   - Uses actual balance if user has set one
3. Automatically recalculates when:
   - You set/clear an actual balance (recalculates from next day forward)
   - You create/edit/delete an event (recalculates from event date forward)

### Actual Balance Override

Click "Set Actual Balance" on any day to override the calculated balance with your actual bank balance. This helps correct projections when reality differs from expectations. Negative balances are supported (e.g., -250.00 for overdrafts).

### Data Visualizations

The Data Views page offers two chart types:
- **Monthly Income vs Expenses**: Horizontal bar chart comparing income and expenses for each of the next 6 months
- **Balance Over Time**: Line chart showing expected balance trajectory

## Development Guidelines

### Database Access Layer (DAL)

**IMPORTANT**: All database operations must go through DAL functions. Never use Prisma client directly in components or API routes.

```typescript
// Good ✓
import { getProjectionEvents } from '@/lib/dal/projection-events';
const events = await getProjectionEvents(startDate, endDate);

// Bad ✗
import { prisma } from '@/lib/prisma';
const events = await prisma.projectionEvent.findMany(...);
```

### API Routes

All API routes follow a consistent pattern:
- Return `ApiResponse<T>` type with `success`, `data`, and optional `error` fields
- Handle errors gracefully
- Trigger recalculations where appropriate

### Prisma 7 Notes

This project uses Prisma 7 with the PostgreSQL adapter pattern:
- Engine type: `library` (for Node.js runtime)
- Uses `@prisma/adapter-pg` and `pg` for connection pooling
- Decimal values automatically converted between JavaScript numbers and PostgreSQL Decimal type

### Testing

All components include `data-testid` attributes for E2E testing:

```typescript
// Examples
<div data-testid="dashboard">Dashboard</div>
<button data-testid="month-link__0">January 2025</button>
<div data-testid="day-cell__14">Day 14</div>
<button data-testid="set-actual-balance-button">Set Actual</button>
```

## Available Scripts

```bash
# Development
yarn dev              # Start development server with Turbopack

# Production
yarn build            # Build for production
yarn start            # Start production server

# Linting
yarn lint             # Run ESLint

# Prisma
npx prisma studio     # Open Prisma Studio (database GUI)
npx prisma migrate dev         # Create and apply migration
npx prisma migrate deploy      # Apply migrations (production)
npx prisma generate   # Generate Prisma client

# Docker
docker ps -a                          # List all containers
docker start financial-projections-db # Start database
docker stop financial-projections-db  # Stop database
docker logs financial-projections-db  # View logs
```

## Troubleshooting

### Database Connection Errors

If you see `Can't reach database server at 127.0.0.1:5434`:

```bash
# Check if container is running
docker ps

# If not running, start it
docker start financial-projections-db

# Check logs for errors
docker logs financial-projections-db
```

### Prisma Client Not Found

```bash
npx prisma generate
```

### Migration Errors

```bash
# Apply pending migrations
npx prisma migrate deploy

# If that fails, reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
yarn dev --port 3001
```

### Wrong Password in .env

If you forgot your database password:

1. Stop and remove the existing container:
   ```bash
   docker stop financial-projections-db
   docker rm financial-projections-db
   ```

2. Create a new container with a new password
3. Update `.env` with the new password
4. Run migrations again: `npx prisma migrate deploy`

## Documentation

- [CLAUDE.md](./CLAUDE.md) - High-level project documentation and design decisions
- [ImplementationPlan.md](./ImplementationPlan.md) - Detailed 8-phase implementation plan

## License

Private personal project.
