#!/bin/bash

# Full Upgrade Script: Node.js 22 + Angular 18
# ⚠️ WARNING: This will require significant code changes

echo "🚀 Full upgrade to Node.js 22 LTS + Angular 18..."
echo "⚠️  WARNING: This will require code migration!"

# Install latest Node.js
if ! command -v nvm &> /dev/null; then
    echo "Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    source ~/.bashrc
fi

# Install Node.js 22 LTS
nvm install 22
nvm use 22
nvm alias default 22

echo "✅ Node.js 22 installed!"
echo "Current versions:"
node --version
npm --version

echo "🔄 Next steps for Angular upgrade:"
echo "   1. cd to your portfolio directory"
echo "   2. Run: npx @angular/cli@latest update"
echo "   3. Follow the migration guide"
echo "   4. Update package.json dependencies"
echo "   5. Fix breaking changes"
echo ""
echo "📚 Angular migration resources:"
echo "   - https://update.angular.io/"
echo "   - https://angular.dev/update-guide"