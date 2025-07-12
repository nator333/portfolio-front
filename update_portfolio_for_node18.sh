#!/bin/bash

echo "🔄 Updating Portfolio Project for Node.js 18 LTS"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in current directory"
    echo "Please navigate to your portfolio directory first:"
    echo "   cd path/to/your/portfolio-front/front"
    exit 1
fi

# Verify Node.js version
NODE_VERSION=$(node --version)
echo "📊 Current Node.js version: $NODE_VERSION"

if [[ ! $NODE_VERSION == v18.* ]]; then
    echo "⚠️  Warning: You're not using Node.js 18.x"
    echo "Please run the node18_upgrade.sh script first"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 1: Backup current package files
echo ""
echo "💾 Step 1: Creating backup of current package files..."
if [ -f "package-lock.json" ]; then
    cp package-lock.json package-lock.json.backup
    echo "   ✅ package-lock.json backed up"
fi

if [ -f "yarn.lock" ]; then
    cp yarn.lock yarn.lock.backup
    echo "   ✅ yarn.lock backed up"
fi

# Step 2: Clean old dependencies
echo ""
echo "🧹 Step 2: Cleaning old dependencies..."
rm -rf node_modules
if [ -f "package-lock.json" ]; then
    rm package-lock.json
    echo "   ✅ Removed package-lock.json"
fi
if [ -f "yarn.lock" ]; then
    rm yarn.lock
    echo "   ✅ Removed yarn.lock"
fi
echo "   ✅ Removed node_modules"

# Step 3: Update package.json for Node.js 18
echo ""
echo "📝 Step 3: Updating package.json for Node.js 18 compatibility..."

# Create updated package.json with Node.js 18 engines requirement
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
    "start": "ng serve --host 0.0.0.0 --port 3000 --poll 2000",
    "build": "ng build",
    "test": "ng test",
    "lint": "ng lint",
    "e2e": "ng e2e"
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
    "rxjs": "~6.6.7",
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

echo "   ✅ package.json updated with Node.js 18 compatibility"

# Step 4: Install dependencies
echo ""
echo "📦 Step 4: Installing dependencies with Node.js 18..."
if command -v yarn &> /dev/null; then
    echo "   Using Yarn package manager..."
    yarn install
else
    echo "   Using npm package manager..."
    npm install
fi

# Step 5: Test build
echo ""
echo "🏗️  Step 5: Testing build..."
if command -v yarn &> /dev/null; then
    yarn build
else
    npm run build
fi

if [ $? -eq 0 ]; then
    echo "   ✅ Build successful!"
else
    echo "   ❌ Build failed. Check errors above."
    exit 1
fi

# Step 6: Success message
echo ""
echo "🎉 Portfolio successfully updated for Node.js 18 LTS!"
echo ""
echo "✅ What was updated:"
echo "   • Node.js engines requirement: >=18.0.0"
echo "   • @types/node updated to ~18.19.0"
echo "   • All dependencies reinstalled"
echo "   • Build tested successfully"
echo ""
echo "🚀 Ready to run:"
if command -v yarn &> /dev/null; then
    echo "   yarn start    # Start development server"
    echo "   yarn build    # Build for production"
else
    echo "   npm start     # Start development server"
    echo "   npm run build # Build for production"
fi
echo ""
echo "🌐 Development server will be available at: http://localhost:3000"