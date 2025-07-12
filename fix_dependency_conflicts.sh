#!/bin/bash

echo "🔧 Fixing npm dependency resolution conflicts..."
echo "=============================================="

# Navigate to portfolio directory (update path as needed)
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from your portfolio directory"
    exit 1
fi

echo "📊 Current directory: $(pwd)"
echo "📦 Found package.json ✅"

# Clean existing installations
echo ""
echo "🧹 Step 1: Cleaning existing dependencies..."
rm -rf node_modules package-lock.json
echo "   ✅ Cleaned node_modules and package-lock.json"

# Install with legacy peer deps flag
echo ""
echo "📦 Step 2: Installing dependencies with legacy peer deps..."
npm install --legacy-peer-deps

if [ $? -eq 0 ]; then
    echo "   ✅ Dependencies installed successfully!"
else
    echo "   ❌ Installation failed"
    exit 1
fi

# Test build
echo ""
echo "🏗️  Step 3: Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "   ✅ Build successful!"
else
    echo "   ❌ Build failed"
    exit 1
fi

echo ""
echo "🎉 Success! Your portfolio is ready to run."
echo ""
echo "🚀 Next steps:"
echo "   npm start              # Start development server"
echo "   open http://localhost:3000  # View in browser"