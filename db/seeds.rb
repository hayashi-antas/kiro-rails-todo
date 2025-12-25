# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Only seed in development environment
if Rails.env.development?
  puts "🌱 Seeding development data..."

  # Create a sample user for development
  # Note: In a real WebAuthn app, users are created through the registration flow
  # This is just for development convenience to test the todo functionality
  sample_user = User.find_or_create_by(id: 1) do |user|
    puts "  Creating sample user..."
  end

  # Create some sample todos with realistic content
  if sample_user.todos.empty?
    puts "  Creating sample todos..."

    sample_todos = [
      { title: "Set up WebAuthn authentication", status: "done", position: 1 },
      { title: "Implement todo CRUD operations", status: "done", position: 2 },
      { title: "Add drag and drop functionality", status: "done", position: 3 },
      { title: "Write comprehensive tests", status: "done", position: 4 },
      { title: "Create API documentation", status: "open", position: 5 },
      { title: "Deploy to production", status: "open", position: 6 },
      { title: "Add user onboarding flow", status: "open", position: 7 },
      { title: "Implement todo categories", status: "open", position: 8 },
      { title: "Add keyboard shortcuts", status: "open", position: 9 },
      { title: "Optimize for mobile devices", status: "open", position: 10 }
    ]

    sample_todos.each do |todo_attrs|
      sample_user.todos.create!(todo_attrs)
    end
  end

  # Create a second sample user with different todos for testing data isolation
  sample_user_2 = User.find_or_create_by(id: 2) do |user|
    puts "  Creating second sample user..."
  end

  if sample_user_2.todos.empty?
    puts "  Creating todos for second user..."

    sample_todos_2 = [
      { title: "Review project requirements", status: "done", position: 1 },
      { title: "Design database schema", status: "done", position: 2 },
      { title: "Implement user authentication", status: "open", position: 3 },
      { title: "Build frontend components", status: "open", position: 4 },
      { title: "Write integration tests", status: "open", position: 5 }
    ]

    sample_todos_2.each do |todo_attrs|
      sample_user_2.todos.create!(todo_attrs)
    end
  end

  puts "✅ Development data seeded successfully!"
  puts "   Sample users created: #{User.count}"
  puts "   Total todos: #{Todo.count}"
  puts "   User 1 todos: #{sample_user.todos.count}"
  puts "   User 2 todos: #{sample_user_2.todos.count}"
  puts ""
  puts "💡 To test the application:"
  puts "   1. Visit http://localhost:3000"
  puts "   2. Register with a Passkey to create your own user"
  puts "   3. Or use the Rails console to simulate login as sample users"
  puts "      rails console"
  puts "      > session[:user_id] = 1  # Login as sample user 1"
end
