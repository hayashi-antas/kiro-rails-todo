# Docker Development Environment

This directory contains Docker configuration files for the Passkey Todo Board development environment.

## Files

- `init-db.sh` - Database initialization script that creates the test database

## Quick Start

1. **Initial Setup**
   ```bash
   ./bin/dev-setup
   ```

2. **Start Development Environment**
   ```bash
   make up
   ```

3. **View Application**
   Open http://localhost:3000 in your browser

## Available Commands

### Make Commands

- `make setup` - Full environment setup (build, install dependencies, setup database)
- `make up` - Start all services in background
- `make down` - Stop all services
- `make logs` - View logs from all services
- `make shell` - Open bash shell in web container
- `make test` - Run RSpec tests
- `make console` - Open Rails console
- `make db-reset` - Reset database (drop, create, migrate, seed)

### Docker Compose Commands

- `docker-compose up` - Start services (foreground)
- `docker-compose up -d` - Start services (background)
- `docker-compose down` - Stop services
- `docker-compose logs -f` - Follow logs
- `docker-compose exec web bash` - Shell into web container
- `docker-compose run --rm web bundle exec rails console` - Rails console

## Services

### Web Service
- **Port**: 3000
- **Environment**: Development
- **Volumes**: 
  - Source code mounted at `/app`
  - Bundle cache for faster gem installs
  - Node modules cache
  - Rails cache

### Database Service
- **Port**: 5432
- **Database**: passkey_todo_board_development
- **User**: postgres
- **Password**: password
- **Health Check**: Ensures database is ready before starting web service

## Environment Variables

The following environment variables are configured for development:

- `DATABASE_URL` - PostgreSQL connection string
- `RAILS_ENV=development`
- `WEBAUTHN_ORIGIN=http://localhost:3000` - Required for WebAuthn
- `WEBAUTHN_RP_ID=localhost` - Required for WebAuthn

## Volumes

- `postgres_data` - Persistent database storage
- `bundle_cache` - Ruby gem cache
- `node_modules` - Node.js dependencies cache
- `rails_cache` - Rails application cache

## Troubleshooting

### Database Connection Issues
```bash
# Check if database is running
docker-compose ps db

# Check database logs
make logs-db

# Reset database
make db-reset
```

### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

### Clean Start
```bash
# Clean everything and start fresh
make clean
make setup
```

### WebAuthn Issues
- Ensure you're accessing the app via `http://localhost:3000` (not 127.0.0.1)
- WebAuthn requires HTTPS in production but allows localhost in development