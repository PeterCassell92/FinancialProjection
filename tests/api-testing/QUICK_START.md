# Quick Start Guide

## ⚡ Fastest Way to Run Tests

```bash
cd /home/pete/Documents/Projects/FinancialProjections/tests/api-testing
./scripts/run-all-tests.sh
```

This handles everything automatically:
- Starts test database
- Runs migrations
- Starts Next.js server in test mode
- Runs all tests
- Cleans up

## 📋 Prerequisites

- Docker and Docker Compose installed
- Node.js and Yarn installed
- Financial Projections app dependencies installed

## 🎯 Step-by-Step Manual Workflow

### 1. Install dependencies
```bash
cd /home/pete/Documents/Projects/FinancialProjections/tests/api-testing
yarn install
```

### 2. Start test database (Docker)
```bash
yarn db:setup
```

You should see:
```
✅ Test database is ready!
Database connection details:
  Host: localhost
  Port: 5435
  ...
```

### 3. Run database migrations
```bash
yarn db:migrate
```

### 4. Start Next.js server in test mode

Open a **new terminal**:

```bash
cd /home/pete/Documents/Projects/FinancialProjections/financial-projections
NODE_ENV=test \
DATABASE_URL=postgresql://test_user:test_password@localhost:5435/financial_projections_test \
yarn dev
```

Wait for: `✓ Ready in Xms`

### 5. Run tests

Back in the first terminal:

```bash
cd /home/pete/Documents/Projects/FinancialProjections/tests/api-testing
yarn test
```

### 6. Cleanup (when done)

```bash
yarn db:teardown
```

And stop the Next.js server (Ctrl+C in the other terminal).

## 🔄 Quick Reset

If tests fail or database gets into a bad state:

```bash
yarn db:reset  # Destroys and recreates database with fresh schema
```

## 🐛 Troubleshooting

**Database won't start:**
```bash
# Check if Docker is running
docker ps

# Check for port conflicts
lsof -i :5435
```

**Tests connect to wrong database:**
Make sure Next.js is using the test database URL (port 5435, not 5432).

**Schema mismatch:**
```bash
yarn db:reset
```

## ✅ Expected Output

```
PASS  src/tests/recurring-event-rules.test.ts
  POST /api/recurring-event-rules
    Validation - Missing Required Fields
      ✓ should reject request when name is missing (424 ms)
      ✓ should reject request when value is missing (29 ms)
      ... (13 more validation tests)
    Successful Creation
      ✓ should successfully create a monthly expense recurring rule (2695 ms)
      ✓ should successfully create a weekly incoming payment rule (837 ms)
      ✓ should successfully create an annual recurring rule (5123 ms)
  GET /api/recurring-event-rules
    ✓ should return a list of recurring event rules (1616 ms)

Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
Time:        18.388 s
```

## 🔐 Safety Note

**Your production database is safe!**

- Tests use a completely isolated Docker database (port 5435)
- Data is stored in tmpfs (memory), not persisted to disk
- Database is destroyed when you run `yarn db:teardown`
- Production DB (port 5432) is never touched
