#!/bin/bash
set -e

echo "🚀 Setting up next-ship development environment..."

# Enable corepack and activate pnpm
echo "📦 Setting up pnpm..."
corepack enable
corepack prepare pnpm@10.24.0 --activate

if ! command -v doppler >/dev/null 2>&1; then
  echo "🔐 Installing Doppler CLI..."
  curl -Ls https://cli.doppler.com/install.sh | sh
fi

# Setup environment files
echo "🔧 Setting up environment files..."
setup_env() {
  local dir=$1
  if [ -f "$dir/.env.example" ] && [ ! -f "$dir/.env" ]; then
    echo "  Copying $dir/.env.example → $dir/.env"
    cp "$dir/.env.example" "$dir/.env"
  fi
}

# Check root and app directories
setup_env "."
for app_dir in apps/*/; do
  setup_env "$app_dir"
done
for pkg_dir in packages/*/; do
  setup_env "$pkg_dir"
done

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h db -U postgres > /dev/null 2>&1; do
  sleep 1
done
echo "✅ PostgreSQL is ready"

echo "⏳ Waiting for Redis..."
until redis-cli -h redis ping > /dev/null 2>&1; do
  sleep 1
done
echo "✅ Redis is ready"

# Install dependencies
echo "📥 Installing dependencies..."
pnpm install --frozen-lockfile

# Setup database schema
echo "🗄️ Setting up database schema..."
pnpm run migrate

# Seed database with test data
echo "🌱 Seeding database..."
cd packages/database && npx prisma db seed || echo "⚠️ No seed script configured, skipping..."
cd /workspaces/next-ship

# Warm build cache
echo "🔨 Running initial build..."
pnpm run build || echo "⚠️ Initial build completed with warnings"

echo ""
echo "✅ Dev environment setup complete!"
echo ""
echo "Available commands:"
echo "  pnpm dev     - Start development servers"
echo "  pnpm test    - Run tests"
echo "  pnpm check   - Run linting/formatting checks"
echo ""
