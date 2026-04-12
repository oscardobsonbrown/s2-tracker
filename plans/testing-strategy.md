# Testing Strategy for Migration Safety

## Current Testing Infrastructure

**What exists today:**
- Vitest 4.0.15 configured in `apps/app` and `apps/api`
- Testing Library React 16.3.0 for component testing
- jsdom environment for browser-like testing
- Only 3 test files covering basic health checks and auth pages
- Tests run automatically before builds in Turborepo pipeline

**Gaps identified:**
- No database testing utilities
- No integration tests for packages
- No E2E/acceptance tests
- No visual regression testing
- No contract/API schema validation tests

---

## Testing Infrastructure to Add

### 1. Package-Level Unit Testing

**Setup for all packages** (`@repo/database`, `@repo/payments`, `@repo/auth`, etc.):

Each package needs:
- `vitest.config.ts` with Node.js environment (not jsdom)
- Test files colocated with source or in `__tests__/` directory
- Coverage reporting

**Priority packages for testing:**
1. **@repo/database** - Critical for Prisma → Drizzle migration
2. **@repo/payments** - Critical for payment integration
3. **@repo/auth** - Critical for user flows
4. **@repo/design-system** - Critical for Radix → Base UI migration

### 2. Database Testing Strategy

**For Prisma → Drizzle Migration:**

```typescript
// packages/database/__tests__/schema-validation.test.ts
// Validates that Drizzle schema matches Prisma schema 1:1
// Tests all CRUD operations
// Tests relationships and constraints
```

**Testing approach:**
- Use **testcontainers** or **pg-mem** for isolated PostgreSQL testing
- Create test database utilities in `@repo/database`
- Seed test data for consistent test scenarios
- Test both Prisma (before) and Drizzle (after) implementations side-by-side
- Run dual-write validation during migration period

**Key tests to write:**
- Schema equivalence validation (same tables, columns, types)
- CRUD operations parity (create, read, update, delete)
- Relationship queries (joins, foreign keys)
- Migration script validation (idempotency, rollback)

### 3. Payment Testing Strategy

**For Polar integration:**

```typescript
// packages/payments/__tests__/polar-flows.test.ts
// Tests Polar SDK behavior for checkout and subscription flows
// Tests webhook payload transformations
```

**Testing approach:**
- Mock external APIs (payment providers) using MSW or Vitest mocks
- Create test fixtures for common payment scenarios:
  - Successful checkout
  - Failed payment
  - Subscription lifecycle
  - Refund processing
  - Webhook events
- Test webhook signature verification
- Validate event payload transformations

**Integration test approach:**
- Use the Polar sandbox
- Run sandbox transactions (non-destructive)
- Validate webhook handlers work with Polar events

### 4. UI Component Testing Strategy

**For Radix → Base UI Migration:**

```typescript
// packages/design-system/components/ui/__tests__/button.test.tsx
// Tests that Base UI Button behaves identically to Radix Button
// Tests accessibility, keyboard navigation, styling
```

**Testing approach:**
- **Component-level tests** for each migrated component
- **Accessibility tests** using jest-axe or @testing-library/jest-dom
- **Visual regression** using Storybook + Chromatic or Loki
- **Interaction tests** for complex components (modal, dropdown, etc.)

**Component test checklist:**
- [ ] Renders correctly with default props
- [ ] Renders correctly with all prop variations
- [ ] Handles user interactions (click, hover, focus)
- [ ] Keyboard navigation works correctly
- [ ] Accessibility attributes present (ARIA, roles)
- [ ] No console errors or warnings
- [ ] Matches visual snapshot (regression)

### 5. Integration Testing

**API Route Testing:**
```typescript
// apps/api/__tests__/webhooks/payments.test.ts
// Tests webhook handling with payment payloads
```

**Approach:**
- Use `next-test-api-route-handler` or similar for Next.js API testing
- Test complete request/response cycles
- Validate database state changes after API calls
- Test authentication/authorization guards

**Test scenarios:**
- Webhook endpoints for payment payloads
- Payment API routes
- Auth callbacks
- Database API routes

### 6. End-to-End Testing

**For Critical User Flows:**

**Option A: Playwright** (recommended for modern E2E)
- Install `@playwright/test`
- Create `e2e/` directory in root or per-app
- Test critical flows:
  - Sign up → Sign in → Dashboard
  - Checkout flow (Polar integration)
  - Payment webhook processing
  - Database operations via UI

**Option B: Cypress** (if preferred)
- Similar setup but different syntax

**E2E test scenarios for migrations:**
- [ ] User can sign up and sign in
- [ ] User can view their profile
- [ ] User can make a purchase (test payment flows)
- [ ] Webhook processing updates database correctly
- [ ] UI components render and work correctly
- [ ] Database queries return expected data
- [ ] No console errors in browser

### 7. Contract/Schema Testing

**API Schema Validation:**
```typescript
// Ensure API responses match expected schemas
// Use Zod for runtime validation of API responses
```

**Database Schema Validation:**
- Compare Prisma schema with Drizzle schema
- Ensure no breaking changes in table/column names
- Validate migration scripts produce correct SQL

---

## Test Data Management

### Test Fixtures

Create comprehensive test fixtures in `packages/database/src/fixtures/`:

```typescript
// Test users with different roles
export const testUsers = {
  admin: { id: '...', email: 'admin@test.com', role: 'admin' },
  customer: { id: '...', email: 'customer@test.com', role: 'customer' },
};

// Test products for payment testing
export const testProducts = {
  basic: { id: '...', name: 'Basic Plan', price: 1000 },
  premium: { id: '...', name: 'Premium Plan', price: 5000 },
};

// Test payment scenarios
export const testPayments = {
  successful: { /* payment payload */ },
  failed: { /* payment payload */ },
  refunded: { /* payment payload */ },
};
```

### Test Database Setup

```typescript
// packages/database/src/test-utils.ts
import { createTestDatabase } from 'testcontainers-postgresql';

export async function setupTestDatabase() {
  const container = await createTestDatabase();
  const connectionString = container.getConnectionString();
  
  // Apply migrations
  // Seed test data
  
  return { container, connectionString };
}
```

---

## Testing Phases for Migration

### Phase 1: Pre-Migration (Establish Baseline)

**Before any migration begins:**

1. **Write comprehensive tests for current state (Prisma + payments + Radix)**
   - Database CRUD tests with Prisma
   - Payment webhook tests with Polar
   - UI component tests with Radix
   - E2E tests for critical flows

2. **Run all tests to establish baseline**
   - Document current behavior
   - Ensure 100% test pass rate
   - Capture snapshots for visual regression

3. **Set up CI/CD gates**
   - All tests must pass before merging
   - Coverage thresholds (suggest 70% minimum)

### Phase 2: During Migration (Parallel Validation)

**While migrating each component:**

1. **Dual-implementation period**
   - Keep old implementation alongside new
   - Run tests against both implementations
   - Compare outputs for equivalence

2. **Gradual cutover**
   - Use feature flags to control rollout
   - Test new implementation in isolation
   - A/B test old vs new in staging

3. **Continuous validation**
   - Run full test suite after each migration phase
   - Monitor for regressions
   - Fix issues immediately

### Phase 3: Post-Migration (Cleanup)

**After migration completes:**

1. **Remove old implementation tests**
   - Delete Prisma-specific tests
   - Delete payment-provider-specific tests
   - Delete Radix-specific tests

2. **Update tests for new implementations**
   - Ensure Drizzle tests cover all use cases
   - Ensure Polar tests cover all payment scenarios
   - Ensure Base UI tests cover all components

3. **Final validation**
   - Full regression test suite
   - E2E tests in production-like environment
   - Performance benchmarks

---

## Recommended Test Structure

```
packages/
  database/
    __tests__/
      schema-validation.test.ts      # Schema parity tests
      crud-operations.test.ts        # CRUD with Drizzle
      migration-scripts.test.ts      # Migration validation
      fixtures/
        users.ts
        products.ts
        payments.ts
    src/
      test-utils.ts                  # Test database utilities
      
  payments/
    __tests__/
      polar-sdk.test.ts              # Polar SDK tests
      polar-flows.test.ts          # Payment provider compatibility checks
      webhooks.test.ts               # Webhook handling
      fixtures/
        payment-events.ts
        polar-events.ts
        
  design-system/
    components/ui/__tests__/
      button.test.tsx
      dialog.test.tsx
      # ... one test per component
    
apps/
  api/
    __tests__/
      health.test.ts                 # Already exists
      webhooks/
        payments.test.ts             # Payment webhook integration tests
        
  app/
    __tests__/
      sign-in.test.tsx               # Already exists
      sign-up.test.tsx               # Already exists
      dashboard.test.tsx             # New: Dashboard integration
      
e2e/                                 # Playwright tests
  auth.spec.ts
  payments.spec.ts
  smoke.spec.ts
```

---

## CI/CD Integration

**Turborepo Pipeline Updates:**

Update `turbo.json` to include comprehensive testing:

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
      "dependsOn": ["^build", "test", "^test"]
    }
  }
}
```

**GitHub Actions Workflow:**

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-integration:
    runs-on: ubuntu-latest
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
      - run: pnpm test:e2e
```

---

## Quick Wins (Start Here)

To get immediate value with minimal effort:

1. **Add database testing utilities** (1-2 hours)
   - Set up test database with testcontainers
   - Create seed fixtures
   - Write one comprehensive CRUD test

2. **Add payment webhook tests** (2-3 hours)
   - Mock payment webhooks
   - Test Polar payment implementation
   - Create test fixtures for common events

3. **Add component smoke tests** (2-3 hours)
   - Test 5 most critical components render
   - Check for console errors
   - Basic accessibility checks

4. **Add one E2E test** (3-4 hours)
   - Install Playwright
   - Test sign-up → sign-in flow
   - Runs in CI on every PR

**Total time to baseline testing: ~8-12 hours**

---

## Test Priorities for Each Migration

### Prisma → Drizzle
**Critical tests:**
1. Schema validation (tables, columns, types match)
2. CRUD operations return identical results
3. Query performance (Drizzle should be faster or equal)
4. Migration scripts are reversible

**Nice-to-have:**
- Edge runtime compatibility tests
- SQL generation tests

### Radix → Base UI
**Critical tests:**
1. Components render identically
2. Accessibility attributes match
3. Keyboard navigation works
4. No console errors

**Nice-to-have:**
- Visual regression snapshots
- Performance benchmarks

### Polar integration
**Critical tests:**
1. Webhook payload handling
2. Database state updates correctly
3. Error handling scenarios
4. Idempotency (duplicate webhooks)

**Nice-to-have:**
- SDK parity tests
- Transaction flow tests

### Next.js 16.2
**Critical tests:**
1. All apps build successfully
2. No runtime errors
3. API routes respond correctly
4. Static generation works

**Nice-to-have:**
- Performance benchmarks
- Bundle size analysis

---

## Success Metrics

**Before migration starts:**
- [ ] 70%+ code coverage
- [ ] All critical paths have E2E tests
- [ ] CI pipeline runs tests on every PR
- [ ] Zero flaky tests

**During migration:**
- [ ] 100% test pass rate maintained
- [ ] No regressions in E2E tests
- [ ] Performance benchmarks maintained or improved

**After migration:**
- [ ] Same or better coverage
- [ ] All tests pass consistently
- [ ] Team confident in rollback strategy
