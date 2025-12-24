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
        patch '/api/todos/reorder', params: { updates: [{ id: todo.id, position: 2 }] }
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
        patch '/api/todos/reorder', params: { updates: [{ id: todo.id, position: 2 }] }
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
      patch '/api/todos/reorder', params: { updates: [{ id: other_todo.id, position: 2 }] }
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
end