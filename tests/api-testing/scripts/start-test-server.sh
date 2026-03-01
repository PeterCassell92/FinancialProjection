#!/bin/bash

# Spin up test database + Next.js server for manual test iteration.
# Leave this running, then run jest tests separately.
# Press Ctrl+C to stop everything.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEST_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_DIR="$(cd "$TEST_DIR/../../financial-projections" && pwd)"
CONFIG_FILE="$TEST_DIR/config.json"

# Read config
APP_PORT=$(node -e "console.log(require('$CONFIG_FILE').appPort)")
DB_HOST=$(node -e "console.log(require('$CONFIG_FILE').database.host)")
DB_PORT=$(node -e "console.log(require('$CONFIG_FILE').database.port)")
DB_NAME=$(node -e "console.log(require('$CONFIG_FILE').database.name)")
DB_USER=$(node -e "console.log(require('$CONFIG_FILE').database.user)")
DB_PASS=$(node -e "console.log(require('$CONFIG_FILE').database.password)")
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

cleanup() {
    echo ""
    echo "🧹 Shutting down..."
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
    fi
    # Clean up test build cache
    rm -rf "$APP_DIR/.next-test"
    cd "$TEST_DIR"
    ./scripts/teardown-test-db.sh
    echo "✅ Done."
}
trap cleanup EXIT INT TERM

# Step 1: Database
echo "🐳 Starting test database..."
cd "$TEST_DIR"
./scripts/setup-test-db.sh

# Step 2: Migrations
echo ""
echo "🔄 Running migrations..."
./scripts/run-migrations.sh

# Step 3: Seed
echo ""
echo "🌱 Seeding test data..."
./scripts/seed-test-data.sh

# Step 4: Next.js server
echo ""
echo "🚀 Starting Next.js on port $APP_PORT..."
cd "$APP_DIR"
export NODE_ENV=test
export DATABASE_URL
export PORT=$APP_PORT
export NEXT_DIST_DIR=.next-test

yarnpkg dev --port $APP_PORT > /tmp/nextjs-test-server.log 2>&1 &
SERVER_PID=$!

timeout=60
elapsed=0
while ! grep -q "Ready" /tmp/nextjs-test-server.log 2>/dev/null; do
    if [ $elapsed -ge $timeout ]; then
        echo "❌ Server failed to start within ${timeout}s"
        cat /tmp/nextjs-test-server.log
        exit 1
    fi
    sleep 1
    elapsed=$((elapsed + 1))
done

echo ""
echo "============================================"
echo "  ✅ Test environment ready!"
echo ""
echo "  App:  http://localhost:$APP_PORT"
echo "  DB:   $DATABASE_URL"
echo ""
echo "  Run tests with:"
echo "    cd $TEST_DIR && yarnpkg test"
echo ""
echo "  Press Ctrl+C to stop."
echo "============================================"

# Wait until Ctrl+C
wait $SERVER_PID
