#!/bin/bash

# Complete test workflow: setup → migrate → start server → test → cleanup

set -e

echo "🚀 Starting complete test workflow..."
echo ""

# Store the starting directory
TEST_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$(cd "$TEST_DIR/../../financial-projections" && pwd)"

# Cleanup function
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."

    # Kill the Next.js server if it's running
    if [ ! -z "$SERVER_PID" ]; then
        echo "Stopping Next.js test server (PID: $SERVER_PID)..."
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
    fi

    # Teardown database
    cd "$TEST_DIR"
    ./scripts/teardown-test-db.sh

    echo "✅ Cleanup complete!"
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Step 1: Setup test database
cd "$TEST_DIR"
echo "Step 1/5: Setting up test database..."
./scripts/setup-test-db.sh
echo ""

# Step 2: Run migrations
echo "Step 2/5: Running database migrations..."
./scripts/run-migrations.sh
echo ""

# Step 3: Seed test data (optional)
echo "Step 3/5: Seeding test data..."
./scripts/seed-test-data.sh
echo ""

# Step 4: Start Next.js server in test mode
echo "Step 4/5: Starting Next.js server in test mode..."
cd "$APP_DIR"

# Use the test environment
export NODE_ENV=test
export DATABASE_URL="postgresql://test_user:test_password@localhost:5435/financial_projections_test"

# Start the server in the background
yarn dev > /tmp/nextjs-test-server.log 2>&1 &
SERVER_PID=$!

echo "Waiting for Next.js server to be ready (PID: $SERVER_PID)..."
# Wait for server to be ready (check for "Ready" in logs)
timeout=60
elapsed=0
while ! grep -q "Ready" /tmp/nextjs-test-server.log 2>/dev/null; do
    if [ $elapsed -ge $timeout ]; then
        echo "❌ Server failed to start within ${timeout}s"
        echo "Server logs:"
        cat /tmp/nextjs-test-server.log
        exit 1
    fi
    sleep 1
    elapsed=$((elapsed + 1))
done

echo "✅ Next.js server is ready!"
echo ""

# Step 5: Run tests
echo "Step 5/5: Running tests..."
cd "$TEST_DIR"
yarn test

echo ""
echo "🎉 All tests completed successfully!"
