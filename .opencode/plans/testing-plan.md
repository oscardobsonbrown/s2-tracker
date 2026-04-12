# Testing Plan for next-ship

A lightweight testing strategy for this SaaS boilerplate. Focus on critical paths and shared packages.

---

## Philosophy

**Keep it simple.** This is a boilerplate, not a production app. Tests should:
- Cover critical SaaS functionality (auth, payments, data)
- Verify shared packages work correctly
- Catch regressions in core user flows
- Be fast and easy to maintain

**Test pyramid for this boilerplate:**
- 70% Unit tests (packages, utilities)
- 20% Integration tests (API routes, components)
- 10% E2E tests (critical flows only)

---

## Current State

**What works:**
- Vitest configured in `apps/app` and `apps/api`
- 3 basic smoke tests passing
- Testing Library set up

**What's missing:**
- Package-level tests (database, payments, auth)
- API route tests
- Component tests for design system
- E2E tests for critical flows

---

## Phase 1: Foundation (Week 1)

### 1.1 Package Unit Tests

Add basic tests to shared packages:

#### `@repo/database`
```
packages/database/__tests__/
├── schema.test.ts          # Verify tables/columns exist
├── queries.test.ts         # Test CRUD operations
└── relationships.test.ts   # Test joins/foreign keys
```

**Key tests:**
- Can connect to database
- Can create/read/update/delete users
- Can query with relationships (user → organization)
- Schema matches expected structure

#### `@repo/payments`
```
packages/payments/__tests__/
├── polar-client.test.ts    # Test Polar SDK initialization
├── webhooks.test.ts        # Test webhook verification
└── fixtures/
    └── polar-events.ts     # Mock webhook payloads
```

**Key tests:**
- Can initialize Polar client
- Can verify webhook signatures
- Can parse common webhook events

#### `@repo/auth`
```
packages/auth/__tests__/
├── permissions.test.ts     # Test role-based access
└── middleware.test.ts      # Test auth guards
```

**Key tests:**
- Admin can access admin routes
- Regular user cannot access admin routes
- Unauthenticated user redirected to sign-in

### 1.2 API Route Tests

Expand existing tests in `apps/api/__tests__/`:

```
apps/api/__tests__/
├── health.test.ts              # ✅ Exists
├── webhooks/
│   ├── payments.test.ts        # Test Polar webhook handling
│   └── auth.test.ts            # Test Clerk webhook handling
└── rate-limit.test.ts          # Test rate limiting
```

**Key tests:**
- Health endpoint returns 200
- Payment webhooks update database correctly
- Auth webhooks create/update users
- Rate limiting works for protected routes

### 1.3 Component Smoke Tests

Add to `packages/design-system/components/ui/__tests__/`:

**Test 5-10 most used components:**
- Button (variants, disabled state)
- Input (value changes, validation)
- Dialog (open/close, focus trap)
- Select (options, selection)
- Card (rendering, slots)

**Pattern per component:**
```tsx
// button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '../button';

test('renders with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeDefined();
});

test('disabled state', () => {
  render(<Button disabled>Disabled</Button>);
  expect(screen.getByRole('button')).toBeDisabled();
});
```

---

## Phase 2: Integration (Week 2)

### 2.1 App Integration Tests

Expand `apps/app/__tests__/`:

```
apps/app/__tests__/
├── sign-in.test.tsx            # ✅ Exists
├── sign-up.test.tsx            # ✅ Exists
├── dashboard.test.tsx          # Test dashboard data fetching
├── layout.test.tsx             # Test authenticated layout
└── search.test.tsx             # Test search functionality
```

**Dashboard test example:**
```tsx
// Test that dashboard fetches and displays data
test('dashboard displays user data', async () => {
  // Mock authenticated session
  // Render dashboard
  // Verify data displays
});
```

### 2.2 Web Integration Tests

Add to `apps/web/__tests__/`:

```
apps/web/__tests__/
├── home.test.tsx               # Test homepage renders
├── pricing.test.tsx            # Test pricing page
├── contact.test.tsx            # Test contact form
└── layout.test.tsx             # Test root layout
```

---

## Phase 3: E2E Testing (Week 2-3)

### 3.1 Playwright Setup

Add E2E testing with Playwright (lighter than Cypress):

```bash
pnpm add -D @playwright/test
npx playwright install
```

Create `e2e/` at root:

```
e2e/
├── auth.spec.ts           # Sign up → Sign in → Dashboard
├── payments.spec.ts       # Checkout flow (test mode)
├── onboarding.spec.ts     # First-time user experience
└── smoke.spec.ts          # Critical path smoke tests
```

### 3.2 Critical Flows to Test

**Auth Flow (5 min test):**
1. Navigate to sign-up
2. Create account (use test email)
3. Verify redirect to dashboard
4. Sign out
5. Sign back in
6. Verify session persists

**Payment Flow (5 min test):**
1. Navigate to pricing
2. Select a plan
3. Complete checkout (Polar test mode)
4. Verify success page
5. Check database for subscription record

**Onboarding Flow (3 min test):**
1. Create new organization
2. Complete onboarding steps
3. Verify org appears in sidebar

---

## Test Data & Utilities

### Test Fixtures

Create in `packages/database/src/fixtures/`:

```typescript
// users.ts
export const testUsers = {
  admin: {
    id: 'user_admin_123',
    email: 'admin@test.local',
    role: 'admin',
  },
  member: {
    id: 'user_member_456',
    email: 'member@test.local',
    role: 'member',
  },
};

// organizations.ts
export const testOrganizations = {
  acme: {
    id: 'org_acme_123',
    name: 'Acme Inc',
    slug: 'acme',
  },
};

// products.ts
export const testProducts = {
  starter: {
    id: 'prod_starter',
    name: 'Starter Plan',
    price: 1000, // cents
  },
  pro: {
    id: 'prod_pro',
    name: 'Pro Plan',
    price: 5000,
  },
};
```

### Test Utilities

Create `packages/database/src/test-utils.ts`:

```typescript
import { db } from './client';

export async function seedTestData() {
  // Insert test fixtures
  await db.insert(users).values(testUsers.admin);
  await db.insert(organizations).values(testOrganizations.acme);
}

export async function cleanupTestData() {
  // Clean up after tests
  await db.delete(users).where(eq(users.email, '%@test.local'));
}

export async function withTestDatabase(testFn: () => Promise<void>) {
  await seedTestData();
  try {
    await testFn();
  } finally {
    await cleanupTestData();
  }
}
```

---

## Implementation Priority

### Week 1: Must Have

1. **Database package tests** (4 hours)
   - Schema validation
   - CRUD operations
   - Relationship queries

2. **Payment webhook tests** (3 hours)
   - Webhook signature verification
   - Event parsing
   - Database updates

3. **Auth permission tests** (2 hours)
   - Role-based access control
   - Middleware behavior

4. **Add 5 component tests** (3 hours)
   - Button, Input, Dialog, Select, Card

**Total: ~12 hours**

### Week 2: Should Have

5. **API route integration tests** (4 hours)
   - Payment webhooks
   - Auth webhooks
   - Rate limiting

6. **App page integration tests** (3 hours)
   - Dashboard
   - Search
   - Layout

7. **Web page tests** (2 hours)
   - Homepage
   - Pricing

8. **Playwright E2E setup** (4 hours)
   - Install & configure
   - Auth flow test
   - Smoke test

**Total: ~13 hours**

### Week 3: Nice to Have

9. **Payment E2E flow** (3 hours)
   - Full checkout test

10. **Visual regression setup** (4 hours)
    - Storybook + Chromatic

11. **Coverage reporting** (2 hours)
    - Istanbul/V8 coverage
    - CI integration

**Total: ~9 hours**

---

## CI/CD Integration

### Turborepo Pipeline

Update `turbo.json`:

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
    },
    "build": {
      "dependsOn": ["^build", "test"]
    }
  }
}
```

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - run: pnpm install
      - run: pnpm test
      
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - run: pnpm install
      - run: pnpm test:e2e
```

---

## Testing Commands

Add to root `package.json`:

```json
{
  "scripts": {
    "test": "turbo test",
    "test:watch": "turbo test:watch",
    "test:coverage": "turbo test:coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## Success Criteria

**By end of Week 1:**
- [ ] All packages have basic unit tests
- [ ] Payment webhooks tested
- [ ] Auth permissions tested
- [ ] 5+ components have tests
- [ ] CI runs tests on every PR

**By end of Week 2:**
- [ ] API routes have integration tests
- [ ] App pages tested
- [ ] E2E tests running in CI
- [ ] 70%+ code coverage on packages

**By end of Week 3:**
- [ ] Full payment E2E flow working
- [ ] Visual regression baseline set
- [ ] All tests passing consistently
- [ ] Documentation updated

---

## Quick Start Checklist

**Today (2 hours):**
- [ ] Add `vitest.config.ts` to each package
- [ ] Write one database test
- [ ] Write one payment test
- [ ] Write one auth test
- [ ] Run `pnpm test` to verify setup

**This week:**
- [ ] Complete Phase 1 tests
- [ ] Set up CI pipeline
- [ ] Document testing patterns

**Next week:**
- [ ] Complete Phase 2 tests
- [ ] Set up Playwright
- [ ] Write first E2E test

---

## Testing Patterns

### Mock External Services

```typescript
// Mock Polar SDK
vi.mock('@polar-sh/sdk', () => ({
  Polar: vi.fn(() => ({
    products: {
      list: vi.fn().mockResolvedValue({ items: [] }),
    },
  })),
}));
```

### Test Database Pattern

```typescript
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { withTestDatabase } from '@repo/database/test-utils';

describe('User Queries', () => {
  beforeEach(async () => {
    await seedTestData();
  });
  
  afterEach(async () => {
    await cleanupTestData();
  });
  
  it('should create user', async () => {
    await withTestDatabase(async () => {
      const user = await createUser({ email: 'test@example.com' });
      expect(user.email).toBe('test@example.com');
    });
  });
});
```

### Component Test Pattern

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('is accessible', () => {
    render(<Button>Accessible</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});
```

---

## Maintenance Tips

1. **Keep tests close to source** - Colocate or use `__tests__/` directories
2. **Use test fixtures** - Don't hardcode test data
3. **Mock external APIs** - Never hit real payment services in tests
4. **Fast feedback** - Aim for <5 second test runs locally
5. **CI gates** - Don't merge if tests fail
6. **Document patterns** - Add examples to this doc as you go

---

## Troubleshooting

**"Cannot find module '@repo/database"**
- Run `pnpm build` first
- Check tsconfig paths

**"Database connection failed"**
- Check DATABASE_URL env var
- Ensure test database exists

**"Playwright tests timeout"**
- Increase timeout in playwright.config.ts
- Check if app is running on correct port

---

## Resources

- [Vitest docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing)

---

*This is a living document. Update it as you add tests and discover patterns.*
