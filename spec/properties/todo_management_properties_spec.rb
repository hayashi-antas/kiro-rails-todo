require 'rails_helper'
require 'rantly'

RSpec.describe "Todo Management Properties", type: :request do
  
  before do
    # Clear any existing data
    User.destroy_all
    Credential.destroy_all
    Todo.destroy_all
  end
  
  describe "Property 3: Todo Creation and Persistence" do
    # **Feature: passkey-todo-board, Property 3: Todo Creation and Persistence**
    # **Validates: Requirements 3.1, 3.2, 3.4**
    
    it "should create persisted todos with 'open' status and next available position for authenticated users with valid titles" do
      100.times do
        # Create user and establish authenticated session
        user = User.create!
        
        # Mock authentication
        allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
        allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)
        
        # Generate valid todo title (non-empty, not just whitespace)
        valid_title = Rantly { 
          sized(range(1, 100)) { 
            string(:alnum).strip 
          }.tap { |s| 
            # Ensure it's not empty after stripping
            s = "Valid Todo #{rand(1000)}" if s.empty?
          }
        }
        
        # Create some existing todos to test position assignment
        existing_todo_count = Rantly { range(0, 5) }
        existing_todos = []
        existing_todo_count.times do |i|
          existing_todos << user.todos.create!(
            title: "Existing Todo #{i}",
            status: Rantly { choose(:open, :done) },
            position: i + 1
          )
        end
        
        expected_position = existing_todo_count + 1
        initial_todo_count = Todo.count
        
        # Create new todo via API
        post '/api/todos', params: { title: valid_title }
        
        # Should return success
        expect(response).to have_http_status(:created)
        
        result = JSON.parse(response.body)
        expect(result['success']).to be true
        expect(result).to have_key('todo')
        
        created_todo = result['todo']
        
        # Verify todo properties
        expect(created_todo['title']).to eq(valid_title)
        expect(created_todo['status']).to eq('open')  # Should default to 'open'
        expect(created_todo['position']).to eq(expected_position)
        expect(created_todo).to have_key('id')
        expect(created_todo).to have_key('created_at')
        
        # Verify persistence - todo should exist in database
        expect(Todo.count).to eq(initial_todo_count + 1)
        
        persisted_todo = Todo.find(created_todo['id'])
        expect(persisted_todo.title).to eq(valid_title)
        expect(persisted_todo.status).to eq('open')
        expect(persisted_todo.position).to eq(expected_position)
        expect(persisted_todo.user_id).to eq(user.id)
        
        # Verify it's immediately retrievable via API
        get '/api/todos'
        expect(response).to have_http_status(:success)
        
        todos_result = JSON.parse(response.body)
        found_todo = todos_result['todos'].find { |t| t['id'] == created_todo['id'] }
        expect(found_todo).to be_present
        expect(found_todo['title']).to eq(valid_title)
        expect(found_todo['status']).to eq('open')
        expect(found_todo['position']).to eq(expected_position)
        
        # Clean up for next iteration
        User.destroy_all
        Todo.destroy_all
      end
    end
  end
  
  describe "Property 5: Todo Modification Persistence" do
    # **Feature: passkey-todo-board, Property 5: Todo Modification Persistence**
    # **Validates: Requirements 4.1, 4.2**
    
    it "should immediately persist and make retrievable any valid modifications to authenticated user's todos" do
      100.times do
        # Create user and establish authenticated session
        user = User.create!
        
        # Mock authentication
        allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
        allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)
        
        # Create an existing todo
        original_title = Rantly { sized(range(1, 50)) { string(:alnum) } }
        original_status = Rantly { choose(:open, :done) }
        todo = user.todos.create!(
          title: original_title,
          status: original_status,
          position: 1
        )
        
        # Generate valid modifications
        modification_type = Rantly { choose(:title, :status, :both) }
        
        new_title = case modification_type
        when :title, :both
          Rantly { sized(range(1, 50)) { string(:alnum) } }
        else
          original_title.to_s
        end
        
        new_status = case modification_type
        when :status, :both
          # Toggle status
          original_status == 'open' ? 'done' : 'open'
        else
          original_status.to_s
        end
        
        # Update todo via API
        patch "/api/todos/#{todo.id}", params: { 
          title: new_title, 
          status: new_status 
        }
        
        # Should return success
        expect(response).to have_http_status(:success)
        
        result = JSON.parse(response.body)
        expect(result['success']).to be true
        expect(result).to have_key('todo')
        
        updated_todo = result['todo']
        
        # Verify updated properties in response
        expect(updated_todo['title']).to eq(new_title)
        expect(updated_todo['status']).to eq(new_status)
        expect(updated_todo['id']).to eq(todo.id)
        
        # Verify immediate persistence - reload from database
        todo.reload
        expect(todo.title).to eq(new_title)
        expect(todo.status).to eq(new_status)
        expect(todo.user_id).to eq(user.id)  # Should remain unchanged
        expect(todo.position).to eq(1)  # Should remain unchanged
        
        # Verify it's immediately retrievable via API
        get '/api/todos'
        expect(response).to have_http_status(:success)
        
        todos_result = JSON.parse(response.body)
        found_todo = todos_result['todos'].find { |t| t['id'] == todo.id }
        expect(found_todo).to be_present
        expect(found_todo['title']).to eq(new_title)
        expect(found_todo['status']).to eq(new_status)
        
        # Verify individual todo retrieval
        get "/api/todos/#{todo.id}"
        expect(response).to have_http_status(:success)
        
        individual_result = JSON.parse(response.body)
        expect(individual_result['todo']['title']).to eq(new_title)
        expect(individual_result['todo']['status']).to eq(new_status)
        
        # Clean up for next iteration
        User.destroy_all
        Todo.destroy_all
      end
    end
  end
  
  describe "Property 6: Data Isolation" do
    # **Feature: passkey-todo-board, Property 6: Data Isolation**
    # **Validates: Requirements 4.3, 5.3, 10.1, 10.2, 10.3, 10.4**
    
    it "should only allow authenticated users to access their own todos and reject attempts to access other users' data" do
      100.times do
        # Create two users with their own todos
        user1 = User.create!
        user2 = User.create!
        
        # Create todos for both users
        user1_todo = user1.todos.create!(
          title: Rantly { sized(range(1, 50)) { string(:alnum) } },
          status: Rantly { choose(:open, :done) },
          position: 1
        )
        
        user2_todo = user2.todos.create!(
          title: Rantly { sized(range(1, 50)) { string(:alnum) } },
          status: Rantly { choose(:open, :done) },
          position: 1
        )
        
        # Authenticate as user1
        allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user1)
        allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)
        
        # Test 1: GET /api/todos should only return user1's todos
        get '/api/todos'
        expect(response).to have_http_status(:success)
        
        result = JSON.parse(response.body)
        expect(result['todos'].length).to eq(1)
        expect(result['todos'].first['id']).to eq(user1_todo.id)
        expect(result['todos'].none? { |t| t['id'] == user2_todo.id }).to be true
        
        # Test 2: GET /api/todos/:id should reject access to other user's todo
        get "/api/todos/#{user2_todo.id}"
        expect(response).to have_http_status(:forbidden)
        
        error_result = JSON.parse(response.body)
        expect(error_result['error']).to include('Unauthorized access to todo')
        
        # Test 3: PATCH /api/todos/:id should reject modification of other user's todo
        patch "/api/todos/#{user2_todo.id}", params: { title: 'Hacked Title' }
        expect(response).to have_http_status(:forbidden)
        
        error_result = JSON.parse(response.body)
        expect(error_result['error']).to include('Unauthorized access to todo')
        
        # Verify user2's todo was not modified
        user2_todo.reload
        expect(user2_todo.title).not_to eq('Hacked Title')
        
        # Test 4: DELETE /api/todos/:id should reject deletion of other user's todo
        delete "/api/todos/#{user2_todo.id}"
        expect(response).to have_http_status(:forbidden)
        
        error_result = JSON.parse(response.body)
        expect(error_result['error']).to include('Unauthorized access to todo')
        
        # Verify user2's todo still exists
        expect(Todo.exists?(user2_todo.id)).to be true
        
        # Test 5: POST /api/todos should automatically associate with authenticated user
        new_todo_title = Rantly { sized(range(1, 50)) { string(:alnum) } }
        post '/api/todos', params: { title: new_todo_title }
        expect(response).to have_http_status(:created)
        
        result = JSON.parse(response.body)
        created_todo_id = result['todo']['id']
        created_todo = Todo.find(created_todo_id)
        expect(created_todo.user_id).to eq(user1.id)
        expect(created_todo.user_id).not_to eq(user2.id)
        
        # Test 6: PATCH /api/todos/reorder should reject reordering other user's todos
        patch '/api/todos/reorder', params: { 
          updates: [{ id: user2_todo.id, position: 2 }] 
        }
        expect(response).to have_http_status(:forbidden)
        
        error_result = JSON.parse(response.body)
        expect(error_result['error']).to include('Unauthorized access to todos')
        
        # Verify user2's todo position was not changed
        user2_todo.reload
        expect(user2_todo.position).to eq(1)
        
        # Test 7: Switch to user2 and verify they can only access their own data
        allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user2)
        
        get '/api/todos'
        expect(response).to have_http_status(:success)
        
        result = JSON.parse(response.body)
        expect(result['todos'].length).to eq(1)
        expect(result['todos'].first['id']).to eq(user2_todo.id)
        expect(result['todos'].none? { |t| t['id'] == user1_todo.id }).to be true
        
        # Clean up for next iteration
        User.destroy_all
        Todo.destroy_all
      end
    end
  end
  
  describe "Property 8: Todo Deletion and Position Integrity" do
    # **Feature: passkey-todo-board, Property 8: Todo Deletion and Position Integrity**
    # **Validates: Requirements 5.1, 5.2**
    
    it "should permanently remove todos while maintaining valid position values for remaining todos" do
      100.times do
        # Create user and establish authenticated session
        user = User.create!
        
        # Mock authentication
        allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
        allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)
        
        # Create multiple todos with sequential positions
        todo_count = Rantly { range(3, 8) }
        todos = []
        todo_count.times do |i|
          todos << user.todos.create!(
            title: "Todo #{i + 1}",
            status: Rantly { choose(:open, :done) },
            position: i + 1
          )
        end
        
        # Select a random todo to delete (not first or last to test position adjustment)
        delete_index = Rantly { range(1, todo_count - 2) } if todo_count > 2
        delete_index ||= Rantly { range(0, todo_count - 1) }
        todo_to_delete = todos[delete_index]
        deleted_position = todo_to_delete.position
        
        initial_todo_count = Todo.count
        
        # Delete the todo via API
        delete "/api/todos/#{todo_to_delete.id}"
        
        # Should return success
        expect(response).to have_http_status(:success)
        
        result = JSON.parse(response.body)
        expect(result['success']).to be true
        expect(result['message']).to include('Todo deleted successfully')
        
        # Verify todo was permanently removed from database
        expect(Todo.count).to eq(initial_todo_count - 1)
        expect(Todo.exists?(todo_to_delete.id)).to be false
        
        # Verify remaining todos have valid, sequential positions
        remaining_todos = user.todos.ordered.to_a
        expect(remaining_todos.length).to eq(todo_count - 1)
        
        # Check that positions are sequential starting from 1
        remaining_todos.each_with_index do |todo, index|
          expect(todo.position).to eq(index + 1)
        end
        
        # Verify todos that had positions greater than deleted todo were decremented
        todos.each do |original_todo|
          next if original_todo.id == todo_to_delete.id
          
          current_todo = Todo.find_by(id: original_todo.id)
          expect(current_todo).to be_present
          
          if original_todo.position > deleted_position
            # Position should be decremented by 1
            expect(current_todo.position).to eq(original_todo.position - 1)
          else
            # Position should remain the same
            expect(current_todo.position).to eq(original_todo.position)
          end
        end
        
        # Verify no gaps in position sequence
        positions = remaining_todos.map(&:position).sort
        expected_positions = (1..remaining_todos.length).to_a
        expect(positions).to eq(expected_positions)
        
        # Verify todos are still retrievable in correct order via API
        get '/api/todos'
        expect(response).to have_http_status(:success)
        
        api_result = JSON.parse(response.body)
        api_todos = api_result['todos']
        
        expect(api_todos.length).to eq(todo_count - 1)
        
        # Verify API returns todos in position order
        api_positions = api_todos.map { |t| t['position'] }
        expect(api_positions).to eq(api_positions.sort)
        expect(api_positions).to eq((1..api_todos.length).to_a)
        
        # Verify deleted todo is not in API response
        expect(api_todos.none? { |t| t['id'] == todo_to_delete.id }).to be true
        
        # Clean up for next iteration
        User.destroy_all
        Todo.destroy_all
      end
    end
  end
end