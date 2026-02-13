#!/bin/bash

# Fullstack App Starter Kit Setup Script
# This script helps you set up the development environment

set -e

echo "🚀 Setting up Fullstack App Starter Kit..."

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

# Copy environment file of every apps
for app in apps/*; do
    if [ -d "$app" ]; then
        echo "📝 Creating .env file from env.example..."
        cp "$app/.env.example" "$app/.env"
        echo "📝 Creating .env.test file from env.example..."
        cp "$app/.env.example" "$app/.env.test"
        if [ "$app" = "apps/api" ]; then
            sed 's|DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:postgres@localhost:5433/test?schema=public"|' "$app/.env.test" > "$app/.env.test.tmp" && mv "$app/.env.test.tmp" "$app/.env.test"
        fi
        sed 's|NODE_ENV=.*|NODE_ENV=test|' "$app/.env.test" > "$app/.env.test.tmp" && mv "$app/.env.test.tmp" "$app/.env.test"
        echo "⚠️  Please update .env with your configuration"
    fi
done

# Setup test database
echo "🔧 Setting up test database..."
pnpm --filter @repo/db test:db:push

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
echo "  4. Run 'pnpm dev' to start development servers"
echo ""
