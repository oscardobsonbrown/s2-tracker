# AGENTS.md

## Project Overview

This is **next-ship**, a production-grade Turborepo template for Next.js applications. It's a monorepo containing multiple apps and shared packages.

## AI Agent Guidelines

### Code Style
- Use TypeScript with strict typing
- Follow **ultracite** formatting rules (Biome preset, enforced via pre-commit hooks)
- IDE auto-save uses Biome extension which reads `biome.jsonc` (ultracite configuration)
- Prefer descriptive variable names with auxiliary verbs
- Write modular, reusable code

### Monorepo Structure
- `apps/` — Applications (web, app, api, docs, email, studio)
- `packages/` — Shared packages (analytics, auth, database, design-system, etc.)
- Uses pnpm workspaces and Turborepo for task orchestration

### Common Commands
- `pnpm dev` — Start development servers
- `pnpm build` — Build all apps and packages
- `pnpm format` — Format with ultracite (runs `ultracite fix`)
- `pnpm lint` — Lint with ultracite (runs `ultracite check`)
- `pnpm check` — Run ultracite check (format + lint)
- `pnpm fix` — Run ultracite fix (format + lint with auto-fix)
- `pnpm test` — Run tests
- `pnpm migrate` — Apply committed Drizzle migrations
- `pnpm db:generate` — Generate Drizzle migration files
- `pnpm db:check` — Check Drizzle migration consistency
- `pnpm boundaries` — Check monorepo boundaries
- `pnpm biome:check` — Direct Biome check (if needed)
- `pnpm biome:ci` — Direct Biome CI check (if needed)

### Environment Variables
- Copy `.env.example` to `.env` in each app/package
- Key variables: DATABASE_URL, POSTHOG_API_KEY, POLAR_ACCESS_TOKEN, etc.

### Database
- Uses Drizzle ORM with PostgreSQL
- Schema defined in `packages/database/src/schema.ts`
- Migration files live in `packages/database/drizzle/` and must be committed with schema changes
- Apply migrations with `pnpm db:migrate`; do not use `db:push` for shared databases
- Refresh medium/large airport data with `pnpm db:import:airports`
- Refresh ski resort data with `pnpm db:import:ski-resorts`
- Studio available via `pnpm db:studio`

### Error Tracking
- PostHog configured for analytics and error tracking
- Use `captureError(error, context)` from `@repo/analytics`
- Global error boundaries in each app capture unhandled errors

### Design System
- Built on shadcn/ui components
- Tailwind CSS for styling
- Dark mode supported via next-themes

### Testing
- Vitest for unit tests
- Run `pnpm test` to execute

### Pre-commit Hooks
- Husky runs on every commit
- **ultracite fix** runs on staged files (via lint-staged)
- Large file detection (>1MB blocks commit)

### IDE Configuration
- **VSCode**: Install "Biome" extension (`biomejs.biome`)
- **Zed**: Install "Biome" extension
- **Cursor**: Install "Biome" extension (`biomejs.biome`)
- All IDEs are configured to use Biome formatter which reads `biome.jsonc`
- The Biome configuration extends `ultracite` presets, ensuring IDE and pre-commit formatting are identical

### Security
- CODEOWNERS configured for review requirements
- Secrets managed via environment variables
- Arcjet for application security (bot detection, rate limiting)

### Deployment
- Optimized for Vercel deployment
- Each app deploys independently
- Environment variables configured per project

## Working with AI Agents

When making changes:
1. Run `pnpm check` before committing
2. Ensure tests pass with `pnpm test`
3. Generate, review, and apply Drizzle migrations when changing database schema
4. Follow existing patterns in the codebase
5. Update documentation if changing APIs or setup
6. Respect monorepo boundaries (check with `pnpm boundaries`)
