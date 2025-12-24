# Passkey Todo Board

A modern todo application built with Ruby on Rails 8.1 and React, featuring passwordless authentication using WebAuthn Passkeys and drag-and-drop functionality.

## Technology Stack

- **Backend**: Ruby on Rails 8.1
- **Frontend**: React 19 with TypeScript
- **Database**: PostgreSQL 15
- **Authentication**: WebAuthn/Passkeys
- **Build Tool**: Vite with vite-ruby
- **Drag & Drop**: @dnd-kit
- **Testing**: RSpec with Rantly (property-based testing)
- **Deployment**: Docker & Render

## Development Setup

### Prerequisites

- Ruby 3.4.8
- Node.js (latest LTS)
- PostgreSQL 15
- Docker & Docker Compose (optional)

### Local Development

1. **Install dependencies:**
   ```bash
   bundle install
   npm install
   ```

2. **Setup database:**
   ```bash
   rails db:create db:migrate
   ```

3. **Start development servers:**
   ```bash
   # Terminal 1: Rails server
   rails server
   
   # Terminal 2: Vite dev server
   bin/vite dev
   ```

4. **Run tests:**
   ```bash
   bundle exec rspec
   ```

### Docker Development

1. **Build and start services:**
   ```bash
   make setup
   make up
   ```

2. **Setup database:**
   ```bash
   make db-setup
   ```

3. **View logs:**
   ```bash
   make logs
   ```

4. **Run tests:**
   ```bash
   make test
   ```

## Project Structure

```
├── app/
│   ├── controllers/          # Rails controllers
│   ├── models/              # ActiveRecord models
│   ├── views/               # Rails views
│   └── frontend/            # React frontend
│       ├── components/      # React components
│       ├── pages/          # Page components
│       ├── hooks/          # Custom React hooks
│       ├── types/          # TypeScript types
│       └── entrypoints/    # Vite entry points
├── config/                  # Rails configuration
├── db/                     # Database migrations and schema
├── spec/                   # RSpec tests
├── docker-compose.yml      # Docker development setup
├── Dockerfile             # Docker image definition
├── Makefile              # Development commands
└── vite.config.ts        # Vite configuration
```

## Available Commands

- `make setup` - Initial project setup
- `make up` - Start all services
- `make down` - Stop all services
- `make logs` - View application logs
- `make shell` - Open shell in web container
- `make db-setup` - Create and migrate database
- `make test` - Run test suite
- `make clean` - Clean up containers and volumes

## Next Steps

This completes the basic project setup. The next tasks will involve:

1. Creating database models (User, Credential, Todo)
2. Implementing WebAuthn authentication
3. Building the React frontend components
4. Adding drag-and-drop functionality
5. Writing comprehensive tests

## License

This project is part of a development specification and is intended for educational purposes.
