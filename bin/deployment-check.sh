#!/usr/bin/env bash
# Script to verify deployment readiness

set -e

echo "🔍 Checking deployment readiness..."

# Check required files exist
echo "📁 Checking required files..."
required_files=(
  "render.yaml"
  "bin/render-build.sh"
  "package.json"
  "Gemfile"
  "config/routes.rb"
  "DEPLOYMENT.md"
)

for file in "${required_files[@]}"; do
  if [[ -f "$file" ]]; then
    echo "✅ $file exists"
  else
    echo "❌ $file missing"
    exit 1
  fi
done

# Check package.json has build script
echo "📦 Checking build scripts..."
if grep -q "build:production" package.json; then
  echo "✅ build:production script found in package.json"
else
  echo "❌ build:production script missing from package.json"
  exit 1
fi

# Check render.yaml structure
echo "🚀 Checking render.yaml structure..."
if grep -q "type: web" render.yaml; then
  echo "✅ Web service configured"
else
  echo "❌ Web service not configured in render.yaml"
  exit 1
fi

if grep -q "healthCheckPath: /up" render.yaml; then
  echo "✅ Health check configured"
else
  echo "❌ Health check not configured in render.yaml"
  exit 1
fi

if grep -q "fromDatabase:" render.yaml; then
  echo "✅ Database connection configured"
else
  echo "❌ Database connection not configured in render.yaml"
  exit 1
fi

# Check WebAuthn configuration
echo "🔐 Checking WebAuthn configuration..."
if grep -q "WEBAUTHN_ORIGIN" config/initializers/webauthn.rb; then
  echo "✅ WebAuthn environment variables configured"
else
  echo "❌ WebAuthn environment variables not configured"
  exit 1
fi

# Check health endpoint exists
echo "🏥 Checking health endpoint..."
if grep -q 'get "up"' config/routes.rb; then
  echo "✅ Health check endpoint configured"
else
  echo "❌ Health check endpoint not found in routes"
  exit 1
fi

echo ""
echo "🎉 Deployment readiness check complete!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Connect your repository to Render"
echo "3. Set environment variables in Render dashboard:"
echo "   - RAILS_MASTER_KEY"
echo "   - WEBAUTHN_ORIGIN"
echo "   - WEBAUTHN_RP_ID"
echo "4. Deploy!"