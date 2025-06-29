#!/bin/bash
# Production deployment optimization script

echo "Starting deployment optimization..."

# Remove development-only files
rm -rf .cache .git/logs .git/refs/remotes
rm -f *.log npm-debug.log*

# Clean up node_modules for production
find node_modules -name "*.d.ts" -type f -delete 2>/dev/null || true
find node_modules -name "*.md" -type f -delete 2>/dev/null || true
find node_modules -name "README*" -type f -delete 2>/dev/null || true
find node_modules -name "CHANGELOG*" -type f -delete 2>/dev/null || true
find node_modules -name "LICENSE*" -type f -delete 2>/dev/null || true
find node_modules -type d -name "test" -exec rm -rf {} + 2>/dev/null || true
find node_modules -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
find node_modules -type d -name "spec" -exec rm -rf {} + 2>/dev/null || true
find node_modules -type d -name "docs" -exec rm -rf {} + 2>/dev/null || true
find node_modules -type d -name "examples" -exec rm -rf {} + 2>/dev/null || true

echo "Deployment optimization completed."