#!/bin/bash

echo "🔧 Fixing OpenSSL compatibility error for Node.js 18 + Angular 7"
echo "=============================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in current directory"
    echo "Please navigate to your portfolio directory first"
    exit 1
fi

echo "📍 Current directory: $(pwd)"
echo "📊 Node.js version: $(node --version)"

# Step 1: Stop any running processes
echo ""
echo "🛑 Step 1: Stopping any running processes..."
pkill -f ng 2>/dev/null || echo "   No ng processes running"

# Step 2: Update package.json scripts with OpenSSL legacy provider
echo ""
echo "📝 Step 2: Updating package.json scripts with OpenSSL legacy provider..."

# Create updated package.json with proper NODE_OPTIONS
cat > package.json << 'EOF'
{
  "name": "front",
  "version": "0.0.0",
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "scripts": {
    "ng": "ng",
    "start": "NODE_OPTIONS=--openssl-legacy-provider ng serve --host 0.0.0.0 --port 3000 --poll 2000",
    "build": "NODE_OPTIONS=--openssl-legacy-provider ng build",
    "build:prod": "NODE_OPTIONS=--openssl-legacy-provider ng build --prod",
    "test": "NODE_OPTIONS=--openssl-legacy-provider ng test",
    "lint": "ng lint",
    "e2e": "NODE_OPTIONS=--openssl-legacy-provider ng e2e"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^7.2.15",
    "@angular/cdk": "^7.3.7",
    "@angular/common": "^7.2.15",
    "@angular/compiler": "^7.2.15",
    "@angular/core": "^7.2.15",
    "@angular/forms": "^7.2.15",
    "@angular/material": "^7.3.7",
    "@angular/platform-browser": "^7.2.15",
    "@angular/platform-browser-dynamic": "^7.2.15",
    "@angular/router": "^7.2.15",
    "@fortawesome/angular-fontawesome": "^0.3.0",
    "@fortawesome/fontawesome-svg-core": "^1.2.17",
    "@fortawesome/free-solid-svg-icons": "^5.8.1",
    "@ngmodule/material-carousel": "^0.3.1",
    "animate.css": "^4.1.1",
    "bulma": "^1.0.2",
    "bulma-carousel": "^4.0.24",
    "core-js": "^2.6.12",
    "devicons": "^1.8.0",
    "firebase-tools": "^13.29.1",
    "font-awesome": "^4.7.0",
    "rxjs": "~6.3.3",
    "tslib": "^1.14.1",
    "zone.js": "~0.8.29"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "~0.13.0",
    "@angular/cli": "~7.3.8",
    "@angular/compiler-cli": "^7.2.15",
    "@angular/language-service": "^7.2.15",
    "@types/jasmine": "~2.8.8",
    "@types/jasminewd2": "~2.0.3",
    "@types/node": "~18.19.0",
    "codelyzer": "~4.5.0",
    "jasmine-core": "~2.99.1",
    "jasmine-spec-reporter": "~4.2.1",
    "karma": "~4.0.0",
    "karma-chrome-launcher": "~2.2.0",
    "karma-coverage-istanbul-reporter": "~2.0.1",
    "karma-jasmine": "~1.1.2",
    "karma-jasmine-html-reporter": "^0.2.2",
    "ngx-owl-carousel-o": "^1.1.3",
    "prettier": "^3.4.2",
    "protractor": "~5.4.0",
    "ts-node": "~7.0.0",
    "tslint": "~5.11.0",
    "tslint-config-prettier": "^1.18.0",
    "tslint-plugin-prettier": "^2.0.1",
    "typescript": "~3.2.2",
    "sass": "^1.81.1"
  }
}
EOF

echo "   ✅ Updated package.json with NODE_OPTIONS=--openssl-legacy-provider"

# Step 3: Test the fix
echo ""
echo "🚀 Step 3: Testing the fix..."
echo "Starting development server with OpenSSL legacy provider..."

npm start &
SERVER_PID=$!

# Wait a bit and check if it's working
sleep 10

if ps -p $SERVER_PID > /dev/null; then
    echo "   ✅ Server started successfully!"
    echo "   🌐 Available at: http://localhost:3000"
    echo ""
    echo "🎉 OpenSSL compatibility issue fixed!"
    echo ""
    echo "📋 All commands now work with Node.js 18:"
    echo "   npm start        # Development server"
    echo "   npm run build    # Development build"
    echo "   npm run build:prod # Production build"
    echo ""
    echo "⚠️  Note: Server is running in background (PID: $SERVER_PID)"
    echo "   To stop: kill $SERVER_PID"
else
    echo "   ❌ Server failed to start"
    echo "   Check the output above for any additional errors"
fi