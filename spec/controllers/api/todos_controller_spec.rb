require 'rails_helper'

RSpec.describe Api::TodosController, type: :request do
  let(:user) { User.create! }
  let(:other_user) { User.create! }

  describe 'Authentication' do
    it 'rejects unauthenticated requests' do
      get '/api/todos'
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'CRUD Operations' do
    before { sign_in_as(user) }

    describe 'GET /api/todos' do
      it 'returns todos for authenticated user' do
        user.todos.create!(title: 'Todo 1', status: 'open', position: 1)
        user.todos.create!(title: 'Todo 2', status: 'done', position: 2)

        get '/api/todos'

        expect(response).to have_http_status(:success)
        result = JSON.parse(response.body)
        expect(result['todos'].length).to eq(2)
      end

      it 'returns empty array when no todos' do
        get '/api/todos'

        expect(response).to have_http_status(:success)
        result = JSON.parse(response.body)
        expect(result['todos']).to eq([])
      end
    end

    describe 'GET /api/todos/:id' do
      it 'returns a specific todo' do
        todo = user.todos.create!(title: 'Test Todo', status: 'open', position: 1)

        get "/api/todos/#{todo.id}"

        expect(response).to have_http_status(:success)
        result = JSON.parse(response.body)
        expect(result['todo']['title']).to eq('Test Todo')
      end

      it 'returns 404 for non-existent todo' do
        get '/api/todos/99999'
        expect(response).to have_http_status(:not_found)
      end
    end

    describe 'POST /api/todos' do
      it 'creates a new todo' do
        post '/api/todos', params: { title: 'New Todo' }

        expect(response).to have_http_status(:created)
        result = JSON.parse(response.body)
        expect(result['success']).to be true
        expect(result['todo']['title']).to eq('New Todo')
        expect(result['todo']['status']).to eq('open')
      end

      it 'returns error for empty title' do
        post '/api/todos', params: { title: '' }
        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    describe 'PATCH /api/todos/:id' do
      let(:todo) { user.todos.create!(title: 'Original', status: 'open', position: 1) }

      it 'updates a todo' do
        patch "/api/todos/#{todo.id}", params: { title: 'Updated', status: 'done' }

        expect(response).to have_http_status(:success)
        result = JSON.parse(response.body)
        expect(result['todo']['title']).to eq('Updated')
        expect(result['todo']['status']).to eq('done')
      end
    end

    describe 'DELETE /api/todos/:id' do
      it 'deletes a todo' do
        todo = user.todos.create!(title: 'To Delete', status: 'open', position: 1)

        delete "/api/todos/#{todo.id}"

        expect(response).to have_http_status(:success)
        expect(Todo.exists?(todo.id)).to be false
      end
    end
  end

  describe 'Authorization' do
    before { sign_in_as(user) }

    it 'prevents access to other users todos' do
      other_todo = other_user.todos.create!(title: 'Other', status: 'open', position: 1)

      get "/api/todos/#{other_todo.id}"
      expect(response).to have_http_status(:forbidden)

      patch "/api/todos/#{other_todo.id}", params: { title: 'Hacked' }
      expect(response).to have_http_status(:forbidden)

      delete "/api/todos/#{other_todo.id}"
      expect(response).to have_http_status(:forbidden)
    end

    it 'only returns current users todos in index' do
      user.todos.create!(title: 'My Todo', status: 'open', position: 1)
      other_user.todos.create!(title: 'Other Todo', status: 'open', position: 1)

      get '/api/todos'

      result = JSON.parse(response.body)
      expect(result['todos'].length).to eq(1)
      expect(result['todos'].first['title']).to eq('My Todo')
    end
  end

  describe 'Reorder' do
    before { sign_in_as(user) }

    it 'reorders todos successfully' do
      todo1 = user.todos.create!(title: 'Todo 1', status: 'open', position: 1)
      user.todos.create!(title: 'Todo 2', status: 'open', position: 2)
      user.todos.create!(title: 'Todo 3', status: 'open', position: 3)

      patch '/api/todos/reorder',
        params: { updates: [{ id: todo1.id, position: 3 }] }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:success)
      result = JSON.parse(response.body)
      expect(result['success']).to be true
    end

    it 'returns error for empty updates' do
      patch '/api/todos/reorder',
        params: { updates: [] }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:bad_request)
    end

    it 'prevents reordering other users todos' do
      other_todo = other_user.todos.create!(title: 'Other', status: 'open', position: 1)

      patch '/api/todos/reorder',
        params: { updates: [{ id: other_todo.id, position: 2 }] }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:forbidden)
    end
  end
end
