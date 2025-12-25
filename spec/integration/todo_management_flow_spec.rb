require 'rails_helper'

RSpec.describe "Todo Management Flow Integration", type: :request do
  let!(:user) { User.create! }
  let!(:other_user) { User.create! }

  before do
    # Simulate authenticated session for user
    allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
    allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)
  end

  describe "Complete Todo CRUD Workflow" do
    it "successfully creates, reads, updates, and deletes todos with proper isolation" do
      # Step 1: Verify empty todo list
      get '/api/todos'
      expect(response).to have_http_status(:success)

      result = JSON.parse(response.body)
      expect(result['todos']).to eq([])

      # Step 2: Create first todo
      post '/api/todos', params: { title: 'First Todo' }
      expect(response).to have_http_status(:created)

      create_result = JSON.parse(response.body)
      expect(create_result['success']).to be true
      expect(create_result['todo']['title']).to eq('First Todo')
      expect(create_result['todo']['status']).to eq('open')
      expect(create_result['todo']['position']).to eq(1)

      first_todo_id = create_result['todo']['id']

      # Step 3: Create second todo
      post '/api/todos', params: { title: 'Second Todo' }
      expect(response).to have_http_status(:created)

      create_result2 = JSON.parse(response.body)
      expect(create_result2['todo']['position']).to eq(2)

      second_todo_id = create_result2['todo']['id']

      # Step 4: Verify todo list shows both todos in correct order
      get '/api/todos'
      expect(response).to have_http_status(:success)

      list_result = JSON.parse(response.body)
      expect(list_result['todos'].length).to eq(2)
      expect(list_result['todos'].first['id']).to eq(first_todo_id)
      expect(list_result['todos'].last['id']).to eq(second_todo_id)

      # Step 5: Update first todo title and status
      patch "/api/todos/#{first_todo_id}", params: { title: 'Updated First Todo', status: 'done' }
      expect(response).to have_http_status(:success)

      update_result = JSON.parse(response.body)
      expect(update_result['success']).to be true
      expect(update_result['todo']['title']).to eq('Updated First Todo')
      expect(update_result['todo']['status']).to eq('done')

      # Step 6: Verify individual todo retrieval
      get "/api/todos/#{first_todo_id}"
      expect(response).to have_http_status(:success)

      show_result = JSON.parse(response.body)
      expect(show_result['todo']['title']).to eq('Updated First Todo')
      expect(show_result['todo']['status']).to eq('done')

      # Step 7: Delete second todo
      delete "/api/todos/#{second_todo_id}"
      expect(response).to have_http_status(:success)

      delete_result = JSON.parse(response.body)
      expect(delete_result['success']).to be true

      # Step 8: Verify todo list shows only first todo with adjusted position
      get '/api/todos'
      expect(response).to have_http_status(:success)

      final_list = JSON.parse(response.body)
      expect(final_list['todos'].length).to eq(1)
      expect(final_list['todos'].first['id']).to eq(first_todo_id)
      expect(final_list['todos'].first['position']).to eq(1)  # Position should be adjusted

      # Step 9: Verify deleted todo cannot be accessed
      get "/api/todos/#{second_todo_id}"
      expect(response).to have_http_status(:not_found)

      not_found_result = JSON.parse(response.body)
      expect(not_found_result['error']).to include('Todo not found')
    end

    it "maintains data isolation between users throughout workflow" do
      # Create todos for other user
      other_user.todos.create!(title: 'Other User Todo 1', status: 'open', position: 1)
      other_user.todos.create!(title: 'Other User Todo 2', status: 'done', position: 2)

      # Step 1: Verify current user sees empty list
      get '/api/todos'
      expect(response).to have_http_status(:success)

      result = JSON.parse(response.body)
      expect(result['todos']).to eq([])

      # Step 2: Create todo for current user
      post '/api/todos', params: { title: 'My Todo' }
      expect(response).to have_http_status(:created)

      create_result = JSON.parse(response.body)
      my_todo_id = create_result['todo']['id']

      # Step 3: Verify current user sees only their todo
      get '/api/todos'
      expect(response).to have_http_status(:success)

      list_result = JSON.parse(response.body)
      expect(list_result['todos'].length).to eq(1)
      expect(list_result['todos'].first['title']).to eq('My Todo')

      # Step 4: Try to access other user's todo directly
      other_todo = other_user.todos.first
      get "/api/todos/#{other_todo.id}"
      expect(response).to have_http_status(:forbidden)

      error_result = JSON.parse(response.body)
      expect(error_result['error']).to include('Unauthorized access to todo')

      # Step 5: Try to update other user's todo
      patch "/api/todos/#{other_todo.id}", params: { title: 'Hacked Title' }
      expect(response).to have_http_status(:forbidden)

      # Step 6: Try to delete other user's todo
      delete "/api/todos/#{other_todo.id}"
      expect(response).to have_http_status(:forbidden)

      # Step 7: Verify other user's todos remain unchanged
      expect(other_user.todos.count).to eq(2)
      expect(other_user.todos.first.title).to eq('Other User Todo 1')
      expect(other_user.todos.last.title).to eq('Other User Todo 2')

      # Step 8: Verify current user can still manage their own todo
      patch "/api/todos/#{my_todo_id}", params: { title: 'Updated My Todo' }
      expect(response).to have_http_status(:success)

      update_result = JSON.parse(response.body)
      expect(update_result['todo']['title']).to eq('Updated My Todo')
    end
  end

  describe "Todo Validation and Error Handling Workflow" do
    it "handles validation errors gracefully throughout the workflow" do
      # Step 1: Try to create todo with empty title
      post '/api/todos', params: { title: '' }
      expect(response).to have_http_status(:unprocessable_entity)

      error_result = JSON.parse(response.body)
      expect(error_result['error']).to include('Todo creation failed')
      expect(error_result['errors']).to include("Title can't be blank")

      # Step 2: Try to create todo with missing title
      post '/api/todos', params: {}
      expect(response).to have_http_status(:unprocessable_entity)

      # Step 3: Create valid todo
      post '/api/todos', params: { title: 'Valid Todo' }
      expect(response).to have_http_status(:created)

      create_result = JSON.parse(response.body)
      todo_id = create_result['todo']['id']

      # Step 4: Try to update with empty title
      patch "/api/todos/#{todo_id}", params: { title: '' }
      expect(response).to have_http_status(:unprocessable_entity)

      update_error = JSON.parse(response.body)
      expect(update_error['error']).to include('Todo update failed')
      expect(update_error['errors']).to include("Title can't be blank")

      # Step 5: Try to update with invalid status
      patch "/api/todos/#{todo_id}", params: { status: 'invalid_status' }
      expect(response).to have_http_status(:internal_server_error)

      status_error = JSON.parse(response.body)
      expect(status_error['error']).to include("'invalid_status' is not a valid status")

      # Step 6: Verify todo remains unchanged after failed updates
      get "/api/todos/#{todo_id}"
      expect(response).to have_http_status(:success)

      show_result = JSON.parse(response.body)
      expect(show_result['todo']['title']).to eq('Valid Todo')
      expect(show_result['todo']['status']).to eq('open')

      # Step 7: Perform valid update
      patch "/api/todos/#{todo_id}", params: { title: 'Updated Valid Todo', status: 'done' }
      expect(response).to have_http_status(:success)

      final_result = JSON.parse(response.body)
      expect(final_result['todo']['title']).to eq('Updated Valid Todo')
      expect(final_result['todo']['status']).to eq('done')
    end

    it "handles non-existent todo operations gracefully" do
      non_existent_id = 99999

      # Step 1: Try to get non-existent todo
      get "/api/todos/#{non_existent_id}"
      expect(response).to have_http_status(:not_found)

      error_result = JSON.parse(response.body)
      expect(error_result['error']).to include('Todo not found')

      # Step 2: Try to update non-existent todo
      patch "/api/todos/#{non_existent_id}", params: { title: 'Updated' }
      expect(response).to have_http_status(:not_found)

      # Step 3: Try to delete non-existent todo
      delete "/api/todos/#{non_existent_id}"
      expect(response).to have_http_status(:not_found)

      # Step 4: Create a todo and delete it
      post '/api/todos', params: { title: 'Temporary Todo' }
      expect(response).to have_http_status(:created)

      create_result = JSON.parse(response.body)
      todo_id = create_result['todo']['id']

      delete "/api/todos/#{todo_id}"
      expect(response).to have_http_status(:success)

      # Step 5: Try to access the deleted todo
      get "/api/todos/#{todo_id}"
      expect(response).to have_http_status(:not_found)

      # Step 6: Try to update the deleted todo
      patch "/api/todos/#{todo_id}", params: { title: 'Updated Deleted' }
      expect(response).to have_http_status(:not_found)

      # Step 7: Try to delete the already deleted todo
      delete "/api/todos/#{todo_id}"
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "Position Management Workflow" do
    it "maintains correct positions throughout todo lifecycle" do
      # Step 1: Create multiple todos and verify positions
      todo_ids = []

      (1..5).each do |i|
        post '/api/todos', params: { title: "Todo #{i}" }
        expect(response).to have_http_status(:created)

        result = JSON.parse(response.body)
        expect(result['todo']['position']).to eq(i)
        todo_ids << result['todo']['id']
      end

      # Step 2: Verify all todos are in correct order
      get '/api/todos'
      expect(response).to have_http_status(:success)

      list_result = JSON.parse(response.body)
      expect(list_result['todos'].length).to eq(5)

      list_result['todos'].each_with_index do |todo, index|
        expect(todo['position']).to eq(index + 1)
        expect(todo['title']).to eq("Todo #{index + 1}")
      end

      # Step 3: Delete middle todo (position 3)
      delete "/api/todos/#{todo_ids[2]}"
      expect(response).to have_http_status(:success)

      # Step 4: Verify positions are adjusted correctly
      get '/api/todos'
      expect(response).to have_http_status(:success)

      adjusted_list = JSON.parse(response.body)
      expect(adjusted_list['todos'].length).to eq(4)

      expected_titles = [ 'Todo 1', 'Todo 2', 'Todo 4', 'Todo 5' ]
      adjusted_list['todos'].each_with_index do |todo, index|
        expect(todo['position']).to eq(index + 1)
        expect(todo['title']).to eq(expected_titles[index])
      end

      # Step 5: Delete first todo
      delete "/api/todos/#{todo_ids[0]}"
      expect(response).to have_http_status(:success)

      # Step 6: Verify positions are adjusted again
      get '/api/todos'
      expect(response).to have_http_status(:success)

      final_list = JSON.parse(response.body)
      expect(final_list['todos'].length).to eq(3)

      expected_final_titles = [ 'Todo 2', 'Todo 4', 'Todo 5' ]
      final_list['todos'].each_with_index do |todo, index|
        expect(todo['position']).to eq(index + 1)
        expect(todo['title']).to eq(expected_final_titles[index])
      end

      # Step 7: Add new todo and verify it gets the next position
      post '/api/todos', params: { title: 'New Todo' }
      expect(response).to have_http_status(:created)

      new_result = JSON.parse(response.body)
      expect(new_result['todo']['position']).to eq(4)

      # Step 8: Final verification of complete list
      get '/api/todos'
      expect(response).to have_http_status(:success)

      complete_list = JSON.parse(response.body)
      expect(complete_list['todos'].length).to eq(4)

      all_positions = complete_list['todos'].map { |t| t['position'] }
      expect(all_positions).to eq([ 1, 2, 3, 4 ])
    end
  end

  describe "Concurrent User Operations" do
    let!(:user2) { User.create! }

    it "handles concurrent operations between users without interference" do
      # Setup: Create todos for both users
      user.todos.create!(title: 'User1 Todo1', status: 'open', position: 1)
      user.todos.create!(title: 'User1 Todo2', status: 'open', position: 2)

      user2.todos.create!(title: 'User2 Todo1', status: 'open', position: 1)
      user2.todos.create!(title: 'User2 Todo2', status: 'open', position: 2)

      # Step 1: User1 operations (current session)
      get '/api/todos'
      expect(response).to have_http_status(:success)

      user1_todos = JSON.parse(response.body)['todos']
      expect(user1_todos.length).to eq(2)
      expect(user1_todos.map { |t| t['title'] }).to match_array([ 'User1 Todo1', 'User1 Todo2' ])

      # Step 2: Create new todo for user1
      post '/api/todos', params: { title: 'User1 Todo3' }
      expect(response).to have_http_status(:created)

      create_result = JSON.parse(response.body)
      expect(create_result['todo']['position']).to eq(3)

      # Step 3: Simulate user2 session and operations
      allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user2)
      allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)

      get '/api/todos'
      expect(response).to have_http_status(:success)

      user2_todos = JSON.parse(response.body)['todos']
      expect(user2_todos.length).to eq(2)
      expect(user2_todos.map { |t| t['title'] }).to match_array([ 'User2 Todo1', 'User2 Todo2' ])

      # Step 4: User2 creates new todo
      post '/api/todos', params: { title: 'User2 Todo3' }
      expect(response).to have_http_status(:created)

      user2_create_result = JSON.parse(response.body)
      expect(user2_create_result['todo']['position']).to eq(3)  # Independent position counter

      # Step 5: Switch back to user1 session
      allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
      allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)

      get '/api/todos'
      expect(response).to have_http_status(:success)

      final_user1_todos = JSON.parse(response.body)['todos']
      expect(final_user1_todos.length).to eq(3)
      expect(final_user1_todos.map { |t| t['title'] }).to match_array([ 'User1 Todo1', 'User1 Todo2', 'User1 Todo3' ])

      # Step 6: Verify user2's todos are unchanged
      expect(user2.todos.count).to eq(3)
      expect(user2.todos.pluck(:title)).to match_array([ 'User2 Todo1', 'User2 Todo2', 'User2 Todo3' ])

      # Step 7: Verify position independence
      user1_positions = user.todos.pluck(:position).sort
      user2_positions = user2.todos.pluck(:position).sort

      expect(user1_positions).to eq([ 1, 2, 3 ])
      expect(user2_positions).to eq([ 1, 2, 3 ])
    end
  end

  describe "Authentication State Changes During Workflow" do
    it "handles session expiration gracefully during todo operations" do
      # Step 1: Create a todo while authenticated
      post '/api/todos', params: { title: 'Test Todo' }
      expect(response).to have_http_status(:created)

      create_result = JSON.parse(response.body)
      todo_id = create_result['todo']['id']

      # Step 2: Verify todo exists
      get "/api/todos/#{todo_id}"
      expect(response).to have_http_status(:success)

      # Step 3: Simulate session expiration
      allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(nil)
      allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(false)

      # Step 4: Try to access todos without authentication
      get '/api/todos'
      expect(response).to have_http_status(:unauthorized)

      error_result = JSON.parse(response.body)
      expect(error_result['error']).to include('Authentication required')

      # Step 5: Try to update todo without authentication
      patch "/api/todos/#{todo_id}", params: { title: 'Updated' }
      expect(response).to have_http_status(:unauthorized)

      # Step 6: Try to delete todo without authentication
      delete "/api/todos/#{todo_id}"
      expect(response).to have_http_status(:unauthorized)

      # Step 7: Re-authenticate
      allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
      allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)

      # Step 8: Verify todo still exists and can be accessed
      get "/api/todos/#{todo_id}"
      expect(response).to have_http_status(:success)

      show_result = JSON.parse(response.body)
      expect(show_result['todo']['title']).to eq('Test Todo')

      # Step 9: Verify todo can be updated after re-authentication
      patch "/api/todos/#{todo_id}", params: { title: 'Finally Updated' }
      expect(response).to have_http_status(:success)

      update_result = JSON.parse(response.body)
      expect(update_result['todo']['title']).to eq('Finally Updated')
    end
  end
end
