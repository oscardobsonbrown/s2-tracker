#!/bin/bash

# N+1 Query Detection Script
# Scans the codebase for potential N+1 query patterns

set -e

echo "🔍 N+1 Query Detection Scanner"
echo "==============================="
echo ""

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Track findings
TOTAL_ISSUES=0
HIGH_RISK=0
MEDIUM_RISK=0
LOW_RISK=0

echo "📊 Scanning for N+1 query patterns..."
echo ""

# Pattern 1: Database queries inside loops
echo "${YELLOW}Pattern 1: Database queries inside loops${NC}"
echo "----------------------------------------"

# Search for .map() with database calls
MAP_DB_PATTERNS=$(grep -r -B 2 -A 2 "\.map.*(" \
  --include="*.ts" \
  --include="*.tsx" \
  apps/ packages/ 2>/dev/null | \
  grep -E "(database\.|db\.|select\(|findMany|findUnique|query)" | \
  head -20 || true)

if [ -n "$MAP_DB_PATTERNS" ]; then
  echo "$MAP_DB_PATTERNS" | while read -r line; do
    if [[ "$line" =~ \.map.*\( ]]; then
      echo "⚠️  Potential N+1: .map() with database operations"
      echo "   $line"
      TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
      HIGH_RISK=$((HIGH_RISK + 1))
    fi
  done
else
  echo "${GREEN}✅ No database queries found inside .map() calls${NC}"
fi
echo ""

# Pattern 2: Sequential await in loops
echo "${YELLOW}Pattern 2: Sequential database calls in loops${NC}"
echo "-----------------------------------------------"

# Find for/of loops with await database calls
FOR_OF_DB=$(grep -r -B 5 "await.*database" \
  --include="*.ts" \
  --include="*.tsx" \
  apps/ packages/ 2>/dev/null | \
  grep -B 3 "for.*of" | \
  head -30 || true)

if [ -n "$FOR_OF_DB" ]; then
  echo "⚠️  Sequential awaits in loops detected:"
  echo "$FOR_OF_DB"
  TOTAL_ISSUES=$((TOTAL_ISSUES + 2))
  HIGH_RISK=$((HIGH_RISK + 2))
else
  echo "${GREEN}✅ No sequential awaits in loops detected${NC}"
fi
echo ""

# Pattern 3: Multiple single queries instead of batch
echo "${YELLOW}Pattern 3: Multiple single-record queries${NC}"
echo "------------------------------------------"

# Find patterns where we query by ID in a loop
ID_QUERIES=$(grep -r "findUnique\|select.*where.*id\|\.where.*eq.*id" \
  --include="*.ts" \
  --include="*.tsx" \
  apps/ packages/ 2>/dev/null | \
  head -20 || true)

if [ -n "$ID_QUERIES" ]; then
  echo "ℹ️  Single-record queries found (review for batch opportunities):"
  echo "$ID_QUERIES" | while read -r line; do
    echo "   $line"
  done
  TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
  MEDIUM_RISK=$((MEDIUM_RISK + 1))
else
  echo "${GREEN}✅ No suspicious single-record query patterns${NC}"
fi
echo ""

# Pattern 4: Missing include/join patterns
echo "${YELLOW}Pattern 4: Potential missing relations${NC}"
echo "-------------------------------------"

# Find queries that select from one table then access another
SEPARATE_QUERIES=$(grep -r "await.*select\|await.*find" \
  --include="*.ts" \
  --include="*.tsx" \
  apps/ packages/ 2>/dev/null | \
  grep -v "include\|join\|with:" | \
  head -15 || true)

if [ -n "$SEPARATE_QUERIES" ]; then
  echo "ℹ️  Queries without explicit includes (may need eager loading):"
  echo "$SEPARATE_QUERIES" | while read -r line; do
    if [[ ! "$line" =~ (include|join|with:) ]]; then
      echo "   $line"
    fi
  done
  TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
  LOW_RISK=$((LOW_RISK + 1))
else
  echo "${GREEN}✅ All queries appear to use proper includes${NC}"
fi
echo ""

# Pattern 5: Database calls in component rendering
echo "${YELLOW}Pattern 5: Database calls in component render${NC}"
echo "----------------------------------------------"

# Find async components that query database
ASYNC_DB_COMPONENTS=$(grep -r -B 3 "async function\|const.*=.*async" \
  --include="*.tsx" \
  apps/app/app/ apps/web/app/ 2>/dev/null | \
  grep -A 3 "database\|db\." | \
  head -20 || true)

if [ -n "$ASYNC_DB_COMPONENTS" ]; then
  echo "ℹ️  Async components with database calls (review data fetching patterns):"
  echo "$ASYNC_DB_COMPONENTS" | head -10
  TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
  MEDIUM_RISK=$((MEDIUM_RISK + 1))
else
  echo "${GREEN}✅ No async database components detected${NC}"
fi
echo ""

# Pattern 6: Server Components with multiple queries
echo "${YELLOW}Pattern 6: Multiple queries in single component${NC}"
echo "------------------------------------------------"

# Count database calls per file
MULTI_QUERY_FILES=$(grep -l "database\.\|db\." \
  --include="*.tsx" \
  --include="*.ts" \
  -r apps/app/app/ apps/web/app/ 2>/dev/null | \
  while read -r file; do
    count=$(grep -c "database\.\|db\." "$file" 2>/dev/null || echo "0")
    if [ "$count" -gt 3 ]; then
      echo "$file: $count queries"
    fi
  done | head -10 || true)

if [ -n "$MULTI_QUERY_FILES" ]; then
  echo "⚠️  Files with many database queries (may benefit from data loaders):"
  echo "$MULTI_QUERY_FILES"
  TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
  MEDIUM_RISK=$((MEDIUM_RISK + 1))
else
  echo "${GREEN}✅ No files with excessive query counts${NC}"
fi
echo ""

# Summary
echo "📈 N+1 Query Detection Summary"
echo "================================"
echo ""
echo "| Severity | Count |"
echo "|----------|-------|"
echo "| 🔴 High Risk (N+1 likely) | $HIGH_RISK |"
echo "| 🟡 Medium Risk (Review needed) | $MEDIUM_RISK |"
echo "| 🟢 Low Risk (Optimization) | $LOW_RISK |"
echo "| **Total Issues** | **$TOTAL_ISSUES** |"
echo ""

if [ $TOTAL_ISSUES -eq 0 ]; then
  echo "${GREEN}✅ No N+1 query patterns detected!${NC}"
  exit 0
elif [ $HIGH_RISK -gt 0 ]; then
  echo "${RED}⚠️  High risk N+1 patterns detected!${NC}"
  echo ""
  echo "${YELLOW}Recommendations:${NC}"
  echo "1. Use DataLoader pattern for batching queries"
  echo "2. Use JOINs or includes instead of separate queries"
  echo "3. Use Promise.all() for parallel queries"
  echo "4. Consider query result caching"
  exit 1
else
  echo "${YELLOW}ℹ️  Some patterns found that may benefit from optimization${NC}"
  exit 0
fi
