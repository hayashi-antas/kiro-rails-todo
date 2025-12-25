# Development Workflow Guide

This guide covers the development workflow, coding standards, and best practices for the Passkey Todo Board project.

## Getting Started

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd passkey-todo-board
   ```

2. **Choose your development environment:**
   
   **Option A: Docker (Recommended)**
   ```bash
   make setup    # Build containers and install dependencies
   make up       # Start all services
   ```
   
   **Option B: Local Development**
   ```bash
   bundle install
   npm install
   rails db:create db:migrate db:seed
   ```

3. **Verify setup:**
   ```bash
   make test     # Run test suite
   ```

4. **Access the application:**
   - Open http://localhost:3000
   - Register with a Passkey
   - Start developing!

## Development Environment

### Docker Development (Recommended)

The Docker setup provides a consistent environment across all development machines.

**Services:**
- `web` - Rails application (port 3000)
- `db` - PostgreSQL database (port 5432)

**Key commands:**
```bash
make up           # Start all services
make down         # Stop all services
make logs         # View application logs
make shell        # Open shell in web container
make console      # Open Rails console
make db-reset     # Reset database with fresh data
```

**File watching:**
- Code changes are automatically reflected (volume mounts)
- Vite provides hot module replacement for React
- Rails reloads automatically in development mode

### Local Development

If you prefer local development without Docker:

**Prerequisites:**
- Ruby 3.4.8 (use rbenv: `rbenv install 3.4.8`)
- Node.js 18+ (use nvm: `nvm install --lts`)
- PostgreSQL 15+

**Setup:**
```bash
# Install dependencies
bundle install
npm install

# Configure database
cp config/database.yml.example config/database.yml
# Edit database.yml with your PostgreSQL settings

# Setup database
rails db:create db:migrate db:seed

# Start development servers
rails server          # Terminal 1
bin/vite dev          # Terminal 2 (for hot reloading)
```

## Code Organization

### Backend Structure

```
app/
├── controllers/
│   ├── api/                    # API endpoints
│   │   ├── webauthn_controller.rb
│   │   ├── todos_controller.rb
│   │   └── sessions_controller.rb
│   ├── concerns/
│   │   └── error_handling.rb   # Shared error handling
│   └── application_controller.rb
├── models/
│   ├── user.rb                 # Minimal user model
│   ├── credential.rb           # WebAuthn credentials
│   └── todo.rb                 # Todo items with positions
└── views/
    └── home/
        └── index.html.erb      # React app entry point
```

### Frontend Structure

```
app/frontend/
├── components/
│   ├── auth/                   # Authentication components
│   ├── todos/                  # Todo management components
│   └── shared/                 # Reusable components
├── pages/                      # Top-level page components
├── hooks/                      # Custom React hooks
├── types/                      # TypeScript type definitions
├── utils/                      # Utility functions
└── entrypoints/               # Vite entry points
```

### Test Structure

```
spec/
├── models/                     # ActiveRecord model tests
├── controllers/                # API controller tests
├── properties/                 # Property-based tests
├── integration/                # End-to-end tests
└── support/                    # Test helpers and configuration

app/frontend/test/
├── components/                 # React component tests
├── hooks/                      # Custom hook tests
├── pages/                      # Page component tests
└── utils/                      # Utility function tests
```

## Development Workflow

### Feature Development Process

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Write tests first (TDD approach):**
   ```bash
   # For backend features
   bundle exec rspec spec/models/your_model_spec.rb --fail-fast
   
   # For frontend features
   npm test -- --watch components/YourComponent.test.tsx
   ```

3. **Implement the feature:**
   - Follow the existing code patterns
   - Write minimal, focused code
   - Ensure tests pass continuously

4. **Run the full test suite:**
   ```bash
   make test                    # All backend tests
   npm test                     # All frontend tests
   ```

5. **Manual testing:**
   - Test in the browser
   - Verify WebAuthn flows work
   - Test drag-and-drop functionality

6. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

### Testing Strategy

#### Property-Based Testing

The project uses property-based testing to verify correctness properties:

```bash
# Run all property tests
bundle exec rspec spec/properties/

# Run specific property test
bundle exec rspec spec/properties/todo_management_properties_spec.rb
```

**Writing property tests:**
```ruby
# Example property test
RSpec.describe "Todo Management Properties" do
  include RSpec::QuickCheck

  it "Property 3: Todo Creation and Persistence" do
    # **Feature: passkey-todo-board, Property 3: Todo Creation and Persistence**
    property_of {
      user = create(:user)
      title = string.suchThat { |s| !s.strip.empty? }
      [user, title]
    }.check { |user, title|
      initial_count = user.todos.count
      
      todo = user.todos.create!(title: title)
      
      expect(user.todos.count).to eq(initial_count + 1)
      expect(todo.title).to eq(title)
      expect(todo.status).to eq("open")
      expect(todo.position).to be > 0
    }
  end
end
```

#### Unit Testing

Standard RSpec tests for specific scenarios:

```ruby
# Example unit test
RSpec.describe Todo, type: :model do
  describe "validations" do
    it "requires a title" do
      todo = build(:todo, title: "")
      expect(todo).not_to be_valid
      expect(todo.errors[:title]).to include("can't be blank")
    end
  end
end
```

#### Frontend Testing

React component tests using Vitest and Testing Library:

```typescript
// Example component test
import { render, screen } from '@testing-library/react'
import { TodoItem } from './TodoItem'

test('renders todo item with title', () => {
  const todo = { id: 1, title: 'Test todo', status: 'open', position: 1 }
  render(<TodoItem todo={todo} />)
  
  expect(screen.getByText('Test todo')).toBeInTheDocument()
})
```

### Code Quality Standards

#### Ruby/Rails Standards

- **Follow Rails conventions** for file naming and structure
- **Use strong parameters** for all controller inputs
- **Validate all user inputs** at the model level
- **Write descriptive method names** and add comments for complex logic
- **Use ActiveRecord associations** instead of manual queries
- **Handle errors gracefully** with proper error messages

**Example controller:**
```ruby
class Api::TodosController < ApplicationController
  before_action :require_authentication
  before_action :set_todo, only: [:show, :update, :destroy]

  def create
    @todo = current_user.todos.build(todo_params)
    @todo.position = next_position
    
    if @todo.save
      render json: { todo: @todo }, status: :created
    else
      render json: { error: "Validation failed", errors: @todo.errors }, 
             status: :unprocessable_entity
    end
  end

  private

  def todo_params
    params.require(:todo).permit(:title, :status)
  end

  def next_position
    current_user.todos.maximum(:position).to_i + 1
  end
end
```

#### TypeScript/React Standards

- **Use TypeScript strictly** - no `any` types
- **Define interfaces** for all data structures
- **Use functional components** with hooks
- **Handle loading and error states** in all components
- **Write accessible components** with proper ARIA attributes
- **Use semantic HTML** elements

**Example component:**
```typescript
interface TodoItemProps {
  todo: Todo
  onUpdate: (todo: Todo) => void
  onDelete: (id: number) => void
}

export const TodoItem: React.FC<TodoItemProps> = ({ 
  todo, 
  onUpdate, 
  onDelete 
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(todo.title)

  const handleSave = async () => {
    try {
      const updatedTodo = await updateTodo(todo.id, { title })
      onUpdate(updatedTodo)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update todo:', error)
      // Show error message to user
    }
  }

  return (
    <div className="todo-item" role="listitem">
      {isEditing ? (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          aria-label="Edit todo title"
        />
      ) : (
        <span onClick={() => setIsEditing(true)}>
          {todo.title}
        </span>
      )}
    </div>
  )
}
```

### Database Management

#### Migrations

Always create migrations for schema changes:

```bash
# Generate migration
rails generate migration AddIndexToTodos user_id position

# Edit the migration file
class AddIndexToTodos < ActiveRecord::Migration[8.1]
  def change
    add_index :todos, [:user_id, :position], unique: true
  end
end

# Run migration
rails db:migrate
```

#### Seeds

Update `db/seeds.rb` for development data:

```ruby
if Rails.env.development?
  # Create sample user and todos
  user = User.find_or_create_by(id: 1)
  
  unless user.todos.exists?
    [
      "Set up authentication",
      "Implement CRUD operations", 
      "Add drag and drop"
    ].each_with_index do |title, index|
      user.todos.create!(
        title: title,
        status: index < 2 ? "done" : "open",
        position: index + 1
      )
    end
  end
end
```

### Debugging

#### Backend Debugging

```bash
# Rails console
make console
> User.count
> Todo.includes(:user).all

# View logs
make logs

# Debug specific request
tail -f log/development.log | grep "POST /api/todos"
```

#### Frontend Debugging

```bash
# Browser developer tools
# - Network tab for API calls
# - Console for JavaScript errors
# - React Developer Tools extension

# Vite dev server logs
bin/vite dev --debug
```

#### WebAuthn Debugging

```javascript
// Browser console - check WebAuthn support
if (window.PublicKeyCredential) {
  console.log('WebAuthn supported')
  
  // Check for platform authenticator
  PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    .then(available => console.log('Platform authenticator:', available))
} else {
  console.log('WebAuthn not supported')
}
```

### Performance Considerations

#### Backend Performance

- **Use database indexes** for frequently queried columns
- **Eager load associations** to avoid N+1 queries
- **Use database constraints** for data integrity
- **Cache expensive operations** where appropriate

```ruby
# Good: Eager loading
@todos = current_user.todos.includes(:user).ordered

# Bad: N+1 queries
@todos = current_user.todos.all
@todos.each { |todo| puts todo.user.email }
```

#### Frontend Performance

- **Use React.memo** for expensive components
- **Implement proper key props** for lists
- **Debounce user inputs** for API calls
- **Use loading states** to improve perceived performance

```typescript
// Debounced search
const [searchTerm, setSearchTerm] = useState('')
const debouncedSearch = useMemo(
  () => debounce((term: string) => {
    // Perform search
  }, 300),
  []
)

useEffect(() => {
  debouncedSearch(searchTerm)
}, [searchTerm, debouncedSearch])
```

### Security Best Practices

#### WebAuthn Security

- **Validate all WebAuthn responses** server-side
- **Use secure challenge generation** (32 bytes entropy)
- **Implement proper origin validation**
- **Track sign count** for replay attack prevention

#### General Security

- **Validate all user inputs** server-side
- **Use parameterized queries** (ActiveRecord default)
- **Implement proper authorization** on all endpoints
- **Use HTTPS in production** (required for WebAuthn)
- **Set secure cookie flags** in production

### Deployment Workflow

#### Staging Deployment

```bash
# Deploy to staging
git push staging main

# Run migrations
heroku run rails db:migrate -a your-staging-app

# Check deployment
curl https://your-staging-app.herokuapp.com/api/todos
```

#### Production Deployment

```bash
# Deploy to production
git push production main

# Monitor deployment
heroku logs --tail -a your-production-app
```

### Troubleshooting Common Issues

#### WebAuthn Issues

**Problem**: "WebAuthn not supported"
**Solution**: 
- Check browser compatibility
- Ensure HTTPS in production
- Verify origin configuration

**Problem**: "Registration failed"
**Solution**:
- Check browser console for errors
- Verify challenge generation
- Check server logs for verification errors

#### Database Issues

**Problem**: "PG::ConnectionBad"
**Solution**:
```bash
# Check PostgreSQL status
make logs-db

# Reset database
make db-reset
```

#### Asset Issues

**Problem**: "Vite build failed"
**Solution**:
```bash
# Clear cache
rm -rf node_modules/.vite
npm install

# Rebuild assets
npm run build
```

### Contributing Guidelines

1. **Follow the existing code style** and patterns
2. **Write tests** for all new functionality
3. **Update documentation** for API changes
4. **Test WebAuthn flows** in multiple browsers
5. **Ensure all tests pass** before submitting PR
6. **Write clear commit messages** following conventional commits

### Getting Help

- **Check the logs** first (`make logs`)
- **Run the test suite** to identify issues
- **Review the API documentation** for endpoint details
- **Check browser developer tools** for frontend issues
- **Use Rails console** for debugging data issues

This development workflow ensures consistent, high-quality code and smooth collaboration across the team.