require 'rails_helper'
require 'rantly/rspec_extensions'

RSpec.describe Todo, type: :model do
  describe "associations" do
    it "belongs to user" do
      expect(Todo.reflect_on_association(:user).macro).to eq(:belongs_to)
    end

    it "is destroyed when user is destroyed" do
      user = User.create!
      todo = user.todos.create!(title: "Test todo", position: 1)

      expect { user.destroy }.to change(Todo, :count).by(-1)
    end
  end

  describe "validations" do
    let(:user) { User.create! }

    it "validates presence of title" do
      todo = user.todos.build(position: 1)
      expect(todo).not_to be_valid
      expect(todo.errors[:title]).to include("can't be blank")
    end

    it "validates presence of position" do
      todo = user.todos.build(title: "Test todo")
      expect(todo).not_to be_valid
      expect(todo.errors[:position]).to include("can't be blank")
    end

    it "validates uniqueness of position within user scope" do
      user.todos.create!(title: "First todo", position: 1)

      duplicate_position_todo = user.todos.build(title: "Second todo", position: 1)
      expect(duplicate_position_todo).not_to be_valid
      expect(duplicate_position_todo.errors[:position]).to include("has already been taken")
    end

    it "allows same position for different users" do
      user1 = User.create!
      user2 = User.create!

      user1.todos.create!(title: "User 1 todo", position: 1)
      todo2 = user2.todos.build(title: "User 2 todo", position: 1)

      expect(todo2).to be_valid
    end

    it "rejects whitespace-only titles" do
      todo = user.todos.build(title: "   \t\n   ", position: 1)
      expect(todo).not_to be_valid
      expect(todo.errors[:title]).to include("can't be blank")
    end

    it "accepts valid titles" do
      todo = user.todos.build(title: "Valid todo title", position: 1)
      expect(todo).to be_valid
    end
  end

  describe "Property 4: Input Validation" do
    # **Feature: passkey-todo-board, Property 4: Input Validation**
    # **Validates: Requirements 3.3**
    it "rejects creation with empty or whitespace-only titles" do
      property_of {
        # Generate whitespace-only strings and empty strings
        whitespace_chars = [ ' ', "\t", "\n", "\r" ]
        whitespace_string = Rantly {
          choose(
            '',  # empty string
            array(range(1, 10)) { choose(*whitespace_chars) }.join  # whitespace-only string
          )
        }

        position = Rantly { range(1, 1000) }
        [ whitespace_string, position ]
      }.check(100) do |invalid_title, position|
        user = User.create!

        # Attempt to create todo with invalid title
        todo = user.todos.build(title: invalid_title, position: position)

        # Should be invalid
        expect(todo).not_to be_valid
        expect(todo.errors[:title]).to include("can't be blank")

        # Should not be saved to database
        expect { todo.save }.not_to change(Todo, :count)

        # Verify the todo was not persisted
        expect(todo.persisted?).to be false
      end
    end
  end

  describe "enums" do
    it "defines status enum correctly" do
      expect(Todo.statuses).to eq({ "open" => 0, "done" => 1 })
    end
  end

  describe "scopes" do
    it "has ordered scope" do
      expect(Todo).to respond_to(:ordered)
    end
  end
end
