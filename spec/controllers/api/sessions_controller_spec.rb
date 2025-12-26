require 'rails_helper'

RSpec.describe Api::SessionsController, type: :request do
  let(:user) { User.create! }

  describe 'POST /api/logout' do
    context 'with active session' do
      before { sign_in_as(user) }

      it 'successfully destroys the session' do
        post '/api/logout'

        expect(response).to have_http_status(:success)
        result = JSON.parse(response.body)

        expect(result['success']).to be true
        expect(result['message']).to eq('Logged out successfully')
      end

      it 'prevents access to protected resources after logout' do
        user.todos.create!(title: 'Test Todo', status: 'open', position: 1)

        post '/api/logout'
        expect(response).to have_http_status(:success)

        get '/api/todos'
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'without active session' do
      it 'handles logout gracefully when no session exists' do
        post '/api/logout'

        expect(response).to have_http_status(:success)
        result = JSON.parse(response.body)

        expect(result['success']).to be true
        expect(result['message']).to eq('Logged out successfully')
      end
    end
  end
end
