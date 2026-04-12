#!/bin/bash

# Version Drift Detection Script
# Identifies version inconsistencies across workspace packages

set -e

echo "🔍 Checking for version drift in workspace packages..."

# Get all workspace packages and their versions
PACKAGES=$(pnpm list -r --json 2>/dev/null | jq -r '.[] | select(.private != true) | "\(.name):\(.version)"' | sort || true)

if [ -z "$PACKAGES" ]; then
  echo "⚠️ No public packages found in workspace"
  exit 0
fi

echo "📦 Workspace packages:"
echo "$PACKAGES"
echo ""

# Check for inconsistent versions across apps using same package
DRIFT_FOUND=0

# Get all package.json files in apps/ and packages/
find apps packages -name "package.json" -not -path "*/node_modules/*" 2>/dev/null | while read -r pkg_file; do
  if [ -f "$pkg_file" ]; then
    dir=$(dirname "$pkg_file")
    # Check dependencies for workspace protocol mismatches
    deps=$(cat "$pkg_file" | jq -r '.dependencies // {} | to_entries[] | select(.value | startswith("workspace:")) | "\(.key):\(.value)"' 2>/dev/null || true)
    peer_deps=$(cat "$pkg_file" | jq -r '.peerDependencies // {} | to_entries[] | select(.value | startswith("workspace:")) | "\(.key):\(.value)"' 2>/dev/null || true)
    dev_deps=$(cat "$pkg_file" | jq -r '.devDependencies // {} | to_entries[] | select(.value | startswith("workspace:")) | "\(.key):\(.value)"' 2>/dev/null || true)
    
    all_deps="$deps $peer_deps $dev_deps"
    
    if [ -n "$all_deps" ]; then
      for dep in $all_deps; do
        # Check if version specifier is inconsistent
        dep_name=$(echo "$dep" | cut -d: -f1)
        dep_version=$(echo "$dep" | cut -d: -f2-)
        
        # Flag if using anything other than workspace:*
        if [[ "$dep_version" != "workspace:*" ]]; then
          echo "⚠️  $dir uses non-standard workspace version for $dep_name: $dep_version"
          DRIFT_FOUND=1
        fi
      done
    fi
  fi
done

# Check root package.json version against workspace packages
ROOT_VERSION=$(cat package.json | jq -r '.version // "0.0.0"')
echo ""
echo "📋 Root version: $ROOT_VERSION"

# Alert if apps have different versions
APP_VERSIONS=$(find apps -name "package.json" -not -path "*/node_modules/*" -exec cat {} \; 2>/dev/null | jq -s '[.[] | {name: .name, version: .version}]' | jq -r '.[] | "\(.name):\(.version)"' | sort | uniq || true)

echo ""
echo "🏗️  App versions:"
echo "$APP_VERSIONS"

UNIQUE_VERSIONS=$(echo "$APP_VERSIONS" | cut -d: -f2 | sort | uniq | wc -l | tr -d ' ')
if [ "$UNIQUE_VERSIONS" -gt 1 ]; then
  echo ""
  echo "⚠️  WARNING: Apps have different version numbers!"
  echo "Consider aligning versions for consistency."
  DRIFT_FOUND=1
fi

if [ "$DRIFT_FOUND" -eq 1 ]; then
  echo ""
  echo "❌ Version drift detected!"
  echo ""
  echo "💡 Recommendations:"
  echo "   1. Use 'workspace:*' for all internal dependencies"
  echo "   2. Keep app versions aligned with root package version"
  echo "   3. Use 'pnpm bump-deps' to update dependencies consistently"
  exit 1
else
  echo ""
  echo "✅ No version drift detected"
  exit 0
fi
