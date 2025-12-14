# Implementation Plan - Financial Projections App

## Requirements Summary - CONFIRMED

### 1. Actual Balance Feature
- Each day will have a "Set Actual Balance" button
- Users can set an `actualBalance` value for any day
- Once set, the next day's expected balance will be calculated from the actual balance (not the previous expected balance)
- This allows for initial setup and real-world corrections

### 2. Recurring Events Implementation
- Recurring events use a one-to-many relationship via `EventRecurringDate` table
- Structure:
  - `ProjectionEvent` has `isRecurring: boolean` field
  - `EventRecurringDate` table stores: `ProjectionEventId` (FK), `RecurringEventId`, `date`
  - One ProjectionEvent can have many EventRecurringDates
- UI for recurring events:
  - Checkbox to enable recurring
  - When enabled, expand section for adding recurrent dates
  - Support manual date entry (one by one)
  - Support pattern entry: "same date each month until [target date]"
  - Store pattern metadata: `onTheSameDateEachMonth: boolean`, `monthlyEventDay: number`, `untilTargetDate: date`
  - This metadata enables repopulating the UI when editing

### 3. Day Interaction
- Clicking a day in the calendar opens a detailed day view modal
- Shows all events for that day
- Shows expected balance
- Shows "Set Actual Balance" button

### 4. Data Views - Visualizations
- **Default View**: Monthly Income vs Expenditure (bar chart)
  - Red bars for total monthly expenses
  - Green bars for total monthly income
  - Aggregates all ProjectionEvents including recurring
- **Alternative View**: Expected Bank Balance over time (line chart)
- Dropdown to switch between chart types
- Each chart type is a separate component for easy swapping
- Use component composition for flexibility

### 5. Certainty Level Impact
- **Calculation Rule**: All events EXCEPT "unlikely" affect balance
- "unlikely" events are excluded from calculations
- This provides a toggle mechanism (mark as "unlikely" to disable)

### 6. "Show Next Six Months" Button
- Pagination style navigation
- Shows months 7-12 when clicked
- Can navigate back to months 1-6

### 7. Data Scope
- Future months only (no historical data initially)
- Can be enhanced later for historical tracking

### 8. Package Manager
- **Use yarn** instead of npm for all package management

### 9. Testing Infrastructure
- **All components must have `data-testid` attributes**
- Repeated elements use differentiating suffixes (e.g., `data-testid="day-cell__14"`)
- This enables robust E2E and integration testing

---

## Phase 1: Project Setup and Database Schema

### Step 1.1: Initialize Next.js Project
```bash
npx create-next-app@latest financial-projections --typescript --tailwind --app
cd financial-projections
```

### Step 1.2: Install Dependencies
```bash
yarn add prisma @prisma/client
yarn add -D @types/node
yarn add zod # for validation
yarn add date-fns # for date utilities
yarn add recharts # for data visualization
```

### Step 1.3: Initialize Prisma
```bash
npx prisma init
```

### Step 1.4: Configure Database
Update `.env.local`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/financial_projections?schema=public"
```

### Step 1.5: Design Prisma Schema

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Settings {
  id                    String   @id @default(cuid())
  initialBankBalance    Decimal  @db.Decimal(10, 2)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

enum EventType {
  EXPENSE
  INCOMING
}

enum CertaintyLevel {
  UNLIKELY
  POSSIBLE
  LIKELY
  CERTAIN
}

model ProjectionEvent {
  id          String          @id @default(cuid())
  name        String
  description String?
  value       Decimal         @db.Decimal(10, 2)
  type        EventType
  certainty   CertaintyLevel
  payTo       String?         // for expenses
  paidBy      String?         // for incoming
  date        DateTime        @db.Date

  // Recurrence tracking
  isRecurring             Boolean   @default(false)
  recurringEventId        String?   // Groups the base event with its recurrences
  onTheSameDateEachMonth  Boolean   @default(false)
  monthlyEventDay         Int?      // Day of month (1-31) for monthly recurring
  untilTargetDate         DateTime? @db.Date

  // Relationships
  recurringDates EventRecurringDate[]

  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([date])
  @@index([recurringEventId])
}

model EventRecurringDate {
  id                String          @id @default(cuid())
  projectionEventId String
  projectionEvent   ProjectionEvent @relation(fields: [projectionEventId], references: [id], onDelete: Cascade)
  recurringEventId  String          // Links to the base recurring event
  date              DateTime        @db.Date

  createdAt         DateTime        @default(now())

  @@index([projectionEventId])
  @@index([recurringEventId])
  @@index([date])
}

model DailyBalance {
  id              String   @id @default(cuid())
  date            DateTime @db.Date @unique
  expectedBalance Decimal  @db.Decimal(10, 2)
  actualBalance   Decimal? @db.Decimal(10, 2)  // User can set this
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([date])
}
```

### Step 1.6: Run Initial Migration
```bash
npx prisma migrate dev --name init
```

### Step 1.7: Generate Prisma Client
```bash
npx prisma generate
```

---

## Phase 2: Database Access Layer (DAL)

### Step 2.1: Create Prisma Client Singleton

Create `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Step 2.2: Create Type Definitions

Create `src/types/index.ts`:
```typescript
import { EventType, CertaintyLevel } from '@prisma/client'

export type { EventType, CertaintyLevel }

export interface CreateProjectionEventInput {
  name: string
  description?: string
  value: number
  type: EventType
  certainty: CertaintyLevel
  payTo?: string
  paidBy?: string
  date: Date
  isRecurring?: boolean
  recurringDates?: Date[] // Additional dates for recurring events
  onTheSameDateEachMonth?: boolean
  untilTargetDate?: Date
}

export interface UpdateProjectionEventInput {
  id: string
  name?: string
  description?: string
  value?: number
  certainty?: CertaintyLevel
  payTo?: string
  paidBy?: string
  recurringDates?: Date[]
  onTheSameDateEachMonth?: boolean
  untilTargetDate?: Date
}

export interface ProjectionEventWithDetails {
  id: string
  name: string
  description: string | null
  value: number
  type: EventType
  certainty: CertaintyLevel
  payTo: string | null
  paidBy: string | null
  date: Date
  isRecurring: boolean
  recurringEventId: string | null
  onTheSameDateEachMonth: boolean
  monthlyEventDay: number | null
  untilTargetDate: Date | null
  recurringDates?: Array<{
    id: string
    date: Date
  }>
}
```

### Step 2.3: Create DAL for Projection Events

Create `src/lib/dal/projection-events.ts`:
```typescript
import { prisma } from '@/lib/prisma'
import { CreateProjectionEventInput, UpdateProjectionEventInput } from '@/types'
import { addMonths, setDate } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'

export async function createProjectionEvent(input: CreateProjectionEventInput) {
  const { recurringDates, onTheSameDateEachMonth, untilTargetDate, ...eventData } = input

  // Create the base event
  const baseEvent = await prisma.projectionEvent.create({
    data: {
      ...eventData,
      isRecurring: !!recurringDates && recurringDates.length > 0,
      recurringEventId: eventData.isRecurring ? uuidv4() : null,
      onTheSameDateEachMonth: onTheSameDateEachMonth || false,
      monthlyEventDay: onTheSameDateEachMonth ? eventData.date.getDate() : null,
      untilTargetDate,
    },
  })

  // If recurring, create recurring date entries
  if (recurringDates && recurringDates.length > 0) {
    await prisma.eventRecurringDate.createMany({
      data: recurringDates.map(date => ({
        projectionEventId: baseEvent.id,
        recurringEventId: baseEvent.recurringEventId!,
        date,
      })),
    })
  }

  return baseEvent
}

export async function getProjectionEventById(id: string) {
  return await prisma.projectionEvent.findUnique({
    where: { id },
    include: {
      recurringDates: true,
    },
  })
}

export async function getProjectionEventsByDateRange(startDate: Date, endDate: Date) {
  // Get base events
  const baseEvents = await prisma.projectionEvent.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  })

  // Get recurring events that occur in this date range
  const recurringEvents = await prisma.eventRecurringDate.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      projectionEvent: true,
    },
  })

  // Combine and flatten
  const allEvents = [
    ...baseEvents,
    ...recurringEvents.map(re => ({
      ...re.projectionEvent,
      date: re.date, // Override with the recurring date
    })),
  ]

  return allEvents.sort((a, b) => a.date.getTime() - b.date.getTime())
}

export async function getProjectionEventsByDate(date: Date) {
  const baseEvents = await prisma.projectionEvent.findMany({
    where: { date },
    orderBy: {
      createdAt: 'asc',
    },
  })

  const recurringEvents = await prisma.eventRecurringDate.findMany({
    where: { date },
    include: {
      projectionEvent: true,
    },
  })

  return [
    ...baseEvents,
    ...recurringEvents.map(re => ({
      ...re.projectionEvent,
      date: re.date,
    })),
  ]
}

export async function updateProjectionEvent(input: UpdateProjectionEventInput) {
  const { id, recurringDates, ...updateData } = input

  const updated = await prisma.projectionEvent.update({
    where: { id },
    data: updateData,
  })

  // If updating recurring dates, delete old ones and create new ones
  if (recurringDates) {
    await prisma.eventRecurringDate.deleteMany({
      where: { projectionEventId: id },
    })

    if (recurringDates.length > 0 && updated.recurringEventId) {
      await prisma.eventRecurringDate.createMany({
        data: recurringDates.map(date => ({
          projectionEventId: id,
          recurringEventId: updated.recurringEventId!,
          date,
        })),
      })
    }
  }

  return updated
}

export async function deleteProjectionEvent(id: string) {
  // Cascade delete will handle EventRecurringDate entries
  return await prisma.projectionEvent.delete({
    where: { id },
  })
}

export async function deleteRecurringGroup(recurringEventId: string) {
  // Delete all recurring date entries
  await prisma.eventRecurringDate.deleteMany({
    where: { recurringEventId },
  })

  // Delete the base event
  return await prisma.projectionEvent.deleteMany({
    where: { recurringEventId },
  })
}
```

### Step 2.4: Create DAL for Settings

Create `src/lib/dal/settings.ts`:
```typescript
import { prisma } from '@/lib/prisma'

export async function getSettings() {
  const settings = await prisma.settings.findFirst()

  if (!settings) {
    // Create default settings if none exist
    return await prisma.settings.create({
      data: {
        initialBankBalance: 0,
      },
    })
  }

  return settings
}

export async function updateInitialBalance(balance: number) {
  const settings = await getSettings()

  return await prisma.settings.update({
    where: { id: settings.id },
    data: { initialBankBalance: balance },
  })
}
```

### Step 2.5: Create DAL for Daily Balances

Create `src/lib/dal/daily-balances.ts`:
```typescript
import { prisma } from '@/lib/prisma'

export async function getDailyBalance(date: Date) {
  return await prisma.dailyBalance.findUnique({
    where: { date },
  })
}

export async function upsertDailyBalance(date: Date, expectedBalance: number, actualBalance: number | null = null) {
  return await prisma.dailyBalance.upsert({
    where: { date },
    update: { expectedBalance, ...(actualBalance !== null && { actualBalance }) },
    create: { date, expectedBalance, actualBalance },
  })
}

export async function setActualBalance(date: Date, actualBalance: number) {
  return await prisma.dailyBalance.upsert({
    where: { date },
    update: { actualBalance },
    create: { date, expectedBalance: actualBalance, actualBalance },
  })
}

export async function getDailyBalancesByRange(startDate: Date, endDate: Date) {
  return await prisma.dailyBalance.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  })
}
```

---

## Phase 3: Business Logic - Balance Calculation Engine

### Step 3.1: Create Balance Calculator

Create `src/lib/calculations/balance-calculator.ts`:
```typescript
import { startOfMonth, endOfMonth, eachDayOfInterval, addMonths, eachMonthOfInterval, format, subDays } from 'date-fns'
import { getSettings } from '@/lib/dal/settings'
import { getProjectionEventsByDateRange } from '@/lib/dal/projection-events'
import { getDailyBalance, upsertDailyBalance } from '@/lib/dal/daily-balances'
import { EventType, CertaintyLevel } from '@prisma/client'

interface DayBalance {
  date: Date
  expectedBalance: number
  actualBalance: number | null
  events: Array<{
    id: string
    name: string
    value: number
    type: EventType
    certainty: CertaintyLevel
  }>
}

export async function calculateMonthlyBalances(year: number, month: number): Promise<DayBalance[]> {
  const startDate = startOfMonth(new Date(year, month - 1))
  const endDate = endOfMonth(new Date(year, month - 1))

  // Get all days in the month
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  // Get settings for initial balance
  const settings = await getSettings()
  let runningBalance = Number(settings.initialBankBalance)

  // Get all events in this month (including recurring dates)
  const events = await getProjectionEventsByDateRange(startDate, endDate)

  // Get the previous day's balance to determine starting point
  const prevDay = subDays(days[0], 1)
  const prevDayBalance = await getDailyBalance(prevDay)

  if (prevDayBalance) {
    // If previous day had an actual balance, use that. Otherwise use expected.
    runningBalance = prevDayBalance.actualBalance
      ? Number(prevDayBalance.actualBalance)
      : Number(prevDayBalance.expectedBalance)
  }

  const dailyBalances: DayBalance[] = []

  // Calculate balance for each day
  for (const day of days) {
    // Check if this day has an actual balance set
    const existingDayBalance = await getDailyBalance(day)

    // Get events for this day
    const dayEvents = events.filter(
      event => format(event.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    )

    // Apply events to balance (excluding "UNLIKELY" certainty)
    for (const event of dayEvents) {
      if (event.certainty !== CertaintyLevel.UNLIKELY) {
        const value = Number(event.value)
        runningBalance += event.type === EventType.INCOMING ? value : -value
      }
    }

    // If there's an actual balance set, use that for the next day's starting point
    const finalBalance = existingDayBalance?.actualBalance
      ? Number(existingDayBalance.actualBalance)
      : runningBalance

    // Store the expected balance (actual balance is set separately via API)
    await upsertDailyBalance(day, runningBalance, existingDayBalance?.actualBalance ?? null)

    dailyBalances.push({
      date: day,
      expectedBalance: runningBalance,
      actualBalance: existingDayBalance?.actualBalance ? Number(existingDayBalance.actualBalance) : null,
      events: dayEvents.map(e => ({
        id: e.id,
        name: e.name,
        value: Number(e.value),
        type: e.type,
        certainty: e.certainty,
      })),
    })

    // Update running balance for next iteration
    runningBalance = finalBalance
  }

  return dailyBalances
}

export async function recalculateFromDate(fromDate: Date) {
  // Recalculate balances from this date forward
  // This is called when an event is added/modified/deleted
  const today = new Date()
  const endDate = addMonths(today, 6)

  const startDate = startOfMonth(fromDate)
  const months = eachMonthOfInterval({ start: startDate, end: endDate })

  for (const month of months) {
    await calculateMonthlyBalances(month.getFullYear(), month.getMonth() + 1)
  }
}
```

---

## Phase 4: API Routes

### Step 4.1: Create API Route for Projection Events

Create `src/app/api/projection-events/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createProjectionEvent, getProjectionEventsByDateRange } from '@/lib/dal/projection-events'
import { recalculateFromDate } from '@/lib/calculations/balance-calculator'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Missing date range' }, { status: 400 })
  }

  const events = await getProjectionEventsByDateRange(
    new Date(startDate),
    new Date(endDate)
  )

  return NextResponse.json(events)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input (use Zod in production)
    const event = await createProjectionEvent({
      ...body,
      date: new Date(body.date),
      value: parseFloat(body.value),
    })

    // Recalculate balances from this date forward
    await recalculateFromDate(new Date(body.date))

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating projection event:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
```

Create `src/app/api/projection-events/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getProjectionEventById, updateProjectionEvent, deleteProjectionEvent } from '@/lib/dal/projection-events'
import { recalculateFromDate } from '@/lib/calculations/balance-calculator'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const event = await getProjectionEventById(params.id)

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  return NextResponse.json(event)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const event = await getProjectionEventById(params.id)

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const updated = await updateProjectionEvent({
      id: params.id,
      ...body,
      value: body.value ? parseFloat(body.value) : undefined,
    })

    // Recalculate from the event date
    await recalculateFromDate(event.date)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating projection event:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await getProjectionEventById(params.id)

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    await deleteProjectionEvent(params.id)

    // Recalculate from the event date
    await recalculateFromDate(event.date)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting projection event:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
```

### Step 4.2: Create API Route for Monthly Balances

Create `src/app/api/monthly-balances/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { calculateMonthlyBalances } from '@/lib/calculations/balance-calculator'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  if (!year || !month) {
    return NextResponse.json({ error: 'Missing year or month' }, { status: 400 })
  }

  const balances = await calculateMonthlyBalances(
    parseInt(year),
    parseInt(month)
  )

  return NextResponse.json(balances)
}
```

### Step 4.3: Create API Route for Settings

Create `src/app/api/settings/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSettings, updateInitialBalance } from '@/lib/dal/settings'

export async function GET() {
  const settings = await getSettings()
  return NextResponse.json(settings)
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const settings = await updateInitialBalance(parseFloat(body.initialBankBalance))
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
```

### Step 4.4: Create API Route for Actual Balance

Create `src/app/api/daily-balances/[date]/actual/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { setActualBalance } from '@/lib/dal/daily-balances'
import { recalculateFromDate } from '@/lib/calculations/balance-calculator'

export async function POST(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const body = await request.json()
    const date = new Date(params.date)
    const actualBalance = parseFloat(body.actualBalance)

    await setActualBalance(date, actualBalance)

    // Recalculate all balances from the next day forward
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)
    await recalculateFromDate(nextDay)

    return NextResponse.json({ success: true, date, actualBalance })
  } catch (error) {
    console.error('Error setting actual balance:', error)
    return NextResponse.json({ error: 'Failed to set actual balance' }, { status: 500 })
  }
}
```

---

## Phase 5: UI Components

**IMPORTANT**: All components must include `data-testid` attributes for testing purposes.

### Component Testing ID Guidelines

1. **Unique Elements**: Use descriptive, kebab-case IDs
   - Example: `data-testid="dashboard-container"`
   - Example: `data-testid="add-expense-button"`

2. **Repeated Elements**: Append differentiating identifier with double underscore
   - Example: `data-testid="day-cell__14"` (for day 14)
   - Example: `data-testid="month-button__2024-01"` (for January 2024)
   - Example: `data-testid="event-label__${event.id}"`

3. **Modal Elements**: Prefix with modal name
   - Example: `data-testid="projection-event-modal__form"`
   - Example: `data-testid="projection-event-modal__save-button"`

4. **Form Fields**: Use field name
   - Example: `data-testid="event-name-input"`
   - Example: `data-testid="event-value-input"`
   - Example: `data-testid="certainty-select"`

### Step 5.1: Create Dashboard Component

Create `src/components/Dashboard.tsx`:
- Main container with `data-testid="dashboard-container"`
- Two navigation cards: "Projections" and "Data Views"
- Each card with `data-testid="nav-card__projections"` and `data-testid="nav-card__data-views"`

### Step 5.2: Create Projections Component

Create `src/components/Projections.tsx`:
- Displays list of next 6 months
- Each month button: `data-testid="month-button__${year}-${month}"`
- "Show Next Six Months" pagination button: `data-testid="show-next-months-button"`
- Handles month range state (0-5 or 6-11)

### Step 5.3: Create Monthly Calendar Component

Create `src/components/MonthlyCalendar.tsx`:
- Calendar grid display
- Each day cell: `data-testid="day-cell__${dayNumber}"`
- Day cell shows: date, expected balance, actual balance (if set)
- "Add Expense" button per day: `data-testid="add-expense-button__${dayNumber}"`
- "Add Incoming" button per day: `data-testid="add-incoming-button__${dayNumber}"`
- "Set Actual Balance" button per day: `data-testid="set-actual-balance-button__${dayNumber}"`
- Event labels clickable: `data-testid="event-label__${event.id}"`
- Color coding: Orange for expenses, Green for incoming
- Click day to open day detail modal

### Step 5.4: Create Projection Event Modal

Create `src/components/ProjectionEventModal.tsx`:
- Modal container: `data-testid="projection-event-modal"`
- Form: `data-testid="projection-event-modal__form"`
- Fields:
  - Name: `data-testid="event-name-input"`
  - Description: `data-testid="event-description-input"`
  - Value: `data-testid="event-value-input"`
  - Certainty: `data-testid="event-certainty-select"`
  - Pay To / Paid By: `data-testid="event-payto-input"` or `data-testid="event-paidby-input"`
  - Date: `data-testid="event-date-input"`
  - Recurring checkbox: `data-testid="event-recurring-checkbox"`
- Recurring section (conditionally shown):
  - "Same date each month" checkbox: `data-testid="recurring-monthly-checkbox"`
  - "Until target date" input: `data-testid="recurring-until-date-input"`
  - Manual date add button: `data-testid="add-recurring-date-button"`
  - Recurring date list: Each item `data-testid="recurring-date-item__${index}"`
- Save button: `data-testid="projection-event-modal__save-button"`
- Update button (edit mode): `data-testid="projection-event-modal__update-button"`
- Cancel button: `data-testid="projection-event-modal__cancel-button"`

### Step 5.5: Create Day Detail Modal

Create `src/components/DayDetailModal.tsx`:
- Modal container: `data-testid="day-detail-modal"`
- Shows date: `data-testid="day-detail-modal__date"`
- Shows expected balance: `data-testid="day-detail-modal__expected-balance"`
- Shows actual balance: `data-testid="day-detail-modal__actual-balance"`
- "Set Actual Balance" button: `data-testid="day-detail-modal__set-actual-button"`
- Event list: Each event `data-testid="day-detail-event__${event.id}"`
- Add expense/incoming buttons in modal

### Step 5.6: Create Set Actual Balance Modal

Create `src/components/SetActualBalanceModal.tsx`:
- Modal container: `data-testid="set-actual-balance-modal"`
- Date display: `data-testid="set-actual-balance-modal__date"`
- Balance input: `data-testid="actual-balance-input"`
- Save button: `data-testid="set-actual-balance-modal__save-button"`
- Cancel button: `data-testid="set-actual-balance-modal__cancel-button"`

### Step 5.7: Create Data Views Component

Create `src/components/DataViews.tsx`:
- Container: `data-testid="data-views-container"`
- Chart selector dropdown: `data-testid="chart-selector-dropdown"`
- Options: "Monthly Income vs Expenditure" (default), "Balance Over Time"
- Chart container: `data-testid="chart-container"`

### Step 5.8: Create Chart Components (Composable)

Create `src/components/charts/MonthlyIncomeExpenseChart.tsx`:
- Uses Recharts BarChart
- Red bars for expenses, green bars for income
- Component wrapped with `data-testid="monthly-income-expense-chart"`
- Aggregates all events (including recurring) by month

Create `src/components/charts/BalanceOverTimeChart.tsx`:
- Uses Recharts LineChart
- Shows expected balance projection
- Component wrapped with `data-testid="balance-over-time-chart"`
- Line chart of daily expected balances

**Note**: Keep chart components separate and swappable for easy library changes

---

## Phase 6: Pages and Routing

### Step 6.1: Create Dashboard Page

Update `src/app/page.tsx`

### Step 6.2: Create Monthly Projection Page

Create `src/app/projections/[year]/[month]/page.tsx`

### Step 6.3: Create Data Views Page

Create `src/app/data-views/page.tsx`

---

## Phase 7: Testing and Refinement

### Step 7.1: Manual Testing Checklist

**Basic Event Operations**
- [ ] Create a new expense
- [ ] Create a new incoming payment
- [ ] Edit an existing event
- [ ] Delete an event
- [ ] Verify event shows correct color (orange for expense, green for incoming)

**Recurring Events**
- [ ] Create a recurring event with manual dates
- [ ] Create a recurring event with "same date each month until target"
- [ ] Edit a recurring event and verify UI repopulates with saved pattern
- [ ] Delete a recurring event
- [ ] Verify recurring events appear on all specified dates

**Balance Calculations**
- [ ] Verify initial balance is used for first calculation
- [ ] Set an actual balance for a day
- [ ] Verify next day's calculation starts from actual balance
- [ ] Create an event with "unlikely" certainty and verify it doesn't affect balance
- [ ] Change an event from "likely" to "unlikely" and verify balance recalculates
- [ ] Verify balance calculation excludes "unlikely" events

**Navigation and UI**
- [ ] Navigate between months
- [ ] Test "Show Next Six Months" pagination
- [ ] Navigate back to first 6 months
- [ ] Click on a day to open day detail modal
- [ ] Click on an event label to edit event

**Day Detail Modal**
- [ ] View day details with multiple events
- [ ] Set actual balance from day detail modal
- [ ] Add expense from day detail modal
- [ ] Add incoming from day detail modal

**Data Visualizations**
- [ ] View Monthly Income vs Expenditure chart (default)
- [ ] Switch to Balance Over Time chart
- [ ] Verify charts update when events are added/modified
- [ ] Verify recurring events are included in aggregations

**Data Integrity**
- [ ] Add event and verify balance recalculates forward
- [ ] Modify event and verify recalculation
- [ ] Delete event and verify recalculation
- [ ] Set actual balance and verify cascade to subsequent days

### Step 7.2: Database Migration Testing
- [ ] Test initial schema migration
- [ ] Verify foreign key constraints (EventRecurringDate -> ProjectionEvent)
- [ ] Test cascade delete behavior
- [ ] Verify data integrity after multiple migrations
- [ ] Test rollback scenarios

### Step 7.3: Performance Testing
- [ ] Test with 6 months of data
- [ ] Test with 50+ events per month
- [ ] Test with recurring events spanning all 6 months
- [ ] Verify calculation performance with actual balance set frequently
- [ ] Test chart rendering with large datasets

### Step 7.4: Testing Infrastructure Validation
- [ ] Verify all components have `data-testid` attributes
- [ ] Verify repeated elements use differentiating suffixes
- [ ] Test E2E scenarios using data-testid selectors
- [ ] Document any missing test IDs for future addition

---

## Phase 8: Documentation and Deployment

### Step 8.1: Create User Guide
- Document basic workflows
- Screenshot key features
- Troubleshooting guide
- How to set up recurring events
- How to use actual balance feature
- How to interpret certainty levels

### Step 8.2: Local Deployment
- PostgreSQL setup instructions
- Environment configuration (.env.local template)
- First-time setup guide
- Database initialization steps
- Running migrations

### Step 8.3: Developer Documentation
- Database schema diagram
- API endpoints documentation
- Component hierarchy
- Testing guide using data-testid attributes

---

## Implementation Summary

### Key Technical Features

1. **Database Schema**
   - PostgreSQL with Prisma ORM
   - `ProjectionEvent` model with recurring event support
   - `EventRecurringDate` junction table for one-to-many recurring dates
   - `DailyBalance` with both expected and actual balance fields
   - Cascade delete for data integrity

2. **Recurring Events System**
   - Base event + multiple recurring dates
   - Pattern storage: "same date each month until target"
   - Manual date entry support
   - Editable patterns that repopulate UI

3. **Balance Calculation Engine**
   - Cascading calculations day-by-day
   - Actual balance override support
   - Certainty-based filtering (excludes "unlikely")
   - Automatic recalculation on event changes

4. **API Layer**
   - RESTful routes for events, balances, settings
   - Dedicated route for setting actual balance
   - Error handling and validation

5. **UI Components**
   - Calendar-based month view
   - Multiple modals: Event creation/editing, day details, actual balance
   - Color-coded events (orange/green)
   - Comprehensive data-testid coverage

6. **Data Visualization**
   - Composable chart components (easy to swap libraries)
   - Monthly income vs expenditure (bar chart)
   - Balance over time (line chart)
   - Dropdown selector for chart types

### Development Best Practices

- **Package Manager**: yarn
- **Testing**: Comprehensive data-testid attributes on all interactive elements
- **DAL Pattern**: All database access through dedicated layer
- **Type Safety**: Full TypeScript coverage
- **Calculation Integrity**: Automatic recalculation triggers
- **Component Composition**: Modular, reusable components

### Database Relationships

```
Settings (1)
  ├─ initialBankBalance

ProjectionEvent (many)
  ├─ date (base event date)
  ├─ isRecurring
  ├─ recurringEventId (groups related events)
  ├─ onTheSameDateEachMonth
  ├─ monthlyEventDay
  ├─ untilTargetDate
  └─ EventRecurringDate (many)
       └─ date (each occurrence date)

DailyBalance (many)
  ├─ expectedBalance (calculated)
  └─ actualBalance (user-set override)
```

### Calculation Flow

```
1. Get initial balance from Settings
2. For each day in sequence:
   a. Check if previous day has actualBalance
   b. Use actualBalance if set, else use expectedBalance
   c. Get all events for current day (including recurring)
   d. Filter out "unlikely" certainty events
   e. Apply expenses (subtract) and incoming (add)
   f. Store as expectedBalance
   g. If day has actualBalance set, use that for next day
3. Cascade through all subsequent days
4. Recalculate on any event change from that date forward
```

### File Structure Overview

```
financial-projections/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── page.tsx (Dashboard)
│   │   ├── projections/[year]/[month]/page.tsx
│   │   ├── data-views/page.tsx
│   │   └── api/
│   │       ├── projection-events/
│   │       ├── daily-balances/
│   │       ├── monthly-balances/
│   │       └── settings/
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── Projections.tsx
│   │   ├── MonthlyCalendar.tsx
│   │   ├── ProjectionEventModal.tsx
│   │   ├── DayDetailModal.tsx
│   │   ├── SetActualBalanceModal.tsx
│   │   ├── DataViews.tsx
│   │   └── charts/
│   │       ├── MonthlyIncomeExpenseChart.tsx
│   │       └── BalanceOverTimeChart.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── dal/
│   │   │   ├── projection-events.ts
│   │   │   ├── daily-balances.ts
│   │   │   └── settings.ts
│   │   └── calculations/
│   │       └── balance-calculator.ts
│   └── types/
│       └── index.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── .env.local
```

---

## Ready to Begin Implementation

This plan is now fully specified based on your requirements. The implementation will proceed through the following phases:

1. **Phase 1**: Project setup and database schema ✓
2. **Phase 2**: Database access layer (DAL) ✓
3. **Phase 3**: Balance calculation engine ✓
4. **Phase 4**: API routes ✓
5. **Phase 5**: UI components ✓
6. **Phase 6**: Pages and routing ✓
7. **Phase 7**: Testing and refinement ✓
8. **Phase 8**: Documentation and deployment ✓

Each phase builds on the previous one, ensuring a solid foundation before moving forward.

**Next Steps**:
1. Confirm this plan meets all your requirements
2. Begin Phase 1 implementation
3. Progress sequentially through each phase
4. Test thoroughly at each step

Would you like to proceed with implementation starting at Phase 1?
