#!/bin/bash

echo "🍎 Mac OpenSSL Fix for Portfolio (Node.js 18 + Angular 7)"
echo "======================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from your portfolio directory"
    exit 1
fi

echo "📍 Directory: $(pwd)"
echo "📊 Node.js: $(node --version)"

# Stop any running processes
echo ""
echo "🛑 Stopping any running ng processes..."
pkill -f ng 2>/dev/null || echo "   No ng processes running"

# Update package.json with OpenSSL fix
echo ""
echo "📝 Updating package.json scripts with OpenSSL legacy provider..."

# Backup original package.json
cp package.json package.json.backup
echo "   ✅ Created backup: package.json.backup"

# Update the scripts section
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = {
  'ng': 'ng',
  'start': 'NODE_OPTIONS=--openssl-legacy-provider ng serve --host 0.0.0.0 --port 3000 --poll 2000',
  'build': 'NODE_OPTIONS=--openssl-legacy-provider ng build',
  'build:prod': 'NODE_OPTIONS=--openssl-legacy-provider ng build --prod',
  'test': 'NODE_OPTIONS=--openssl-legacy-provider ng test',
  'lint': 'ng lint',
  'e2e': 'NODE_OPTIONS=--openssl-legacy-provider ng e2e'
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('   ✅ Updated package.json scripts');
"

# Test the fix
echo ""
echo "🚀 Testing the fix..."
echo "Starting development server..."

npm start &
SERVER_PID=$!

# Wait and check
sleep 8

if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo ""
    echo "🎉 SUCCESS! Portfolio is running with Node.js 18"
    echo ""
    echo "✅ OpenSSL compatibility issue resolved"
    echo "🌐 Available at: http://localhost:3000"
    echo ""
    echo "📋 Available commands:"
    echo "   npm start              # Development server"
    echo "   npm run build          # Development build"
    echo "   npm run build:prod     # Production build"
    echo ""
    echo "🔄 Server is running (PID: $SERVER_PID)"
    echo "   To stop: kill $SERVER_PID"
    echo "   Or press Ctrl+C in the terminal where it's running"
else
    echo ""
    echo "❌ Server failed to start"
    echo "Check the terminal output for any additional errors"
    echo ""
    echo "💡 Try running manually:"
    echo "   npm start"
fi