#!/bin/bash

# Script to set up complete test environment (database + Next.js app in Docker)

set -e

echo "🐳 Starting complete test environment (database + application)..."
docker-compose -f docker-compose.test.yml up -d --build

echo "⏳ Waiting for database to be ready..."
until docker exec financial-projections-test-db pg_isready -U test_user -d financial_projections_test > /dev/null 2>&1; do
  sleep 1
done

echo "✅ Test database is ready!"

echo "⏳ Running database migrations..."
docker exec financial-projections-test-app npx prisma db push --skip-generate

echo "⏳ Waiting for Next.js application to be ready..."
timeout=60
elapsed=0
until docker logs financial-projections-test-app 2>&1 | grep -q "Ready" > /dev/null 2>&1; do
  if [ $elapsed -ge $timeout ]; then
    echo "❌ Application failed to start within ${timeout}s"
    echo "Container logs:"
    docker logs financial-projections-test-app
    exit 1
  fi
  sleep 2
  elapsed=$((elapsed + 2))
done

echo "✅ Test application is ready!"
echo ""
echo "🎉 Environment is ready!"
echo "  Application URL: http://localhost:3001"
echo "  Database Port: 5435"
echo ""
echo "Run tests with:"
echo "  yarn test"
