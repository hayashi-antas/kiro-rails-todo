# Deployment Guide

This guide covers deploying the Passkey Todo Board application to production environments.

## Render Platform Deployment (Recommended)

The application is configured for deployment on Render, which provides a simple and cost-effective hosting solution.

### Prerequisites

- Render account (free tier available)
- GitHub repository with your code
- Domain name (optional, Render provides free subdomains)

### Deployment Steps

1. **Connect GitHub Repository:**
   - Log in to Render dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository branch (usually `main`)

2. **Configure Build Settings:**
   ```yaml
   # These settings are automatically detected from render.yaml
   Build Command: bundle install && npm install && npm run build
   Start Command: bundle exec rails server -p $PORT
   ```

3. **Set Environment Variables:**
   ```bash
   RAILS_ENV=production
   RAILS_MASTER_KEY=<your-master-key>
   DATABASE_URL=<automatically-provided>
   WEBAUTHN_ORIGIN=https://your-app-name.onrender.com
   WEBAUTHN_RP_ID=your-app-name.onrender.com
   ```

4. **Create Database:**
   - In Render dashboard, create a new PostgreSQL database
   - Link it to your web service
   - Database URL is automatically provided

5. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically build and deploy
   - Monitor build logs for any issues

### Render Configuration File

The project includes a `render.yaml` file for automated deployment:

```yaml
services:
  - type: web
    name: passkey-todo-board
    env: ruby
    buildCommand: bundle install && npm install && npm run build
    startCommand: bundle exec rails server -p $PORT
    envVars:
      - key: RAILS_ENV
        value: production
      - key: WEBAUTHN_ORIGIN
        value: https://passkey-todo-board.onrender.com
      - key: WEBAUTHN_RP_ID
        value: passkey-todo-board.onrender.com
      - key: RAILS_MASTER_KEY
        fromDatabase:
          name: passkey-todo-board-db
          property: connectionString

databases:
  - name: passkey-todo-board-db
    databaseName: passkey_todo_board_production
    user: passkey_todo_board
```

### Post-Deployment Steps

1. **Run Database Migrations:**
   ```bash
   # Render automatically runs migrations during deployment
   # If needed, you can run them manually via Render shell
   ```

2. **Verify Deployment:**
   - Visit your application URL
   - Test Passkey registration (requires HTTPS)
   - Create and manage todos
   - Test drag-and-drop functionality

3. **Monitor Application:**
   - Check Render logs for any errors
   - Monitor database performance
   - Set up uptime monitoring (optional)

## Alternative Deployment Options

### Heroku Deployment

1. **Install Heroku CLI:**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Other platforms: https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Create Heroku App:**
   ```bash
   heroku create your-app-name
   heroku addons:create heroku-postgresql:mini
   ```

3. **Configure Environment Variables:**
   ```bash
   heroku config:set RAILS_MASTER_KEY=$(cat config/master.key)
   heroku config:set WEBAUTHN_ORIGIN=https://your-app-name.herokuapp.com
   heroku config:set WEBAUTHN_RP_ID=your-app-name.herokuapp.com
   ```

4. **Deploy:**
   ```bash
   git push heroku main
   heroku run rails db:migrate
   ```

### Docker Deployment

1. **Build Production Image:**
   ```bash
   docker build -t passkey-todo-board .
   ```

2. **Run with Docker Compose:**
   ```yaml
   # docker-compose.prod.yml
   version: '3.8'
   services:
     web:
       image: passkey-todo-board
       ports:
         - "3000:3000"
       environment:
         - RAILS_ENV=production
         - DATABASE_URL=postgresql://user:pass@db:5432/app_production
         - WEBAUTHN_ORIGIN=https://yourdomain.com
         - WEBAUTHN_RP_ID=yourdomain.com
       depends_on:
         - db
     
     db:
       image: postgres:15
       environment:
         - POSTGRES_DB=app_production
         - POSTGRES_USER=user
         - POSTGRES_PASSWORD=pass
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

3. **Deploy:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `RAILS_ENV` | Rails environment | `production` |
| `RAILS_MASTER_KEY` | Rails credentials key | `abc123...` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| `WEBAUTHN_ORIGIN` | Application origin | `https://yourdomain.com` |
| `WEBAUTHN_RP_ID` | Relying party ID | `yourdomain.com` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `RAILS_LOG_LEVEL` | Log level | `info` |
| `RAILS_SERVE_STATIC_FILES` | Serve static files | `true` |

### Rails Credentials

Sensitive configuration is stored in Rails credentials:

```bash
# Edit credentials (development)
EDITOR=nano rails credentials:edit

# Edit production credentials
EDITOR=nano rails credentials:edit --environment production
```

Example credentials structure:
```yaml
# config/credentials/production.yml.enc
secret_key_base: <generated-secret>
database:
  password: <db-password>
webauthn:
  origin: https://yourdomain.com
  rp_id: yourdomain.com
```

## SSL/HTTPS Configuration

WebAuthn requires HTTPS in production. Most hosting platforms provide SSL automatically.

### Custom Domain SSL

If using a custom domain:

1. **Configure DNS:**
   ```
   CNAME: www.yourdomain.com → your-app.onrender.com
   A: yourdomain.com → <render-ip>
   ```

2. **Add Custom Domain in Render:**
   - Go to your service settings
   - Add custom domain
   - Render will provision SSL certificate automatically

3. **Update Environment Variables:**
   ```bash
   WEBAUTHN_ORIGIN=https://yourdomain.com
   WEBAUTHN_RP_ID=yourdomain.com
   ```

## Database Management

### Migrations

Migrations run automatically during deployment on most platforms:

```bash
# Manual migration (if needed)
heroku run rails db:migrate
# or
render shell rails db:migrate
```

### Backups

**Render:**
- Automatic daily backups included
- Manual backups via dashboard

**Heroku:**
```bash
heroku pg:backups:capture
heroku pg:backups:download
```

**Manual Backup:**
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Database Seeding

**Never run seeds in production** unless specifically needed:

```bash
# Only if absolutely necessary
heroku run rails db:seed RAILS_ENV=production
```

## Monitoring and Logging

### Application Logs

**Render:**
```bash
# View logs in dashboard or CLI
render logs --service your-service-name
```

**Heroku:**
```bash
heroku logs --tail
heroku logs --source app
```

### Error Monitoring

Consider integrating error monitoring services:

1. **Sentry:**
   ```ruby
   # Gemfile
   gem 'sentry-ruby'
   gem 'sentry-rails'
   ```

2. **Rollbar:**
   ```ruby
   # Gemfile
   gem 'rollbar'
   ```

3. **Bugsnag:**
   ```ruby
   # Gemfile
   gem 'bugsnag'
   ```

### Performance Monitoring

**New Relic:**
```ruby
# Gemfile
gem 'newrelic_rpm'
```

**Scout APM:**
```ruby
# Gemfile
gem 'scout_apm'
```

## Security Considerations

### Production Security Checklist

- [ ] HTTPS enabled and enforced
- [ ] Secure cookie settings configured
- [ ] CSRF protection enabled
- [ ] SQL injection protection (ActiveRecord)
- [ ] XSS protection enabled
- [ ] Content Security Policy configured
- [ ] Rate limiting implemented (optional)
- [ ] Database credentials secured
- [ ] Rails master key secured
- [ ] Error pages don't expose sensitive info

### WebAuthn Security

- [ ] Origin validation configured correctly
- [ ] RP ID matches domain
- [ ] Challenge generation is cryptographically secure
- [ ] Credentials stored securely (public keys only)
- [ ] Sign count verification implemented

### Rails Security Configuration

```ruby
# config/environments/production.rb
Rails.application.configure do
  # Force SSL
  config.force_ssl = true
  
  # Secure cookies
  config.session_store :cookie_store, 
    key: '_passkey_todo_board_session',
    secure: true,
    httponly: true,
    same_site: :lax
  
  # Content Security Policy
  config.content_security_policy do |policy|
    policy.default_src :self
    policy.script_src :self
    policy.style_src :self, :unsafe_inline
  end
end
```

## Performance Optimization

### Asset Optimization

Assets are automatically optimized during build:

```bash
# Precompile assets
rails assets:precompile

# Vite builds optimized React bundle
npm run build
```

### Database Optimization

1. **Indexes:**
   ```ruby
   # Ensure proper indexes exist
   add_index :todos, [:user_id, :position], unique: true
   add_index :credentials, :credential_id, unique: true
   ```

2. **Connection Pooling:**
   ```ruby
   # config/database.yml
   production:
     pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
   ```

### Caching

Enable caching in production:

```ruby
# config/environments/production.rb
config.cache_classes = true
config.action_controller.perform_caching = true
config.cache_store = :memory_store
```

## Troubleshooting

### Common Deployment Issues

**Build Failures:**
```bash
# Check build logs
render logs --service your-service --type build

# Common fixes:
# - Ensure all dependencies in Gemfile/package.json
# - Check Ruby/Node versions
# - Verify asset compilation
```

**WebAuthn Issues:**
```bash
# Check environment variables
render env --service your-service

# Verify:
# - WEBAUTHN_ORIGIN matches actual domain
# - WEBAUTHN_RP_ID is correct
# - HTTPS is enabled
```

**Database Issues:**
```bash
# Check database connection
render shell rails console
> ActiveRecord::Base.connection.execute("SELECT 1")

# Run migrations if needed
render shell rails db:migrate
```

### Health Checks

Add a health check endpoint:

```ruby
# config/routes.rb
get '/health', to: 'health#check'

# app/controllers/health_controller.rb
class HealthController < ApplicationController
  def check
    render json: { 
      status: 'ok', 
      timestamp: Time.current,
      database: database_status
    }
  end
  
  private
  
  def database_status
    ActiveRecord::Base.connection.execute("SELECT 1")
    'connected'
  rescue
    'disconnected'
  end
end
```

### Rollback Strategy

**Render:**
- Use Git to revert to previous commit
- Push to trigger new deployment

**Heroku:**
```bash
heroku releases
heroku rollback v123
```

**Docker:**
```bash
# Tag stable versions
docker tag passkey-todo-board:latest passkey-todo-board:stable

# Rollback
docker-compose down
docker-compose up -d passkey-todo-board:stable
```

## Maintenance

### Regular Tasks

1. **Monitor logs** for errors and performance issues
2. **Update dependencies** regularly for security patches
3. **Monitor database** size and performance
4. **Test WebAuthn flows** across different browsers
5. **Backup database** regularly (automated on most platforms)

### Updates and Patches

```bash
# Update dependencies
bundle update
npm update

# Security patches
bundle audit
npm audit

# Deploy updates
git push origin main
```

This deployment guide ensures a smooth and secure production deployment of your Passkey Todo Board application.