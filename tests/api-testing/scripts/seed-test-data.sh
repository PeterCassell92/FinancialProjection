#!/bin/bash

# Script to seed test database with initial data

set -e

echo "🌱 Seeding test database with initial data..."

# Read config
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/../config.json"
DB_HOST=$(node -e "console.log(require('$CONFIG_FILE').database.host)")
DB_PORT=$(node -e "console.log(require('$CONFIG_FILE').database.port)")
DB_NAME=$(node -e "console.log(require('$CONFIG_FILE').database.name)")
DB_USER=$(node -e "console.log(require('$CONFIG_FILE').database.user)")
DB_PASS=$(node -e "console.log(require('$CONFIG_FILE').database.password)")

export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Navigate to the main app directory
cd "$SCRIPT_DIR/../../../financial-projections"

# Run the test seed script
npx tsx prisma/seed-test.ts

echo "✅ Test data seeded!"
