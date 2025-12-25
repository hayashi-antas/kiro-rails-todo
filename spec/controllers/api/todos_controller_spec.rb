require 'rails_helper'

RSpec.describe Api::TodosController, type: :request do
  let(:user) { User.create! }
  let(:other_user) { User.create! }
  let(:todo) { user.todos.create!(title: 'Test Todo', status: 'open', position: 1) }
  let(:other_todo) { other_user.todos.create!(title: 'Other Todo', status: 'open', position: 1) }

  describe 'Authentication filters' do
    context 'without authentication' do
      it 'rejects GET /api/todos' do
        get '/api/todos'
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to include('Authentication required')
      end

      it 'rejects POST /api/todos' do
        post '/api/todos', params: { title: 'New Todo' }
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to include('Authentication required')
      end

      it 'rejects PATCH /api/todos/:id' do
        patch "/api/todos/#{todo.id}", params: { title: 'Updated' }
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to include('Authentication required')
      end

      it 'rejects DELETE /api/todos/:id' do
        delete "/api/todos/#{todo.id}"
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to include('Authentication required')
      end

      it 'rejects PATCH /api/todos/reorder' do
        patch '/api/todos/reorder', params: { updates: [ { id: todo.id, position: 2 } ] }
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to include('Authentication required')
      end
    end

    context 'with valid authentication' do
      before do
        # Simulate authenticated session
        allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
        allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)
      end

      it 'allows GET /api/todos' do
        get '/api/todos'
        expect(response).to have_http_status(:success)
      end

      it 'allows POST /api/todos' do
        post '/api/todos', params: { title: 'New Todo' }
        expect(response).to have_http_status(:created)
      end

      it 'allows PATCH /api/todos/:id for owned todo' do
        patch "/api/todos/#{todo.id}", params: { title: 'Updated' }
        expect(response).to have_http_status(:success)
      end

      it 'allows DELETE /api/todos/:id for owned todo' do
        delete "/api/todos/#{todo.id}"
        expect(response).to have_http_status(:success)
      end

      it 'allows PATCH /api/todos/reorder for owned todos' do
        patch '/api/todos/reorder', params: { updates: [ { id: todo.id, position: 2 } ] }
        expect(response).to have_http_status(:success)
      end
    end
  end

  describe 'Authorization filters' do
    before do
      # Simulate authenticated session for user
      allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
      allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)
    end

    it 'prevents access to other users todos via GET' do
      get "/api/todos/#{other_todo.id}"
      expect(response).to have_http_status(:forbidden)
      expect(JSON.parse(response.body)['error']).to include('Unauthorized access to todo')
    end

    it 'prevents access to other users todos via PATCH' do
      patch "/api/todos/#{other_todo.id}", params: { title: 'Hacked' }
      expect(response).to have_http_status(:forbidden)
      expect(JSON.parse(response.body)['error']).to include('Unauthorized access to todo')
    end

    it 'prevents access to other users todos via DELETE' do
      delete "/api/todos/#{other_todo.id}"
      expect(response).to have_http_status(:forbidden)
      expect(JSON.parse(response.body)['error']).to include('Unauthorized access to todo')
    end

    it 'prevents reordering other users todos' do
      patch '/api/todos/reorder', params: { updates: [ { id: other_todo.id, position: 2 } ] }
      expect(response).to have_http_status(:forbidden)
      expect(JSON.parse(response.body)['error']).to include('Unauthorized access to todos')
    end

    it 'only returns current users todos in index' do
      # Create todos for both users
      user.todos.create!(title: 'User Todo 1', status: 'open', position: 1)
      user.todos.create!(title: 'User Todo 2', status: 'done', position: 2)
      other_user.todos.create!(title: 'Other User Todo', status: 'open', position: 1)

      get '/api/todos'
      expect(response).to have_http_status(:success)

      result = JSON.parse(response.body)
      expect(result['todos'].length).to eq(2)
      expect(result['todos'].all? { |t| t['title'].include?('User Todo') }).to be true
    end
  end

  describe 'CRUD Operations' do
    before do
      # Simulate authenticated session for user
      allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
      allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)
    end

    describe 'GET /api/todos (index)' do
      it 'returns todos in position order with correct JSON format' do
        todo1 = user.todos.create!(title: 'First Todo', status: 'open', position: 1)
        todo2 = user.todos.create!(title: 'Second Todo', status: 'done', position: 2)

        get '/api/todos'
        expect(response).to have_http_status(:success)
        expect(response.content_type).to include('application/json')

        result = JSON.parse(response.body)
        expect(result).to have_key('todos')
        expect(result['todos'].length).to eq(2)

        # Verify JSON format
        first_todo = result['todos'].first
        expect(first_todo).to have_key('id')
        expect(first_todo).to have_key('title')
        expect(first_todo).to have_key('status')
        expect(first_todo).to have_key('position')
        expect(first_todo).to have_key('created_at')

        # Verify order
        expect(result['todos'].first['position']).to eq(1)
        expect(result['todos'].last['position']).to eq(2)
      end

      it 'returns empty array when user has no todos' do
        get '/api/todos'
        expect(response).to have_http_status(:success)

        result = JSON.parse(response.body)
        expect(result['todos']).to eq([])
      end
    end

    describe 'GET /api/todos/:id (show)' do
      it 'returns todo with correct JSON format' do
        get "/api/todos/#{todo.id}"
        expect(response).to have_http_status(:success)
        expect(response.content_type).to include('application/json')

        result = JSON.parse(response.body)
        expect(result).to have_key('todo')

        todo_data = result['todo']
        expect(todo_data['id']).to eq(todo.id)
        expect(todo_data['title']).to eq('Test Todo')
        expect(todo_data['status']).to eq('open')
        expect(todo_data['position']).to eq(1)
        expect(todo_data).to have_key('created_at')
      end

      it 'returns 404 for non-existent todo' do
        get '/api/todos/99999'
        expect(response).to have_http_status(:not_found)

        result = JSON.parse(response.body)
        expect(result['error']).to include('Todo not found')
      end
    end

    describe 'POST /api/todos (create)' do
      it 'creates todo with correct JSON response format' do
        post '/api/todos', params: { title: 'New Todo' }
        expect(response).to have_http_status(:created)
        expect(response.content_type).to include('application/json')

        result = JSON.parse(response.body)
        expect(result['success']).to be true
        expect(result).to have_key('todo')

        todo_data = result['todo']
        expect(todo_data['title']).to eq('New Todo')
        expect(todo_data['status']).to eq('open')
        expect(todo_data['position']).to eq(1)
        expect(todo_data).to have_key('id')
        expect(todo_data).to have_key('created_at')
      end

      it 'assigns correct position when other todos exist' do
        user.todos.create!(title: 'Existing Todo', status: 'open', position: 1)

        post '/api/todos', params: { title: 'New Todo' }
        expect(response).to have_http_status(:created)

        result = JSON.parse(response.body)
        expect(result['todo']['position']).to eq(2)
      end
    end

    describe 'PATCH /api/todos/:id (update)' do
      it 'updates todo with correct JSON response format' do
        patch "/api/todos/#{todo.id}", params: { title: 'Updated Title', status: 'done' }
        expect(response).to have_http_status(:success)
        expect(response.content_type).to include('application/json')

        result = JSON.parse(response.body)
        expect(result['success']).to be true
        expect(result).to have_key('todo')

        todo_data = result['todo']
        expect(todo_data['title']).to eq('Updated Title')
        expect(todo_data['status']).to eq('done')
        expect(todo_data['id']).to eq(todo.id)
      end

      it 'updates only title when only title provided' do
        patch "/api/todos/#{todo.id}", params: { title: 'Only Title Updated' }
        expect(response).to have_http_status(:success)

        result = JSON.parse(response.body)
        expect(result['todo']['title']).to eq('Only Title Updated')
        expect(result['todo']['status']).to eq('open')  # Should remain unchanged
      end

      it 'updates only status when only status provided' do
        patch "/api/todos/#{todo.id}", params: { status: 'done' }
        expect(response).to have_http_status(:success)

        result = JSON.parse(response.body)
        expect(result['todo']['status']).to eq('done')
        expect(result['todo']['title']).to eq('Test Todo')  # Should remain unchanged
      end
    end

    describe 'DELETE /api/todos/:id (destroy)' do
      it 'deletes todo with correct JSON response format' do
        delete "/api/todos/#{todo.id}"
        expect(response).to have_http_status(:success)
        expect(response.content_type).to include('application/json')

        result = JSON.parse(response.body)
        expect(result['success']).to be true
        expect(result['message']).to include('Todo deleted successfully')

        # Verify todo was actually deleted
        expect(Todo.exists?(todo.id)).to be false
      end

      it 'maintains position integrity after deletion' do
        todo1 = user.todos.create!(title: 'Todo 1', status: 'open', position: 1)
        todo2 = user.todos.create!(title: 'Todo 2', status: 'open', position: 2)
        todo3 = user.todos.create!(title: 'Todo 3', status: 'open', position: 3)

        # Delete middle todo
        delete "/api/todos/#{todo2.id}"
        expect(response).to have_http_status(:success)

        # Verify positions were adjusted
        todo1.reload
        todo3.reload
        expect(todo1.position).to eq(1)
        expect(todo3.position).to eq(2)  # Should be decremented
      end
    end
  end

  describe 'Validation Error Handling' do
    before do
      # Simulate authenticated session for user
      allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
      allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)
    end

    describe 'POST /api/todos with invalid data' do
      it 'returns validation errors for empty title' do
        post '/api/todos', params: { title: '' }
        expect(response).to have_http_status(:unprocessable_entity)
        expect(response.content_type).to include('application/json')

        result = JSON.parse(response.body)
        expect(result['error']).to include('Todo creation failed')
        expect(result).to have_key('errors')
        expect(result['errors']).to include("Title can't be blank")
      end

      it 'accepts whitespace-only title (validation should be improved)' do
        # Note: This test documents current behavior - the validation should be improved
        post '/api/todos', params: { title: '   \t\n   ' }
        expect(response).to have_http_status(:created)

        result = JSON.parse(response.body)
        expect(result['success']).to be true
        # The title gets stored as-is, which may not be ideal
      end

      it 'returns validation errors for missing title' do
        post '/api/todos', params: {}
        expect(response).to have_http_status(:unprocessable_entity)

        result = JSON.parse(response.body)
        expect(result['error']).to include('Todo creation failed')
        expect(result['errors']).to include("Title can't be blank")
      end
    end

    describe 'PATCH /api/todos/:id with invalid data' do
      it 'returns validation errors for empty title' do
        patch "/api/todos/#{todo.id}", params: { title: '' }
        expect(response).to have_http_status(:unprocessable_entity)
        expect(response.content_type).to include('application/json')

        result = JSON.parse(response.body)
        expect(result['error']).to include('Todo update failed')
        expect(result).to have_key('errors')
        expect(result['errors']).to include("Title can't be blank")
      end

      it 'accepts whitespace-only title (validation should be improved)' do
        # Note: This test documents current behavior - the validation should be improved
        patch "/api/todos/#{todo.id}", params: { title: '   \t\n   ' }
        expect(response).to have_http_status(:success)

        result = JSON.parse(response.body)
        expect(result['success']).to be true
        # The title gets stored as-is, which may not be ideal
      end

      it 'returns error for invalid status' do
        patch "/api/todos/#{todo.id}", params: { status: 'invalid_status' }

        expect(response).to have_http_status(:internal_server_error)
        result = JSON.parse(response.body)
        expect(result['error']).to include("'invalid_status' is not a valid status")
      end
    end
  end

  describe 'Reorder functionality' do
    before do
      # Simulate authenticated session for user
      allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
      allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)
    end

    describe 'bulk position updates' do
      it 'successfully updates multiple todo positions without conflicts' do
        todo1 = user.todos.create!(title: 'Todo 1', status: 'open', position: 1)
        todo2 = user.todos.create!(title: 'Todo 2', status: 'open', position: 2)
        todo3 = user.todos.create!(title: 'Todo 3', status: 'open', position: 3)

        # Move todo1 to position 3, todo3 to position 1 (non-conflicting)
        patch '/api/todos/reorder',
          params: {
            updates: [
              { id: todo1.id, position: 4 },  # Move to safe position first
              { id: todo3.id, position: 1 }   # Then move to desired position
            ]
          }.to_json,
          headers: { 'Content-Type' => 'application/json' }

        expect(response).to have_http_status(:success)

        result = JSON.parse(response.body)
        expect(result['success']).to be true
        expect(result['message']).to include('Todos reordered successfully')

        # Verify positions are sequential and unique after normalization
        user.todos.reload
        all_positions = user.todos.pluck(:position).sort
        expect(all_positions).to eq([ 1, 2, 3 ])

        # Verify the order has changed
        ordered_todos = user.todos.ordered.to_a
        expect(ordered_todos.map(&:id)).not_to eq([ todo1.id, todo2.id, todo3.id ])
      end

      it 'handles single todo position update' do
        todo1 = user.todos.create!(title: 'Todo 1', status: 'open', position: 1)
        todo2 = user.todos.create!(title: 'Todo 2', status: 'open', position: 2)
        todo3 = user.todos.create!(title: 'Todo 3', status: 'open', position: 3)

        original_order = [ todo1.id, todo2.id, todo3.id ]

        # Move todo1 to position 3 (end of list)
        patch '/api/todos/reorder',
          params: {
            updates: [
              { id: todo1.id, position: 3 }
            ]
          }.to_json,
          headers: { 'Content-Type' => 'application/json' }

        expect(response).to have_http_status(:success)

        result = JSON.parse(response.body)
        expect(result['success']).to be true
        expect(result['message']).to include('Todos reordered successfully')

        # Verify positions are sequential and unique
        user.todos.reload
        all_positions = user.todos.pluck(:position).sort
        expect(all_positions).to eq([ 1, 2, 3 ])

        # Verify the order has changed - todo1 should now be at the end
        new_order = user.todos.ordered.pluck(:id)
        expect(new_order).not_to eq(original_order)
        expect(new_order.last).to eq(todo1.id)  # todo1 should be at the end
      end
    end

    describe 'position conflict handling' do
      it 'resolves conflicts when multiple todos claim the same position' do
        todo1 = user.todos.create!(title: 'Todo 1', status: 'open', position: 1)
        todo2 = user.todos.create!(title: 'Todo 2', status: 'open', position: 2)
        todo3 = user.todos.create!(title: 'Todo 3', status: 'open', position: 3)

        # Try to move both todo1 and todo2 to position 2 (conflict)
        patch '/api/todos/reorder',
          params: {
            updates: [
              { id: todo1.id, position: 2 },
              { id: todo2.id, position: 2 }
            ]
          }.to_json,
          headers: { 'Content-Type' => 'application/json' }

        expect(response).to have_http_status(:success)

        result = JSON.parse(response.body)
        expect(result['success']).to be true
        expect(result['message']).to include('Todos reordered successfully')

        # Verify all todos have unique positions
        all_positions = user.todos.pluck(:position)
        expect(all_positions.uniq.length).to eq(all_positions.length)
        expect(all_positions.sort).to eq([ 1, 2, 3 ])
      end

      it 'handles position swapping conflicts' do
        todo1 = user.todos.create!(title: 'Todo 1', status: 'open', position: 1)
        todo2 = user.todos.create!(title: 'Todo 2', status: 'open', position: 2)

        # Try to swap positions (would cause temporary conflict)
        patch '/api/todos/reorder',
          params: {
            updates: [
              { id: todo1.id, position: 2 },
              { id: todo2.id, position: 1 }
            ]
          }.to_json,
          headers: { 'Content-Type' => 'application/json' }

        expect(response).to have_http_status(:success)

        result = JSON.parse(response.body)
        expect(result['success']).to be true
        expect(result['message']).to include('Todos reordered successfully')

        # Verify positions are unique and sequential
        all_positions = user.todos.pluck(:position).sort
        expect(all_positions).to eq([ 1, 2 ])

        # Verify todos have been assigned valid positions
        todo1.reload
        todo2.reload
        expect([ todo1.position, todo2.position ].sort).to eq([ 1, 2 ])
      end
    end

    describe 'authorization for reorder operations' do
      let(:other_user) { User.create! }
      let(:other_todo) { other_user.todos.create!(title: 'Other Todo', status: 'open', position: 1) }

      it 'prevents reordering other users todos' do
        patch '/api/todos/reorder', params: { updates: [ { id: other_todo.id, position: 2 } ] }

        expect(response).to have_http_status(:forbidden)
        expect(JSON.parse(response.body)['error']).to include('Unauthorized access to todos')

        # Verify other user's todo was not modified
        other_todo.reload
        expect(other_todo.position).to eq(1)
      end

      it 'prevents mixed user todo reordering' do
        user_todo = user.todos.create!(title: 'User Todo', status: 'open', position: 1)

        patch '/api/todos/reorder', params: {
          updates: [
            { id: user_todo.id, position: 2 },
            { id: other_todo.id, position: 1 }
          ]
        }

        expect(response).to have_http_status(:forbidden)
        expect(JSON.parse(response.body)['error']).to include('Unauthorized access to todos')

        # Verify no todos were modified
        user_todo.reload
        other_todo.reload
        expect(user_todo.position).to eq(1)
        expect(other_todo.position).to eq(1)
      end

      it 'allows reordering only owned todos' do
        todo1 = user.todos.create!(title: 'Todo 1', status: 'open', position: 1)
        todo2 = user.todos.create!(title: 'Todo 2', status: 'open', position: 2)

        patch '/api/todos/reorder', params: {
          updates: [
            { id: todo1.id, position: 3 },
            { id: todo2.id, position: 1 }
          ]
        }

        expect(response).to have_http_status(:success)

        result = JSON.parse(response.body)
        expect(result['success']).to be true
      end
    end

    it 'returns error for empty updates' do
      patch '/api/todos/reorder',
        params: { updates: [] }.to_json,
        headers: { 'Content-Type' => 'application/json' }
      expect(response).to have_http_status(:bad_request)

      result = JSON.parse(response.body)
      expect(result['error']).to include('No updates provided')
    end

    it 'returns error for missing updates parameter' do
      patch '/api/todos/reorder',
        params: {}.to_json,
        headers: { 'Content-Type' => 'application/json' }
      expect(response).to have_http_status(:bad_request)

      result = JSON.parse(response.body)
      expect(result['error']).to include('No updates provided')
    end

    it 'returns error for non-existent todo IDs' do
      patch '/api/todos/reorder',
        params: {
          updates: [ { id: 99999, position: 1 } ]
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:forbidden)
      expect(JSON.parse(response.body)['error']).to include('Unauthorized access to todos')
    end
  end
end
