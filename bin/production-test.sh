#!/usr/bin/env bash
# Script to test production build locally

set -e

echo "🔧 Setting up production environment..."

# Set production environment
export RAILS_ENV=production
export RAILS_SERVE_STATIC_FILES=true
export RAILS_LOG_TO_STDOUT=true

# Set dummy WebAuthn values for local testing
export WEBAUTHN_ORIGIN=https://localhost:3000
export WEBAUTHN_RP_ID=localhost

echo "📦 Installing dependencies..."
bundle install --without development test
npm install

echo "🏗️  Building assets..."
npm run build:production
bundle exec rails assets:precompile

echo "🗄️  Setting up database..."
bundle exec rails db:prepare

echo "🚀 Starting production server..."
echo "Visit https://localhost:3000 (you'll need to set up SSL for WebAuthn testing)"
bundle exec rails server -p 3000 -e production