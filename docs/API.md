# API Documentation

This document provides detailed technical documentation for the Passkey Todo Board API endpoints.

## Base URL

All API endpoints are prefixed with `/api` and require JSON content type unless otherwise specified.

```
Base URL: http://localhost:3000/api (development)
Content-Type: application/json
```

## Authentication

The API uses cookie-based session authentication. After successful WebAuthn authentication, a session cookie is set that must be included in subsequent requests to protected endpoints.

### Session Cookie
- **Name**: `_passkey_todo_board_session`
- **HttpOnly**: true (prevents XSS access)
- **SameSite**: Lax (CSRF protection)
- **Secure**: true (production only, HTTPS)

## WebAuthn Authentication Endpoints

### POST /api/webauthn/registration/options

Generates WebAuthn registration options for creating a new Passkey.

**Request:**
```http
POST /api/webauthn/registration/options
Content-Type: application/json

{}
```

**Response (200 OK):**
```json
{
  "options": {
    "challenge": "dGVzdC1jaGFsbGVuZ2U",
    "rp": {
      "name": "Passkey Todo Board",
      "id": "localhost"
    },
    "user": {
      "id": "dXNlci0xMjM0NTY",
      "name": "user@example.com",
      "displayName": "User"
    },
    "pubKeyCredParams": [
      {"type": "public-key", "alg": -7},
      {"type": "public-key", "alg": -257}
    ],
    "timeout": 60000,
    "attestation": "none",
    "authenticatorSelection": {
      "authenticatorAttachment": "platform",
      "userVerification": "required"
    }
  }
}
```

**Error Responses:**
- `500` - Server error generating options

---

### POST /api/webauthn/registration/verify

Verifies WebAuthn registration credential and creates user account.

**Request:**
```http
POST /api/webauthn/registration/verify
Content-Type: application/json

{
  "credential": {
    "id": "credential-id-string",
    "rawId": "Y3JlZGVudGlhbC1pZA",
    "response": {
      "attestationObject": "base64-encoded-attestation-object",
      "clientDataJSON": "base64-encoded-client-data"
    },
    "type": "public-key"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "created_at": "2024-01-01T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid credential format
- `422` - Credential verification failed
- `500` - Server error during verification

---

### POST /api/webauthn/authentication/options

Generates WebAuthn authentication options for existing users.

**Request:**
```http
POST /api/webauthn/authentication/options
Content-Type: application/json

{}
```

**Response (200 OK):**
```json
{
  "options": {
    "challenge": "YXV0aC1jaGFsbGVuZ2U",
    "timeout": 60000,
    "rpId": "localhost",
    "allowCredentials": [
      {
        "type": "public-key",
        "id": "Y3JlZGVudGlhbC1pZA"
      }
    ],
    "userVerification": "required"
  }
}
```

**Error Responses:**
- `404` - No credentials found for authentication
- `500` - Server error generating options

---

### POST /api/webauthn/authentication/verify

Verifies WebAuthn authentication signature and establishes session.

**Request:**
```http
POST /api/webauthn/authentication/verify
Content-Type: application/json

{
  "credential": {
    "id": "credential-id-string",
    "rawId": "Y3JlZGVudGlhbC1pZA",
    "response": {
      "authenticatorData": "base64-encoded-authenticator-data",
      "clientDataJSON": "base64-encoded-client-data",
      "signature": "base64-encoded-signature"
    },
    "type": "public-key"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "created_at": "2024-01-01T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid credential format
- `401` - Authentication failed
- `422` - Signature verification failed
- `500` - Server error during verification

---

### POST /api/logout

Destroys the current session and logs out the user.

**Request:**
```http
POST /api/logout
Content-Type: application/json

{}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Error Responses:**
- `500` - Server error during logout

## Todo Management Endpoints

All todo endpoints require authentication. Include the session cookie in requests.

### GET /api/todos

Retrieves all todos for the authenticated user, ordered by position.

**Request:**
```http
GET /api/todos
Cookie: _passkey_todo_board_session=session-value
```

**Response (200 OK):**
```json
{
  "todos": [
    {
      "id": 1,
      "title": "Complete project setup",
      "status": "open",
      "position": 1,
      "created_at": "2024-01-01T10:00:00.000Z",
      "updated_at": "2024-01-01T10:00:00.000Z"
    },
    {
      "id": 2,
      "title": "Write documentation",
      "status": "done",
      "position": 2,
      "created_at": "2024-01-01T11:00:00.000Z",
      "updated_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `401` - Authentication required
- `500` - Server error retrieving todos

---

### POST /api/todos

Creates a new todo for the authenticated user.

**Request:**
```http
POST /api/todos
Content-Type: application/json
Cookie: _passkey_todo_board_session=session-value

{
  "todo": {
    "title": "New task to complete"
  }
}
```

**Response (201 Created):**
```json
{
  "todo": {
    "id": 3,
    "title": "New task to complete",
    "status": "open",
    "position": 3,
    "created_at": "2024-01-01T13:00:00.000Z",
    "updated_at": "2024-01-01T13:00:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Authentication required
- `422` - Validation failed (e.g., empty title)
- `500` - Server error creating todo

**Validation Rules:**
- `title` - Required, cannot be blank or whitespace-only

---

### PATCH /api/todos/:id

Updates an existing todo for the authenticated user.

**Request:**
```http
PATCH /api/todos/1
Content-Type: application/json
Cookie: _passkey_todo_board_session=session-value

{
  "todo": {
    "title": "Updated task title",
    "status": "done"
  }
}
```

**Response (200 OK):**
```json
{
  "todo": {
    "id": 1,
    "title": "Updated task title",
    "status": "done",
    "position": 1,
    "created_at": "2024-01-01T10:00:00.000Z",
    "updated_at": "2024-01-01T14:00:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Authentication required
- `403` - Access denied (not user's todo)
- `404` - Todo not found
- `422` - Validation failed
- `500` - Server error updating todo

**Validation Rules:**
- `title` - If provided, cannot be blank or whitespace-only
- `status` - Must be "open" or "done"

---

### DELETE /api/todos/:id

Deletes a todo belonging to the authenticated user.

**Request:**
```http
DELETE /api/todos/1
Cookie: _passkey_todo_board_session=session-value
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Todo deleted successfully"
}
```

**Error Responses:**
- `401` - Authentication required
- `403` - Access denied (not user's todo)
- `404` - Todo not found
- `500` - Server error deleting todo

**Side Effects:**
- Remaining todos maintain valid position values
- Position gaps are preserved (no automatic reordering)

---

### PATCH /api/todos/reorder

Updates positions for multiple todos in a single atomic operation.

**Request:**
```http
PATCH /api/todos/reorder
Content-Type: application/json
Cookie: _passkey_todo_board_session=session-value

{
  "updates": [
    {"id": 1, "position": 2},
    {"id": 2, "position": 1},
    {"id": 3, "position": 3}
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "todos": [
    {
      "id": 2,
      "title": "Write documentation",
      "status": "done",
      "position": 1,
      "created_at": "2024-01-01T11:00:00.000Z",
      "updated_at": "2024-01-01T15:00:00.000Z"
    },
    {
      "id": 1,
      "title": "Complete project setup",
      "status": "open",
      "position": 2,
      "created_at": "2024-01-01T10:00:00.000Z",
      "updated_at": "2024-01-01T15:00:00.000Z"
    },
    {
      "id": 3,
      "title": "New task to complete",
      "status": "open",
      "position": 3,
      "created_at": "2024-01-01T13:00:00.000Z",
      "updated_at": "2024-01-01T13:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `401` - Authentication required
- `403` - Access denied (trying to reorder other user's todos)
- `422` - Validation failed (invalid todo IDs or positions)
- `500` - Server error during reorder

**Validation Rules:**
- All todo IDs must belong to the authenticated user
- Position values must be positive integers
- Position conflicts are resolved automatically
- Operation is atomic (all updates succeed or all fail)

## Error Response Format

All error responses follow a consistent format:

### Authentication Error (401)
```json
{
  "error": "Authentication required",
  "message": "Please log in to access this resource"
}
```

### Authorization Error (403)
```json
{
  "error": "Access denied",
  "message": "You can only access your own todos"
}
```

### Not Found Error (404)
```json
{
  "error": "Not found",
  "message": "Todo not found"
}
```

### Validation Error (422)
```json
{
  "error": "Validation failed",
  "errors": {
    "title": ["can't be blank"],
    "status": ["is not included in the list"]
  }
}
```

### Server Error (500)
```json
{
  "error": "Internal server error",
  "message": "Something went wrong. Please try again."
}
```

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider implementing:

- **Authentication endpoints**: 5 requests per minute per IP
- **Todo operations**: 100 requests per minute per user
- **Reorder operations**: 10 requests per minute per user

## CORS Policy

The API is configured for same-origin requests only. Cross-origin requests are not supported in the current implementation.

## WebAuthn Specific Details

### Challenge Management
- Challenges are stored temporarily in the session
- Challenges expire after 5 minutes
- Each challenge can only be used once
- Challenges are cryptographically secure (32 bytes of entropy)

### Credential Storage
- Only public key material is stored on the server
- Private keys remain on the user's device/authenticator
- Sign count is tracked for replay attack prevention
- Credentials are associated with the user account

### Browser Compatibility
- Requires WebAuthn Level 1 support minimum
- Platform authenticators preferred (Touch ID, Face ID, Windows Hello)
- Cross-platform authenticators supported (USB security keys)
- User verification required for all operations

## Security Considerations

### Session Security
- Sessions expire after 24 hours of inactivity
- Session cookies are HttpOnly and SameSite=Lax
- CSRF protection via Rails authenticity tokens
- Secure flag enabled in production (HTTPS only)

### Data Validation
- All user input is validated server-side
- SQL injection prevention via ActiveRecord
- XSS prevention via proper output encoding
- Input sanitization for todo titles

### Authorization
- Every API call verifies user ownership of resources
- No cross-user data access possible
- Database constraints enforce data isolation
- Proper error messages without information leakage

## Testing the API

### Using curl

**Register a new user:**
```bash
# Get registration options
curl -X POST http://localhost:3000/api/webauthn/registration/options \
  -H "Content-Type: application/json" \
  -d '{}'

# Note: WebAuthn verification requires browser WebAuthn API
# Use the frontend application for complete registration flow
```

**List todos (after authentication):**
```bash
curl -X GET http://localhost:3000/api/todos \
  -H "Cookie: _passkey_todo_board_session=your-session-cookie"
```

### Using the Frontend

The React frontend provides a complete interface for testing all API endpoints:

1. Open http://localhost:3000
2. Register with a Passkey
3. Create, edit, and reorder todos
4. Use browser developer tools to inspect API calls

### Automated Testing

Run the test suite to verify API functionality:

```bash
# All tests
bundle exec rspec

# API controller tests only
bundle exec rspec spec/controllers/api/

# Property-based tests
bundle exec rspec spec/properties/
```