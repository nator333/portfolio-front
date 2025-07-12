#!/bin/bash

echo "🚀 QUICK FIX: OpenSSL Error for Node.js 18 + Angular 7"
echo "===================================================="

# Step 1: Kill any running processes
echo "🛑 Stopping any running processes..."
pkill -f ng 2>/dev/null || echo "No ng processes to stop"

# Step 2: Set environment variable and start
echo ""
echo "🔧 Starting with OpenSSL legacy provider..."
echo "This will fix the 'digital envelope routines::unsupported' error"
echo ""

# Export the NODE_OPTIONS for current session
export NODE_OPTIONS=--openssl-legacy-provider

# Start the development server
echo "🚀 Starting development server..."
npm run ng serve -- --host 0.0.0.0 --port 3000 --poll 2000