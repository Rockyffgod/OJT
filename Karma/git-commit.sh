#!/bin/bash
set -e
cd "$(dirname "$0")"

if [ $# -eq 0 ]; then
    echo "Usage: $0 \"commit message\""
    exit 1
fi

echo "=== Git: Adding all changes ==="
git add .

echo "=== Git: Committing ==="
git commit -m "$*"

echo "=== Git: Pushing to origin ==="
git push

echo "=== Done ==="
