#!/bin/bash

# Git Commands to Create Pull Request for Dependency Updates

echo "🔄 Creating Pull Request for Portfolio Dependencies Update..."

# 1. Create a new branch for the changes
git checkout -b update-dependencies-2025

# 2. Add all the changes
git add .

# 3. Commit with descriptive message
git commit -m "feat: Update portfolio dependencies to latest compatible versions

- Update animate.css from 3.7.0 to 4.1.1
- Update bulma from 0.7.4 to 1.0.2  
- Update firebase-tools from 6.9.2 to 13.29.1
- Update prettier from 1.16.4 to 3.4.2
- Update core-js, rxjs, tslib, zone.js to latest compatible versions
- Replace node-sass with sass for ARM64 compatibility
- Add Node.js 20 compatibility with OpenSSL legacy provider
- Fix FontAwesome integration issues
- Enhance development server configuration

✅ All builds working correctly
✅ No breaking changes
✅ Backward compatible
✅ Documentation included"

# 4. Push the branch to origin
git push origin update-dependencies-2025

echo "✅ Branch pushed! Now create PR on GitHub:"
echo "   1. Go to https://github.com/nator333/portfolio-front"
echo "   2. Click 'Compare & pull request'"
echo "   3. Copy the PR description from PR_DESCRIPTION.md"
echo "   4. Submit the pull request"