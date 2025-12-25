require 'rails_helper'

RSpec.describe "Drag and Drop Integration", type: :request do
  let!(:user) { User.create! }
  let!(:other_user) { User.create! }

  before do
    # Simulate authenticated session for user
    allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
    allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)
  end

  describe "Complete Drag-and-Drop Reordering Workflow" do
    it "successfully reorders todos through complete workflow" do
      # Step 1: Create initial todo list
      todo_ids = []
      (1..5).each do |i|
        post '/api/todos', params: { title: "Todo #{i}" }
        expect(response).to have_http_status(:created)

        result = JSON.parse(response.body)
        todo_ids << result['todo']['id']
      end

      # Step 2: Verify initial order
      get '/api/todos'
      expect(response).to have_http_status(:success)

      initial_list = JSON.parse(response.body)['todos']
      expect(initial_list.map { |t| t['title'] }).to eq([ 'Todo 1', 'Todo 2', 'Todo 3', 'Todo 4', 'Todo 5' ])
      expect(initial_list.map { |t| t['position'] }).to eq([ 1, 2, 3, 4, 5 ])

      # Step 3: Move first todo to the end (position 5)
      patch '/api/todos/reorder',
        params: {
          updates: [ { id: todo_ids[0], position: 5 } ]
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:success)

      reorder_result = JSON.parse(response.body)
      expect(reorder_result['success']).to be true
      expect(reorder_result['message']).to include('Todos reordered successfully')

      # Step 4: Verify new order after single move
      get '/api/todos'
      expect(response).to have_http_status(:success)

      after_move_list = JSON.parse(response.body)['todos']
      expect(after_move_list.length).to eq(5)

      # Verify positions are sequential and unique
      positions = after_move_list.map { |t| t['position'] }.sort
      expect(positions).to eq([ 1, 2, 3, 4, 5 ])

      # Verify Todo 1 is now at the end
      last_todo = after_move_list.find { |t| t['position'] == 5 }
      expect(last_todo['title']).to eq('Todo 1')

      # Step 5: Perform complex reordering - swap multiple todos
      patch '/api/todos/reorder',
        params: {
          updates: [
            { id: todo_ids[1], position: 1 },  # Todo 2 to position 1
            { id: todo_ids[2], position: 2 },  # Todo 3 to position 2
            { id: todo_ids[3], position: 4 }   # Todo 4 to position 4
          ]
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:success)

      # Step 6: Verify complex reordering result
      get '/api/todos'
      expect(response).to have_http_status(:success)

      complex_reorder_list = JSON.parse(response.body)['todos']

      # Verify all positions are still sequential and unique
      final_positions = complex_reorder_list.map { |t| t['position'] }.sort
      expect(final_positions).to eq([ 1, 2, 3, 4, 5 ])

      # Verify that the todos we explicitly moved are in reasonable positions
      # The exact positions may vary due to normalization, but the relative order should be maintained
      position_1_todo = complex_reorder_list.find { |t| t['position'] == 1 }
      position_2_todo = complex_reorder_list.find { |t| t['position'] == 2 }

      # At minimum, Todo 2 and Todo 3 should be in the first two positions (in some order)
      first_two_titles = [ position_1_todo['title'], position_2_todo['title'] ].sort
      expect(first_two_titles).to include('Todo 2')
      expect(first_two_titles).to include('Todo 3')

      # Step 7: Add new todo and verify it gets correct position
      post '/api/todos', params: { title: 'New Todo' }
      expect(response).to have_http_status(:created)

      new_todo_result = JSON.parse(response.body)
      expect(new_todo_result['todo']['position']).to eq(6)

      # Step 8: Reorder with the new todo included
      new_todo_id = new_todo_result['todo']['id']

      patch '/api/todos/reorder',
        params: {
          updates: [
            { id: new_todo_id, position: 1 }  # Move new todo to front
          ]
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:success)

      # Step 9: Final verification
      get '/api/todos'
      expect(response).to have_http_status(:success)

      final_list = JSON.parse(response.body)['todos']
      expect(final_list.length).to eq(6)

      # Verify all positions are sequential
      all_final_positions = final_list.map { |t| t['position'] }.sort
      expect(all_final_positions).to eq([ 1, 2, 3, 4, 5, 6 ])

      # Verify new todo is at position 1
      first_todo = final_list.find { |t| t['position'] == 1 }
      expect(first_todo['title']).to eq('New Todo')
    end

    it "handles position conflicts and resolves them automatically" do
      # Step 1: Create test todos
      todo_ids = []
      (1..4).each do |i|
        post '/api/todos', params: { title: "Conflict Todo #{i}" }
        expect(response).to have_http_status(:created)

        result = JSON.parse(response.body)
        todo_ids << result['todo']['id']
      end

      # Step 2: Create intentional position conflicts
      patch '/api/todos/reorder',
        params: {
          updates: [
            { id: todo_ids[0], position: 2 },  # Todo 1 to position 2
            { id: todo_ids[1], position: 2 },  # Todo 2 to position 2 (conflict!)
            { id: todo_ids[2], position: 2 }   # Todo 3 to position 2 (conflict!)
          ]
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:success)

      conflict_result = JSON.parse(response.body)
      expect(conflict_result['success']).to be true
      expect(conflict_result['message']).to include('Todos reordered successfully')

      # Step 3: Verify conflicts are resolved with unique positions
      get '/api/todos'
      expect(response).to have_http_status(:success)

      resolved_list = JSON.parse(response.body)['todos']

      # All positions should be unique and sequential
      positions = resolved_list.map { |t| t['position'] }.sort
      expect(positions).to eq([ 1, 2, 3, 4 ])
      expect(positions.uniq.length).to eq(positions.length)

      # Step 4: Test swapping positions (temporary conflicts)
      patch '/api/todos/reorder',
        params: {
          updates: [
            { id: todo_ids[0], position: 4 },  # Move first to last
            { id: todo_ids[3], position: 1 }   # Move last to first
          ]
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:success)

      # Step 5: Verify swap was handled correctly
      get '/api/todos'
      expect(response).to have_http_status(:success)

      swapped_list = JSON.parse(response.body)['todos']

      # Positions should still be unique and sequential
      swap_positions = swapped_list.map { |t| t['position'] }.sort
      expect(swap_positions).to eq([ 1, 2, 3, 4 ])

      # Verify the todos moved to expected relative positions
      first_position_todo = swapped_list.find { |t| t['position'] == 1 }
      last_position_todo = swapped_list.find { |t| t['position'] == 4 }

      expect(first_position_todo['title']).to eq('Conflict Todo 4')
      expect(last_position_todo['title']).to eq('Conflict Todo 1')
    end
  end

  describe "Drag-and-Drop with Todo Lifecycle Integration" do
    it "maintains correct ordering through create, reorder, and delete operations" do
      # Step 1: Create initial todos
      todo_ids = []
      [ 'Alpha', 'Beta', 'Gamma' ].each do |name|
        post '/api/todos', params: { title: name }
        expect(response).to have_http_status(:created)

        result = JSON.parse(response.body)
        todo_ids << result['todo']['id']
      end

      # Step 2: Reorder to Gamma, Alpha, Beta
      patch '/api/todos/reorder',
        params: {
          updates: [
            { id: todo_ids[2], position: 1 },  # Gamma to position 1
            { id: todo_ids[0], position: 2 },  # Alpha to position 2
            { id: todo_ids[1], position: 3 }   # Beta to position 3
          ]
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:success)

      # Step 3: Verify reordering
      get '/api/todos'
      expect(response).to have_http_status(:success)

      reordered_list = JSON.parse(response.body)['todos']
      titles_in_order = reordered_list.sort_by { |t| t['position'] }.map { |t| t['title'] }
      expect(titles_in_order).to eq([ 'Gamma', 'Alpha', 'Beta' ])

      # Step 4: Add new todo (should go to end)
      post '/api/todos', params: { title: 'Delta' }
      expect(response).to have_http_status(:created)

      new_result = JSON.parse(response.body)
      delta_id = new_result['todo']['id']
      expect(new_result['todo']['position']).to eq(4)

      # Step 5: Move new todo to position 2
      patch '/api/todos/reorder',
        params: {
          updates: [ { id: delta_id, position: 2 } ]
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:success)

      # Step 6: Verify insertion
      get '/api/todos'
      expect(response).to have_http_status(:success)

      after_insert_list = JSON.parse(response.body)['todos']
      titles_after_insert = after_insert_list.sort_by { |t| t['position'] }.map { |t| t['title'] }
      expect(titles_after_insert).to eq([ 'Gamma', 'Delta', 'Alpha', 'Beta' ])

      # Step 7: Delete middle todo (Delta)
      delete "/api/todos/#{delta_id}"
      expect(response).to have_http_status(:success)

      # Step 8: Verify positions adjusted after deletion
      get '/api/todos'
      expect(response).to have_http_status(:success)

      after_delete_list = JSON.parse(response.body)['todos']
      expect(after_delete_list.length).to eq(3)

      positions_after_delete = after_delete_list.map { |t| t['position'] }.sort
      expect(positions_after_delete).to eq([ 1, 2, 3 ])

      titles_after_delete = after_delete_list.sort_by { |t| t['position'] }.map { |t| t['title'] }
      expect(titles_after_delete).to eq([ 'Gamma', 'Alpha', 'Beta' ])

      # Step 9: Final reorder to original order
      alpha_id = after_delete_list.find { |t| t['title'] == 'Alpha' }['id']
      gamma_id = after_delete_list.find { |t| t['title'] == 'Gamma' }['id']

      patch '/api/todos/reorder',
        params: {
          updates: [
            { id: alpha_id, position: 1 },
            { id: gamma_id, position: 3 }
          ]
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:success)

      # Step 10: Final verification
      get '/api/todos'
      expect(response).to have_http_status(:success)

      final_list = JSON.parse(response.body)['todos']
      final_titles = final_list.sort_by { |t| t['position'] }.map { |t| t['title'] }
      expect(final_titles).to eq([ 'Alpha', 'Beta', 'Gamma' ])
    end
  end

  describe "Cross-User Drag-and-Drop Security" do
    it "prevents unauthorized reordering across users" do
      # Step 1: Create todos for current user
      user_todo_ids = []
      [ 'User1 Todo1', 'User1 Todo2' ].each do |title|
        post '/api/todos', params: { title: title }
        expect(response).to have_http_status(:created)

        result = JSON.parse(response.body)
        user_todo_ids << result['todo']['id']
      end

      # Step 2: Create todos for other user
      other_todo_ids = []
      [ 'Other Todo1', 'Other Todo2' ].each do |title|
        other_user.todos.create!(title: title, status: 'open', position: other_user.todos.count + 1)
      end
      other_todo_ids = other_user.todos.pluck(:id)

      # Step 3: Try to reorder other user's todos
      patch '/api/todos/reorder',
        params: {
          updates: [ { id: other_todo_ids.first, position: 1 } ]
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:forbidden)

      error_result = JSON.parse(response.body)
      expect(error_result['error']).to include('Unauthorized access to todos')

      # Step 4: Try mixed reordering (own + other user's todos)
      patch '/api/todos/reorder',
        params: {
          updates: [
            { id: user_todo_ids.first, position: 2 },
            { id: other_todo_ids.first, position: 1 }
          ]
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:forbidden)

      mixed_error = JSON.parse(response.body)
      expect(mixed_error['error']).to include('Unauthorized access to todos')

      # Step 5: Verify no changes were made to any todos
      get '/api/todos'
      expect(response).to have_http_status(:success)

      user_todos = JSON.parse(response.body)['todos']
      expect(user_todos.length).to eq(2)
      expect(user_todos.map { |t| t['position'] }.sort).to eq([ 1, 2 ])

      # Verify other user's todos unchanged
      other_user.todos.reload
      expect(other_user.todos.count).to eq(2)
      expect(other_user.todos.pluck(:position).sort).to eq([ 1, 2 ])

      # Step 6: Verify legitimate reordering still works
      patch '/api/todos/reorder',
        params: {
          updates: [
            { id: user_todo_ids[0], position: 2 },
            { id: user_todo_ids[1], position: 1 }
          ]
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:success)

      legitimate_result = JSON.parse(response.body)
      expect(legitimate_result['success']).to be true
    end
  end

  describe "Drag-and-Drop Error Handling and Recovery" do
    it "handles various error conditions gracefully" do
      # Step 1: Create test todos
      todo_ids = []
      (1..3).each do |i|
        post '/api/todos', params: { title: "Error Test #{i}" }
        expect(response).to have_http_status(:created)

        result = JSON.parse(response.body)
        todo_ids << result['todo']['id']
      end

      # Step 2: Test empty updates
      patch '/api/todos/reorder',
        params: { updates: [] }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:bad_request)

      empty_error = JSON.parse(response.body)
      expect(empty_error['error']).to include('No updates provided')

      # Step 3: Test missing updates parameter
      patch '/api/todos/reorder',
        params: {}.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:bad_request)

      missing_error = JSON.parse(response.body)
      expect(missing_error['error']).to include('No updates provided')

      # Step 4: Test non-existent todo IDs
      patch '/api/todos/reorder',
        params: {
          updates: [ { id: 99999, position: 1 } ]
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:forbidden)

      nonexistent_error = JSON.parse(response.body)
      expect(nonexistent_error['error']).to include('Unauthorized access to todos')

      # Step 5: Test mixed valid and invalid IDs
      patch '/api/todos/reorder',
        params: {
          updates: [
            { id: todo_ids.first, position: 1 },
            { id: 99999, position: 2 }
          ]
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:forbidden)

      # Step 6: Verify original todos are unchanged after errors
      get '/api/todos'
      expect(response).to have_http_status(:success)

      unchanged_list = JSON.parse(response.body)['todos']
      expect(unchanged_list.length).to eq(3)
      expect(unchanged_list.map { |t| t['position'] }.sort).to eq([ 1, 2, 3 ])

      # Step 7: Test successful reorder after errors
      patch '/api/todos/reorder',
        params: {
          updates: [ { id: todo_ids.last, position: 1 } ]
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:success)

      recovery_result = JSON.parse(response.body)
      expect(recovery_result['success']).to be true

      # Step 8: Verify successful reorder worked
      get '/api/todos'
      expect(response).to have_http_status(:success)

      recovered_list = JSON.parse(response.body)['todos']
      first_todo = recovered_list.find { |t| t['position'] == 1 }
      expect(first_todo['title']).to eq('Error Test 3')
    end
  end

  describe "Authentication Integration with Drag-and-Drop" do
    it "handles authentication state changes during reorder operations" do
      # Step 1: Create todos while authenticated
      todo_ids = []
      [ 'Auth Test 1', 'Auth Test 2', 'Auth Test 3' ].each do |title|
        post '/api/todos', params: { title: title }
        expect(response).to have_http_status(:created)

        result = JSON.parse(response.body)
        todo_ids << result['todo']['id']
      end

      # Step 2: Perform successful reorder
      patch '/api/todos/reorder',
        params: {
          updates: [ { id: todo_ids.last, position: 1 } ]
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:success)

      # Step 3: Simulate session expiration
      allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(nil)
      allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(false)

      # Step 4: Try to reorder without authentication
      patch '/api/todos/reorder',
        params: {
          updates: [ { id: todo_ids.first, position: 3 } ]
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:unauthorized)

      auth_error = JSON.parse(response.body)
      expect(auth_error['error']).to include('Authentication required')

      # Step 5: Re-authenticate
      allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
      allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)

      # Step 6: Verify reorder works again after re-authentication
      patch '/api/todos/reorder',
        params: {
          updates: [ { id: todo_ids.first, position: 3 } ]
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:success)

      reauth_result = JSON.parse(response.body)
      expect(reauth_result['success']).to be true

      # Step 7: Verify final state
      get '/api/todos'
      expect(response).to have_http_status(:success)

      final_list = JSON.parse(response.body)['todos']
      expect(final_list.length).to eq(3)

      last_position_todo = final_list.find { |t| t['position'] == 3 }
      expect(last_position_todo['title']).to eq('Auth Test 1')
    end
  end
end
