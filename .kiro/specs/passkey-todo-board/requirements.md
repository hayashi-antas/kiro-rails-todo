# Requirements Document

## Introduction

The Passkey ToDo Board is a simple task management application that combines Ruby on Rails backend with React frontend, featuring passwordless authentication using WebAuthn Passkeys and drag-and-drop functionality similar to GitHub Issues interface.

## Glossary

- **System**: The Passkey ToDo Board application
- **User**: An authenticated individual who can manage their personal todos
- **Todo**: A task item with title, status, and position that belongs to a user
- **Passkey**: WebAuthn credential used for passwordless authentication
- **Challenge**: A cryptographic nonce used in WebAuthn authentication flows
- **Position**: Numeric value determining the display order of todos within a user's list

## Requirements

### Requirement 1

**User Story:** As a new user, I want to register using only a Passkey, so that I can access the application without managing passwords.

#### Acceptance Criteria

1. WHEN a user clicks "Create Passkey" button, THE System SHALL generate a WebAuthn registration challenge
2. WHEN the browser WebAuthn API creates a credential, THE System SHALL verify the credential and create a new User record
3. WHEN Passkey registration completes successfully, THE System SHALL establish an authenticated session for the user
4. WHEN a user attempts to register without WebAuthn support, THE System SHALL display an appropriate error message
5. WHERE Passkey registration fails, THE System SHALL maintain the unauthenticated state and allow retry

### Requirement 2

**User Story:** As a returning user, I want to login using my Passkey, so that I can quickly access my todos without entering passwords.

#### Acceptance Criteria

1. WHEN a user clicks "Login with Passkey" button, THE System SHALL generate a WebAuthn authentication challenge
2. WHEN the browser WebAuthn API provides a valid signature, THE System SHALL verify the signature and establish a session
3. WHEN authentication succeeds, THE System SHALL redirect the user to the todo list interface
4. WHEN authentication fails, THE System SHALL display an error message and remain on the login screen
5. WHERE no registered Passkeys exist for authentication, THE System SHALL guide the user to registration

### Requirement 3

**User Story:** As an authenticated user, I want to create new todos, so that I can capture tasks I need to accomplish.

#### Acceptance Criteria

1. WHEN a user enters a todo title and submits, THE System SHALL create a new todo with "open" status
2. WHEN a todo is created, THE System SHALL assign it the next available position in the user's list
3. WHEN a user attempts to create a todo with empty title, THE System SHALL reject the creation and display validation error
4. WHEN a todo is successfully created, THE System SHALL persist it to the database immediately
5. WHERE a user is not authenticated, THE System SHALL prevent todo creation and redirect to login

### Requirement 4

**User Story:** As an authenticated user, I want to edit my todos, so that I can update task details as they evolve.

#### Acceptance Criteria

1. WHEN a user modifies a todo title and saves, THE System SHALL update the todo with the new title
2. WHEN a user toggles todo status between open and done, THE System SHALL persist the status change immediately
3. WHEN a user attempts to edit another user's todo, THE System SHALL reject the operation and return authorization error
4. WHEN todo editing fails due to validation, THE System SHALL display specific error messages
5. WHERE a todo no longer exists during edit, THE System SHALL handle the error gracefully

### Requirement 5

**User Story:** As an authenticated user, I want to delete todos, so that I can remove completed or irrelevant tasks.

#### Acceptance Criteria

1. WHEN a user confirms todo deletion, THE System SHALL remove the todo from the database permanently
2. WHEN a todo is deleted, THE System SHALL maintain the position integrity of remaining todos
3. WHEN a user attempts to delete another user's todo, THE System SHALL reject the operation with authorization error
4. WHEN deletion fails, THE System SHALL display an error message and maintain current state
5. WHERE a todo is already deleted, THE System SHALL handle the duplicate deletion gracefully

### Requirement 6

**User Story:** As an authenticated user, I want to reorder my todos by dragging and dropping, so that I can prioritize tasks according to my workflow.

#### Acceptance Criteria

1. WHEN a user drags a todo to a new position, THE System SHALL update the position values for affected todos
2. WHEN reordering completes, THE System SHALL persist the new order to the database immediately
3. WHEN the page reloads after reordering, THE System SHALL display todos in the saved order
4. WHEN reordering fails due to network issues, THE System SHALL revert to the previous order and notify the user
5. WHERE position conflicts occur, THE System SHALL resolve them by recalculating position values

### Requirement 7

**User Story:** As an authenticated user, I want to logout, so that I can secure my session when finished.

#### Acceptance Criteria

1. WHEN a user clicks logout, THE System SHALL destroy the current session
2. WHEN logout completes, THE System SHALL redirect the user to the login screen
3. WHEN a logged-out user attempts to access protected resources, THE System SHALL redirect to login
4. WHEN logout fails, THE System SHALL display an error but still attempt to clear local session state
5. WHERE session expires naturally, THE System SHALL handle it gracefully and prompt for re-authentication

### Requirement 8

**User Story:** As a system administrator, I want the application to handle errors gracefully, so that users receive helpful feedback during failures.

#### Acceptance Criteria

1. WHEN network errors occur during API calls, THE System SHALL display user-friendly error messages
2. WHEN authentication errors occur, THE System SHALL redirect users to the login screen with appropriate messaging
3. WHEN validation errors occur, THE System SHALL display specific field-level error messages
4. WHEN server errors occur, THE System SHALL log the error details while showing generic user messages
5. WHERE WebAuthn is not supported, THE System SHALL inform users about browser compatibility requirements

### Requirement 9

**User Story:** As a developer, I want the application to provide secure WebAuthn implementation, so that user credentials are properly protected.

#### Acceptance Criteria

1. WHEN generating WebAuthn challenges, THE System SHALL create cryptographically secure, single-use challenges
2. WHEN storing credentials, THE System SHALL never store private key material on the server
3. WHEN validating authentication, THE System SHALL verify challenge freshness and signature validity
4. WHEN establishing sessions, THE System SHALL use secure cookie settings appropriate for the environment
5. WHERE CSRF attacks are attempted, THE System SHALL reject requests using Rails standard CSRF protection

### Requirement 10

**User Story:** As a user, I want my data to be properly isolated, so that I can only access my own todos.

#### Acceptance Criteria

1. WHEN a user requests their todo list, THE System SHALL return only todos belonging to that user
2. WHEN a user attempts to access another user's todo, THE System SHALL reject the request with authorization error
3. WHEN performing todo operations, THE System SHALL verify ownership before allowing modifications
4. WHEN creating new todos, THE System SHALL automatically associate them with the authenticated user
5. WHERE user context is missing, THE System SHALL require authentication before processing requests