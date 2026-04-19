# next-ship

**Production-grade Next.js starter for modern SaaS applications.**

Built for solo founders and small teams who want a fast, maintainable foundation without the enterprise complexity.

## Why next-ship?

Most Next.js starters are either too basic or too complex. next-ship hits the sweet spot:

- **Modern stack** — Latest stable tools that work well together
- **Simplified** — Removed enterprise features you don't need as a solo founder
- **Fast to ship** — Pre-configured auth, payments, database, and analytics
- **Easy to maintain** — Consolidated tooling, flat URLs
- **Production-ready** — Type-safe, secure, and scalable

## Stack

### Framework
- **Next.js 16.2** — React 19, latest features
- **TypeScript 5.9** — Strict mode, end-to-end type safety
- **Turborepo** + **pnpm** — Monorepo with fast, disk-space efficient installs
- **Tailwind CSS 4** — Latest syntax, no configuration needed

### Core Services
| Service | Purpose |
|---------|---------|
| **Clerk** | Authentication — simple, secure, works out of the box |
| **Drizzle ORM** | Database — type-safe, SQL-like, better performance than Prisma |
| **Neon PostgreSQL** | Database hosting — serverless, scales with you |
| **Polar.sh** | Payments — modern SaaS billing with strong TypeScript support |
| **PostHog** | Analytics + Error tracking — one tool instead of three |
| **Resend** | Transactional email — simple API, great deliverability |
| **BaseHub** | CMS — type-safe content management |
| **Nosecone** | Security headers |

### UI Components
- **Base UI** — shadcn's next-generation component library (replacement for Radix)
- **Tailwind CSS v4** — Latest features, no config
- **Geist font** — Modern, readable typography

## Quick Start

### Prerequisites
- Node.js 20+
- [pnpm](https://pnpm.io)

### Installation

```bash
# Clone the repository
git clone https://github.com/oscardobsonbrown/next-ship.git
cd next-ship

# Install dependencies
pnpm install

# Set up environment variables
# Copy .env.example files to .env in each app/package and fill in your API keys

# Apply committed database migrations when you intentionally update the database
pnpm --filter @repo/database db:migrate

# Start development
pnpm dev
```

### Required Environment Variables

Create `.env` files in each app directory:

**apps/web/.env:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WEB_URL=http://localhost:3001
NEXT_PUBLIC_POSTHOG_KEY=phc_...
```

**apps/app/.env:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_POSTHOG_KEY=phc_...
```

**apps/api/.env:**
```
DATABASE_URL=postgresql://...
RESEND_FROM=hello@example.com
RESEND_TOKEN=re_...
POLAR_ACCESS_TOKEN=polar_...

# Optional for webhook features
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
POLAR_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WEB_URL=http://localhost:3001
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

See individual `.env.example` files for complete lists.

## Architecture

### Apps

```
apps/
├── web/           # Marketing site (port 3001)
│   ├── /          # Homepage
│   ├── /contact   # Contact form
│   ├── /pricing   # Pricing page
│   └── /blog      # Blog with CMS integration
├── app/           # Main application (port 3000)
│   ├── /sign-in   # Authentication
│   ├── /sign-up
│   └── /dashboard # Main app dashboard
├── api/           # API server (port 3002)
│   └── /webhooks  # Payment webhooks, auth callbacks
├── docs/          # Documentation site
├── email/         # Email preview server
└── storybook/     # Component library
```

All apps are independently deployable.

### Packages

```
packages/
├── auth/           # Clerk configuration
├── database/       # Drizzle ORM, schema, migrations
├── design-system/  # Base UI components, Tailwind config
├── payments/       # Polar.sh integration
├── analytics/      # PostHog client/server
├── observability/  # Error handling, logging
├── security/       # Security headers configuration
├── cms/            # BaseHub integration
├── email/          # React Email templates
├── ai/             # Vercel AI SDK utilities
├── seo/            # Metadata, sitemaps, JSON-LD
└── typescript-config/  # Shared TypeScript settings
```

## Key Decisions

### Flat URLs

Clean URL structure without locale prefixes. `/contact` instead of `/en/contact`. Simpler routing, faster builds, no configuration needed.

### Consolidated Observability

One tool instead of three:
- **PostHog** for analytics, session replay, and error tracking
- No Sentry (replaced by PostHog error tracking)
- No Logtail (Vercel logs + PostHog capture are sufficient)

### Modern Database Layer

Drizzle ORM instead of Prisma:
- Better query performance
- SQL-like syntax (you write actual SQL)
- Smaller bundle size
- Edge runtime compatible

### Modern Payments

Polar.sh for payments:
- Better developer experience
- Modern TypeScript SDK
- Webhook handling included
- Perfect for SaaS subscriptions

### Modern UI

Base UI instead of Radix:
- shadcn's next-generation component library
- Better accessibility
- No `asChild` prop complexity
- Cleaner composition patterns

## Database

Drizzle ORM with Neon PostgreSQL:

```typescript
// packages/database/src/schema.ts
import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});
```

### Database Migrations

Schema changes are code-first and migration-first.

1. Edit `packages/database/src/schema.ts`.
2. Generate a migration:

   ```bash
   pnpm --filter @repo/database db:generate --name add_example_table
   ```

3. Review the generated SQL in `packages/database/drizzle/`.
4. Check migration consistency:

   ```bash
   pnpm --filter @repo/database db:check
   ```

5. Apply migrations intentionally:

   ```bash
   pnpm --filter @repo/database db:migrate
   ```

Do not use `db:push` for shared databases. It bypasses migration history.

Useful database commands:

```bash
pnpm --filter @repo/database db:generate  # Generate migration files
pnpm --filter @repo/database db:check     # Check migration consistency
pnpm --filter @repo/database db:migrate   # Apply pending migrations
pnpm --filter @repo/database db:studio     # Open Drizzle Studio
```

Refresh the ski resort dataset from OpenSkiMap:

```bash
pnpm db:import:ski-resorts
```

Refresh the airport dataset from OurAirports. The importer keeps only
`large_airport` and `medium_airport` rows so flight lookup does not use
helipads, seaplane bases, small/private airfields, balloonports, or closed
airports:

```bash
pnpm db:import:airports
```

For database integration tests with an ephemeral Neon branch:

```bash
pnpm --filter @repo/database test:ephemeral
```

## Components

Base UI components via shadcn CLI:

```bash
# Add a component
npx shadcn@latest add button -c packages/design-system

# Use in your app
import { Button } from "@repo/design-system/components/ui/button";
```

Composition pattern (no `asChild`):
```tsx
// ✅ Correct
<Link href="/contact">
  <Button>Contact</Button>
</Link>

// ❌ Old pattern (doesn't work with Base UI)
<Button asChild>
  <Link href="/contact">Contact</Link>
</Button>
```

## Development

### Commands

```bash
# Type check all packages
pnpm typecheck

# Run tests
pnpm test

# Build all apps
pnpm build

# Lint and format
pnpm check
pnpm fix

# Update dependencies
pnpm bump-deps

# Update all shadcn components
pnpm bump-ui
```

### Database Changes

After modifying schema:
1. Edit `packages/database/src/schema.ts`
2. Run `pnpm --filter @repo/database db:generate --name descriptive_migration_name`
3. Review the generated SQL in `packages/database/drizzle/`
4. Run `pnpm --filter @repo/database db:check`
5. Run `pnpm --filter @repo/database db:migrate`

Deploy builds do not apply database migrations. Apply schema changes
intentionally before or alongside the release using the database commands above.

### Adding a New App

1. Create directory in `apps/`
2. Add `package.json` with dependencies
3. Create `next.config.ts`
4. Add to `turbo.json` pipeline if needed

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

The monorepo is configured to deploy all apps independently via Turborepo.
Vercel deploy builds do not run database migrations; run database schema
commands explicitly when schema changes are part of a release.
The Vercel app configs use `turbo run build --filter=<app> --only` so deploys
build only the selected Next.js app and do not run test or tooling package tasks.

### Environment Variables by App

Each app needs specific environment variables:
- **Web**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`, etc.
- **App**: All Clerk variables, PostHog key
- **API**: Database URL, Resend, Polar, PostHog, and app URL variables.

Required API variables for Vercel:

```env
DATABASE_URL
RESEND_FROM
RESEND_TOKEN
POLAR_ACCESS_TOKEN
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_WEB_URL
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
```

Optional API variables:

```env
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
POLAR_WEBHOOK_SECRET
POLAR_SERVER
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_DOCS_URL
NEXT_PUBLIC_GA_MEASUREMENT_ID
```

## Inspired By

Built on lessons learned from next-ship, with simplifications for solo founders:
- Removed complex routing patterns
- Consolidated observability tools
- Updated to latest stack (Drizzle, Base UI, Polar.sh)
- Flattened URL structure
- Simplified codebase

## License

MIT
