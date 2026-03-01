#!/bin/bash

# Script to tear down test database container

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.test.yml"

echo "🛑 Stopping test database container..."
docker compose -f "$COMPOSE_FILE" down -v

echo "✅ Test database cleaned up!"
