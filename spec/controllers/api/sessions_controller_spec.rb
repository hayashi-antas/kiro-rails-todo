require 'rails_helper'

RSpec.describe Api::SessionsController, type: :request do
  let(:user) { User.create! }
  
  describe 'POST /api/logout' do
    context 'with active session' do
      before do
        # Simulate an active session
        post '/api/webauthn/authentication/options'
        
        # Mock successful authentication to establish session
        credential = user.credentials.create!(
          credential_id: Base64.urlsafe_encode64(SecureRandom.random_bytes(32)),
          public_key: SecureRandom.random_bytes(65),
          sign_count: 0
        )
        
        mock_webauthn_credential = double(sign_count: 1)
        allow(WebAuthn::Credential).to receive(:from_get).and_return(mock_webauthn_credential)
        allow(mock_webauthn_credential).to receive(:verify).and_return(true)
        
        mock_credential = {
          'id' => credential.credential_id,
          'response' => { 'signature' => 'valid' }
        }
        
        post '/api/webauthn/authentication/verify', params: { credential: mock_credential }
        expect(response).to have_http_status(:success)
        
        # Verify session is established
        expect(session[:user_id]).to eq(user.id)
        expect(session[:authenticated_at]).to be_present
      end
      
      it 'successfully destroys the session' do
        post '/api/logout'
        
        expect(response).to have_http_status(:success)
        result = JSON.parse(response.body)
        
        expect(result['success']).to be true
        expect(result['message']).to eq('Logged out successfully')
        
        # Verify session was cleared
        expect(session[:user_id]).to be_nil
        expect(session[:authenticated_at]).to be_nil
      end
      
      it 'prevents access to protected resources after logout' do
        # Create a todo for testing
        todo = user.todos.create!(title: 'Test Todo', status: 'open', position: 1)
        
        # Logout
        post '/api/logout'
        expect(response).to have_http_status(:success)
        
        # Try to access protected resource
        get '/api/todos'
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to include('Authentication required')
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
    
    context 'when logout fails' do
      before do
        # Simulate session establishment
        allow_any_instance_of(ActionDispatch::Request::Session).to receive(:delete).and_raise(StandardError.new('Session error'))
      end
      
      it 'handles logout errors gracefully' do
        post '/api/logout'
        
        expect(response).to have_http_status(:internal_server_error)
        result = JSON.parse(response.body)
        
        expect(result['error']).to eq('Logout failed')
      end
    end
  end
end