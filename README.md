# Vivid Account Insights

A comprehensive Next.js application for personal financial management that combines historical transaction analysis with forward-looking projections. Track your past spending patterns, analyze transaction history, and project your financial future with AI-assisted insights.

## Why Use This App?

Unlike traditional budgeting apps or simple spreadsheets, this system provides:

| Feature | This App | Traditional Apps | Spreadsheets |
|---------|----------|------------------|--------------|
| **Historical Analysis** | ✅ Import & analyze bank statements | ✅ Usually yes | ⚠️ Manual entry |
| **Future Projections** | ✅ Day-by-day with certainty levels | ⚠️ Monthly budgets only | ⚠️ Manual formulas |
| **Combined View** | ✅ Seamless historical + projected | ❌ Separate features | ❌ Complex setup |
| **AI Integration** | ✅ Built-in MCP server | ❌ No AI access | ❌ No AI access |
| **Privacy** | ✅ 100% local storage | ❌ Cloud-based | ✅ Local files |
| **Scenario Planning** | ✅ Toggle multiple scenarios | ❌ Not available | ⚠️ Duplicate sheets |
| **Auto-categorization** | ✅ Learning rules engine | ✅ Usually yes | ❌ Manual |
| **Recurring Events** | ✅ Rule-based templates | ⚠️ Limited | ⚠️ Copy/paste |
| **Real-time Updates** | ✅ SSE notifications | ⚠️ App-dependent | ❌ No |
| **Data Ownership** | ✅ Full control | ❌ Vendor lock-in | ✅ Full control |

**Key Advantages:**

- **Complete Financial Picture**: See both where you've been (transaction history) and where you're going (projections) in one unified interface
- **Privacy-First**: All data stored locally in your own PostgreSQL database - no cloud services, no data sharing, no vendor lock-in
- **AI-Powered Insights**: Built-in MCP server enables Claude (or other AI assistants) to help you understand spending patterns, optimize budgets, and make better financial decisions
- **Flexible Scenario Planning**: Model different financial futures (e.g., "what if I change jobs?", "what if I buy a house?") and compare them side-by-side
- **Smart Automation**: Auto-categorize transactions with learning rules, auto-generate recurring events from templates
- **Realistic Planning**: Seamlessly blend historical actual spending with forward projections, weighted by certainty levels

## Overview

This system provides two powerful, integrated capabilities:

### 1. Historical Transaction Analysis
- **Bank Statement Import**: Ingest CSV bank statements in known formats
- **Transaction Storage**: Store complete transaction history in PostgreSQL
- **Smart Categorization**: Automated transaction categorization with rule-based learning
- **Spending Analysis**: Visualize spending patterns by category, merchant, and time period
- **Activity Logging**: Track all system changes with real-time SSE notifications

### 2. Future Financial Projections
- **Day-by-Day Projections**: Project bank balance for each day over the next 6+ months
- **Recurring Events**: Rule-based recurring income and expenses with automatic generation
- **Certainty Levels**: Weight events by likelihood (unlikely/possible/likely/certain)
- **Actual Balance Tracking**: Override calculated balances with real values to correct drift
- **Scenario Planning**: Toggle multiple projection scenarios on and off

### 3. Unified Visualization & AI Integration
- **Combined Analytics**: Visualize both historical data and future projections together
- **Scenario Toggle**: Compare different financial scenarios side-by-side
- **MCP Server Integration**: Optimized API for AI-assisted financial insights and planning
- **Real-time Updates**: Server-sent events for live activity monitoring

## Key Features

### Transaction Management
- **CSV Import**: Upload and parse bank statement CSVs in supported formats
- **Auto-categorization**: Rules engine learns from your categorization patterns
- **Transaction Filters**: Advanced filtering by date, category, amount, merchant
- **Spending Type Management**: Create custom spending categories and subcategories
- **Bulk Operations**: Update multiple transactions at once

### Projection Planning
- **Event Management**: Track both expenses (paid to) and incoming payments (paid by)
- **Recurring Rules**: Automatic event generation from templates (daily/weekly/monthly/annual)
- **Certainty Weighting**: Exclude unlikely events from balance calculations
- **Multi-month Planning**: Support for 5-10 year forward planning
- **Automatic Recalculation**: Projections update instantly when you add/edit/delete events

### Data Visualization & Insights
- **Historical Spending**: Analyze actual spending patterns over time
- **Income vs Expenses**: Compare monthly income and expenses (actual and projected)
- **Balance Trajectory**: Line charts showing balance over time
- **Category Breakdown**: Spending distribution by category
- **AI-Powered Insights**: Query your financial data through the MCP server

### AI Collaboration (MCP Server)
- **Natural Language Queries**: Ask questions about your finances in plain English
- **Pattern Recognition**: AI identifies spending trends and anomalies
- **Smart Recommendations**: Get insights based on historical data and projections
- **Financial Planning**: Collaborative scenario building and goal setting

## Tech Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript
- **Database**: PostgreSQL 15 with Prisma ORM 7
- **State Management**: Redux Toolkit + React Context API
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Real-time Updates**: Server-Sent Events (SSE)
- **Date Utilities**: date-fns
- **AI Integration**: Model Context Protocol (MCP) server
- **Package Manager**: yarn

## Prerequisites

- Node.js 18+
- yarn package manager
- Docker (for PostgreSQL database)

## Quick Start Guide

Want to get up and running quickly? Here's the fastest path:

1. **Start the database** (Docker): `docker start financial-projections-db` (or create it if first time - see full setup below)
2. **Run migrations**: `npx prisma migrate deploy && npx prisma generate`
3. **Start the app**: `yarn dev`
4. **Import transactions**: Visit [http://localhost:3000/transactions](http://localhost:3000/transactions) and upload a bank statement CSV
5. **Create projections**: Add future events and see your projected balance
6. **Optional - AI Integration**: Set up the MCP server to query your data with Claude

## Full Setup Instructions

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
│   ├── schema.prisma          # Database schema (unified historical + projection models)
│   └── migrations/            # Database migrations
├── src/
│   ├── app/
│   │   ├── page.tsx          # Dashboard
│   │   ├── api/              # API routes (REST + SSE)
│   │   │   ├── transactions/ # Transaction CRUD and import
│   │   │   ├── projections/  # Projection events and scenarios
│   │   │   ├── balance-history/ # Historical balance queries
│   │   │   ├── activity-log/ # Activity logging + SSE
│   │   │   └── settings/     # User preferences
│   │   ├── transactions/     # Transaction management UI
│   │   ├── projections/
│   │   │   └── [monthId]/
│   │   │       └── page.tsx  # Monthly calendar view
│   │   └── data-views/
│   │       └── page.tsx      # Charts and analytics (historical + projected)
│   ├── components/
│   │   ├── TransactionRecordsTable.tsx
│   │   ├── CategorizationRulesManagement.tsx
│   │   ├── DayDetailModal.tsx
│   │   ├── ProjectionEventForm.tsx
│   │   └── ConfirmationModal.tsx
│   ├── lib/
│   │   ├── dal/              # Database Access Layer
│   │   │   ├── transaction-records.ts
│   │   │   ├── categorization-rules.ts
│   │   │   ├── projection-events.ts
│   │   │   ├── daily-balance.ts
│   │   │   └── settings.ts
│   │   ├── calculations/
│   │   │   └── balance-calculator.ts
│   │   ├── csv-parser/       # Bank statement import logic
│   │   └── prisma.ts         # Prisma singleton
│   ├── store/                # Redux Toolkit state management
│   │   ├── activityLogSlice.ts
│   │   └── store.ts
│   └── types/
│       └── index.ts          # TypeScript type definitions
├── mcp-server/               # Model Context Protocol server for AI integration
│   ├── src/
│   │   ├── index.ts
│   │   └── tools/            # AI-accessible financial tools
│   └── package.json
├── .env                       # Environment variables (create this, not committed)
├── .gitignore
├── package.json
└── tsconfig.json
```

## Database Schema

### Transaction History Models

- **TransactionRecord**: Imported bank transactions with categorization
- **SpendingType**: User-defined spending categories (hierarchical)
- **CategorizationRule**: Rules for auto-categorizing transactions
- **ActivityLog**: Audit trail of all system changes (SSE-enabled)

### Projection Models

- **ProjectionEvent**: Future financial events (expenses and income)
- **RecurringProjectionEventRule**: Templates for recurring events
- **DailyBalance**: Calculated and actual daily balances

### Shared Models

- **Settings**: User preferences (currency, date format, initial balance)
- **BalanceHistory**: Historical balance snapshots for charting

### Key Features

- **Transaction Auto-categorization**: Rules engine with pattern matching (merchant names, amounts, date ranges)
- **Recurring Event Generation**: Rule-based templates automatically create child events
- **Balance Calculation**: Combines historical actuals with projected events
- **Activity Logging**: Real-time SSE notifications for all data changes
- **Certainty Weighting**: `UNLIKELY | POSSIBLE | LIKELY | CERTAIN` (Unlikely excluded from calculations)
- **Scenario Support**: Toggle multiple projection scenarios for comparison

## User Workflows

### Transaction Management Workflow

1. **Import Bank Statement**: Upload CSV file from your bank
2. **Review Transactions**: System displays imported transactions in table
3. **Categorize**: Manually categorize transactions or create rules for auto-categorization
4. **Analyze**: View spending breakdowns by category, merchant, time period
5. **Activity Log**: Track all changes with real-time notifications

### Projection Planning Workflow

1. **Set Initial Balance**: Configure your starting bank balance in Settings
2. **Add Events**: Create one-time or recurring income/expense events
3. **Set Certainty**: Weight events by likelihood (unlikely/possible/likely/certain)
4. **View Calendar**: See daily projected balances across months
5. **Adjust Reality**: Set actual balances to correct projections as reality unfolds
6. **Compare Scenarios**: Toggle different projection scenarios to compare outcomes

### Combined Analysis Workflow

1. **Historical Foundation**: Import 6-12 months of transaction history
2. **Pattern Recognition**: Identify recurring expenses and income patterns
3. **Build Projections**: Create future events based on historical patterns
4. **Visualize Together**: View charts combining historical actuals and future projections
5. **AI Insights**: Query your data through the MCP server for deeper insights
6. **Iterate & Refine**: Adjust projections based on AI recommendations and actual results

## MCP Server Integration

The system includes a dedicated **Model Context Protocol (MCP) server** that exposes financial data and operations to AI assistants like Claude.

### What is MCP?

MCP is an open protocol that allows AI assistants to securely connect to external data sources and tools. This application's MCP server enables Claude (or other AI assistants) to:

- Query your transaction history and spending patterns
- Analyze financial trends and identify anomalies
- Create and modify projection events
- Compare different financial scenarios
- Answer natural language questions about your finances
- Provide personalized financial insights and recommendations

### Available MCP Tools

The server exposes tools for:
- Transaction querying and analysis
- Categorization rule management
- Projection event creation and modification
- Balance history queries
- Spending pattern analysis
- Scenario comparison

### Setting Up MCP Server

```bash
# Navigate to MCP server directory
cd mcp-server

# Install dependencies
yarn install

# Build the server
yarn build

# Configure in Claude Desktop or other MCP clients
# See mcp-server/README.md for configuration details
```

### Example AI Interactions

- "What did I spend on groceries last month?"
- "Show me my top 5 spending categories this quarter"
- "Create a recurring monthly rent payment for £1,200"
- "What will my balance be in 3 months if I cut dining out by 50%?"
- "Compare my actual spending to my projections for the last 6 months"

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
# Main Application
yarn dev              # Start development server with Turbopack
yarn build            # Build for production
yarn start            # Start production server
yarn lint             # Run ESLint

# MCP Server (in mcp-server/ directory)
cd mcp-server
yarn install          # Install MCP server dependencies
yarn build            # Build MCP server
yarn start            # Start MCP server
yarn dev              # Start MCP server in development mode

# Prisma Database Management
npx prisma studio              # Open Prisma Studio (database GUI)
npx prisma migrate dev         # Create and apply migration
npx prisma migrate deploy      # Apply migrations (production)
npx prisma generate            # Generate Prisma client

# Docker Database Management
docker ps -a                          # List all containers
docker start financial-projections-db # Start database
docker stop financial-projections-db  # Stop database
docker logs financial-projections-db  # View logs
docker restart financial-projections-db # Restart database
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

### Core Documentation
- **[CLAUDE.md](./CLAUDE.md)** - Project overview, architecture, and development guidelines for Claude Code
- **[ImplementationPlan.md](./ImplementationPlan.md)** - Detailed 8-phase implementation plan with task breakdown

### Feature Documentation
- **Transaction Import** - Supports CSV bank statements (see `/src/lib/csv-parser/` for supported formats)
- **Categorization Rules** - Auto-categorize based on merchant name, amount range, date patterns
- **Recurring Events** - Templates with daily/weekly/monthly/annual frequencies
- **Balance Calculation** - Combines historical actuals with projected events, weighted by certainty
- **Activity Logging** - Real-time SSE notifications for all data changes
- **Scenario Planning** - Create and toggle multiple projection scenarios

### MCP Server Documentation
- **[mcp-server/README.md](./mcp-server/README.md)** - MCP server setup and configuration
- **Available Tools** - Transaction queries, categorization, projections, balance history
- **Integration Guide** - Connecting Claude Desktop or other MCP clients

### Database Schema
- **[prisma/schema.prisma](./prisma/schema.prisma)** - Complete database schema with comments
- **Models**: Settings, TransactionRecord, SpendingType, CategorizationRule, ProjectionEvent, RecurringProjectionEventRule, DailyBalance, ActivityLog, BalanceHistory

## Use Cases

### For Personal Finance Management
- Track all spending from bank statements
- Identify spending patterns and categories
- Project future cash flow with confidence intervals
- Model different financial scenarios (e.g., "what if I reduce dining out?")
- Catch unexpected expenses early with balance projections

### For Financial Planning
- Plan for large purchases by modeling different payment schedules
- Compare rent vs. buy scenarios with projected cash flow
- Prepare for irregular expenses (annual insurance, quarterly taxes)
- Build emergency fund goals with realistic timelines

### For AI-Assisted Insights
- Ask Claude to analyze your spending trends
- Get recommendations for budget optimization
- Identify anomalies and unusual transactions
- Compare actual spending to projections
- Generate financial reports and summaries

## Privacy & Security

- **Local-only storage**: All data stored in your own PostgreSQL database
- **No cloud services**: No external APIs, no data sharing, no tracking
- **Full control**: You own your data completely
- **Open source**: Audit the code yourself
- **MCP security**: MCP server runs locally and only responds to local AI clients

## Contributing

This is a personal project, but suggestions and feedback are welcome via GitHub issues.

## License

Private personal project.
