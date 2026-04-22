#!/usr/bin/env bash
set -euo pipefail

get_source_root() {
  if [ -n "${CONDUCTOR_ROOT_PATH:-}" ]; then
    printf '%s\n' "$CONDUCTOR_ROOT_PATH"
    return
  fi

  local common_git_dir
  common_git_dir="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)"
  dirname "$common_git_dir"
}

WORKTREE_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SOURCE_ROOT="$(get_source_root)"

if [ ! -d "$SOURCE_ROOT" ]; then
  echo "Source root not found: $SOURCE_ROOT" >&2
  exit 1
fi

cd "$WORKTREE_ROOT"

copied=0
skipped=0

if [ "$WORKTREE_ROOT" != "$SOURCE_ROOT" ]; then
  while IFS= read -r source_file; do
    relative_path="${source_file#"$SOURCE_ROOT"/}"
    target_file="$WORKTREE_ROOT/$relative_path"

    if [ -e "$target_file" ]; then
      echo "Skipped $relative_path (already exists)"
      skipped=$((skipped + 1))
      continue
    fi

    mkdir -p "$(dirname "$target_file")"
    cp "$source_file" "$target_file"
    echo "Copied $relative_path"
    copied=$((copied + 1))
  done < <(
    find "$SOURCE_ROOT" \
      \( -path "$SOURCE_ROOT/.git" -o -path "$SOURCE_ROOT/node_modules" -o -path "$SOURCE_ROOT/.next" -o -path "$SOURCE_ROOT/.turbo" \) -prune \
      -o -type f \
      \( \
        -name ".env" \
        -o -name ".env.local" \
        -o -name ".env.development.local" \
        -o -name ".env.test.local" \
        -o -name ".env.production.local" \
      \) -print | sort
  )
else
  echo "Primary checkout detected; skipping env file copy."
fi

echo "Copied $copied env file(s); skipped $skipped existing file(s)."
echo "Installing dependencies with pnpm..."
pnpm install
