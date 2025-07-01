#!/bin/bash

# Production startup script for Replit deployment
echo "🚀 Starting EzTax production server for deployment..."

# Change to workspace directory
cd /home/runner/workspace

# Set environment variables
export NODE_ENV=production
export PORT=${PORT:-5000}

# Kill any existing processes on port 5000
echo "Stopping any existing processes on port 5000..."
pkill -f "tsx server/index.ts" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true
sleep 2

# Verify dist/index.js exists
if [ ! -f "dist/index.js" ]; then
    echo "❌ dist/index.js not found, running build..."
    node deployment-replit-final.js
fi

# Start production server
echo "Starting production server on port $PORT..."
node dist/index.js
