#!/bin/bash

# Script to seed test database with initial data

set -e

echo "🌱 Seeding test database with initial data..."

# Export test database URL
export DATABASE_URL="postgresql://test_user:test_password@localhost:5435/financial_projections_test"

# Navigate to the main app directory
cd ../../financial-projections

# You can add seed logic here, for example:
# npx tsx prisma/seed.ts

echo "✅ Test data seeded!"
echo ""
echo "Note: Add your seed script to financial-projections/prisma/seed.ts"
echo "      or create custom seeding logic here."
