# Quick Start Runbook

## Project Setup

### Prerequisites

- Node.js 22+ installed
- pnpm package manager
- Git configured

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/next-ship/next-ship.git
cd next-ship

# Install dependencies
pnpm install

# Copy environment variables
cp apps/web/.env.example apps/web/.env
cp apps/app/.env.example apps/app/.env
cp apps/api/.env.example apps/api/.env

# Fill in required environment variables (see .env.example files)
# Required: DATABASE_URL, POSTHOG_API_KEY, CLERK_SECRET_KEY

# Apply committed database migrations
pnpm --filter @repo/database db:migrate

# Start development
pnpm dev
```

### Environment Variables

**Required for all apps:**
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nextship"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Analytics (PostHog)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**App-specific:**
- `apps/web/.env` - Marketing site
- `apps/app/.env` - Main application
- `apps/api/.env` - API server

### Verify Setup

```bash
# Check all services are running
curl http://localhost:3001  # Web
curl http://localhost:3000    # App
curl http://localhost:3002/api/health  # API

# Run tests
pnpm test

# Run linting
pnpm lint
```

### Common Setup Issues

**Issue**: `DATABASE_URL` not found
**Solution**: Ensure PostgreSQL is running and DATABASE_URL is set

**Issue**: Database schema is out of date
**Solution**: Generate and apply migrations intentionally:
```bash
pnpm --filter @repo/database db:generate --name describe_change
pnpm --filter @repo/database db:check
pnpm --filter @repo/database db:migrate
```

**Issue**: Clerk authentication not working
**Solution**: Verify Clerk keys are correct and match the environment

**Issue**: PostHog errors in console
**Solution**: Non-critical if keys are missing, but recommended for error tracking

## Next Steps

- See [Development Guide](../development.md) for detailed workflows
- See [Debugging Runbook](./debugging.md) for troubleshooting
- See [Architecture Guide](../architecture.md) for system overview
