#!/bin/bash

# Script to set up test database in Docker

set -e

echo "🐳 Starting test database container..."
docker-compose -f docker-compose.test.yml up -d

echo "⏳ Waiting for database to be ready..."
until docker exec financial-projections-test-db pg_isready -U test_user -d financial_projections_test > /dev/null 2>&1; do
  sleep 1
done

echo "✅ Test database is ready!"
echo ""
echo "Database connection details:"
echo "  Host: localhost"
echo "  Port: 5435"
echo "  Database: financial_projections_test"
echo "  User: test_user"
echo "  Password: test_password"
echo ""
echo "Connection string:"
echo "  postgresql://test_user:test_password@localhost:5435/financial_projections_test"
