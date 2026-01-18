# Financial Projections App

A Next.js application for personal financial projections, allowing users to project their bank balance forward through time by tracking expected expenses and income across a 6-month rolling window.

## 🎯 Features

- **Monthly Projections**: Visualize your financial future with a calendar-based interface
- **Projection Events**: Track expenses and income with certainty levels (unlikely, possible, likely, certain)
- **Recurring Events**: Create rules that automatically generate recurring financial events
- **Actual Balance Tracking**: Set actual balances to override calculated projections
- **Scenario Planning**: Create multiple scenarios with decision paths to compare financial outcomes
- **Bank Statement Import**: Import transactions from CSV files (Halifax format supported)
- **Data Visualization**: Charts showing income vs expenses and balance trends
- **Multi-Currency Support**: GBP and USD with configurable date formats

## 🛠 Technology Stack

- **Frontend**: Next.js 14+ with TypeScript, React 18+
- **UI Framework**: shadcn/ui (Radix UI + Tailwind CSS v4)
- **Database**: PostgreSQL (local)
- **ORM**: Prisma
- **State Management**: Redux Toolkit
- **Date Utilities**: date-fns
- **Charts**: Recharts
- **Validation**: Zod

## 📋 Prerequisites

- Node.js 18+ and yarn
- PostgreSQL 14+
- Git

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd financial-projections
yarn install
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
createdb financial_projections
```

Configure your database connection in `.env.local`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/financial_projections?schema=public"
```

### 3. Run Migrations

```bash
npx prisma migrate dev
```

### 4. (Optional) Seed the Database

```bash
npx prisma db seed
```

### 5. Start Development Server

```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📖 User Guide

### Initial Setup

On first launch, you'll be prompted to configure:
- **Initial Bank Balance**: Your starting balance
- **Initial Balance Date**: The date of your starting balance
- **Currency**: GBP or USD
- **Date Format**: UK (DD/MM/YYYY) or US (MM/DD/YYYY)
- **Default Bank Account**: Select from your configured accounts

### Creating Projection Events

1. Navigate to a month from the Dashboard
2. Click on any day in the calendar
3. Click "Add Expense" or "Add Income"
4. Fill in the event details:
   - **Name**: Description of the transaction
   - **Value**: Amount (always positive)
   - **Type**: EXPENSE or INCOMING
   - **Certainty**: unlikely, possible, likely, or certain
   - **Pay To / Paid By**: Optional recipient/payer
   - **Bank Account**: Which account this affects
   - **Decision Path**: Optional scenario categorization

### Creating Recurring Events

1. Navigate to Settings → Recurring Events (via burger menu)
2. Click "Create Recurring Rule"
3. Configure the rule:
   - **Frequency**: DAILY, WEEKLY, MONTHLY, or ANNUAL
   - **Start Date**: When the recurrence begins
   - **End Date**: When the recurrence ends (required)
   - All other event fields

The system will automatically generate individual events for each occurrence.

### Setting Actual Balances

1. Click on a day in the calendar
2. Click "Set Actual Balance"
3. Enter the actual balance for that day
4. The system will recalculate all future balances from this point

### Scenario Planning

Create different financial scenarios:

1. Open the Scenario Panel (left sidebar on projection pages)
2. Create decision paths (e.g., "Buy House", "Keep Renting")
3. Assign events to decision paths
4. Create scenario sets to compare different combinations
5. Toggle scenarios on/off to see different financial outcomes

### Bank Statement Import

1. Navigate to Bank Records → Manage Transaction Records
2. Upload a CSV file (Halifax format supported)
3. Review and confirm the import
4. View transactions in the Transaction Records table

## 🗄 Database Schema

### Core Tables

- **Settings**: Application-wide configuration
- **BankAccount**: User's bank accounts
- **ProjectionEvent**: Individual financial events
- **RecurringProjectionEventRule**: Templates for recurring events
- **DailyBalance**: Calculated and actual balances per day
- **DecisionPath**: Scenario planning paths
- **ScenarioSet**: Collections of decision path states
- **TransactionRecord**: Imported bank transactions
- **SpendingType**: Categories for transaction classification
- **UploadOperation**: Audit trail for CSV imports

See [prisma/schema.prisma](prisma/schema.prisma) for detailed schema.

## 🔌 API Endpoints

All API routes return JSON with a standard response format:

```typescript
{
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### Projection Events

- `GET /api/projection-events?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&bankAccountId=<id>`
- `POST /api/projection-events`
- `GET /api/projection-events/[id]`
- `PUT /api/projection-events/[id]`
- `DELETE /api/projection-events/[id]`

### Recurring Event Rules

- `GET /api/recurring-event-rules`
- `POST /api/recurring-event-rules`
- `GET /api/recurring-event-rules/[id]`
- `PATCH /api/recurring-event-rules/[id]`
- `DELETE /api/recurring-event-rules/[id]`

### Daily Balances

- `GET /api/daily-balance?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&bankAccountId=<id>`
- `PUT /api/daily-balance` (set actual balance)
- `DELETE /api/daily-balance?date=YYYY-MM-DD&bankAccountId=<id>` (clear actual)

### Bank Accounts

- `GET /api/bank-accounts`
- `POST /api/bank-accounts`
- `GET /api/bank-accounts/[id]`
- `PATCH /api/bank-accounts/[id]`
- `DELETE /api/bank-accounts/[id]`

### Settings

- `GET /api/settings`
- `PUT /api/settings`
- `PATCH /api/settings`

### Transaction Records

- `GET /api/transaction-records?bankAccountId=<id>&page=1&limit=50`
- `POST /api/transaction-records/upload-csv`
- `DELETE /api/transaction-records/bulk-delete`

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for detailed API documentation.

## 📁 Project Structure

```
financial-projections/
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Database migrations
│   └── seed.ts                 # Database seeding script
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API routes
│   │   ├── projections/       # Monthly projection pages
│   │   ├── data-views/        # Data visualization page
│   │   ├── bank-records/      # Bank record management
│   │   └── page.tsx           # Dashboard
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── Header.tsx
│   │   ├── DayDetailModal.tsx
│   │   ├── ProjectionEventForm.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── dal/              # Data Access Layer
│   │   ├── calculations/     # Balance calculation engine
│   │   ├── parsers/          # CSV parsers
│   │   ├── redux/            # Redux store and slices
│   │   ├── schemas/          # Zod validation schemas
│   │   ├── utils/            # Utility functions
│   │   └── prisma.ts         # Prisma client
│   └── types/                # TypeScript type definitions
├── tests/                     # Test files
└── public/                    # Static assets
```

## 🧮 Balance Calculation Logic

The application calculates daily balances using the following algorithm:

1. **Starting Point**: Initial balance from settings or most recent actual balance
2. **Daily Calculation**: For each day:
   - Start with previous day's balance
   - Add all INCOMING events (except UNLIKELY certainty)
   - Subtract all EXPENSE events (except UNLIKELY certainty)
   - Store as expected balance
3. **Actual Balance Override**: If an actual balance is set for a day:
   - Use actual balance instead of calculated
   - Next day calculation starts from actual balance

Events with UNLIKELY certainty are excluded from calculations, providing a way to temporarily disable events without deleting them.

## 🔐 Security Considerations

- Input validation using Zod on all API endpoints
- SQL injection prevention via Prisma parameterization
- XSS prevention through React's default escaping
- Local-only PostgreSQL instance (no external access)
- No authentication initially (single-user local app)

## 🧪 Testing

Tests are organized in the `tests/` directory with a Docker-isolated environment:

```bash
# Run API tests
cd tests/api-testing
yarn test
```

All components include `data-testid` attributes for E2E testing.

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify database exists
psql -l | grep financial_projections
```

### Migration Errors

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## 📝 Development Notes

### Adding a New API Endpoint

1. Create route file in `src/app/api/`
2. Add DAL functions in `src/lib/dal/`
3. Create Zod schemas in `src/lib/schemas/`
4. Update type definitions if needed

### Adding a New Component

1. Create component in `src/components/`
2. Add `data-testid` attributes
3. Use shadcn/ui components where possible
4. Follow existing naming conventions

### Database Changes

1. Update `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name description`
3. Update DAL functions as needed
4. Update API routes and schemas

## 🤝 Contributing

This is a personal project, but suggestions and bug reports are welcome via GitHub issues.

## 📄 License

[MIT License](LICENSE)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Radix UI](https://www.radix-ui.com/)
- Charts powered by [Recharts](https://recharts.org/)
