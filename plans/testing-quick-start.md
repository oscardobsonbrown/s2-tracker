# Testing Infrastructure Setup - Quick Start Guide

## Current State

We have **minimal testing** in place:
- ✅ Vitest configured in `apps/app` and `apps/api`
- ✅ Testing Library React for component tests
- ⚠️ Only **3 test files** exist
- ❌ No database testing utilities
- ❌ No payment integration tests
- ❌ No E2E tests
- ❌ Most packages have zero tests

## Immediate Action Items

### Priority 1: Database Testing (Critical for Prisma → Drizzle)

**Install dependencies:**
```bash
pnpm add -D testcontainers @testcontainers/postgresql vitest @vitest/coverage-v8 -w packages/database
```

**Create test utilities:**
```typescript
// packages/database/src/test-utils.ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export async function createTestDatabase() {
  const container = await new PostgreSqlContainer().start();
  const connectionString = container.getConnectionUri();
  
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  // Apply migrations
  // Seed test data
  
  return {
    db,
    container,
    cleanup: async () => {
      await client.end();
      await container.stop();
    }
  };
}
```

**Create first test:**
```typescript
// packages/database/__tests__/schema.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDatabase } from '../src/test-utils';

describe('Database Schema', () => {
  let testDb: Awaited<ReturnType<typeof createTestDatabase>>;
  
  beforeAll(async () => {
    testDb = await createTestDatabase();
  });
  
  afterAll(async () => {
    await testDb.cleanup();
  });
  
  it('should have Page table with correct columns', async () => {
    // Test table structure matches schema
  });
  
  it('should support CRUD operations', async () => {
    // Test create, read, update, delete
  });
});
```

### Priority 2: Payment Testing (Critical for Polar integration)

**Create webhook test fixtures:**
```typescript
// packages/payments/__tests__/fixtures/payment-events.ts
export const checkoutCompleted = {
  id: 'evt_test_checkout_completed',
  type: 'checkout.completed',
  data: {
    object: {
      id: 'checkout_test_...',
      customer: 'customer_test_...',
      payment_status: 'paid',
      // ...
    }
  }
};

export const polarCheckoutCompleted = {
  // Additional Polar event fixture
};
```

**Create webhook handler test:**
```typescript
// packages/payments/__tests__/webhooks.test.ts
import { describe, it, expect, vi } from 'vitest';
import { checkoutCompleted, polarCheckoutCompleted } from './fixtures/payment-events';

describe('Payment Webhooks', () => {
  it('should handle checkout completed', async () => {
    // Test Polar payment implementation
  });
  
  it('should handle checkout.completed with same outcome', async () => {
    // Test payment processing produces the expected database updates
  });
});
```

### Priority 3: Component Testing (Critical for Radix → Base UI)

**Install additional testing libraries:**
```bash
pnpm add -D @testing-library/jest-dom @testing-library/user-event jest-axe -w packages/design-system
```

**Create component test template:**
```typescript
// packages/design-system/components/ui/__tests__/button.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from '../button';
import { axe } from 'jest-axe';

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
  
  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
  
  it('meets accessibility standards', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('has no console errors', () => {
    const consoleSpy = vi.spyOn(console, 'error');
    render(<Button>Click me</Button>);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
```

### Priority 4: E2E Testing with Playwright

**Install Playwright:**
```bash
pnpm create playwright
# Or:
npx playwright install
```

**Create critical flow test:**
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can sign up and sign in', async ({ page }) => {
    // Navigate to sign up
    await page.goto('/sign-up');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Verify user is logged in
    await expect(page.locator('text=Welcome')).toBeVisible();
  });
});

test.describe('Payments', () => {
  test('user can complete checkout', async ({ page }) => {
    await page.goto('/pricing');
    await page.click('text=Buy Now');
    
    // Complete payment checkout
    // Verify success
    await expect(page.locator('text=Payment successful')).toBeVisible();
    
    // Verify database updated
    // Query database to confirm subscription created
  });
});
```

## Package Configuration

### Add test scripts to root package.json

```json
{
  "scripts": {
    "test": "turbo test",
    "test:watch": "turbo test:watch",
    "test:coverage": "turbo test:coverage",
    "test:e2e": "playwright test"
  }
}
```

### Update turbo.json

```json
{
  "tasks": {
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "cache": false
    }
  }
}
```

## Testing Checklist for Migration

### Before Migration Starts
- [ ] Database tests written for current Prisma implementation
- [ ] Payment webhook tests written for Polar payment implementation
- [ ] Component tests written for 5 most-used Radix components
- [ ] E2E test covering sign-up → dashboard flow
- [ ] All tests passing in CI

### During Each Migration Phase
- [ ] Run full test suite after changes
- [ ] Compare old vs new implementation outputs
- [ ] Monitor test coverage (should not decrease)
- [ ] Zero tolerance for test failures

### After Migration Completes
- [ ] Remove old implementation tests
- [ ] Add tests for new implementation edge cases
- [ ] Update E2E tests if URLs/flows changed
- [ ] Document any behavioral changes

## CI/CD Test Gates

Add to GitHub Actions:

```yaml
name: Migration Safety Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:coverage
      
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: npx playwright install --with-deps
      - run: pnpm build
      - run: pnpm test:e2e
```

## Summary

**Time investment:**
- Database testing setup: 2-3 hours
- Payment testing setup: 2-3 hours  
- Component testing setup: 2-3 hours
- E2E testing setup: 3-4 hours
- **Total: ~10-13 hours** for comprehensive migration safety

**This will prevent:**
- Silent database schema mismatches
- Payment webhook failures in production
- UI component regressions
- Broken user flows

**Recommendation:** Start with database testing since Drizzle migration is foundational and affects everything else.
