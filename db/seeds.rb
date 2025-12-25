# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Only seed in development environment
if Rails.env.development?
  puts "🌱 Seeding development data..."
  
  # Create a sample user for development
  # Note: In a real WebAuthn app, users are created through the registration flow
  # This is just for development convenience
  sample_user = User.find_or_create_by(id: 1) do |user|
    puts "  Creating sample user..."
  end
  
  # Create some sample todos
  if sample_user.todos.empty?
    puts "  Creating sample todos..."
    
    [
      { title: "Set up WebAuthn authentication", status: "done", position: 1 },
      { title: "Implement todo CRUD operations", status: "done", position: 2 },
      { title: "Add drag and drop functionality", status: "done", position: 3 },
      { title: "Write comprehensive tests", status: "open", position: 4 },
      { title: "Deploy to production", status: "open", position: 5 },
      { title: "Add user documentation", status: "open", position: 6 }
    ].each do |todo_attrs|
      sample_user.todos.create!(todo_attrs)
    end
  end
  
  puts "✅ Development data seeded successfully!"
  puts "   Sample user ID: #{sample_user.id}"
  puts "   Sample todos: #{sample_user.todos.count}"
end
