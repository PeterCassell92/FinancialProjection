# API Test Infrastructure Design

## Overview

Containerized test environment for comprehensive API testing with isolated database, file storage, and automated data seeding.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Test Orchestrator                     │
│  (Host machine - runs docker-compose & test suite)      │
└──────────────┬──────────────────────────────────────────┘
               │
    ┌──────────┴───────────┬──────────────────┐
    │                      │                  │
┌───▼──────────┐  ┌────────▼────────┐  ┌─────▼──────┐
│  PostgreSQL  │  │   Next.js App   │  │   Volume   │
│  Container   │  │    Container    │  │  (CSV Files)│
│              │  │                 │  │            │
│  test_db     │◄─┤  Port: 3001     │──► /app/uploads│
└──────────────┘  └─────────────────┘  └────────────┘
```

## Components

### 1. Docker Compose Configuration

**File:** `docker-compose.test.yml`

Services:
- **test-db**: PostgreSQL 16 with ephemeral data
- **test-app**: Next.js app with database connection
- **test-volumes**: Shared volume for CSV uploads

Environment variables:
- `DATABASE_URL`: Points to test-db
- `NODE_ENV`: test
- `CSV_UPLOAD_PATH`: /app/uploads

### 2. Database Seeding

**Location:** `tests/seeds/`

Scripts:
- `01-settings.ts`: Create default settings (GBP, UK date format)
- `02-bank-accounts.ts`: Create 2 bank accounts (Halifax Current, Halifax Savings)
- `03-spending-types.ts`: Create 10 common spending types
- `04-decision-paths.ts`: Create 3 decision paths (Base, Optimistic, Pessimistic)
- `05-scenario-sets.ts`: Create 2 scenario sets
- `seed.ts`: Master seed orchestrator

**Spoof Bank Account Data:**
```typescript
{
  name: "Halifax Current Account",
  sortCode: "11-22-33",
  accountNumber: "12345678",
  provider: "HALIFAX"
}
```

### 3. CSV Test Dataset

**Location:** `tests/fixtures/csv/`

**Organization by DataFormat:**
```
tests/fixtures/csv/
├── halifax/                          # Halifax DataFormat CSVs
│   ├── valid/
│   │   ├── halifax-12-months-2024.csv     # Full year of transactions
│   │   ├── halifax-overlap-test.csv       # Small set with known overlap dates
│   │   └── halifax-single-month.csv       # January 2024 only
│   └── invalid/
│       ├── halifax-missing-headers.csv    # Missing required column headers
│       ├── halifax-malformed-dates.csv    # Invalid date formats
│       ├── halifax-missing-balance.csv    # Missing balance column
│       ├── halifax-invalid-amounts.csv    # Non-numeric amounts
│       ├── halifax-empty.csv              # Empty file (no data rows)
│       └── halifax-wrong-structure.csv    # Completely wrong CSV structure
└── future-formats/                   # Placeholder for other banks
    └── README.md                     # Instructions for adding new formats

**Data Generation:**
- 365 days of transactions
- Mix of debits/credits (salary, bills, groceries, entertainment)
- Realistic balances starting from £5,000
- Average 5-8 transactions per day
- Include weekends, direct debits, standing orders

**Transaction Types Distribution:**
- DD (Direct Debit): 10%
- SO (Standing Order): 5%
- DEB (Debit Card): 60%
- CR (Credit/Salary): 5%
- TFR (Transfer): 15%
- ATM: 5%

### 4. Test Suite Structure

**Location:** `tests/api/`

```
tests/
├── api/
│   ├── settings.test.ts
│   ├── bank-accounts.test.ts
│   ├── spending-types.test.ts
│   ├── transaction-records.test.ts
│   ├── csv-upload-flow.test.ts         # Integration test (valid CSVs)
│   ├── csv-validation.test.ts          # Invalid CSV rejection tests
│   ├── projection-events.test.ts
│   ├── recurring-event-rules.test.ts
│   ├── scenario-sets.test.ts
│   ├── decision-paths.test.ts
│   ├── calculate-balances.test.ts
│   └── daily-balance.test.ts
├── fixtures/
│   ├── csv/                            # CSV test files
│   └── responses/                      # Expected response shapes
├── seeds/                              # Database seed scripts
├── utils/
│   ├── test-client.ts                  # HTTP client for API calls
│   ├── assertions.ts                   # Custom Zod-based assertions
│   └── cleanup.ts                      # Database cleanup helpers
└── setup.ts                            # Global test setup/teardown
```

### 5. Test Execution Flow

**Script:** `package.json` scripts

```json
{
  "scripts": {
    "test:api": "npm run test:api:setup && npm run test:api:run && npm run test:api:teardown",
    "test:api:setup": "docker-compose -f docker-compose.test.yml up -d && npm run test:api:seed",
    "test:api:seed": "tsx tests/seeds/seed.ts",
    "test:api:run": "NODE_ENV=test jest tests/api --runInBand --verbose",
    "test:api:teardown": "docker-compose -f docker-compose.test.yml down -v",
    "test:api:logs": "docker-compose -f docker-compose.test.yml logs -f",
    "test:api:shell": "docker-compose -f docker-compose.test.yml exec test-app sh"
  }
}
```

### 6. Test Configuration

**File:** `jest.config.api.js`

```javascript
module.exports = {
  displayName: 'API Tests',
  testEnvironment: 'node',
  testMatch: ['**/tests/api/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000, // 30s for integration tests
  verbose: true,
  bail: false, // Run all tests even if some fail
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-results',
      outputName: 'api-tests.xml'
    }]
  ]
};
```

## Implementation Plan

### Phase 4.1: Design ✅ (This Document)

### Phase 4.2: Docker Infrastructure
- Create `docker-compose.test.yml`
- Create `Dockerfile.test` for Next.js app
- Configure networking and volumes
- Test container startup/teardown

### Phase 4.3: Database Seeding
- Install `tsx` for TypeScript seed execution
- Create seed scripts in `tests/seeds/`
- Implement idempotent seeding (can run multiple times)
- Test seed data integrity

### Phase 4.4: CSV Test Data Generation
- Create `generate-csv-fixtures.ts` script for valid CSVs
- Generate 12-month Halifax CSV with realistic data
- Generate single-month and overlap test CSVs
- Create invalid CSV fixtures (6 types) for error testing
- Organize by DataFormat type (halifax/, future-formats/)
- Validate CSVs can be parsed/rejected by existing processors
- Document expected validation errors for each invalid CSV

### Phase 4.5: Test Suite Development
- Port existing `recurring-event-rules.test.ts` pattern to all endpoints
- Create test utilities (`test-client.ts`, `assertions.ts`)
- Write integration tests for CSV upload flow
- Test all CRUD operations with Zod validation

### Phase 4.6: Test Orchestration
- Create npm scripts for test lifecycle
- Add GitHub Actions workflow (optional)
- Document test running procedures
- Create troubleshooting guide

## Key Features

### 1. Isolation
- Each test run uses fresh database
- No test pollution between runs
- Ephemeral file storage

### 2. Speed
- Parallel test execution where possible
- Fast container startup (~10s)
- Efficient seeding (<5s)
- **Target: Full test suite < 2 minutes**

### 3. Reliability
- Deterministic seed data
- Zod validation of all responses
- Clear error messages
- Automatic cleanup

### 4. Developer Experience
- Single command to run tests: `npm run test:api`
- View logs: `npm run test:api:logs`
- Debug in container: `npm run test:api:shell`
- Clear test output with jest reporters

## CSV Dataset Specification

### halifax-12-months-2024.csv

**Structure:**
```csv
Transaction Date,Transaction Type,Transaction Description,Debit Amount,Credit Amount,Balance
01/01/2024,CR,SALARY PAYMENT,,2500.00,7500.00
02/01/2024,DD,COUNCIL TAX,150.00,,7350.00
02/01/2024,DEB,TESCO STORES,45.20,,7304.80
...
```

**Requirements:**
- Start date: 01/01/2024
- End date: 31/12/2024
- Starting balance: £5,000
- Monthly salary: £2,500 (1st of month)
- Regular bills: Council Tax (£150), Utilities (£80), Internet (£30)
- Variable spending: £500-800/month
- Occasional credits: Tax refund, savings transfer

**Valid CSV Generation:**
```typescript
// tests/fixtures/csv/generate-valid-csvs.ts
- Use date-fns for date manipulation
- Realistic transaction descriptions
- Vary amounts within reasonable ranges
- Include weekends (fewer transactions)
- Add monthly patterns (salary, bills)
```

**Invalid CSV Test Cases:**

| File | Purpose | Expected Error |
|------|---------|----------------|
| `halifax-missing-headers.csv` | CSV without header row | "Missing required headers" |
| `halifax-malformed-dates.csv` | Invalid date format (e.g., "2024-13-45") | "Invalid date format" |
| `halifax-missing-balance.csv` | Missing Balance column | "Required column 'Balance' not found" |
| `halifax-invalid-amounts.csv` | Non-numeric values in amount columns | "Invalid amount value" |
| `halifax-empty.csv` | Empty file with headers only | "No transaction records found" |
| `halifax-wrong-structure.csv` | Completely different CSV structure | "Unrecognized CSV format" |

Each invalid CSV should trigger the validation check to fail and return an appropriate error message through the `/api/transaction-records/check-csv-validity` endpoint.

## Test Assertions

Use Zod schemas for response validation:

```typescript
import { SettingsGetResponseSchema } from '@/lib/schemas';

test('GET /api/settings returns valid response', async () => {
  const response = await testClient.get('/api/settings');

  // Validate response shape with Zod
  const parsed = SettingsGetResponseSchema.parse(response.data);

  expect(parsed.success).toBe(true);
  expect(parsed.data?.currency).toBe('GBP');
});
```

## Monitoring Test Results

### Console Output (Default)
```
 PASS  tests/api/settings.test.ts
  ✓ GET /api/settings (152ms)
  ✓ PUT /api/settings (89ms)
  ✓ PATCH /api/settings (76ms)

Test Suites: 11 passed, 11 total
Tests:       87 passed, 87 total
Time:        45.234s
```

### JUnit XML (CI/CD)
- Output: `test-results/api-tests.xml`
- Compatible with Jenkins, GitLab CI, GitHub Actions
- Detailed failure information

### HTML Report (Optional)
- Install `jest-html-reporter`
- View in browser: `open test-results/report.html`

## Success Criteria

- [ ] All 11 endpoint groups have passing tests
- [ ] CSV upload flow tested end-to-end
- [ ] Test suite completes in < 2 minutes
- [ ] 100% of Zod schemas validated in tests
- [ ] Zero test failures
- [ ] Clean container startup/teardown
- [ ] No manual cleanup required

## Next Steps

1. **Immediate:** Create docker-compose.test.yml
2. **Short-term:** Implement seed scripts and CSV generator
3. **Medium-term:** Port test patterns to all endpoints
4. **Long-term:** Add to CI/CD pipeline

## Questions to Resolve

1. **Port allocation:** Use 3001 for test app (3000 for dev)?
2. **Prisma migrations:** Run in container or before startup?
3. **Test parallelization:** Run tests serially (`--runInBand`) or parallel?
4. **CSV fixtures:** Generate once or on-demand?
5. **Snapshot testing:** Use for response validation?

## Estimated Timeline

- Phase 4.2 (Docker): 2-3 hours
- Phase 4.3 (Seeding): 3-4 hours
- Phase 4.4 (CSV Data): 2-3 hours
- Phase 4.5 (Test Suite): 8-10 hours
- Phase 4.6 (Orchestration): 1-2 hours

**Total: 16-22 hours of development**
