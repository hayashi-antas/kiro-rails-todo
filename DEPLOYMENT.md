# Deployment Guide

This application is configured for deployment on Render.com using the included `render.yaml` configuration.

## Prerequisites

1. A Render.com account
2. A GitHub repository with this code
3. Environment variables configured in Render

## Environment Variables

The following environment variables must be configured in Render:

### Required Variables

- `RAILS_MASTER_KEY`: Rails credentials encryption key (from `config/master.key`)
- `WEBAUTHN_ORIGIN`: The full URL of your deployed application (e.g., `https://your-app.onrender.com`)
- `WEBAUTHN_RP_ID`: The domain of your deployed application (e.g., `your-app.onrender.com`)

### Automatically Set Variables

These are set automatically by the `render.yaml` configuration:

- `RAILS_ENV=production`
- `RAILS_SERVE_STATIC_FILES=true`
- `RAILS_LOG_TO_STDOUT=true`
- `DATABASE_URL` (from the PostgreSQL database service)

## Deployment Steps

1. **Connect Repository**: Connect your GitHub repository to Render
2. **Configure Environment Variables**: Set the required environment variables in the Render dashboard
3. **Deploy**: Render will automatically build and deploy using the `render.yaml` configuration

## Build Process

The deployment uses the `bin/render-build.sh` script which:

1. Installs Ruby dependencies (`bundle install`)
2. Installs Node.js dependencies (`npm install`)
3. Builds frontend assets (`npm run build:production`)
4. Precompiles Rails assets (`bundle exec rails assets:precompile`)
5. Runs database migrations (`bundle exec rails db:migrate`)

## Health Checks

The application includes a health check endpoint at `/up` that Render uses to verify the application is running correctly.

## Database

The application uses PostgreSQL with automatic migrations during deployment. The database connection is configured via the `DATABASE_URL` environment variable.

## Static Assets

Static assets are served by Rails in production mode with appropriate caching headers. The Vite-built frontend assets are integrated with Rails' asset pipeline.

## SSL/HTTPS

Render provides SSL termination, so the application runs over HTTPS in production, which is required for WebAuthn functionality.

## Troubleshooting

### Build Failures

- Check that all dependencies are properly listed in `Gemfile` and `package.json`
- Verify that the `RAILS_MASTER_KEY` environment variable is set correctly
- Check build logs for specific error messages

### Runtime Issues

- Verify WebAuthn environment variables (`WEBAUTHN_ORIGIN` and `WEBAUTHN_RP_ID`) match your deployed domain
- Check application logs for database connection issues
- Ensure health check endpoint `/up` is accessible

### WebAuthn Issues

- Verify `WEBAUTHN_ORIGIN` includes the full URL with protocol (https://)
- Ensure `WEBAUTHN_RP_ID` matches the domain exactly
- Check browser console for WebAuthn-specific errors