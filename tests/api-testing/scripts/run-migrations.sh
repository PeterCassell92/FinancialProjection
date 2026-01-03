#!/bin/bash

# Script to run Prisma migrations on test database

set -e

echo "🔄 Running Prisma migrations on test database..."

# Export test database URL
export DATABASE_URL="postgresql://test_user:test_password@localhost:5435/financial_projections_test"

# Navigate to the main app directory and run migrations
cd ../../financial-projections

# Push the schema to the test database
npx prisma db push --skip-generate

echo "✅ Migrations completed!"
