#!/bin/bash

# Feature Flag Detection Script
# Identifies potentially dead/unused feature flags

set -e

FLAGS_FILE="packages/feature-flags/index.ts"

echo "🔍 Analyzing feature flags for stale usage..."

if [ ! -f "$FLAGS_FILE" ]; then
  echo "⚠️ Feature flags index file not found at $FLAGS_FILE"
  exit 0
fi

# Extract all exported flag names
FLAGS=$(grep -oE 'export const [a-zA-Z0-9_]+' "$FLAGS_FILE" | sed 's/export const //' || true)

if [ -z "$FLAGS" ]; then
  echo "⚠️ No feature flags found in $FLAGS_FILE"
  exit 0
fi

echo "📋 Defined feature flags:"
echo "$FLAGS"
echo ""

DEAD_FLAGS=""
TOTAL_FLAGS=0
UNUSED_COUNT=0

for flag in $FLAGS; do
  TOTAL_FLAGS=$((TOTAL_FLAGS + 1))
  
  # Search for usage across the codebase (excluding node_modules, .next, etc.)
  USAGE_COUNT=$(grep -r "${flag}" \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.jsx" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=dist \
    --exclude="packages/feature-flags/*" \
    . 2>/dev/null | wc -l | tr -d ' ')
  
  if [ "$USAGE_COUNT" -eq 0 ]; then
    echo "⚠️  Flag '$flag' appears unused (0 references outside feature-flags package)"
    DEAD_FLAGS="${DEAD_FLAGS}${flag}
"
    UNUSED_COUNT=$((UNUSED_COUNT + 1))
  else
    echo "✅ Flag '$flag' is used ($USAGE_COUNT references)"
  fi
done

echo ""
echo "📊 Summary:"
echo "  Total flags: $TOTAL_FLAGS"
echo "  Potentially dead flags: $UNUSED_COUNT"

if [ -n "$DEAD_FLAGS" ]; then
  echo ""
  echo "🚩 Potentially dead feature flags:"
  echo "$DEAD_FLAGS"
  echo ""
  echo "💡 Recommendations:"
  echo "   1. Review flagged features to confirm they're truly unused"
  echo "   2. Remove flag definitions from packages/feature-flags/index.ts"
  echo "   3. Clean up any remaining conditional code using these flags"
  echo "   4. Archive flags in PostHog/Vercel Toolbar if applicable"
  echo ""
  echo "ℹ️  Notes:"
  echo "   - Some flags may be new and waiting for implementation"
  echo "   - Some may be experiment flags used in specific branches"
  echo "   - Some may be kept intentionally for rollback capability"
  echo ""
  echo "Review the list and manually verify before removal."
  
  # Exit with code 0 to not block CI, but provide the list
  exit 0
else
  echo ""
  echo "✅ All feature flags appear to be in use!"
  exit 0
fi
