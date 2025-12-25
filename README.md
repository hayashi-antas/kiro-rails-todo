# Passkey Todo Board

A modern todo application built with Ruby on Rails 8.1 and React, featuring passwordless authentication using WebAuthn Passkeys and drag-and-drop functionality similar to GitHub Issues.

## Features

- 🔐 **Passwordless Authentication**: Secure login using WebAuthn Passkeys
- 📝 **Todo Management**: Create, edit, delete, and toggle todo status
- 🎯 **Drag & Drop**: Reorder todos with intuitive drag-and-drop interface
- 🔒 **Data Isolation**: Each user can only access their own todos
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🧪 **Property-Based Testing**: Comprehensive test coverage with formal correctness properties

## Technology Stack

- **Backend**: Ruby on Rails 8.1 (full-stack mode)
- **Frontend**: React 19 with TypeScript
- **Database**: PostgreSQL 15
- **Authentication**: WebAuthn/Passkeys with cookie sessions
- **Build Tool**: Vite with vite-ruby integration
- **Drag & Drop**: @dnd-kit library
- **Testing**: RSpec with rspec-quickcheck (property-based testing)
- **Deployment**: Docker & Render platform

## Quick Start

### Option 1: Docker Development (Recommended)

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd passkey-todo-board
   make setup
   ```

2. **Start the application:**
   ```bash
   make up
   ```

3. **Access the application:**
   - Open http://localhost:3000
   - Create a Passkey to register
   - Start managing your todos!

### Option 2: Local Development

#### Prerequisites

- Ruby 3.4.8 (use rbenv or rvm)
- Node.js 18+ (use nvm)
- PostgreSQL 15+
- Git

#### Setup Steps

1. **Install dependencies:**
   ```bash
   bundle install
   npm install
   ```

2. **Configure database:**
   ```bash
   # Create database.yml if needed
   cp config/database.yml.example config/database.yml
   
   # Setup database
   rails db:create db:migrate db:seed
   ```

3. **Start development servers:**
   ```bash
   # Terminal 1: Rails server
   rails server
   
   # Terminal 2: Vite dev server (for hot reloading)
   bin/vite dev
   ```

4. **Access the application:**
   - Open http://localhost:3000
   - Register with a Passkey
   - Start using the todo board!

## Development Workflow

### Available Make Commands

```bash
# Setup and lifecycle
make setup          # Initial project setup
make up             # Start all services
make down           # Stop all services
make restart        # Restart all services
make status         # Check service status
make logs           # View all logs
make logs-web       # View web server logs
make logs-db        # View database logs

# Database operations
make db-setup       # Create and migrate database
make db-migrate     # Run pending migrations
make db-seed        # Load seed data
make db-reset       # Drop, create, migrate, and seed

# Development tools
make shell          # Open shell in web container
make console        # Open Rails console
make install        # Install/update dependencies

# Testing
make test           # Run backend tests
make test-frontend  # Run frontend tests
make test-watch     # Run tests in watch mode

# Cleanup
make clean          # Remove containers and volumes
make reset          # Full reset (clean + setup)
```

### Running Tests

```bash
# All backend tests
bundle exec rspec

# Specific test files
bundle exec rspec spec/models/
bundle exec rspec spec/properties/

# Frontend tests
npm test

# Property-based tests only
bundle exec rspec spec/properties/
```

## API Documentation

The application provides a JSON API under the `/api/*` namespace for frontend communication.

### Authentication Endpoints

#### Register Passkey - Get Options
```http
POST /api/webauthn/registration/options
Content-Type: application/json

{}
```

**Response:**
```json
{
  "options": {
    "challenge": "base64-encoded-challenge",
    "rp": {
      "name": "Passkey Todo Board",
      "id": "localhost"
    },
    "user": {
      "id": "base64-user-id",
      "name": "user@example.com",
      "displayName": "User"
    },
    "pubKeyCredParams": [
      {"type": "public-key", "alg": -7},
      {"type": "public-key", "alg": -257}
    ],
    "timeout": 60000,
    "attestation": "none"
  }
}
```

#### Register Passkey - Verify Credential
```http
POST /api/webauthn/registration/verify
Content-Type: application/json

{
  "credential": {
    "id": "credential-id",
    "rawId": "base64-raw-id",
    "response": {
      "attestationObject": "base64-attestation",
      "clientDataJSON": "base64-client-data"
    },
    "type": "public-key"
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "created_at": "2024-01-01T10:00:00Z"
  }
}
```

#### Authenticate - Get Options
```http
POST /api/webauthn/authentication/options
Content-Type: application/json

{}
```

**Response:**
```json
{
  "options": {
    "challenge": "base64-encoded-challenge",
    "timeout": 60000,
    "rpId": "localhost",
    "allowCredentials": [
      {
        "type": "public-key",
        "id": "base64-credential-id"
      }
    ]
  }
}
```

#### Authenticate - Verify Signature
```http
POST /api/webauthn/authentication/verify
Content-Type: application/json

{
  "credential": {
    "id": "credential-id",
    "rawId": "base64-raw-id",
    "response": {
      "authenticatorData": "base64-auth-data",
      "clientDataJSON": "base64-client-data",
      "signature": "base64-signature"
    },
    "type": "public-key"
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "created_at": "2024-01-01T10:00:00Z"
  }
}
```

#### Logout
```http
POST /api/logout
Content-Type: application/json

{}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Todo Management Endpoints

All todo endpoints require authentication via session cookie.

#### List Todos
```http
GET /api/todos
```

**Response:**
```json
{
  "todos": [
    {
      "id": 1,
      "title": "Complete project setup",
      "status": "open",
      "position": 1,
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T10:00:00Z"
    },
    {
      "id": 2,
      "title": "Write documentation",
      "status": "done",
      "position": 2,
      "created_at": "2024-01-01T11:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

#### Create Todo
```http
POST /api/todos
Content-Type: application/json

{
  "todo": {
    "title": "New task to complete"
  }
}
```

**Response:**
```json
{
  "todo": {
    "id": 3,
    "title": "New task to complete",
    "status": "open",
    "position": 3,
    "created_at": "2024-01-01T13:00:00Z",
    "updated_at": "2024-01-01T13:00:00Z"
  }
}
```

#### Update Todo
```http
PATCH /api/todos/:id
Content-Type: application/json

{
  "todo": {
    "title": "Updated task title",
    "status": "done"
  }
}
```

**Response:**
```json
{
  "todo": {
    "id": 1,
    "title": "Updated task title",
    "status": "done",
    "position": 1,
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-01T14:00:00Z"
  }
}
```

#### Delete Todo
```http
DELETE /api/todos/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Todo deleted successfully"
}
```

#### Reorder Todos
```http
PATCH /api/todos/reorder
Content-Type: application/json

{
  "updates": [
    {"id": 1, "position": 2},
    {"id": 2, "position": 1},
    {"id": 3, "position": 3}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "todos": [
    {
      "id": 2,
      "title": "Write documentation",
      "status": "done",
      "position": 1,
      "created_at": "2024-01-01T11:00:00Z",
      "updated_at": "2024-01-01T15:00:00Z"
    },
    {
      "id": 1,
      "title": "Complete project setup",
      "status": "open",
      "position": 2,
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T15:00:00Z"
    },
    {
      "id": 3,
      "title": "New task to complete",
      "status": "open",
      "position": 3,
      "created_at": "2024-01-01T13:00:00Z",
      "updated_at": "2024-01-01T13:00:00Z"
    }
  ]
}
```

### Error Responses

All endpoints may return error responses in the following format:

#### Authentication Error (401)
```json
{
  "error": "Authentication required",
  "message": "Please log in to access this resource"
}
```

#### Authorization Error (403)
```json
{
  "error": "Access denied",
  "message": "You can only access your own todos"
}
```

#### Validation Error (422)
```json
{
  "error": "Validation failed",
  "errors": {
    "title": ["can't be blank"]
  }
}
```

#### Server Error (500)
```json
{
  "error": "Internal server error",
  "message": "Something went wrong. Please try again."
}
```

## Project Structure

```
passkey-todo-board/
├── app/
│   ├── controllers/
│   │   ├── api/                    # API controllers
│   │   │   ├── sessions_controller.rb
│   │   │   ├── todos_controller.rb
│   │   │   └── webauthn_controller.rb
│   │   ├── concerns/
│   │   │   └── error_handling.rb   # Global error handling
│   │   ├── application_controller.rb
│   │   └── home_controller.rb      # Serves React app
│   ├── models/
│   │   ├── user.rb                 # User model (minimal)
│   │   ├── credential.rb           # WebAuthn credentials
│   │   └── todo.rb                 # Todo items
│   ├── views/
│   │   └── home/
│   │       └── index.html.erb      # React app entry point
│   └── frontend/                   # React frontend
│       ├── components/
│       │   ├── ErrorBoundary.tsx
│       │   ├── Layout.tsx
│       │   ├── PasskeyAuthentication.tsx
│       │   ├── PasskeyRegistration.tsx
│       │   ├── ProtectedRoute.tsx
│       │   ├── SortableTodoItem.tsx
│       │   ├── TodoForm.tsx
│       │   ├── TodoItem.tsx
│       │   └── TodoList.tsx
│       ├── pages/
│       │   ├── AccountPage.tsx
│       │   ├── AuthPage.tsx
│       │   └── TodoPage.tsx
│       ├── hooks/
│       │   └── useAuth.tsx         # Authentication context
│       ├── types/
│       │   ├── auth.ts
│       │   └── todo.ts
│       ├── utils/
│       │   ├── api.ts              # API client
│       │   └── networkError.ts     # Error handling
│       └── entrypoints/
│           ├── application.tsx     # React app entry
│           └── application.css     # Global styles
├── config/
│   ├── routes.rb                   # API and frontend routes
│   ├── database.yml                # Database configuration
│   └── initializers/
│       └── webauthn.rb             # WebAuthn configuration
├── db/
│   ├── migrate/                    # Database migrations
│   ├── schema.rb                   # Current database schema
│   └── seeds.rb                    # Sample data for development
├── spec/                           # Test suite
│   ├── models/                     # Model unit tests
│   ├── controllers/                # Controller unit tests
│   ├── properties/                 # Property-based tests
│   ├── integration/                # Integration tests
│   └── rails_helper.rb             # Test configuration
├── docker-compose.yml              # Development environment
├── Dockerfile                      # Container definition
├── Makefile                        # Development commands
├── package.json                    # Node.js dependencies
├── Gemfile                         # Ruby dependencies
├── vite.config.ts                  # Frontend build configuration
└── README.md                       # This file
```

## Architecture Overview

### Backend (Rails)
- **Full-stack Rails application** (not API-only mode)
- **JSON API endpoints** under `/api/*` namespace
- **Cookie-based sessions** for authentication
- **WebAuthn integration** for passwordless auth
- **PostgreSQL database** with proper constraints and indexes

### Frontend (React + TypeScript)
- **React 19** with TypeScript for type safety
- **Vite integration** via vite-ruby for fast development
- **@dnd-kit** for drag-and-drop functionality
- **Context-based state management** for authentication
- **Error boundaries** for graceful error handling

### Authentication Flow
1. User clicks "Create Passkey" or "Login with Passkey"
2. Frontend calls WebAuthn API endpoints
3. Browser WebAuthn API handles cryptographic operations
4. Server verifies credentials and establishes session
5. Session cookie enables access to protected resources

### Data Flow
1. React components make API calls to `/api/*` endpoints
2. Rails controllers handle authentication and authorization
3. ActiveRecord models manage data persistence
4. PostgreSQL ensures data integrity and isolation

## Testing Strategy

The application uses a comprehensive testing approach:

### Property-Based Testing
- **Framework**: rspec-quickcheck gem
- **Purpose**: Verify universal properties across all inputs
- **Coverage**: Authentication flows, data persistence, authorization
- **Iterations**: Minimum 100 iterations per property test

### Unit Testing
- **Framework**: RSpec
- **Purpose**: Test specific examples and edge cases
- **Coverage**: Models, controllers, components
- **Integration**: WebAuthn flows, API endpoints

### Test Categories
```bash
spec/
├── models/           # ActiveRecord model tests
├── controllers/      # API controller tests
├── properties/       # Property-based correctness tests
├── integration/      # End-to-end workflow tests
└── frontend/test/    # React component tests
```

## Security Features

### WebAuthn Security
- **Cryptographically secure challenges** with proper entropy
- **Public key storage only** (never private keys)
- **Replay attack prevention** via sign count verification
- **Origin validation** to prevent phishing attacks

### Session Security
- **HttpOnly cookies** to prevent XSS access
- **SameSite=Lax** for CSRF protection
- **Secure flag** in production (HTTPS only)
- **Proper session expiration** and cleanup

### Data Protection
- **User data isolation** - users can only access their own todos
- **Server-side authorization** on all API endpoints
- **Input validation** and sanitization
- **SQL injection prevention** via ActiveRecord

## Deployment

### Render Platform
The application is configured for deployment on Render:

```yaml
# render.yaml
services:
  - type: web
    name: passkey-todo-board
    env: ruby
    buildCommand: bundle install && npm install && npm run build
    startCommand: bundle exec rails server -p $PORT
    
databases:
  - name: passkey-todo-board-db
    databaseName: passkey_todo_board_production
```

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `RAILS_MASTER_KEY` - Rails credentials encryption key
- `WEBAUTHN_ORIGIN` - Application origin for WebAuthn
- `WEBAUTHN_RP_ID` - Relying party identifier

### Build Process
1. Install Ruby and Node.js dependencies
2. Build React assets with Vite
3. Precompile Rails assets
4. Run database migrations
5. Start Rails server

## Browser Compatibility

### WebAuthn Requirements
- **Chrome/Edge**: Version 67+
- **Firefox**: Version 60+
- **Safari**: Version 14+
- **Mobile**: iOS 14+, Android Chrome 67+

### Fallback Handling
- Detect WebAuthn support on page load
- Display compatibility message for unsupported browsers
- Graceful degradation with clear user guidance

## Development Tips

### WebAuthn Testing
- Use **localhost** for development (WebAuthn allows this)
- For production testing, use **HTTPS** (required by WebAuthn)
- Test with multiple browsers and devices
- Use browser developer tools to inspect WebAuthn calls

### Database Management
```bash
# Reset database with fresh seed data
make db-reset

# View database in Rails console
make console
> User.count
> Todo.includes(:user).all
```

### Debugging
```bash
# View application logs
make logs

# Access Rails console
make console

# Run specific tests
bundle exec rspec spec/properties/
```

## Documentation

- **[API Documentation](docs/API.md)** - Detailed API endpoint reference
- **[Development Guide](docs/DEVELOPMENT.md)** - Development workflow and best practices  
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

See the [Development Guide](docs/DEVELOPMENT.md) for detailed workflow instructions.

## Troubleshooting

### Common Issues

**WebAuthn not working:**
- Ensure you're using HTTPS in production
- Check browser compatibility
- Verify origin and RP ID configuration

**Database connection errors:**
- Check PostgreSQL is running
- Verify DATABASE_URL configuration
- Run `make db-setup` to initialize

**Asset compilation issues:**
- Clear Vite cache: `rm -rf node_modules/.vite`
- Rebuild assets: `npm run build`
- Restart development server

**Test failures:**
- Ensure test database is set up: `RAILS_ENV=test rails db:prepare`
- Check for port conflicts
- Review test logs for specific errors

For more detailed troubleshooting, see the [Development Guide](docs/DEVELOPMENT.md).

## License

This project is part of a development specification and is intended for educational purposes.
