# Migration Plan: Modernization Sweep

## Overview

This plan covers five major migrations to modernize the next-ship stack:
1. **Prisma → Drizzle ORM** (type-safe, SQL-like, edge-compatible)
2. **Radix UI → Base UI** (shadcn's next-gen component primitives)
3. **Next.js 16.0.10 → 16.2** (latest features and improvements)
4. **Polar.sh integration** (modern payment infrastructure)
5. **Observability consolidation** (unify on PostHog, remove Logtail)

---

## Architectural Decisions

**Database Strategy**:
- Keep Neon Postgres as the database provider
- Drizzle will use `@neondatabase/serverless` driver for edge compatibility
- Schema will be migrated 1:1 initially, then optimized

**UI Component Strategy**:
- Base UI is the next-gen replacement for Radix UI primitives
- Components maintain similar API but with better performance and a11y
- Styling remains Tailwind CSS v4 with minimal changes

**Payment Strategy**:
- Polar.sh provides modern payment infrastructure with better developer experience
- Webhook handling will be preserved but adapted to Polar's event structure
- Existing payment flows will be migrated gradually

**Observability Strategy**:
- PostHog becomes the unified observability platform (analytics + error tracking)
- Sentry remains as a backup/error tracking until PostHog proves stable
- Logtail is removed (redundant with PostHog's native logging and Vercel's built-in logging)

---

## Phase 1: Next.js 16.2 Upgrade + Foundation

**Goal**: Upgrade Next.js across all apps and packages, establish baseline

### What to build

Update all Next.js dependencies from 16.0.10 to 16.2.x across:
- `apps/web/package.json`
- `apps/api/package.json`
- `apps/app/package.json`
- `apps/docs/package.json`
- `apps/email/package.json`
- `apps/storybook/package.json`
- `apps/studio/package.json`

Update related dependencies that may have peer dependency requirements:
- `react` and `react-dom` (if needed for 16.2 compatibility)
- `@next/third-parties` (if applicable)

### Acceptance Criteria

- [ ] All apps build successfully with Next.js 16.2
- [ ] No peer dependency warnings related to Next.js version
- [ ] Development servers start without errors
- [ ] All existing functionality works (manual smoke test)
- [ ] CI/CD pipeline passes

---

## Phase 2: Prisma → Drizzle ORM Migration

**Goal**: Replace Prisma with Drizzle ORM while maintaining all database functionality

### What to build

**Schema Migration**:
- Convert `packages/database/prisma/schema.prisma` to Drizzle schema
- Install `drizzle-orm` and `drizzle-kit`
- Configure Drizzle with Neon serverless driver
- Set up Drizzle migrations folder structure

**Package Updates**:
- Update `packages/database/package.json` dependencies
- Remove Prisma-related dependencies
- Add Drizzle Kit scripts (generate, migrate, push, studio)

**Code Migration**:
- Create Drizzle schema files that mirror existing Prisma models
- Migrate all database queries in other packages from Prisma Client to Drizzle
- Update type imports from `@prisma/client` to Drizzle-generated types

**Environment Variables**:
- Update `DATABASE_URL` usage (Drizzle uses it directly)
- No changes needed to environment variable structure

### Acceptance Criteria

- [ ] Drizzle schema covers all existing Prisma models
- [ ] `drizzle-kit generate` produces valid SQL migrations
- [ ] `drizzle-kit push` successfully applies migrations to Neon
- [ ] All database queries in `@repo/database` consumers updated
- [ ] No `@prisma/client` imports remain in the codebase
- [ ] Type safety maintained (no `any` types introduced)
- [ ] Database tests pass (if any exist)

---

## Phase 3: Radix UI → Base UI Migration

**Goal**: Migrate from Radix UI primitives to Base UI (shadcn's new component library)

### What to build

**Understanding Base UI**:
- Base UI is MUI's unstyled component library that shadcn now recommends
- It's the successor to Radix UI primitives in the shadcn ecosystem
- Components have similar APIs but different import paths

**Migration Strategy**:
- Audit all Radix UI imports across the codebase
- Identify which Base UI components map to existing Radix primitives
- Update component wrapper files to use Base UI primitives

**Package Updates**:
- Update `packages/design-system/package.json`
- Replace `@radix-ui/*` dependencies with `@base-ui-components/*`
- Keep `radix-ui` (the all-in-one package) if Base UI has full coverage

**Component Migration**:
Update each component in `packages/design-system/components/ui/`:
- `accordion.tsx` - Radix Accordion → Base UI Accordion
- `alert-dialog.tsx` - Radix AlertDialog → Base UI Dialog
- `avatar.tsx` - Radix Avatar → Base UI Avatar
- `checkbox.tsx` - Radix Checkbox → Base UI Checkbox
- `collapsible.tsx` - Radix Collapsible → Base UI Collapsible
- `context-menu.tsx` - Radix ContextMenu → Base UI Menu
- `dialog.tsx` - Radix Dialog → Base UI Dialog
- `dropdown-menu.tsx` - Radix DropdownMenu → Base UI Menu
- `hover-card.tsx` - Radix HoverCard → Base UI Popover
- `label.tsx` - Radix Label → Base UI Field
- `menubar.tsx` - Radix Menubar → Base UI Menu
- `navigation-menu.tsx` - Radix NavigationMenu → Custom or Base UI
- `popover.tsx` - Radix Popover → Base UI Popover
- `progress.tsx` - Radix Progress → Base UI Progress
- `radio-group.tsx` - Radix RadioGroup → Base UI RadioGroup
- `scroll-area.tsx` - Radix ScrollArea → Base UI ScrollArea
- `select.tsx` - Radix Select → Base UI Select
- `separator.tsx` - Radix Separator → Base UI Separator
- `slider.tsx` - Radix Slider → Base UI Slider
- `switch.tsx` - Radix Switch → Base UI Switch
- `tabs.tsx` - Radix Tabs → Base UI Tabs
- `toggle.tsx` - Radix Toggle → Base UI Toggle
- `toggle-group.tsx` - Radix ToggleGroup → Base UI ToggleGroup
- `tooltip.tsx` - Radix Tooltip → Base UI Tooltip

### Acceptance Criteria

- [ ] All Radix UI primitive imports replaced with Base UI equivalents
- [ ] No `@radix-ui/react-*` dependencies in package.json
- [ ] All components render correctly in Storybook
- [ ] No visual regressions (spot check key components)
- [ ] Accessibility features preserved (keyboard nav, ARIA)
- [ ] TypeScript types compile without errors

---

## Phase 4: Polar.sh integration

**Goal**: Finalize the Polar payment integration

### What to build

**Understanding Polar.sh**:
- Modern payment infrastructure with better developer experience
- Similar concepts: products, prices, customers, subscriptions
- Different API structure and webhook events
- Better TypeScript support and SDK

**Package Updates**:
- Update `packages/payments/package.json`
- Remove obsolete payment provider dependencies
- Add `@polar-sh/sdk` (or appropriate Polar SDK)

**Code Migration**:

Update `packages/payments/index.ts`:
- Initialize the Polar client
- Export the Polar types needed by consumers
- Migrate API methods to the Polar SDK

Update webhook handling:
- Use Polar webhook signature verification
- Update webhook event types and handlers
- Map payment events:
  - `checkout.created` → Polar checkout event
  - `invoice.paid` → Polar subscription event
  - `customer.subscription.updated` → Polar subscription update
  - etc.

**Environment Variables**:
- Use `POLAR_ACCESS_TOKEN` for the Polar SDK
- Use `POLAR_WEBHOOK_SECRET` for webhook verification
- Update `keys.ts` to use new environment variables

**Consumer Updates**:
- Update `apps/api` webhook handler to use Polar events
- Update any payment-related UI components

### Acceptance Criteria

- [ ] Polar SDK integrated and initialized correctly
- [ ] All payment provider imports and usage removed
- [ ] Webhook handlers updated for Polar event structure
- [ ] Environment variables migrated
- [ ] Payment flows tested (checkout, webhook handling)
- [ ] Documentation updated with Polar setup instructions

---

## Phase 5: Observability Consolidation (PostHog + Remove Logtail)

**Goal**: Unify observability on PostHog, remove redundant Logtail integration

### What to build

**Understanding the Current State**:
- **Sentry**: Error tracking, performance monitoring, session replay
- **Logtail**: Structured logging (lightweight wrapper around console in dev)
- **PostHog**: Product analytics, feature flags, session recording

**Why Remove Logtail?**
- Logtail is redundant in this setup:
  - Vercel has native logging (visible in dashboard)
  - PostHog can capture console logs and errors
  - Sentry already captures errors and console output
  - Logtail adds another vendor to manage for minimal value

**PostHog Enhancement**:
- Configure PostHog to capture console logs (it has this capability)
- Set up PostHog exception capture (it can replace Sentry for error tracking)
- Use PostHog's built-in session recording (already configured)

**Migration Steps**:

1. **Remove Logtail**:
   - Delete `packages/observability/log.ts`
   - Remove `@logtail/next` from package.json
   - Replace all `log.*` imports with standard console or PostHog logging

2. **Enhance PostHog**:
   - Configure PostHog client to capture console logs
   - Set up error tracking in PostHog
   - Add PostHog server-side logging integration

3. **Gradual Sentry Deprecation (Optional Phase 6)**:
   - Initially keep Sentry as backup
   - Once PostHog proves stable for error tracking, remove Sentry
   - This is lower priority since Sentry provides value

**Package Updates**:
- Remove `@logtail/next` from `packages/observability/package.json`
- Keep `@sentry/nextjs` for now (can be removed later if desired)

**Code Changes**:
- Update `packages/observability/index.ts` (or create one) to export unified logging
- Update all consumers that use `log` from observability package

### Acceptance Criteria

- [ ] Logtail dependency removed
- [ ] No `@logtail/next` imports remain
- [ ] All logging uses standard console or PostHog
- [ ] PostHog configured to capture console logs
- [ ] PostHog error tracking enabled
- [ ] No runtime errors after removal
- [ ] Logs visible in appropriate tools (Vercel dashboard for runtime, PostHog for analytics)

---

## Phase 6: Validation & Cleanup

**Goal**: Comprehensive testing and cleanup of all migrations

### What to build

**Full Regression Testing**:
- End-to-end testing of critical user flows
- Database operations (CRUD)
- Payment flows (if test environment available)
- UI component functionality
- Error tracking and logging

**Documentation Updates**:
- Update README files with new setup instructions
- Document Drizzle ORM usage patterns
- Document Polar.sh integration
- Update environment variable documentation

**Cleanup**:
- Remove any migration scaffolding or temporary files
- Update `.env.example` files
- Clean up any dead code identified during migration

**Performance Validation**:
- Run bundle analysis to ensure no bloat
- Check for any performance regressions
- Verify edge runtime compatibility

### Acceptance Criteria

- [ ] All CI/CD checks pass
- [ ] Manual end-to-end testing complete
- [ ] No console errors in production build
- [ ] Bundle size acceptable (no major increases)
- [ ] Documentation updated and accurate
- [ ] Team members briefed on changes

---

## Risk Assessment & Mitigation

### High Risk
1. **Database Migration (Prisma → Drizzle)**
   - **Risk**: Data loss or corruption during migration
   - **Mitigation**: Full database backup before migration, test on staging first, reversible migration strategy

2. **Payment Integration**
   - **Risk**: Payment processing downtime, lost subscriptions
   - **Mitigation**: Parallel run period, thorough webhook testing, customer communication

### Medium Risk
3. **UI Component Migration (Radix → Base UI)**
   - **Risk**: Visual regressions, accessibility issues
   - **Mitigation**: Component-level testing, visual regression testing, accessibility audit

4. **Next.js Upgrade**
   - **Risk**: Breaking changes in 16.2
   - **Mitigation**: Review Next.js 16.2 changelog, test all apps thoroughly

### Low Risk
5. **Logtail Removal**
   - **Risk**: Loss of logging visibility
   - **Mitigation**: Verify Vercel logging and PostHog capture work correctly

---

## Recommended Order

1. **Phase 1**: Next.js 16.2 (foundation)
2. **Phase 5**: Remove Logtail (quick win, low risk)
3. **Phase 3**: Base UI migration (UI layer)
4. **Phase 2**: Drizzle ORM (data layer)
5. **Phase 4**: Polar.sh (business layer - highest risk)
6. **Phase 6**: Validation & cleanup

This order:
- Starts with low-risk foundation upgrades
- Removes redundant code early
- Does UI changes before data changes (easier to rollback UI)
- Saves highest-risk payment migration for last when system is stable
- Ends with comprehensive validation

---

## Notes on Logtail vs Alternatives

**Your Question**: "What's the point of logtail, isn't it able to send to posthog too or vercel natively?"

**Answer**: You're absolutely right. Logtail is redundant in your current architecture:

1. **Vercel Native Logging**: Vercel captures all `console.*` output automatically. You can view logs in the Vercel dashboard with filtering and search. For most use cases, this is sufficient.

2. **PostHog Console Capture**: PostHog can capture console logs and exceptions automatically. When you initialize PostHog with `capture_console_logs: true`, it sends console output as events to PostHog, giving you logs alongside your analytics data.

3. **Sentry Console Integration**: Your Sentry setup already captures console logs with `Sentry.consoleLoggingIntegration()`.

**Logtail's Value Proposition**:
- Structured logging with JSON parsing
- Better search and filtering than raw Vercel logs
- Long-term log retention (Vercel has limits)
- Alerts on log patterns

**Verdict**: For your use case, Logtail doesn't add enough value to justify:
- Another vendor relationship
- Additional dependency
- Extra cost
- Maintenance overhead

**Recommendation**: Remove Logtail and rely on:
- Vercel dashboard for real-time debugging
- PostHog for structured log analysis alongside user behavior
- Sentry for error tracking (until you fully migrate to PostHog for that too)

If you later need advanced log management (retention, alerting, complex queries), you can evaluate dedicated solutions like Datadog, but Logtail isn't providing that value today.
