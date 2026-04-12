# Debugging Runbook

## Local Development Debugging

### Common Issues & Solutions

#### 1. Build Failures

**Issue**: TypeScript compilation errors
```bash
# Check types
pnpm typecheck

# Fix auto-fixable issues
pnpm fix
```

**Issue**: Turbopack bundling errors
```bash
# Clear cache and rebuild
rm -rf .next
rm -rf node_modules/.cache
pnpm dev
```

**Issue**: Module resolution errors
```bash
# Ensure all packages are built
pnpm build

# If using workspace packages
pnpm --filter @repo/testing build
```

#### 2. Runtime Errors

**Issue**: "Cannot find module"
```bash
# Reinstall dependencies
pnpm install

# If workspace package, rebuild it
pnpm --filter @repo/package-name build
```

**Issue**: Database connection failures
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# If not running, start it
brew services start postgresql  # macOS
sudo service postgresql start   # Linux

# Verify DATABASE_URL format
# Should be: postgresql://user:password@host:port/database
```

**Issue**: Environment variables not loading
```bash
# Check .env files exist
ls -la apps/web/.env
ls -la apps/app/.env
ls -la apps/api/.env

# Ensure .env files are not committed
git check-ignore apps/web/.env  # Should output the path
```

#### 3. Test Failures

**Issue**: Tests timeout or hang
```bash
# Run with longer timeout
pnpm test -- --testTimeout=30000

# Run specific test file
pnpm test packages/auth/__tests__/exports.test.ts

# Check for port conflicts
lsof -ti:3000,3001,3002
```

**Issue**: E2E tests failing
```bash
# Ensure dev servers are not already running
lsof -ti:3000,3001,3002 | xargs kill -9

# Install Playwright browsers
pnpm playwright:install

# Run E2E tests with UI for debugging
pnpm test:e2e:ui
```

#### 4. Lint/Format Issues

**Issue**: Pre-commit hook failing
```bash
# Fix all auto-fixable issues
pnpm fix

# If still failing, commit with --no-verify (use sparingly)
git commit -m "your message" --no-verify
```

**Issue**: Biome formatting not working
```bash
# Reinstall Biome
pnpm install @biomejs/biome@latest

# Run format
pnpm format
```

### Log Analysis

#### Application Logs

```bash
# Development logs
pnpm dev 2>&1 | tee dev.log

# Filter for errors
pnpm dev 2>&1 | grep -i error
```

#### Structured Logging

The app uses structured logging. Key fields to look for:
- `level`: error, warn, info
- `service`: app name (web, app, api)
- `trace_id`: For tracking requests
- `error`: Error details

#### PostHog Error Tracking

Check errors in PostHog dashboard:
1. Go to PostHog → Errors
2. Filter by: `service:web` or `service:api`
3. Look for patterns in error messages

### Debugging Strategies

#### 1. Isolate the Problem

```bash
# Test individual packages
pnpm --filter @repo/auth test
pnpm --filter @repo/database test

# Build individual apps
pnpm --filter web build
pnpm --filter api build
```

#### 2. Check Recent Changes

```bash
# See what changed recently
git log --oneline -10

# Check if issue exists on main
git stash
git checkout main
pnpm test
git checkout -
git stash pop
```

#### 3. Verify Environment

```bash
# Check Node version
node --version  # Should be 22+

# Check pnpm version
pnpm --version  # Should be 10+

# Check installed packages
pnpm list
```

### Vercel-Specific Debugging

#### Local Production Build

```bash
# Build as if deploying to Vercel
cd apps/web
pnpm build

# Test production build locally
pnpm start
```

#### Vercel Deployment Issues

**Check Vercel Dashboard:**
1. Go to Vercel Dashboard → Your Project
2. Check "Deployments" tab for failed builds
3. View build logs for specific errors

**Common Vercel Issues:**

- **Build command failing**: Check `vercel.json` and build settings
- **Environment variables missing**: Add in Vercel Dashboard → Settings → Environment Variables
- **Function timeout**: Default is 10s, increase in `vercel.json`
- **Memory limit**: Default is 1024MB, increase if needed

```json
// vercel.json example for API
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

#### Edge Function Debugging

For edge runtime issues:
```bash
# Edge functions have different constraints
# - No Node.js built-ins (fs, crypto, etc.)
# - Must use Web APIs
# - Check compatibility at webcompat.com
```

### Database Debugging

#### Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check connection pool
# Look for "too many connections" errors

# View active connections
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"
```

#### Query Performance

```bash
# Enable query logging in dev
# Add to .env: DEBUG="prisma:query"

# Check slow queries
# Look in logs for queries > 1s
```

### Getting Help

1. **Check documentation**: README.md, AGENTS.md, and these runbooks
2. **Search GitHub issues**: Look for similar problems
3. **Run diagnostics**: `pnpm system-checks`
4. **Check CI logs**: See if issue reproduces in CI
5. **Ask team**: Post in team Slack/Discord with:
   - Error message
   - Steps to reproduce
   - What you've tried
   - Environment details

### Emergency Procedures

#### Rollback Deployment

If production issue:
```bash
# In Vercel Dashboard
# 1. Go to Deployments
# 2. Find last working deployment
# 3. Click "Promote to Production"
```

#### Disable Feature

If feature flag causing issues:
```bash
# Toggle feature in PostHog or Vercel Toolbar
# Or set in environment: FEATURE_FLAG_NAME=false
```
