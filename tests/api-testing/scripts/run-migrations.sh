#!/bin/bash

# Script to run Prisma migrations on test database

set -e

echo "🔄 Running Prisma migrations on test database..."

# Read config
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/../config.json"
DB_HOST=$(node -e "console.log(require('$CONFIG_FILE').database.host)")
DB_PORT=$(node -e "console.log(require('$CONFIG_FILE').database.port)")
DB_NAME=$(node -e "console.log(require('$CONFIG_FILE').database.name)")
DB_USER=$(node -e "console.log(require('$CONFIG_FILE').database.user)")
DB_PASS=$(node -e "console.log(require('$CONFIG_FILE').database.password)")

export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Navigate to the main app directory and run migrations
cd "$SCRIPT_DIR/../../../financial-projections"

# Push the schema to the test database
npx prisma db push

echo "✅ Migrations completed!"
