#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Ruby dependencies
bundle install

# Install Node.js dependencies
npm install

# Build frontend assets
npm run build:production

# Precompile Rails assets
bundle exec rails assets:precompile

# Run database migrations
bundle exec rails db:migrate