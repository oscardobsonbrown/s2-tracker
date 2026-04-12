# Design #2: External/Separate Site Approach

**Design Philosophy**: Maximize separation - docs are a completely separate deployment that template users visit as a hosted website. The docs code doesn't exist in the template repo.

---

## 1. Architecture Overview

### Repository Structure

```
# Two distinct repositories (complete separation)

┌─────────────────────────────────────────────────────────────┐
│  github.com/next-ship/template                              │
│  ─────────────────────────────────                          │
│  The production-grade Turborepo starter template            │
│  (What developers clone and use)                           │
│                                                              │
│  apps/                                                       │
│    ├── web/         # Marketing site                        │
│    ├── app/         # Main application                      │
│    ├── api/         # API server                          │
│    ├── email/       # Email service                       │
│    └── studio/      # Content/DB studio                   │
│  packages/                                                   │
│    ├── database/    # Prisma schema & client              │
│    ├── auth/        # Authentication utilities            │
│    └── ...                                                   │
│  README.md          # Points to external docs               │
│  docs-site-url      # Link: docs.next-ship.dev            │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ independent
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  github.com/next-ship/docs-site                             │
│  ─────────────────────────────────                          │
│  Standalone documentation website (Next.js)                   │
│  (Maintained by next-ship team, not cloned by users)         │
│                                                              │
│  apps/web/                                                   │
│    ├── pages/       # All documentation pages               │
│    ├── components/  # Docs-specific UI components           │
│    └── lib/         # Docs utilities                        │
│  content/                                                    │
│    ├── guides/      # How-to guides                       │
│    ├── reference/   # API/component reference               │
│    ├── tutorials/   # Step-by-step tutorials              │
│    └── versions/    # Version-specific content            │
│  package.json                                                │
│  next.config.js     # Standalone Next.js config             │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Setup

```
┌─────────────────────────────────────────────────────────────┐
│                    Deployment Architecture                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Template Repo (github.com/next-ship/template)               │
│       │                                                     │
│       │  Push to main                                      │
│       ▼                                                     │
│  ┌──────────────────┐                                       │
│  │ Template Release │────┐                                  │
│  │    (Git Tags)    │    │                                  │
│  └──────────────────┘    │  Triggers                         │
│       │                  │  Webhook                          │
│       │  Release created │                                  │
│       ▼                  ▼                                  │
│  ┌────────────────────────────────────────────┐            │
│  │         Sync Service (GitHub Actions)      │            │
│  │  ─────────────────────────────────────     │            │
│  │  1. Parse release notes & changelog        │            │
│  │  2. Extract new features / breaking changes  │            │
│  │  3. Generate versioned docs content          │            │
│  │  4. Create PR in docs-site repo              │            │
│  └────────────────────────────────────────────┘            │
│                           │                                 │
│                           │  Auto-PR created                 │
│                           ▼                                 │
│  ┌────────────────────────────────────────────┐            │
│  │      Docs Site Repo (next-ship/docs-site)    │            │
│  │  ─────────────────────────────────────       │            │
│  │  • New version content in /content/v2.1      │            │
│  │  • Updated "latest" alias                  │            │
│  │  • Changelog entry                          │            │
│  └────────────────────────────────────────────┘            │
│                           │                                 │
│                           │  PR merged                       │
│                           ▼                                 │
│                    ┌──────────────┐                         │
│                    │  Vercel      │                         │
│                    │  Deployment  │                         │
│                    │  docs.next-ship.dev                  │
│                    │              │                         │
│                    │  ┌──────────┴──────────┐             │
│                    │  │  Edge Network (CDN)   │             │
│                    │  │  • Global distribution│             │
│                    │  │  • Version routing   │             │
│                    │  │  • /v2.1/* paths     │             │
│                    │  └───────────────────────┘             │
│                    └────────────────┘                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Versioning Strategy

```
Docs Site URL Structure:

https://docs.next-ship.dev/
├── /                    → Redirects to /latest/
├── /latest/             → Current stable version (v2.x)
├── /v2.1/               → Specific version
├── /v2.0/               → Previous version
├── /v1.9/               → Legacy version
└── /changelog/          → All versions changelog

Version Selector UI:
┌─────────────────────────────┐
│  Version: [v2.1 ▼]        │
│  ─────────────────────      │
│  • v2.1 (latest)   ← active │
│  • v2.0                     │
│  • v1.9                     │
│  • v1.8                     │
└─────────────────────────────┘
```

---

## 2. Usage Example

### For Template Users (Developers)

**Getting Started Flow:**

```bash
# 1. Clone the template (docs NOT included)
git clone https://github.com/next-ship/template.git my-app
cd my-app

# 2. README points to external docs
cat README.md
# → "📚 Full documentation: https://docs.next-ship.dev"

# 3. Visit the docs site
open https://docs.next-ship.dev

# 4. Select your template version
#    UI shows: "Viewing docs for: v2.1 (latest)"
```

**Developer Documentation Journey:**

```
Developer arrives at docs.next-ship.dev
         │
         ▼
┌─────────────────────────────────────┐
│ Landing Page                        │
│ • Quick Start (5-min guide)        │
│ • Version selector (defaults to latest)│
└─────────────────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐  ┌──────────────┐
│Guides  │  │ API Reference │
│- Setup │  │ - Components  │
│- Deploy│  │ - Hooks       │
│- Auth  │  │ - Utilities   │
└────────┘  └───────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Interactive Examples                │
│ • Live code playgrounds             │
│ • Copy-paste ready snippets         │
│ • StackBlitz integration            │
└─────────────────────────────────────┘
```

**Accessing Version-Specific Docs:**

```
User needs docs for v2.0 (older release):

1. Visit: https://docs.next-ship.dev/v2.0/
   
2. Banner shows: "You're viewing v2.0 docs. 
                  Latest is v2.1"
   
3. All links stay within /v2.0/ namespace

4. Code examples match v2.0 template structure
```

### For Next-Ship Maintainers

**Publishing New Documentation:**

```bash
# When releasing template v2.2:

# 1. In template repo:
git tag v2.2.0
git push origin v2.2.0

# 2. Automated workflow triggers:
#    → Parses v2.2.0 release notes
#    → Extracts new features
#    → Creates PR in docs-site repo

# 3. In docs-site repo (review & merge):
#    PR: "Add v2.2 documentation"
#    - /content/v2.2/ created
#    - /latest/ symlink updated
#    - Changelog updated
#    - Breaking changes highlighted

# 4. On merge, Vercel deploys automatically
```

---

## 3. What This Design Hides Internally

### Hidden Complexity

| Hidden Element | What User Sees | Internal Complexity |
|---------------|----------------|---------------------|
| **Content Sync** | Version dropdown just works | GitHub Actions parsing release notes, auto-generating docs PRs |
| **Version Routing** | `/v2.1/guides/setup` | Next.js middleware, CDN edge config, symlink management |
| **Code Examples** | Copy-ready snippets | Git submodule or API fetch to template repo for source verification |
| **Search** | Instant search results | Indexed across all versions, Algolia DocSearch integration |
| **API Reference** | Auto-generated tables | TypeDoc/TSdoc parsing, AST extraction from template packages |
| **Playgrounds** | Interactive demos | Sandpack/StackBlitz integration, template repo file fetching |

### Sync Mechanism (Hidden from Users)

```
User sees: "Version 2.1 docs"

Behind the scenes:
┌─────────────────────────────────────────────────────────┐
│  Template Repo Release v2.1.0                            │
│       │                                                  │
│       │ webhook                                          │
│       ▼                                                  │
│  ┌──────────────────────────────┐                       │
│  │  1. CHANGELOG.md parsed      │                       │
│  │  2. New features identified  │                       │
│  │  3. Breaking changes flagged │                       │
│  │  4. Code examples extracted │                       │
│  └──────────────────────────────┘                       │
│       │                                                  │
│       │ generates                                        │
│       ▼                                                  │
│  ┌──────────────────────────────┐                       │
│  │  Docs Content Updates:       │                       │
│  │  • New: /content/v2.1/       │                       │
│  │  • Update: /content/latest/    │                       │
│  │  • Changelog: /changelog/v2.1/│                       │
│  │  • Breaking: /migrations/v1-to-v2/│                  │
│  └──────────────────────────────┘                       │
│       │                                                  │
│       │ PR to docs-site                                    │
│       ▼                                                  │
│  Maintainer reviews & merges                             │
│       │                                                  │
│       ▼                                                  │
│  Vercel deploys docs.next-ship.dev                        │
└─────────────────────────────────────────────────────────┘
```

### Content Source Mapping

```
Template Repo (Source of Truth)
├── packages/database/prisma/schema.prisma
│   └── Generates: /reference/database-schema.md
│
├── packages/auth/src/
│   └── Generates: /reference/auth-api.md
│
├── apps/web/app/
│   └── Generates: /guides/app-structure.md
│
└── README.md + docs/
    └── Generates: /getting-started/

(docs-site repo fetches these via GitHub API on build)
```

---

## 4. Trade-offs of This Approach

### ✅ Advantages

| Aspect | Benefit | Detail |
|--------|---------|--------|
| **Template Size** | Minimal repo | Template users don't download docs code (~2MB saved) |
| **Build Speed** | Faster template builds | No docs dependencies in template's node_modules |
| **Separation of Concerns** | Clear boundaries | Template = code, Docs-site = content, no coupling |
| **Advanced Docs Features** | Rich documentation | Can use heavy docs frameworks (MDX, search, playgrounds) without burdening template |
| **Version Control** | Clean versioning | Each template version has immutable docs at /vX.Y/ |
| **Independent Iteration** | Docs improve without template releases | Can add features, fix typos, improve search anytime |
| **Monetization Path** | Future flexibility | Could add pro docs tier without affecting template |

### ❌ Disadvantages

| Aspect | Drawback | Mitigation |
|--------|----------|------------|
| **Sync Complexity** | Two repos to maintain | Automated sync workflows, clear release process |
| **Offline Access** | No docs without internet | PWA support, downloadable PDF guides |
| **Contribution Friction** | Harder for users to contribute docs | "Edit this page" links, external contribution guide |
| **Context Switching** | Developers leave IDE to read docs | VS Code extension with inline docs, CLI help |
| **Version Mismatch Risk** | Template and docs could drift | Automated sync on every template release |
| **Search Fragmentation** | Can't search template + docs together | Docs site searches template README, guides reference source |

### Comparison with Alternative Approaches

```
┌────────────────────────────────────────────────────────────┐
│                    Approach Comparison                       │
├────────────────────┬────────────────┬──────────────────────┤
│  Approach          │  Template Size │  Docs Richness       │
├────────────────────┼────────────────┼──────────────────────┤
│  #1 Docs in Repo   │     ~5MB       │  Basic (MD files)    │
│  #2 External Site │     ~2MB ⭐   │  Full (search, etc)  │
│  #3 Hybrid        │     ~3MB       │  Core + External     │
├────────────────────┼────────────────┼──────────────────────┤
│  Approach          │  Offline       │  Maintenance         │
├────────────────────┼────────────────┼──────────────────────┤
│  #1 Docs in Repo   │    Yes ⭐      │  Simple              │
│  #2 External Site │    No          │  Complex             │
│  #3 Hybrid        │    Partial     │  Moderate            │
├────────────────────┼────────────────┼──────────────────────┤
│  Approach          │  Versioning    │  Contribution        │
├────────────────────┼────────────────┼──────────────────────┤
│  #1 Docs in Repo   │    Git tags    │  Easy PRs ⭐        │
│  #2 External Site │    URL paths ⭐ │  Separate repo       │
│  #3 Hybrid        │    Mixed       │  Two places          │
└────────────────────┴────────────────┴──────────────────────┘
```

### When This Approach Shines

**Best for:**
- 🎯 Template has rapid iteration cycles
- 📚 Documentation is extensive (20+ pages)
- 🔍 Rich search and discovery is important
- 🎨 Docs need custom branding/design
- 📖 Multiple versions need to coexist
- 👥 Template users are not expected to contribute docs

**Not ideal when:**
- Template is simple (< 10 pages of docs)
- Users need offline documentation access
- Documentation changes frequently with template code
- Community contributions to docs are crucial

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│           External/Separate Site Approach                   │
│                    (Design #2)                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Core Principle:                                             │
│  Template repo = Minimal starter code only                   │
│  Docs site    = Separate, rich, versioned website            │
│                                                              │
│  Key Mechanisms:                                             │
│  • Automated sync via GitHub Actions                        │
│  • URL-based versioning (/v2.1/, /latest/)                   │
│  • Vercel edge deployment with global CDN                     │
│  • Content generated from template source code                │
│                                                              │
│  User Experience:                                            │
│  • Clone template → visit docs site → follow guides           │
│  • Always see version-matching documentation                │
│  • Rich features: search, playgrounds, API reference          │
│                                                              │
│  Maintenance:                                                  │
│  • Template release triggers docs update PR                   │
│  • One maintainer reviews and merges                          │
│  • Docs can iterate independently for fixes/improvements      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Reference Implementation

Similar real-world examples:
- **Vercel/Next.js**: github.com/vercel/next.js (template) + nextjs.org/docs (external)
- **Polar**: -sh/sdk (template) + polar.sh docs (external)
- **Supabase**: supabase/supabase (template) + supabase.com/docs (external)

These all use the external docs pattern with automated sync workflows.
