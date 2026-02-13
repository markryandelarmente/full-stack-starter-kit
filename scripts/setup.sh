#!/bin/bash

# Fullstack App Template Setup Script
# This script helps you set up the development environment

set -e

echo "🚀 Setting up Fullstack App Template..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20+ is required. Current version: $(node -v)"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from env.example..."
    cp env.example .env
    echo "⚠️  Please update .env with your configuration"
fi

# Create test.env file if it doesn't exist
if [ ! -f test.env ]; then
    echo "📝 Creating test.env file for testing..."
    cat > test.env << 'EOF'
# Test Environment
NODE_ENV=test

# Test Database (uses port 5433 - separate from dev database)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/fullstack_app_test"

# Auth (mock values for testing)
BETTER_AUTH_SECRET="test-secret-key-min-32-chars-long!!"
BETTER_AUTH_URL="http://localhost:3000"

# Logging
LOG_LEVEL="debug"

# API
PORT=3001

# S3 Storage
S3_ENDPOINT="localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET_NAME="uploads"
S3_USE_SSL="false"
MAX_FILE_SIZE="10485760"
EOF
    echo "✅ test.env created with test configuration"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm db:generate

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Update .env with your database URL and secrets"
echo "  2. Run 'docker compose up -d' to start databases"
echo "  3. Run 'pnpm db:push' to create database tables"
echo "  4. Run 'pnpm --filter @repo/api test:db:push' to setup test database"
echo "  5. Run 'pnpm dev' to start development servers"
echo ""
