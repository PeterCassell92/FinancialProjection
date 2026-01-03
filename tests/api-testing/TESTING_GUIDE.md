# Complete Testing Guide

## 🎯 Three Ways to Run Tests

### 1. Fully Containerized (Recommended for CI/CD)

**Everything runs in Docker - database AND application**

```bash
yarn test:containerized
```

**Pros:**
- ✅ Complete isolation from host
- ✅ Perfect for CI/CD
- ✅ Reproducible across machines
- ✅ No local Node.js changes needed
- ✅ Database is 100% isolated

**Cons:**
- ⏱️ Slower (builds Docker image each time)
- 🐛 Harder to debug with breakpoints

### 2. Hybrid (Best for Development)

**Database in Docker, Next.js running locally**

```bash
# Terminal 1: Start database
yarn db:setup
yarn db:migrate

# Terminal 2: Start Next.js with test DB
cd ../../financial-projections
DATABASE_URL=postgresql://test_user:test_password@localhost:5435/financial_projections_test yarn dev

# Terminal 1: Run tests
yarn test
```

**Pros:**
- ✅ Fast iteration
- ✅ Easy debugging
- ✅ Hot reload works
- ✅ Database still isolated

**Cons:**
- 🔧 Manual setup required
- 📝 Must remember to use test DATABASE_URL

### 3. Automated Hybrid (Convenience)

**Automated script manages everything**

```bash
./scripts/run-all-tests.sh
```

**Pros:**
- ✅ One command
- ✅ Auto cleanup
- ✅ Faster than fully containerized

**Cons:**
- ⏱️ Still starts/stops server each time

## 📊 Comparison Matrix

| Feature                  | Containerized | Hybrid (Manual) | Hybrid (Script) |
|-------------------------|---------------|-----------------|-----------------|
| Setup Complexity        | Low (1 cmd)   | Medium          | Low (1 cmd)     |
| Speed                   | Slower        | Fastest         | Medium          |
| Debugging               | Hard          | Easy            | Medium          |
| CI/CD Ready             | ✅ Yes        | ❌ No           | ⚠️ Maybe        |
| Complete Isolation      | ✅ Yes        | ⚠️ Partial      | ⚠️ Partial      |
| Hot Reload              | ✅ Yes*       | ✅ Yes          | ❌ No           |
| Zero Config             | ✅ Yes        | ❌ No           | ✅ Yes          |

*Hot reload works in containerized mode due to volume mounts

## 🚦 Quick Decision Guide

**Choose Containerized if:**
- Running in CI/CD
- Want zero configuration
- Don't need to debug
- Testing production-like environment

**Choose Hybrid (Manual) if:**
- Actively developing
- Need to debug with breakpoints
- Running tests repeatedly
- Want fastest feedback loop

**Choose Hybrid (Script) if:**
- Want convenience
- One-time test runs
- Don't want to manage terminals

## 🔧 Advanced: Environment Variables

### For Containerized Tests
Edit `.env.test`:
```bash
API_BASE_URL=http://localhost:3001  # Containerized app port
```

### For Hybrid Tests (Local Next.js)
Edit `.env.test`:
```bash
API_BASE_URL=http://localhost:3000  # Local dev server port
```

## 🐛 Debugging Tips

### View Application Logs (Containerized)
```bash
docker logs -f financial-projections-test-app
```

### View Database Logs (Containerized)
```bash
docker logs -f financial-projections-test-db
```

### Connect to Test Database
```bash
psql postgresql://test_user:test_password@localhost:5435/financial_projections_test
```

### Execute SQL in Container
```bash
docker exec -it financial-projections-test-db psql -U test_user -d financial_projections_test
```

### Inspect Network
```bash
docker network inspect tests_test-network
```

## 🧹 Cleanup Commands

```bash
# Remove all test containers and volumes
docker-compose -f docker-compose.test.yml down -v

# Remove test database only
docker rm -f financial-projections-test-db

# Remove test app only
docker rm -f financial-projections-test-app

# Remove Docker volumes
docker volume prune
```

## 📦 What Gets Created

### Containerized Mode
- Docker container: `financial-projections-test-db`
- Docker container: `financial-projections-test-app`
- Docker network: `tests_test-network`
- Docker volume: tmpfs (ephemeral)

### Hybrid Mode
- Docker container: `financial-projections-test-db`
- Local Next.js process on port 3000

## ⚡ Performance Tips

1. **Use tmpfs**: Already configured - database runs in memory
2. **Parallel tests**: Jest runs tests in parallel by default
3. **Skip build**: In hybrid mode, no Docker build needed
4. **Keep containers running**: For multiple test runs, use `env:setup` once

## 🔐 Security Notes

- Test database uses simple credentials (test_user/test_password)
- No sensitive data should be in test database
- Test containers are isolated from production
- Test database is destroyed on teardown
