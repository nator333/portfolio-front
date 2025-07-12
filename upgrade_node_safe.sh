#!/bin/bash

# Safe Node.js Upgrade Script for Angular 7 Portfolio
# This upgrades to Node.js 18 LTS which is the highest version that works with Angular 7

echo "🔄 Upgrading Node.js to v18 LTS (Angular 7 compatible)..."

# Check current Node version
echo "Current Node.js version:"
node --version

# Install Node.js 18 LTS using nvm (recommended)
echo "Installing Node.js 18 LTS..."

# Install nvm if not already installed
if ! command -v nvm &> /dev/null; then
    echo "Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    source ~/.bashrc
fi

# Install and use Node.js 18 LTS
nvm install 18
nvm use 18
nvm alias default 18

# Verify installation
echo "New Node.js version:"
node --version
npm --version

echo "✅ Node.js upgraded successfully!"
echo "⚠️  Note: Using Node.js 18 LTS for Angular 7 compatibility"
echo "🔄 Next steps:"
echo "   1. cd to your portfolio directory"
echo "   2. rm -rf node_modules package-lock.json yarn.lock"
echo "   3. yarn install"
echo "   4. yarn start"