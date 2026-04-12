#!/bin/bash

# Technical Debt Scanner
# Scans the codebase for common tech debt indicators

set -e

echo "🔍 Technical Debt Scanner"
echo ""

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "📊 Scanning for technical debt..."
echo ""

# 1. Large files
echo "${YELLOW}## Large Files (>500 lines)${NC}"
echo ""
LARGE_FILES=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" \
  -not -path "*/__tests__/*" \
  -exec wc -l {} \; 2>/dev/null | \
  awk '$1 > 500 {printf "  - %s (%d lines)\n", $2, $1}' | \
  head -20)

if [ -n "$LARGE_FILES" ]; then
  echo "$LARGE_FILES"
  echo ""
  echo "${YELLOW}Consider breaking these files into smaller modules${NC}"
else
  echo "${GREEN}✅ No large files found${NC}"
fi
echo ""

# 2. TODO/FIXME/XXX comments
echo "${YELLOW}## TODO/FIXME/XXX Comments${NC}"
echo ""

TODO_COUNT=$(grep -r "TODO\|FIXME\|XXX" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=dist \
  . 2>/dev/null | wc -l | tr -d ' ')

if [ "$TODO_COUNT" -gt 0 ]; then
  echo "${YELLOW}Found $TODO_COUNT TODO/FIXME/XXX comments${NC}"
  echo ""
  echo "Top 10:"
  grep -r -n "TODO\|FIXME\|XXX" \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.jsx" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=dist \
    . 2>/dev/null | \
    head -10 | \
    while read -r line; do
      echo "  $line"
    done
  echo ""
  echo "${YELLOW}Consider addressing these before they accumulate${NC}"
else
  echo "${GREEN}✅ No TODO/FIXME/XXX comments found${NC}"
fi
echo ""

# 3. Check for any console.logs
echo "${YELLOW}## Console Statements${NC}"
echo ""

CONSOLE_COUNT=$(grep -r "console\." \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=dist \
  . 2>/dev/null | grep -v "// " | wc -l | tr -d ' ')

if [ "$CONSOLE_COUNT" -gt 0 ]; then
  echo "${YELLOW}Found $CONSOLE_COUNT console statements${NC}"
  echo "${YELLOW}Consider using proper logging instead of console${NC}"
else
  echo "${GREEN}✅ No console statements found${NC}"
fi
echo ""

# 4. Outdated dependencies
echo "${YELLOW}## Outdated Dependencies${NC}"
echo ""

# Check if pnpm outdated works
OUTDATED=$(pnpm outdated --json 2>/dev/null | jq -r 'keys | length' || echo "unknown")

if [ "$OUTDATED" != "unknown" ] && [ "$OUTDATED" -gt 0 ]; then
  echo "${YELLOW}$OUTDATED outdated packages found${NC}"
  echo "${YELLOW}Run 'pnpm bump-deps' to update dependencies${NC}"
else
  echo "${GREEN}✅ Dependencies are up to date${NC}"
fi
echo ""

# Summary
echo "📈 Summary"
echo "=========="
echo ""
echo "| Metric | Count | Status |"
echo "|--------|-------|--------|"

if [ -n "$LARGE_FILES" ]; then
  LARGE_COUNT=$(echo "$LARGE_FILES" | wc -l | tr -d ' ')
  echo "| Large Files | $LARGE_COUNT | ⚠️ |"
else
  echo "| Large Files | 0 | ✅ |"
fi

echo "| TODO/FIXME | $TODO_COUNT | $([ "$TODO_COUNT" -gt 10 ] && echo "⚠️" || echo "✅") |"
echo "| Console Logs | $CONSOLE_COUNT | $([ "$CONSOLE_COUNT" -gt 0 ] && echo "⚠️" || echo "✅") |"
echo "| Outdated Deps | $OUTDATED | $([ "$OUTDATED" != "unknown" ] && [ "$OUTDATED" -gt 5 ] && echo "⚠️" || echo "✅") |"
echo ""

echo "💡 Run ${YELLOW}pnpm tech-debt:scan${NC} anytime to check tech debt status"
echo "📊 Weekly reports are generated automatically via GitHub Actions"
echo ""
