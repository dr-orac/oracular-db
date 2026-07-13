#!/bin/sh
# One-time setup after cloning: make the versioned commit guard active locally.
set -eu

root="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "Run this script from inside the repository." >&2
  exit 1
}

cd "$root"
git config core.hooksPath tools/git-hooks
echo "Git hooks configured. Commits now run tools/selfcheck.py automatically."
