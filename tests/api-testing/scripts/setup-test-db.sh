#!/bin/bash

# Script to set up test database in Docker

set -e

# Read config
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/../config.json"
DB_HOST=$(node -e "console.log(require('$CONFIG_FILE').database.host)")
DB_PORT=$(node -e "console.log(require('$CONFIG_FILE').database.port)")
DB_NAME=$(node -e "console.log(require('$CONFIG_FILE').database.name)")
DB_USER=$(node -e "console.log(require('$CONFIG_FILE').database.user)")
DB_PASS=$(node -e "console.log(require('$CONFIG_FILE').database.password)")
COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.test.yml"

echo "🐳 Starting test database container..."
docker compose -f "$COMPOSE_FILE" up -d

echo "⏳ Waiting for database to be ready..."
until docker exec financial-projections-test-db pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; do
  sleep 1
done

echo "✅ Test database is ready!"
echo ""
echo "Database connection details:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""
echo "Connection string:"
echo "  postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
