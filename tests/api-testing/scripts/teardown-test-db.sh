#!/bin/bash

# Script to tear down test database container

set -e

echo "🛑 Stopping test database container..."
docker-compose -f docker-compose.test.yml down -v

echo "✅ Test database cleaned up!"
