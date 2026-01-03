#!/bin/bash

# Complete containerized test workflow
# This spins up database + Next.js app in Docker, runs tests, then tears down

set -e

echo "🚀 Starting containerized test workflow..."
echo ""

# Store the test directory
TEST_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$TEST_DIR"

# Cleanup function
cleanup() {
    echo ""
    echo "🧹 Cleaning up containers..."
    docker-compose -f docker-compose.test.yml down -v
    echo "✅ Cleanup complete!"
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Start complete environment
./scripts/setup-test-env.sh

echo ""
echo "🧪 Running tests..."
echo ""

# Run tests
yarn test

echo ""
echo "🎉 All tests completed successfully!"
