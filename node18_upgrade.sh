#!/bin/bash

echo "🚀 Starting Node.js 18 LTS Upgrade for Angular 7 Portfolio"
echo "============================================================"

# Check current Node version
echo "📊 Current Node.js version:"
node --version
npm --version
echo ""

# Step 1: Install/Update nvm
echo "🔧 Step 1: Installing/Updating nvm (Node Version Manager)..."
if ! command -v nvm &> /dev/null; then
    echo "   Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # Source nvm for current session
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
else
    echo "   nvm is already installed ✅"
fi

# Step 2: Install Node.js 18 LTS
echo ""
echo "📦 Step 2: Installing Node.js 18 LTS..."
nvm install 18
nvm use 18
nvm alias default 18

# Step 3: Verify installation
echo ""
echo "✅ Step 3: Verification - New versions installed:"
node --version
npm --version

# Step 4: Update npm to latest compatible version
echo ""
echo "🔄 Step 4: Updating npm to latest version..."
npm install -g npm@latest

echo ""
echo "🎉 Node.js 18 LTS upgrade completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Navigate to your portfolio directory"
echo "2. Run the portfolio update script: ./update_portfolio_for_node18.sh"
echo "3. Or manually run these commands:"
echo "   cd your-portfolio-directory"
echo "   rm -rf node_modules package-lock.json yarn.lock"
echo "   yarn install"
echo "   yarn start"
echo ""
echo "🔍 Verification commands:"
echo "   node --version  (should show v18.x.x)"
echo "   npm --version   (should show 10.x.x or higher)"