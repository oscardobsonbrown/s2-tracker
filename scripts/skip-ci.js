#!/usr/bin/env node
/**
 * Vercel Ignore Script
 *
 * This script determines whether Vercel should skip the build/deployment
 * based on the files changed in the current commit.
 *
 * Exit codes:
 * - 0: Continue with deployment
 * - 1: Skip deployment
 */

const { execSync } = require("node:child_process");

// Files/patterns that should NOT trigger a deployment
const skipPatterns = [
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  ".github/",
  "docs/",
  "*.test.ts",
  "*.test.tsx",
  "*.spec.ts",
  "*.spec.tsx",
  "__tests__/",
  "scripts/",
  "*.md",
];

// Get the list of changed files
function getChangedFiles() {
  try {
    // In Vercel's environment, this uses the git commit range
    const result = execSync(
      'git diff --name-only HEAD^ HEAD || git diff --name-only $(git merge-base HEAD origin/main) HEAD || echo ""',
      { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }
    );
    return result.trim().split("\n").filter(Boolean);
  } catch {
    // If git commands fail, assume we should deploy
    return null;
  }
}

// Check if all changed files match skip patterns
function shouldSkip(files) {
  if (!files || files.length === 0) {
    return false; // No files or git failed, proceed with deployment
  }

  return files.every((file) =>
    skipPatterns.some((pattern) =>
      pattern.endsWith("/")
        ? file.startsWith(pattern) || file.includes(`/${pattern}`)
        : file === pattern || file.endsWith(pattern.replace("*", ""))
    )
  );
}

const changedFiles = getChangedFiles();

if (shouldSkip(changedFiles)) {
  console.log("🚫 Skipping deployment - only documentation/test files changed");
  process.exit(1);
}

console.log("✅ Proceeding with deployment");
process.exit(0);
