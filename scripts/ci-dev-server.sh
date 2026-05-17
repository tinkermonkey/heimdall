#!/bin/bash
# Starts the vite dev server for CI environments where the project directory
# may not be writable. Copies config to /tmp so vite can write its temp files.
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TEMP_DIR="/tmp/vite-ci"

mkdir -p "$TEMP_DIR"
cp "$PROJECT_DIR/vite.config.mjs" "$TEMP_DIR/vite.config.mjs"

# Symlink node_modules so imports resolve correctly
ln -sfn "$PROJECT_DIR/node_modules" "$TEMP_DIR/node_modules"

exec npx vite "$PROJECT_DIR" --config "$TEMP_DIR/vite.config.mjs"
