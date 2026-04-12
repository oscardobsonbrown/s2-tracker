#!/bin/bash

# Flaky Test Quarantine Script
# Manages quarantined tests by excluding them from test runs

set -e

FLAKY_TESTS_FILE=".flaky-tests.json"
VITEST_CONFIG="packages/testing/src/vitest/node.ts"

echo "🔍 Flaky Test Quarantine Manager"
echo ""

# Function to check if flaky tests exist
check_flaky_tests() {
  if [ -f "$FLAKY_TESTS_FILE" ]; then
    local count=$(jq -r '.tests | length' "$FLAKY_TESTS_FILE" 2>/dev/null || echo "0")
    echo "Found $count quarantined test(s) in $FLAKY_TESTS_FILE"
    return 0
  else
    echo "No $FLAKY_TESTS_FILE found - no tests are currently quarantined"
    return 1
  fi
}

# Function to list quarantined tests
list_quarantined() {
  if [ -f "$FLAKY_TESTS_FILE" ]; then
    echo "📋 Currently Quarantined Tests:"
    echo ""
    jq -r '.tests[] | "  • \(.name)\n    File: \(.file)\n    Reason: \(.reason)\n    Quarantined: \(.quarantinedAt)\n"' "$FLAKY_TESTS_FILE" 2>/dev/null || echo "  No tests currently quarantined"
  fi
}

# Function to quarantine a test
quarantine_test() {
  local test_name="$1"
  local test_file="$2"
  local reason="$3"
  
  if [ -z "$test_name" ] || [ -z "$test_file" ] || [ -z "$reason" ]; then
    echo "❌ Usage: quarantine <test-name> <test-file> <reason>"
    exit 1
  fi
  
  echo "🚫 Quarantining test: $test_name"
  
  # Create file if it doesn't exist
  if [ ! -f "$FLAKY_TESTS_FILE" ]; then
    cat > "$FLAKY_TESTS_FILE" << 'EOF'
{
  "$schema": "./flaky-tests.schema.json",
  "description": "List of known flaky tests to be quarantined from regular CI runs",
  "quarantinePolicy": {
    "maxRetries": 3,
    "autoQuarantineThreshold": 5,
    "maxQuarantineDuration": "30d"
  },
  "tests": [],
  "metadata": {
    "lastUpdated": "",
    "totalQuarantined": 0
  }
}
EOF
  fi
  
  # Add test to quarantine list
  local today=$(date +%Y-%m-%d)
  local new_test=$(jq -n \
    --arg name "$test_name" \
    --arg file "$test_file" \
    --arg reason "$reason" \
    --arg date "$today" \
    '{name: $name, file: $file, reason: $reason, quarantinedAt: $date}')
  
  jq --argjson test "$new_test" \
     --arg date "$today" \
     '.tests += [$test] | .metadata.lastUpdated = $date | .metadata.totalQuarantined = (.tests | length)' \
     "$FLAKY_TESTS_FILE" > "$FLAKY_TESTS_FILE.tmp" && \
     mv "$FLAKY_TESTS_FILE.tmp" "$FLAKY_TESTS_FILE"
  
  echo "✅ Test quarantined successfully"
  echo ""
  echo "💡 To run quarantined tests separately:"
  echo "   pnpm test:quarantined"
}

# Function to unquarantine a test
unquarantine_test() {
  local test_name="$1"
  
  if [ -z "$test_name" ]; then
    echo "❌ Usage: unquarantine <test-name>"
    exit 1
  fi
  
  echo "✅ Unquarantining test: $test_name"
  
  if [ -f "$FLAKY_TESTS_FILE" ]; then
    local today=$(date +%Y-%m-%d)
    jq --arg name "$test_name" \
       --arg date "$today" \
       '.tests |= map(select(.name != $name)) | .metadata.lastUpdated = $date | .metadata.totalQuarantined = (.tests | length)' \
       "$FLAKY_TESTS_FILE" > "$FLAKY_TESTS_FILE.tmp" && \
       mv "$FLAKY_TESTS_FILE.tmp" "$FLAKY_TESTS_FILE"
    
    echo "✅ Test removed from quarantine"
  fi
}

# Show help
show_help() {
  cat << 'EOF'
Flaky Test Quarantine Manager

Usage:
  ./scripts/flaky-tests.sh [command] [args]

Commands:
  list                     List all quarantined tests
  quarantine <name> <file> <reason>  Add a test to quarantine
  unquarantine <name>      Remove a test from quarantine
  check                    Check if any tests are quarantined
  help                     Show this help message

Examples:
  ./scripts/flaky-tests.sh list
  ./scripts/flaky-tests.sh quarantine "my test" "src/test.ts" "Intermittent timeout"
  ./scripts/flaky-tests.sh unquarantine "my test"

EOF
}

# Main command handling
case "${1:-help}" in
  list)
    list_quarantined
    ;;
  quarantine)
    quarantine_test "$2" "$3" "$4"
    ;;
  unquarantine)
    unquarantine_test "$2"
    ;;
  check)
    check_flaky_tests
    exit $?
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    echo "❌ Unknown command: $1"
    show_help
    exit 1
    ;;
esac
