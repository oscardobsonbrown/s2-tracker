# Local GitHub Actions Testing with Act

This project uses [Act](https://github.com/nektos/act) to run GitHub Actions locally before pushing to GitHub.

## Prerequisites

1. **Colima** - Container runtime (lightweight alternative to Docker Desktop)
   ```bash
   # Install via Homebrew
   brew install colima docker
   
   # Start Colima
   colima start --cpu 4 --memory 8
   ```
2. **Act** - Already installed via Homebrew (`brew install act`)

## Quick Start

### 1. Configure Secrets

Copy the template and fill in your actual secrets:

```bash
cp .env.act .env.act.local
# Edit .env.act.local with your actual tokens
```

Required secrets:
- `GITHUB_TOKEN` - **REQUIRED** GitHub personal access token (Act needs this to fetch actions from GitHub, even public ones!)
- `NPM_TOKEN` - NPM authentication token (for release workflow)
- `POSTHOG_API_KEY` - PostHog API key (for error-to-insight workflow)
- `POSTHOG_PROJECT_ID` - PostHog project ID

**Important**: You MUST set a `GITHUB_TOKEN` for Act to work. Even public GitHub Actions require authentication to fetch. Create a token at https://github.com/settings/tokens - for public repos, a classic token with no scopes is sufficient.

### 2. Available Commands

```bash
# List all workflows
pnpm act:list

# Run CI workflow (lint, typecheck, test)
pnpm act:ci

# Run E2E tests (takes ~30 min for Playwright browser install)
pnpm act:e2e

# Run build system checks
pnpm act:build-checks

# Dry-run release workflow (no actual release)
pnpm act:release:dry

# Run error-to-insight workflow
pnpm act:error-insight

# Run AGENTS.md validation
pnpm act:agents-md

# Run all workflows (on pull_request event)
pnpm act:all
```

## Workflow Details

| Workflow | Command | Notes |
|----------|---------|-------|
| `ci.yml` | `pnpm act:ci` | Large file detection, lint, typecheck, test |
| `e2e.yml` | `pnpm act:e2e` | Playwright tests (30min+ first run) |
| `build-system-checks.yml` | `pnpm act:build-checks` | Version drift, dead code, bundle size |
| `release.yml` | `pnpm act:release:dry` | Dry-run only (adds `-n` flag) |
| `error-to-insight.yml` | `pnpm act:error-insight` | ⚠️ **YAML parsing issue with Act** (works on GitHub) |
| `agents-md-validation.yml` | `pnpm act:agents-md` | AGENTS.md validation |
| `codeql.yml` | `pnpm act:codeql` | Limited functionality locally (GitHub-hosted) |

## Configuration

- **`.actrc`** - Act configuration file with runner images and settings
- **`.env.act`** - Secrets template (do not commit real values)
- **Cache**: Act uses built-in cache server at `127.0.0.1`
- **Artifacts**: Stored in `/tmp/act-artifacts` for `upload-artifact@v4` support

## Troubleshooting

### Docker Desktop Not Running

**Symptom:** `Couldn't get a valid docker connection` or `docker: command not found`

Docker Desktop must be running. If installed but not accessible:

```bash
# Start Docker Desktop (if installed in Applications)
open -a Docker

# Wait ~30 seconds for Docker to start, then verify:
docker ps

# If docker command is still not found, add to PATH:
export PATH="$PATH:/Applications/Docker.app/Contents/Resources/bin"
```

### error-to-insight.yml YAML Parsing Error

**Symptom:** `yaml: line 130: did not find expected alphabetic or numeric character`

This is a known issue where Act's YAML parser is stricter than GitHub's. The workflow uses `**` (markdown bold) inside JavaScript template literals, which confuses the YAML parser (it interprets `*` as alias references).

**Workaround:** This workflow works correctly on GitHub Actions but cannot be tested locally with Act. To test other workflows while excluding this one:

```bash
# Run specific workflows (avoid error-to-insight.yml)
pnpm act:ci
pnpm act:e2e
pnpm act:build-checks
# etc...
```

The workflow is valid YAML and works on GitHub Actions - this is purely an Act parser limitation.

### Large Image Downloads

The runner image is ~5GB. First run will take time:
```bash
# Pre-pull the image
docker pull catthehacker/ubuntu:act-latest
```

### Workflow-Specific Issues

- **e2e.yml**: Requires extended timeout (30m) for Playwright browser downloads
- **release.yml**: Always uses dry-run mode locally (won't actually release)
- **codeql.yml**: CodeQL analysis is GitHub-hosted and won't fully work locally
- **error-to-insight.yml**: Cannot run locally due to YAML parsing issue (works fine on GitHub)

### Apple Silicon (M1/M2/M3/M4) Considerations

If you encounter architecture-related issues:

```bash
# Option 1: Use the built-in .actrc configuration (already set up)
# Option 2: Override with explicit architecture flag
act --container-architecture linux/amd64 -W .github/workflows/ci.yml
```

The default `.actrc` uses `catthehacker/ubuntu:act-latest` which supports both ARM64 and AMD64.

### Verbose Output

For debugging, enable verbose mode:
```bash
act --verbose --workflows .github/workflows/ci.yml
```

## Architecture

- **Runner**: `catthehacker/ubuntu:act-latest` (ARM64 compatible)
- **Docker Socket**: `unix:///var/run/docker.sock`
- **Artifact Server**: Enabled at `/tmp/act-artifacts`
- **Cache**: Built-in cache server enabled
- **Secrets**: Read from `.env.act` file

## Security Notes

- `.env.act` is in `.gitignore` - never commit real secrets
- Use `.env.act` as a template/documentation only
- For actual local testing, create `.env.act.local` or set environment variables directly
- All `release.yml` and `release-notes.yml` runs use dry-run mode locally
