# Documentation Index

This directory contains comprehensive documentation for the Passkey Todo Board application.

## Documentation Files

### [API.md](API.md)
Complete API reference documentation including:
- Authentication endpoints (WebAuthn registration and login)
- Todo management endpoints (CRUD operations)
- Drag-and-drop reordering API
- Request/response formats and examples
- Error handling and status codes
- WebAuthn-specific implementation details

### [DEVELOPMENT.md](DEVELOPMENT.md)
Development workflow and best practices guide covering:
- Development environment setup (Docker and local)
- Code organization and structure
- Testing strategies (property-based and unit testing)
- Code quality standards for Ruby/Rails and TypeScript/React
- Database management and migrations
- Debugging techniques
- Performance considerations
- Security best practices

### [DEPLOYMENT.md](DEPLOYMENT.md)
Production deployment guide including:
- Render platform deployment (recommended)
- Alternative deployment options (Heroku, Docker)
- Environment configuration and variables
- SSL/HTTPS setup for WebAuthn
- Database management in production
- Monitoring and logging
- Security checklist
- Performance optimization
- Troubleshooting common deployment issues

## Quick Reference

### Getting Started
1. See [DEVELOPMENT.md](DEVELOPMENT.md#getting-started) for setup instructions
2. Review [API.md](API.md) for endpoint documentation
3. Follow [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment

### Key Concepts

**WebAuthn Authentication:**
- Passwordless authentication using Passkeys
- Browser WebAuthn API integration
- Secure challenge-response flow
- See [API.md](API.md#webauthn-authentication-endpoints) for details

**Todo Management:**
- CRUD operations for todo items
- Drag-and-drop reordering with position management
- User data isolation and authorization
- See [API.md](API.md#todo-management-endpoints) for endpoints

**Testing Strategy:**
- Property-based testing for correctness properties
- Unit testing for specific scenarios
- Integration testing for end-to-end workflows
- See [DEVELOPMENT.md](DEVELOPMENT.md#testing-strategy) for details

### Architecture Overview

```
Frontend (React + TypeScript)
    ↓ HTTP/JSON API
Backend (Rails 8.1)
    ↓ ActiveRecord
Database (PostgreSQL)
```

**Key Technologies:**
- **Authentication**: WebAuthn/Passkeys with cookie sessions
- **Frontend**: React 19, TypeScript, Vite, @dnd-kit
- **Backend**: Ruby on Rails 8.1, PostgreSQL 15
- **Testing**: RSpec, rspec-quickcheck, Vitest
- **Deployment**: Docker, Render platform

### Security Features

- **WebAuthn Security**: Cryptographically secure challenges, public key storage only
- **Session Security**: HttpOnly cookies, SameSite protection, CSRF tokens
- **Data Protection**: User isolation, input validation, SQL injection prevention
- **HTTPS Required**: WebAuthn requires secure connections in production

### Development Commands

```bash
# Docker development (recommended)
make setup          # Initial setup
make up             # Start services
make test           # Run tests
make logs           # View logs

# Local development
bundle install      # Install Ruby dependencies
npm install         # Install Node dependencies
rails server        # Start Rails server
bin/vite dev        # Start Vite dev server
```

### API Quick Reference

```bash
# Authentication
POST /api/webauthn/registration/options
POST /api/webauthn/registration/verify
POST /api/webauthn/authentication/options
POST /api/webauthn/authentication/verify
POST /api/logout

# Todo Management (requires authentication)
GET    /api/todos           # List todos
POST   /api/todos           # Create todo
PATCH  /api/todos/:id       # Update todo
DELETE /api/todos/:id       # Delete todo
PATCH  /api/todos/reorder   # Reorder todos
```

## Contributing to Documentation

When updating documentation:

1. **Keep it current** - Update docs when making code changes
2. **Be comprehensive** - Include examples and edge cases
3. **Use clear language** - Write for developers of all experience levels
4. **Test examples** - Ensure all code examples work
5. **Cross-reference** - Link between related documentation sections

## Documentation Standards

- Use **Markdown** for all documentation files
- Include **code examples** with proper syntax highlighting
- Provide **step-by-step instructions** for complex procedures
- Use **consistent formatting** across all files
- Include **troubleshooting sections** for common issues
- Keep **table of contents** updated for long documents

This documentation is designed to help developers understand, develop, and deploy the Passkey Todo Board application effectively.