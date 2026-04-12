# Environment Variables Setup Guide

This document provides a comprehensive reference for all API keys and services needed to run the next-ship project.

## Quick Setup Checklist

**Required for basic functionality:**
- [ ] Clerk (Authentication)
- [ ] PostgreSQL Database (DATABASE_URL)
- [ ] Polar (Payments)
- [ ] PostHog (Analytics)

**Optional but recommended:**
- [ ] Resend (Email)
- [ ] BaseHub (CMS)
- [ ] Vercel Blob (Storage)
- [ ] Vercel Feature Flags

**Optional services:**
- [ ] Knock (Notifications)
- [ ] Svix (Webhooks)
- [ ] Upstash Redis (Rate Limiting)
- [ ] OpenAI (AI Features)
- [ ] Google Analytics

---

## Authentication

### Clerk

**Purpose:** User authentication and authorization

**Status:** Required

**Where to get it:** https://clerk.com

**Environment Variables:**

| Variable | Type | Format | Description |
|----------|------|--------|-------------|
| `CLERK_SECRET_KEY` | Server | `sk_...` | Clerk secret key for server-side operations |
| `CLERK_WEBHOOK_SECRET` | Server | `whsec_...` | Webhook secret for Clerk events |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Client | `pk_...` | Public key for client-side auth |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Client | `/sign-in` | URL path for sign-in page |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Client | `/sign-up` | URL path for sign-up page |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Client | `/` | Redirect after sign-in |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Client | `/` | Redirect after sign-up |

**Example values:**
```env
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"
```

---

## Database

### PostgreSQL Database

**Purpose:** Primary database for application data

**Status:** Required

**Where to get it:** 
- Neon: https://neon.tech
- Supabase: https://supabase.com
- Railway: https://railway.app
- Local PostgreSQL

**Environment Variables:**

| Variable | Type | Format | Description |
|----------|------|--------|-------------|
| `DATABASE_URL` | Server | Connection URL | PostgreSQL connection string |

**Example values:**
```env
# Neon
DATABASE_URL="postgresql://username:password@hostname.neon.tech/database?sslmode=require"

# Supabase
DATABASE_URL="postgresql://postgres:password@host.supabase.co:6543/postgres?pgbouncer=true"

# Local
DATABASE_URL="postgresql://postgres:password@localhost:5432/nextship"
```

---

## Payments

### Polar

**Purpose:** Payment processing and subscription management

**Status:** Required

**Where to get it:** https://polar.sh

**Environment Variables:**

| Variable | Type | Format | Description |
|----------|------|--------|-------------|
| `POLAR_ACCESS_TOKEN` | Server | `polar_...` | Polar API access token |
| `POLAR_WEBHOOK_SECRET` | Server | String | Secret for verifying webhooks |
| `POLAR_SERVER` | Server | `sandbox` or `production` | Polar environment (optional) |

**Example values:**
```env
POLAR_ACCESS_TOKEN="polar_test_..."
POLAR_WEBHOOK_SECRET="whsec_..."
POLAR_SERVER="sandbox"  # or "production"
```

---

## Email

### Resend

**Purpose:** Transactional email delivery

**Status:** Required

**Where to get it:** https://resend.com

**Environment Variables:**

| Variable | Type | Format | Description |
|----------|------|--------|-------------|
| `RESEND_TOKEN` | Server | `re_...` | Resend API token |
| `RESEND_FROM` | Server | Email | Default sender email address |

**Example values:**
```env
RESEND_TOKEN="re_xxxxxxxxxxxxxxxx"
RESEND_FROM="onboarding@yourdomain.com"
```

---

## Analytics

### PostHog

**Purpose:** Product analytics and user behavior tracking

**Status:** Required

**Where to get it:** https://posthog.com

**Environment Variables:**

| Variable | Type | Format | Description |
|----------|------|--------|-------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | Client | `phc_...` | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | Client | URL | PostHog instance URL |

**Example values:**
```env
NEXT_PUBLIC_POSTHOG_KEY="phc_xxxxxxxxxxxxxxxx"
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
```

### Google Analytics

**Purpose:** Web analytics and tracking

**Status:** Optional

**Where to get it:** https://analytics.google.com

**Environment Variables:**

| Variable | Type | Format | Description |
|----------|------|--------|-------------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Client | `G-XXXXXXXX` | Google Analytics 4 measurement ID |

**Example values:**
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

---

## Content Management

### BaseHub

**Purpose:** Headless CMS for content management

**Status:** Required

**Where to get it:** https://basehub.com

**Environment Variables:**

| Variable | Type | Format | Description |
|----------|------|--------|-------------|
| `BASEHUB_TOKEN` | Server | `bshb_pk_...` | BaseHub API token |

**Example values:**
```env
BASEHUB_TOKEN="bshb_pk_xxxxxxxxxxxxxxxx"
```

---

## Feature Flags

### Vercel Feature Flags

**Purpose:** Feature flag management

**Status:** Optional

**Where to get it:** https://vercel.com/docs/workflow-collaboration/feature-flags

**Environment Variables:**

| Variable | Type | Format | Description |
|----------|------|--------|-------------|
| `FLAGS_SECRET` | Server | String | Secret for feature flag evaluation |

**Example values:**
```env
FLAGS_SECRET="your-secret-key-here"
```

---

## Storage

### Vercel Blob

**Purpose:** File storage and asset management

**Status:** Optional

**Where to get it:** https://vercel.com/docs/storage/vercel-blob

**Environment Variables:**

| Variable | Type | Format | Description |
|----------|------|--------|-------------|
| `BLOB_READ_WRITE_TOKEN` | Server | Token | Vercel Blob read-write token |

**Example values:**
```env
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxxxxxxxx"
```

---

## Notifications

### Knock

**Purpose:** In-app notifications and feed

**Status:** Optional

**Where to get it:** https://knock.app

**Environment Variables:**

| Variable | Type | Format | Description |
|----------|------|--------|-------------|
| `KNOCK_SECRET_API_KEY` | Server | String | Knock secret API key |
| `NEXT_PUBLIC_KNOCK_API_KEY` | Client | String | Knock public API key |
| `NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID` | Client | String | Knock feed channel ID |

**Example values:**
```env
KNOCK_SECRET_API_KEY="sk_test_..."
NEXT_PUBLIC_KNOCK_API_KEY="pk_test_..."
NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

---

## Observability & Monitoring

All observability is handled by **PostHog** (see Analytics section above). We intentionally consolidated on a single tool for simplicity.

---

## Webhooks

### Svix

**Purpose:** Webhook infrastructure and delivery

**Status:** Optional

**Where to get it:** https://svix.com

**Environment Variables:**

| Variable | Type | Format | Description |
|----------|------|--------|-------------|
| `SVIX_TOKEN` | Server | `sk_...` or `testsk_...` | Svix API token |

**Example values:**
```env
SVIX_TOKEN="sk_xxxxxxxxxxxxxxxx"  # or "testsk_..." for testing
```

---

## Rate Limiting

### Upstash Redis

**Purpose:** Redis for rate limiting and caching

**Status:** Optional

**Where to get it:** https://upstash.com

**Environment Variables:**

| Variable | Type | Format | Description |
|----------|------|--------|-------------|
| `UPSTASH_REDIS_REST_URL` | Server | URL | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Server | Token | Upstash Redis REST token |

**Example values:**
```env
UPSTASH_REDIS_REST_URL="https://your-db.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxxxxxxxxxxxxxxx"
```

---

## AI/ML

### OpenAI

**Purpose:** AI features and integrations

**Status:** Optional

**Where to get it:** https://platform.openai.com

**Environment Variables:**

| Variable | Type | Format | Description |
|----------|------|--------|-------------|
| `OPENAI_API_KEY` | Server | `sk-...` | OpenAI API key |

**Example values:**
```env
OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxx"
```

---

## Application URLs

**Purpose:** Define application endpoints for cross-app communication

**Status:** Required

**Environment Variables:**

| Variable | Type | Format | Description |
|----------|------|--------|-------------|
| `NEXT_PUBLIC_APP_URL` | Client | URL | Main app URL |
| `NEXT_PUBLIC_WEB_URL` | Client | URL | Web/marketing site URL |
| `NEXT_PUBLIC_API_URL` | Client | URL | API endpoint URL |
| `NEXT_PUBLIC_DOCS_URL` | Client | URL | Documentation site URL |
| `VERCEL_PROJECT_PRODUCTION_URL` | Server | URL | Production deployment URL |

**Example values (Development):**
```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_WEB_URL="http://localhost:3001"
NEXT_PUBLIC_API_URL="http://localhost:3002"
NEXT_PUBLIC_DOCS_URL="http://localhost:3004"
VERCEL_PROJECT_PRODUCTION_URL="http://localhost:3000"
```

**Example values (Production):**
```env
NEXT_PUBLIC_APP_URL="https://app.yourdomain.com"
NEXT_PUBLIC_WEB_URL="https://yourdomain.com"
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
NEXT_PUBLIC_DOCS_URL="https://docs.yourdomain.com"
VERCEL_PROJECT_PRODUCTION_URL="https://app.yourdomain.com"
```

---

## Complete Environment File Examples

### apps/web/.env (Web/Marketing Site)

```env
# Server
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."
RESEND_FROM="hello@yourdomain.com"
DATABASE_URL="postgresql://..."
RESEND_TOKEN="re_..."
POLAR_ACCESS_TOKEN="polar_test_..."
POLAR_WEBHOOK_SECRET="whsec_..."
FLAGS_SECRET="..."
SVIX_TOKEN="sk_..."
BASEHUB_TOKEN="bshb_pk_..."
VERCEL_PROJECT_PRODUCTION_URL="http://localhost:3001"
KNOCK_API_KEY="sk_test_..."
KNOCK_FEED_CHANNEL_ID="..."
KNOCK_SECRET_API_KEY="sk_test_..."

# Client
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-..."
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_WEB_URL="http://localhost:3001"
NEXT_PUBLIC_API_URL="http://localhost:3002"
NEXT_PUBLIC_DOCS_URL="http://localhost:3004"
NEXT_PUBLIC_KNOCK_API_KEY="pk_test_..."
NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID="..."
```

### apps/app/.env (Main Application)

```env
# Server
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."
RESEND_FROM="hello@yourdomain.com"
DATABASE_URL="postgresql://..."
RESEND_TOKEN="re_..."
POLAR_ACCESS_TOKEN="polar_test_..."
POLAR_WEBHOOK_SECRET="whsec_..."
FLAGS_SECRET="..."
SVIX_TOKEN="sk_..."
BASEHUB_TOKEN="bshb_pk_..."
VERCEL_PROJECT_PRODUCTION_URL="http://localhost:3000"
KNOCK_API_KEY="sk_test_..."
KNOCK_FEED_CHANNEL_ID="..."
KNOCK_SECRET_API_KEY="sk_test_..."
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
OPENAI_API_KEY="sk-..."
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# Client
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-..."
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_WEB_URL="http://localhost:3001"
NEXT_PUBLIC_DOCS_URL="http://localhost:3004"
NEXT_PUBLIC_KNOCK_API_KEY="pk_test_..."
NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID="..."
```

### apps/api/.env (API Server)

```env
# Server
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."
RESEND_FROM="hello@yourdomain.com"
DATABASE_URL="postgresql://..."
RESEND_TOKEN="re_..."
POLAR_ACCESS_TOKEN="polar_test_..."
POLAR_WEBHOOK_SECRET="whsec_..."
FLAGS_SECRET="..."
SVIX_TOKEN="sk_..."
BASEHUB_TOKEN="bshb_pk_..."
VERCEL_PROJECT_PRODUCTION_URL="http://localhost:3002"
KNOCK_API_KEY="sk_test_..."
KNOCK_FEED_CHANNEL_ID="..."
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
OPENAI_API_KEY="sk-..."

# Client
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-..."
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_WEB_URL="http://localhost:3001"
NEXT_PUBLIC_DOCS_URL="http://localhost:3004"
```

---

## Important Notes

### Security Best Practices

1. **Never commit `.env` files** - They are already in `.gitignore`
2. **Use different keys for different environments** - Don't use production keys in development
3. **Rotate keys regularly** - Especially webhook secrets and API tokens
4. **Use strong secrets** - For `FLAGS_SECRET` and webhook secrets, use cryptographically secure random strings

### Environment-Specific Setup

- **Development:** Use sandbox/test keys for all services
- **Staging:** Use sandbox/test keys for payments, production for others
- **Production:** Use production keys for everything

### Common Issues

1. **Missing `NEXT_PUBLIC_` prefix** - Client-side variables must start with `NEXT_PUBLIC_`
2. **Wrong key format** - Check that keys match the expected format (e.g., `sk_`, `pk_`, `phc_`)
3. **Missing environment variables in Vercel** - Add all variables to your Vercel project settings
4. **Database URL format** - Must be a valid PostgreSQL connection string

---

## Support

If you encounter issues with any service:

- **Clerk:** https://clerk.com/support
- **Polar:** https://polar.sh/support
- **PostHog:** https://posthog.com/docs
- **Resend:** https://resend.com/docs
- **BaseHub:** https://basehub.com/docs
