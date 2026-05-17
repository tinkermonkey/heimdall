#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "Updating Playwright snapshots..."
npx playwright test --update-snapshots

echo "Snapshots updated successfully."
