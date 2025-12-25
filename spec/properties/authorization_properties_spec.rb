require 'rails_helper'
require 'rantly'

RSpec.describe "Authorization Properties", type: :request do
  before do
    # Clear any existing data
    User.destroy_all
    Credential.destroy_all
  end

  describe "Property 7: Authentication Enforcement" do
    # **Feature: passkey-todo-board, Property 7: Authentication Enforcement**
    # **Validates: Requirements 3.5, 10.5**

    it "should reject unauthenticated requests to protected resources and redirect to authentication" do
      100.times do
        # Create a user and some todos for testing
        user = User.create!
        todo = user.todos.create!(
          title: Rantly { sized(10) { string(:alnum) } },
          status: Rantly { choose(:open, :done) },
          position: Rantly { integer(1..100) }
        )

        # Test various protected endpoints without authentication
        protected_endpoints = [
          { method: :get, path: '/api/todos' },
          { method: :post, path: '/api/todos', params: { title: 'Test Todo' } },
          { method: :patch, path: "/api/todos/#{todo.id}", params: { title: 'Updated' } },
          { method: :delete, path: "/api/todos/#{todo.id}" },
          { method: :patch, path: '/api/todos/reorder', params: { updates: [ { id: todo.id, position: 2 } ] } }
        ]

        # Test each endpoint without authentication
        endpoint = Rantly { choose(*protected_endpoints) }

        # Ensure no session exists
        get '/up'  # Clear session

        case endpoint[:method]
        when :get
          get endpoint[:path]
        when :post
          post endpoint[:path], params: endpoint[:params] || {}
        when :patch
          patch endpoint[:path], params: endpoint[:params] || {}
        when :delete
          delete endpoint[:path]
        end

        # Should return unauthorized status
        expect(response).to have_http_status(:unauthorized)

        # Should return appropriate error message
        if response.content_type&.include?('application/json')
          result = JSON.parse(response.body)
          expect(result).to have_key('error')
          expect(result['error']).to include('Authentication required')
        end

        # Verify no session was established
        expect(session[:user_id]).to be_nil
        expect(session[:authenticated_at]).to be_nil

        # Clean up for next iteration
        User.destroy_all
        Credential.destroy_all
      end
    end
  end

  describe "Property 12: Session Management" do
    # **Feature: passkey-todo-board, Property 12: Session Management**
    # **Validates: Requirements 7.1, 7.3**

    it "should destroy session on logout and prevent access to protected resources until re-authentication" do
      100.times do
        # Create user and establish authenticated session
        user = User.create!
        credential = user.credentials.create!(
          credential_id: Base64.urlsafe_encode64(SecureRandom.random_bytes(32)),
          public_key: SecureRandom.random_bytes(65),
          sign_count: Rantly { integer(0..100) }
        )

        # Establish session manually (simulating successful authentication)
        # We'll use a direct session assignment since we're testing session management, not authentication
        post '/api/webauthn/authentication/options'
        expect(response).to have_http_status(:success)

        # Mock successful authentication to establish session
        mock_webauthn_credential = double(sign_count: credential.sign_count + 1)
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

        # Test logout
        post '/api/logout'
        expect(response).to have_http_status(:success)

        result = JSON.parse(response.body)
        expect(result['success']).to be true
        expect(result['message']).to include('Logged out successfully')

        # Verify session was destroyed
        expect(session[:user_id]).to be_nil
        expect(session[:authenticated_at]).to be_nil

        # Test that protected resources are now inaccessible
        get '/api/todos'
        expect(response).to have_http_status(:unauthorized)

        # Test creating a todo (should fail)
        post '/api/todos', params: { title: 'Test Todo' }
        expect(response).to have_http_status(:unauthorized)

        # Clean up for next iteration
        User.destroy_all
        Credential.destroy_all
        get '/up'  # Clear any remaining session data
      end
    end
  end
end
