# API Testing Suite

API integration tests for the Financial Projections application using an isolated Docker test database.

## Quick Start (Recommended)

Run the complete automated test workflow:

```bash
./scripts/run-all-tests.sh
```

This will:
1. ✅ Start a fresh PostgreSQL test database in Docker
2. ✅ Run database migrations
3. ✅ Seed test data (if configured)
4. ✅ Start the Next.js dev server in test mode
5. ✅ Run all tests
6. ✅ Clean up everything

## Manual Setup

If you prefer to manage each step manually:

### 1. Install Dependencies
```bash
yarn install
```

### 2. Start Test Database
```bash
yarn db:setup
```

This starts a PostgreSQL container on port 5435 (separate from your dev DB on 5432).

### 3. Run Migrations
```bash
yarn db:migrate
```

### 4. Start Next.js in Test Mode
In a separate terminal:
```bash
cd ../../financial-projections
NODE_ENV=test DATABASE_URL=postgresql://test_user:test_password@localhost:5435/financial_projections_test yarn dev
```

### 5. Run Tests
```bash
yarn test
```

### 6. Cleanup
```bash
yarn db:teardown
```

## Available Scripts

### Test Commands
- `yarn test` - Run all tests
- `yarn test:watch` - Watch mode (auto-rerun on changes)
- `yarn test:coverage` - Generate coverage report
- `yarn test:verbose` - Detailed output

### Database Commands
- `yarn db:setup` - Start test database container
- `yarn db:teardown` - Stop and remove test database
- `yarn db:migrate` - Run Prisma migrations
- `yarn db:seed` - Seed test data
- `yarn db:reset` - Teardown → Setup → Migrate

### CI/CD Command
- `yarn test:ci` - Full workflow for CI (setup → migrate → test → teardown)

## Test Database

The test database runs in Docker with these specs:

- **Image**: postgres:16
- **Port**: 5435 (to avoid conflicts with dev DB)
- **Database**: financial_projections_test
- **User**: test_user
- **Password**: test_password
- **Storage**: tmpfs (in-memory, not persisted)

Connection string:
```
postgresql://test_user:test_password@localhost:5435/financial_projections_test
```

## Test Structure

```
tests/api-testing/
├── src/
│   ├── tests/              # Test files
│   │   └── recurring-event-rules.test.ts
│   └── utils/              # Test utilities
│       └── api-client.ts   # HTTP client wrapper
├── scripts/                # Database & test scripts
│   ├── setup-test-db.sh    # Start Docker database
│   ├── teardown-test-db.sh # Stop Docker database
│   ├── run-migrations.sh   # Run Prisma migrations
│   ├── seed-test-data.sh   # Seed test data
│   └── run-all-tests.sh    # Complete automated workflow
├── docker-compose.test.yml # Test database config
├── jest.config.js          # Jest configuration
├── tsconfig.json           # TypeScript configuration
└── .env.test              # Test environment variables
```

## Writing Tests

### Example Test
```typescript
import { apiClient } from '../utils/api-client';

describe('POST /api/my-endpoint', () => {
  it('should validate required fields', async () => {
    const { status, data } = await apiClient.post('/api/my-endpoint', {
      // missing required field
    });

    expect(status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('required');
  });

  it('should create resource successfully', async () => {
    const { status, data } = await apiClient.post('/api/my-endpoint', {
      name: 'Test',
      value: 100,
    });

    expect(status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });
});
```

## Current Test Coverage

### Recurring Event Rules (`/api/recurring-event-rules`)

#### Validation Tests (13)
- ✓ Missing required fields (name, value, type, certainty, startDate, endDate, frequency)
- ✓ Invalid date formats (startDate, endDate)
- ✓ Invalid date ranges (endDate before/equal to startDate)
- ✓ Invalid values (zero, negative)

#### Success Cases (4)
- ✓ Monthly expense recurring rule
- ✓ Weekly incoming payment rule
- ✓ Annual recurring rule
- ✓ GET all recurring rules

**Total: 17 tests**

## Isolation & Safety

**Your production database is completely safe!**

- Tests run against an isolated Docker database
- Test database uses tmpfs (in-memory storage)
- All data is destroyed when the container stops
- Production database remains untouched
- Test DB runs on a different port (5435 vs 5432)

## Troubleshooting

### Tests fail with "fetch failed" or connection errors
```bash
# Check if test database is running
docker ps | grep financial-projections-test-db

# Check database health
docker exec financial-projections-test-db pg_isready -U test_user

# Restart the database
yarn db:reset
```

### Next.js server not using test database
Make sure you're starting the server with the test DATABASE_URL:
```bash
DATABASE_URL=postgresql://test_user:test_password@localhost:5435/financial_projections_test yarn dev
```

### Port conflicts
If port 5435 is already in use, edit `docker-compose.test.yml` to use a different port.

### Database schema out of sync
```bash
yarn db:reset  # This will recreate the database with fresh schema
```

## CI/CD Integration

For GitHub Actions, Jenkins, or other CI systems:

```yaml
# Example GitHub Actions
- name: Run API Tests
  run: |
    cd tests/api-testing
    yarn install
    yarn test:ci
```

The `test:ci` command handles everything automatically.

---

## 🐳 Containerized Testing (Recommended for CI/CD)

For complete isolation, you can run both the database AND the Next.js application in Docker containers.

### Quick Containerized Test Run

```bash
yarn test:containerized
```

This single command:
1. Builds and starts PostgreSQL container (port 5435)
2. Builds and starts Next.js application container (port 3001)
3. Runs database migrations
4. Waits for services to be healthy
5. Runs all tests
6. Tears down all containers

### Manual Containerized Workflow

```bash
# Start database + app containers
yarn env:setup

# Run tests (containers stay running)
yarn test

# Stop and remove containers
yarn env:teardown
```

### Container Architecture

```
┌─────────────────────────────────────────┐
│  Host Machine (localhost)               │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Test Runner (Jest)                │ │
│  │  Port: N/A                         │ │
│  └──────────┬─────────────────────────┘ │
│             │ HTTP                       │
│             ▼                            │
│  ┌────────────────────────────────────┐ │
│  │  test-app (Next.js)                │ │
│  │  Internal: 3000                    │ │
│  │  External: 3001                    │ │
│  └──────────┬─────────────────────────┘ │
│             │ PostgreSQL Protocol        │
│             ▼                            │
│  ┌────────────────────────────────────┐ │
│  │  test-db (PostgreSQL)              │ │
│  │  Internal: 5432                    │ │
│  │  External: 5435                    │ │
│  │  Storage: tmpfs (in-memory)        │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Network: test-network (bridge)         │
└─────────────────────────────────────────┘
```

### When to Use Containerized vs Manual

**Use Containerized (`yarn test:containerized`):**
- ✅ CI/CD pipelines
- ✅ Clean room testing
- ✅ Don't want to install Node.js locally
- ✅ Testing on different machines
- ✅ E2E testing (future)

**Use Manual (local Next.js + Docker DB):**
- ✅ Active development
- ✅ Faster iteration (no rebuild needed)
- ✅ Debugging with breakpoints
- ✅ Testing local code changes

### Dockerfile Details

The `Dockerfile.test` creates a lightweight Next.js container:
- Base image: `node:24-alpine`
- Installs dependencies via Yarn
- Generates Prisma client
- Runs `yarn dev` (hot reload enabled with volumes)
- Exposed on port 3001 externally

### Volume Mounts

The docker-compose configuration mounts your source code:
```yaml
volumes:
  - ../../financial-projections:/app
  - /app/node_modules
  - /app/.next
```

This means:
- Code changes are reflected immediately (hot reload)
- `node_modules` and `.next` stay in the container for performance
