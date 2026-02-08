# Balance Architecture Overhaul - Full Plan & Progress

## Why This Change

The app originally had no transaction data, so users manually entered an `initialBankBalance` in Settings and could set per-day `actualBalance` overrides. Now that real transaction data is ingested via CSV, these manual mechanisms are obsolete. The `balance` field on TransactionRecord is the true source of truth.

This plan replaces the manual balance system with transaction-sourced balances, adds date coverage tracking, introduces on-the-fly computation for what-if analysis, and optimises computation with diff-based updates and lazy evaluation.

---

## Progress Summary

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | DONE | Zero-Event Day Records |
| Phase 2 | DONE | Coverage API |
| Phase 3 | DONE | Rewrite Balance Calculator + On-the-fly API |
| Phase 4 | TODO | Schema migration - remove old fields |
| Phase 5 | TODO | Frontend changes |
| Phase 6 | TODO | Cleanup |
| Phase 7 | TODO | Computation Optimisations (NEW - not yet planned in detail) |

---

## What's Been Completed

### Phase 1: Zero-Event Day Records

**Schema changes** (`prisma/schema.prisma`):
- Added `ZERO_EVENT` to `TransactionType` enum
- Added composite index `@@index([bankAccountId, transactionDate])` on TransactionRecord
- Migration applied: `20260207233241_add_zero_event_type_and_composite_index`

**New DAL functions** (`src/lib/dal/transaction-records.ts`):
- `getLastTransactionBalanceOnOrBefore(date, bankAccountId)` - finds the most recent transaction balance, used as starting point for projections
- `insertZeroEventDayRecords(bankAccountId, startDate, endDate, uploadOperationId)` - fills gaps during CSV import so every day has a record
- `getDailyTransactionBalances(bankAccountId, startDate, endDate)` - returns closing balance per day from transactions (for calendar display)

**CSV upload integration** (`src/app/api/transaction-records/upload-csv/route.ts`):
- After batch insert, automatically calls `insertZeroEventDayRecords()` to fill gaps
- Response includes `zeroEventDaysInserted` count

**NOT YET DONE**: Backfill script for existing imported data (Phase 1d in original plan)

### Phase 2: Coverage API

**New DAL function** (`src/lib/dal/transaction-records.ts`):
- `getTransactionCoverage(bankAccountId)` - queries distinct transaction dates, groups consecutive dates into `{ startDate, endDate }` ranges

**New API route** (`src/app/api/transaction-records/coverage/route.ts`):
- `GET /api/transaction-records/coverage?bankAccountId=X`
- Returns coverage ranges, total covered days, latest covered date

**New schema** (`src/lib/schemas/transaction-coverage.ts`)

### Phase 3: Rewrite Balance Calculator

**Completely rewritten** (`src/lib/calculations/balance-calculator.ts`):

- `findStartingBalanceAndDate()` now uses `getLastTransactionBalanceOnOrBefore()` instead of actualBalance/initialBankBalance. Falls back to 0 if no transactions exist.
- `calculateDailyBalances()` - no more actualBalance logic. Uses a shared `computeBalances()` core function, stores results in DailyBalance cache.
- `recalculateBalancesFrom()` - unchanged signature, still called by all event/rule CRUD APIs. Works transparently with the new transaction-based starting balance.
- **NEW** `computeBalancesOnTheFly()` - computes and RETURNS balances without storing. Accepts `useTrueBalanceFromDate` and `enabledDecisionPathIds`. Returns `{ date, expectedBalance, eventCount, balanceType: 'true' | 'projected' }[]`.

**New API route** (`src/app/api/compute-balances/route.ts`):
- `POST /api/compute-balances`
- Body: `{ startDate, endDate, bankAccountId, useTrueBalanceFromDate, enabledDecisionPathIds? }`
- Returns computed balances with true/projected type markers

**New schema** (`src/lib/schemas/compute-balances.ts`)

---

## What Remains

### Phase 4: Schema Migration - Remove Old Fields

**Prisma schema changes:**
- Settings: remove `initialBankBalance` and `initialBalanceDate`
- DailyBalance: remove `actualBalance`
- Run destructive migration

**DAL updates:**
- `daily-balance.ts`: remove `setActualBalance()`, `clearActualBalance()`, `getMostRecentActualBalance()`, `getMostRecentActualBalanceOnOrBefore()`. Remove `actualBalance` from all interfaces.
- `settings.ts`: remove `updateInitialBankBalance()`. Update `createSettings()` to not require initialBankBalance.

**API updates:**
- `api/daily-balance/route.ts`: remove PUT (set actual) and DELETE (clear actual) handlers
- `api/settings/route.ts`: remove initialBankBalance/initialBalanceDate from request/response, remove `setActualBalance()` call in PUT handler

**Schema/type updates:**
- `schemas/daily-balance.ts`: remove actualBalance from schemas
- `schemas/settings.ts`: remove initialBankBalance/initialBalanceDate
- `schemas/calculate-balances.ts`: remove actualBalance from DailyBalanceSummarySchema
- `types/index.ts`: remove actualBalance from DailyBalanceData, isActual from BalanceChartData, SetActualBalanceRequest, initialBankBalance/initialBalanceDate from SettingsData
- `redux/settingsSlice.ts`: remove initialBankBalance/initialBalanceDate from state

### Phase 5: Frontend Changes

**DayDetailModal** (`src/components/modals/DayDetailModal.tsx`):
- Remove all actual balance UI (set/edit/clear buttons, input form, orange display)
- Show "True Balance" from transactions for covered dates, "Projected Balance" for uncovered dates

**Monthly Projection Page** (`src/app/projections/[monthId]/page.tsx`):
- Remove orange pill / hasActualBalance logic
- **New behavior**: two types of balance per day cell:
  - Days within transaction coverage: true balance in **black** (positive) or **red** (negative)
  - Days after coverage: projected balance in a muted/distinct style
- Data flow: fetch transaction balances for covered days + projected balances for the rest
- Add `useTrueBalanceFromDate` date picker in projections view header

**FullScreenSettingsModal** (`src/components/FullScreenSettingsModal.tsx`):
- Remove "Initial Balance" section entirely

**Data Views** (`src/app/data-views/page.tsx`):
- Remove actualBalance/isActual references

### Phase 6: Cleanup

- Delete deprecated files
- Remove unused imports
- Update CLAUDE.md
- Run full test suite

---

## Phase 7: Computation Optimisations (NEW - Not Yet Implemented)

These are optimisation ideas to reduce unnecessary computation:

### 7a. Diff-Based Decision Path Toggling

**Problem**: Currently, toggling a decision path triggers a full recalculation of all daily balances from scratch.

**Solution**: When toggling a decision path, instead of recalculating everything:
1. Query only the ProjectionEvents associated with the toggled decision path
2. For each event, compute its impact (+/- value based on type)
3. Apply the diff to the existing DailyBalance dataset:
   - If enabling a path: add the event impacts to all affected dates and cascade forward
   - If disabling a path: subtract the event impacts from all affected dates and cascade forward
4. This is O(events_in_path + affected_days) instead of O(all_events * all_days)

**Implementation approach**:
- New function: `applyDecisionPathDiff(bankAccountId, decisionPathId, enable: boolean)`
- Fetch events for the decision path, group by date
- Walk forward from earliest event date, applying +/- diff and cascading to subsequent days
- Update DailyBalance records in-place

### 7b. Lazy (View-Scoped) Computation

**Problem**: Currently recalculation computes 6 months forward from any changed event, even if the user is only viewing month 1.

**Solution**: Only calculate balances for months that are currently being viewed, plus the month before (to get the correct starting balance for the viewed month).

**Implementation approach**:
- The projections page knows which month is being viewed
- When loading a month, check if DailyBalance records exist for that month
- If not, compute just that month (using the last known balance from the previous month or from transactions)
- When clicking "next month", extend the existing dataset by computing just the new month
- When an event changes, only invalidate DailyBalance records from the event date forward (mark as stale or delete)
- Re-compute on next view rather than eagerly

### 7c. Incremental Extension When Navigating

**Problem**: Navigating to the next month could trigger a fresh computation.

**Solution**: When the user clicks "next month":
1. Take the last balance from the current month's computed data
2. Fetch events only for the new month
3. Compute the new month's balances from that starting point
4. Append to the existing dataset
5. This is O(days_in_month) instead of O(all_days_from_start)

### 7d. Client-Side Caching Strategy

**Problem**: Multiple API calls for the same data when navigating back and forth.

**Proposed cache layers**:

1. **In-memory event cache** (frontend, Redux/React Query):
   - Cache fetched ProjectionEvents by month/date range
   - Invalidate when events are created/updated/deleted
   - This avoids re-fetching events on every view

2. **Computed balance cache** (frontend, Redux/React Query):
   - Cache computed balances keyed by `(bankAccountId, startDate, endDate, enabledDecisionPathIds hash)`
   - Invalidate when events change or decision paths are toggled
   - When navigating months, check cache first before calling API

3. **Server-side DailyBalance as persistent cache**:
   - Current approach: pre-computed for the default scenario (all paths enabled)
   - Serves as a fast fallback when client cache is cold
   - Only invalidated/recomputed when events actually change

4. **Stale-while-revalidate pattern**:
   - Show cached data immediately
   - Recompute in background if data might be stale
   - Update display when fresh data arrives

---

## Design Decisions

### `useTrueBalanceFromDate` is UI-only state (not persisted)
A frontend parameter managed in component/Redux state, passed to the compute API per-request. Default = null (most recent transaction date). Resets on page reload. The DailyBalance cache always uses the default.

### DailyBalance kept as a cache (not removed)
Pre-computed DailyBalance serves the default calendar view for fast page loads. The on-the-fly API serves what-if analysis. This is pragmatic - can evolve to remove DailyBalance later.

### Coverage derived from TransactionRecords (not UploadOperations)
With zero-event records filling imported ranges, TransactionRecords are the authoritative source. UploadOperations could be superseded by patchy re-imports.

### True balances alongside projections in the calendar
Days with transaction coverage show the true bank balance (black/red). Days after coverage show projected balances (distinct style). This fulfils the core product mission.

---

## Key Files (All Paths Relative to `financial-projections/`)

### Already Modified
| File | What Changed |
|------|-------------|
| `prisma/schema.prisma` | Added ZERO_EVENT enum, composite index |
| `src/lib/dal/transaction-records.ts` | Added 4 new functions: getLastTransactionBalanceOnOrBefore, insertZeroEventDayRecords, getDailyTransactionBalances, getTransactionCoverage |
| `src/lib/calculations/balance-calculator.ts` | Complete rewrite: transaction-based starting balance, shared computeBalances core, new computeBalancesOnTheFly |
| `src/app/api/transaction-records/upload-csv/route.ts` | Hooks zero-event insertion after CSV import |
| `src/app/api/transaction-records/coverage/route.ts` | NEW - coverage API |
| `src/app/api/compute-balances/route.ts` | NEW - on-the-fly computation API |
| `src/lib/schemas/transaction-coverage.ts` | NEW - coverage response schema |
| `src/lib/schemas/compute-balances.ts` | NEW - compute-balances request/response schemas |
| `src/lib/schemas/index.ts` | Added exports for new schemas |
| `src/lib/schemas/transaction-records.ts` | Added zeroEventDaysInserted to CsvUploadResponse |

### Still Need Modification (Phase 4-6)
| File | What Needs to Change |
|------|---------------------|
| `prisma/schema.prisma` | Remove actualBalance from DailyBalance, initialBankBalance/initialBalanceDate from Settings |
| `src/lib/dal/daily-balance.ts` | Remove actualBalance functions and from interfaces |
| `src/lib/dal/settings.ts` | Remove updateInitialBankBalance, update createSettings |
| `src/app/api/daily-balance/route.ts` | Remove PUT/DELETE handlers |
| `src/app/api/settings/route.ts` | Remove balance fields |
| `src/lib/schemas/daily-balance.ts` | Remove actualBalance |
| `src/lib/schemas/settings.ts` | Remove initialBankBalance/initialBalanceDate |
| `src/lib/schemas/calculate-balances.ts` | Remove actualBalance from summary |
| `src/types/index.ts` | Remove actualBalance, isActual, SetActualBalanceRequest |
| `src/lib/redux/settingsSlice.ts` | Remove balance state |
| `src/components/modals/DayDetailModal.tsx` | Remove actual balance UI, show true/projected |
| `src/app/projections/[monthId]/page.tsx` | Remove orange pills, blend true/projected balances, add useTrueBalanceFromDate picker |
| `src/components/FullScreenSettingsModal.tsx` | Remove Initial Balance section |
| `src/app/data-views/page.tsx` | Remove actualBalance references |
| `CLAUDE.md` | Update architecture documentation |
