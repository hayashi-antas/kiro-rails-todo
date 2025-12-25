require 'rails_helper'

RSpec.describe "Error Handling Integration", type: :request do
  let!(:user) { User.create! }
  let!(:other_user) { User.create! }

  describe "Authentication Error Boundaries" do
    it "handles authentication errors consistently across all endpoints" do
      # Test all protected endpoints without authentication
      protected_endpoints = [
        { method: :get, path: '/api/todos' },
        { method: :post, path: '/api/todos', params: { title: 'Test' } },
        { method: :get, path: '/api/todos/1' },
        { method: :patch, path: '/api/todos/1', params: { title: 'Updated' } },
        { method: :delete, path: '/api/todos/1' },
        { method: :patch, path: '/api/todos/reorder', params: { updates: [] } }
      ]

      protected_endpoints.each do |endpoint|
        case endpoint[:method]
        when :get
          get endpoint[:path]
        when :post
          post endpoint[:path], params: endpoint[:params] || {}
        when :patch
          if endpoint[:path].include?('reorder')
            patch endpoint[:path],
              params: (endpoint[:params] || {}).to_json,
              headers: { 'Content-Type' => 'application/json' }
          else
            patch endpoint[:path], params: endpoint[:params] || {}
          end
        when :delete
          delete endpoint[:path]
        end

        expect(response).to have_http_status(:unauthorized),
          "Expected #{endpoint[:method].upcase} #{endpoint[:path]} to return 401"

        error_result = JSON.parse(response.body)
        expect(error_result['error']).to include('Authentication required'),
          "Expected authentication error message for #{endpoint[:method].upcase} #{endpoint[:path]}"
      end
    end

    it "handles session expiration gracefully during multi-step operations" do
      # Step 1: Start authenticated
      allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
      allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)

      # Step 2: Create a todo
      post '/api/todos', params: { title: 'Session Test Todo' }
      expect(response).to have_http_status(:created)

      todo_result = JSON.parse(response.body)
      todo_id = todo_result['todo']['id']

      # Step 3: Simulate session expiration mid-workflow
      allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(nil)
      allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(false)

      # Step 4: Try to continue workflow - should fail consistently
      patch "/api/todos/#{todo_id}", params: { title: 'Updated Title' }
      expect(response).to have_http_status(:unauthorized)

      get "/api/todos/#{todo_id}"
      expect(response).to have_http_status(:unauthorized)

      delete "/api/todos/#{todo_id}"
      expect(response).to have_http_status(:unauthorized)

      # Step 5: Re-authenticate
      allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
      allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)

      # Step 6: Verify workflow can continue after re-authentication
      get "/api/todos/#{todo_id}"
      expect(response).to have_http_status(:success)

      show_result = JSON.parse(response.body)
      expect(show_result['todo']['title']).to eq('Session Test Todo')
    end
  end

  describe "Authorization Error Boundaries" do
    before do
      # Authenticate as user
      allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
      allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)
    end

    it "consistently prevents cross-user access across all operations" do
      # Create todos for other user
      other_todo = other_user.todos.create!(title: 'Other User Todo', status: 'open', position: 1)

      # Test all operations that should be forbidden
      forbidden_operations = [
        { method: :get, path: "/api/todos/#{other_todo.id}" },
        { method: :patch, path: "/api/todos/#{other_todo.id}", params: { title: 'Hacked' } },
        { method: :delete, path: "/api/todos/#{other_todo.id}" },
        { method: :patch, path: '/api/todos/reorder', params: { updates: [ { id: other_todo.id, position: 2 } ] } }
      ]

      forbidden_operations.each do |operation|
        case operation[:method]
        when :get
          get operation[:path]
        when :patch
          if operation[:path].include?('reorder')
            patch operation[:path],
              params: (operation[:params] || {}).to_json,
              headers: { 'Content-Type' => 'application/json' }
          else
            patch operation[:path], params: operation[:params] || {}
          end
        when :delete
          delete operation[:path]
        end

        expect(response).to have_http_status(:forbidden),
          "Expected #{operation[:method].upcase} #{operation[:path]} to return 403"

        error_result = JSON.parse(response.body)
        expect(error_result['error']).to match(/Unauthorized access|not found/i),
          "Expected authorization error for #{operation[:method].upcase} #{operation[:path]}"
      end

      # Verify other user's data remains unchanged
      other_todo.reload
      expect(other_todo.title).to eq('Other User Todo')
      expect(other_todo.position).to eq(1)
    end

    it "handles mixed authorization scenarios in batch operations" do
      # Create todos for both users
      user_todo = user.todos.create!(title: 'User Todo', status: 'open', position: 1)
      other_todo = other_user.todos.create!(title: 'Other Todo', status: 'open', position: 1)

      # Try to reorder both users' todos in one request
      patch '/api/todos/reorder',
        params: {
          updates: [
            { id: user_todo.id, position: 2 },
            { id: other_todo.id, position: 1 }
          ]
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:forbidden)

      error_result = JSON.parse(response.body)
      expect(error_result['error']).to include('Unauthorized access to todos')

      # Verify no changes were made to any todos
      user_todo.reload
      other_todo.reload
      expect(user_todo.position).to eq(1)
      expect(other_todo.position).to eq(1)
    end
  end

  describe "Validation Error Boundaries" do
    before do
      # Authenticate as user
      allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
      allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)
    end

    it "handles validation errors consistently across create and update operations" do
      # Test creation validation errors
      invalid_create_params = [
        { title: '' },
        { title: nil },
        {}
      ]

      invalid_create_params.each do |params|
        post '/api/todos', params: params
        expect(response).to have_http_status(:unprocessable_entity),
          "Expected validation error for params: #{params}"

        error_result = JSON.parse(response.body)
        expect(error_result['error']).to include('Todo creation failed')
        expect(error_result).to have_key('errors')
        expect(error_result['errors']).to include("Title can't be blank")
      end

      # Create a valid todo for update tests
      post '/api/todos', params: { title: 'Valid Todo' }
      expect(response).to have_http_status(:created)

      todo_result = JSON.parse(response.body)
      todo_id = todo_result['todo']['id']

      # Test update validation errors
      invalid_update_params = [
        { title: '' },
        { title: nil }
      ]

      invalid_update_params.each do |params|
        patch "/api/todos/#{todo_id}", params: params
        expect(response).to have_http_status(:unprocessable_entity),
          "Expected validation error for update params: #{params}"

        error_result = JSON.parse(response.body)
        expect(error_result['error']).to include('Todo update failed')
        expect(error_result).to have_key('errors')
        expect(error_result['errors']).to include("Title can't be blank")
      end

      # Test invalid status
      patch "/api/todos/#{todo_id}", params: { status: 'invalid_status' }
      expect(response).to have_http_status(:internal_server_error)

      status_error = JSON.parse(response.body)
      expect(status_error['error']).to include("'invalid_status' is not a valid status")

      # Verify todo remains unchanged after validation errors
      get "/api/todos/#{todo_id}"
      expect(response).to have_http_status(:success)

      unchanged_result = JSON.parse(response.body)
      expect(unchanged_result['todo']['title']).to eq('Valid Todo')
      expect(unchanged_result['todo']['status']).to eq('open')
    end

    it "handles validation errors in complex workflows" do
      # Step 1: Create valid todo
      post '/api/todos', params: { title: 'Workflow Todo' }
      expect(response).to have_http_status(:created)

      todo_result = JSON.parse(response.body)
      todo_id = todo_result['todo']['id']

      # Step 2: Try invalid update
      patch "/api/todos/#{todo_id}", params: { title: '' }
      expect(response).to have_http_status(:unprocessable_entity)

      # Step 3: Verify todo can still be accessed and is unchanged
      get "/api/todos/#{todo_id}"
      expect(response).to have_http_status(:success)

      show_result = JSON.parse(response.body)
      expect(show_result['todo']['title']).to eq('Workflow Todo')

      # Step 4: Perform valid update
      patch "/api/todos/#{todo_id}", params: { title: 'Updated Workflow Todo' }
      expect(response).to have_http_status(:success)

      # Step 5: Try another invalid update
      patch "/api/todos/#{todo_id}", params: { title: nil }
      expect(response).to have_http_status(:unprocessable_entity)

      # Step 6: Verify todo retains last valid state
      get "/api/todos/#{todo_id}"
      expect(response).to have_http_status(:success)

      final_result = JSON.parse(response.body)
      expect(final_result['todo']['title']).to eq('Updated Workflow Todo')
    end
  end

  describe "Resource Not Found Error Boundaries" do
    before do
      # Authenticate as user
      allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
      allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)
    end

    it "handles non-existent resources consistently" do
      non_existent_id = 99999

      # Test all operations on non-existent resource
      not_found_operations = [
        { method: :get, path: "/api/todos/#{non_existent_id}" },
        { method: :patch, path: "/api/todos/#{non_existent_id}", params: { title: 'Updated' } },
        { method: :delete, path: "/api/todos/#{non_existent_id}" }
      ]

      not_found_operations.each do |operation|
        case operation[:method]
        when :get
          get operation[:path]
        when :patch
          patch operation[:path], params: operation[:params] || {}
        when :delete
          delete operation[:path]
        end

        expect(response).to have_http_status(:not_found),
          "Expected #{operation[:method].upcase} #{operation[:path]} to return 404"

        error_result = JSON.parse(response.body)
        expect(error_result['error']).to include('Todo not found'),
          "Expected not found error for #{operation[:method].upcase} #{operation[:path]}"
      end
    end

    it "handles deleted resources consistently" do
      # Create and then delete a todo
      post '/api/todos', params: { title: 'To Be Deleted' }
      expect(response).to have_http_status(:created)

      todo_result = JSON.parse(response.body)
      todo_id = todo_result['todo']['id']

      # Delete the todo
      delete "/api/todos/#{todo_id}"
      expect(response).to have_http_status(:success)

      # Try to access deleted todo with all operations
      deleted_operations = [
        { method: :get, path: "/api/todos/#{todo_id}" },
        { method: :patch, path: "/api/todos/#{todo_id}", params: { title: 'Updated Deleted' } },
        { method: :delete, path: "/api/todos/#{todo_id}" }
      ]

      deleted_operations.each do |operation|
        case operation[:method]
        when :get
          get operation[:path]
        when :patch
          patch operation[:path], params: operation[:params] || {}
        when :delete
          delete operation[:path]
        end

        expect(response).to have_http_status(:not_found),
          "Expected #{operation[:method].upcase} on deleted resource to return 404"

        error_result = JSON.parse(response.body)
        expect(error_result['error']).to include('Todo not found'),
          "Expected not found error for deleted resource"
      end
    end
  end

  describe "WebAuthn Error Boundaries" do
    before do
      # Clear any existing data
      User.destroy_all
      Credential.destroy_all
    end

    it "handles WebAuthn registration errors gracefully" do
      # Step 1: Get registration options
      post '/api/webauthn/registration/options'
      expect(response).to have_http_status(:success)

      # Step 2: Try registration with invalid credential data
      invalid_credential = {
        'id' => 'invalid_id',
        'rawId' => 'invalid_raw_id',
        'type' => 'public-key',
        'response' => {
          'clientDataJSON' => 'invalid_json',
          'attestationObject' => 'invalid_object'
        }
      }

      allow(WebAuthn::Credential).to receive(:from_create).and_raise(WebAuthn::Error.new("Invalid credential"))

      post '/api/webauthn/registration/verify', params: { credential: invalid_credential }
      expect(response).to have_http_status(:bad_request)

      error_result = JSON.parse(response.body)
      expect(error_result['error']).to eq("Registration verification failed")

      # Verify no user or credential was created
      expect(User.count).to eq(0)
      expect(Credential.count).to eq(0)

      # Step 3: Try again with valid credential
      valid_credential = {
        'id' => Base64.urlsafe_encode64(SecureRandom.random_bytes(32)),
        'rawId' => Base64.urlsafe_encode64(SecureRandom.random_bytes(32)),
        'type' => 'public-key',
        'response' => {
          'clientDataJSON' => Base64.urlsafe_encode64('{"type":"webauthn.create"}'),
          'attestationObject' => Base64.urlsafe_encode64(SecureRandom.random_bytes(64))
        }
      }

      mock_webauthn_credential = double(
        id: valid_credential['id'],
        public_key: SecureRandom.random_bytes(65),
        sign_count: 0
      )

      allow(WebAuthn::Credential).to receive(:from_create).and_return(mock_webauthn_credential)
      allow(mock_webauthn_credential).to receive(:verify).and_return(true)

      # Get new registration options first
      post '/api/webauthn/registration/options'
      expect(response).to have_http_status(:success)

      post '/api/webauthn/registration/verify', params: { credential: valid_credential }
      expect(response).to have_http_status(:success)

      success_result = JSON.parse(response.body)
      expect(success_result['success']).to be true

      # Verify user and credential were created
      expect(User.count).to eq(1)
      expect(Credential.count).to eq(1)
    end

    it "handles WebAuthn authentication errors gracefully" do
      # Setup: Create user and credential
      user = User.create!
      credential = user.credentials.create!(
        credential_id: Base64.urlsafe_encode64(SecureRandom.random_bytes(32)),
        public_key: SecureRandom.random_bytes(65),
        sign_count: 50
      )

      # Step 1: Get authentication options
      post '/api/webauthn/authentication/options'
      expect(response).to have_http_status(:success)

      # Step 2: Try authentication with invalid signature
      auth_credential = {
        'id' => credential.credential_id,
        'rawId' => credential.credential_id,
        'type' => 'public-key',
        'response' => {
          'clientDataJSON' => Base64.urlsafe_encode64('{"type":"webauthn.get"}'),
          'authenticatorData' => Base64.urlsafe_encode64(SecureRandom.random_bytes(37)),
          'signature' => Base64.urlsafe_encode64(SecureRandom.random_bytes(64))
        }
      }

      mock_webauthn_credential = double(sign_count: credential.sign_count + 1)
      allow(WebAuthn::Credential).to receive(:from_get).and_return(mock_webauthn_credential)
      allow(mock_webauthn_credential).to receive(:verify).and_raise(WebAuthn::Error.new("Invalid signature"))

      post '/api/webauthn/authentication/verify', params: { credential: auth_credential }
      expect(response).to have_http_status(:unauthorized)

      auth_error = JSON.parse(response.body)
      expect(auth_error['error']).to eq("Authentication verification failed")

      # Step 3: Verify user cannot access protected resources
      get '/api/todos'
      expect(response).to have_http_status(:unauthorized)

      # Step 4: Try valid authentication
      allow(mock_webauthn_credential).to receive(:verify).and_return(true)

      # Get new authentication options
      post '/api/webauthn/authentication/options'
      expect(response).to have_http_status(:success)

      post '/api/webauthn/authentication/verify', params: { credential: auth_credential }
      expect(response).to have_http_status(:success)

      success_result = JSON.parse(response.body)
      expect(success_result['success']).to be true

      # Verify user can now access protected resources (need to stub authentication)
      allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
      allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)

      get '/api/todos'
      expect(response).to have_http_status(:success)
    end
  end

  describe "System Error Recovery" do
    before do
      # Authenticate as user
      allow_any_instance_of(ApplicationController).to receive(:current_user).and_return(user)
      allow_any_instance_of(ApplicationController).to receive(:authenticated?).and_return(true)
    end

    it "handles database errors gracefully" do
      # Create a todo first
      post '/api/todos', params: { title: 'Database Test Todo' }
      expect(response).to have_http_status(:created)

      todo_result = JSON.parse(response.body)
      todo_id = todo_result['todo']['id']

      # Simulate database error during update
      allow_any_instance_of(Todo).to receive(:update).and_raise(ActiveRecord::StatementInvalid.new("Database error"))

      patch "/api/todos/#{todo_id}", params: { title: 'Updated Title' }
      expect(response).to have_http_status(:internal_server_error)

      error_result = JSON.parse(response.body)
      expect(error_result['error']).to eq('Database error')

      # Verify system can recover
      allow_any_instance_of(Todo).to receive(:update).and_call_original

      patch "/api/todos/#{todo_id}", params: { title: 'Recovery Update' }
      expect(response).to have_http_status(:success)

      recovery_result = JSON.parse(response.body)
      expect(recovery_result['todo']['title']).to eq('Recovery Update')
    end

    it "maintains data consistency during error conditions" do
      # Create multiple todos
      todo_ids = []
      (1..3).each do |i|
        post '/api/todos', params: { title: "Consistency Test #{i}" }
        expect(response).to have_http_status(:created)

        result = JSON.parse(response.body)
        todo_ids << result['todo']['id']
      end

      # Verify initial state
      get '/api/todos'
      expect(response).to have_http_status(:success)

      initial_list = JSON.parse(response.body)['todos']
      expect(initial_list.length).to eq(3)
      expect(initial_list.map { |t| t['position'] }.sort).to eq([ 1, 2, 3 ])

      # Simulate error during reorder by trying to reorder with invalid data
      patch '/api/todos/reorder',
        params: {
          updates: [ { id: 99999, position: 3 } ]  # Non-existent todo ID
        }.to_json,
        headers: { 'Content-Type' => 'application/json' }

      expect(response).to have_http_status(:forbidden)

      # Verify data consistency maintained
      get '/api/todos'
      expect(response).to have_http_status(:success)

      consistent_list = JSON.parse(response.body)['todos']
      expect(consistent_list.length).to eq(3)
      expect(consistent_list.map { |t| t['position'] }.sort).to eq([ 1, 2, 3 ])

      # Verify original order maintained
      expect(consistent_list.map { |t| t['title'] }).to eq([ 'Consistency Test 1', 'Consistency Test 2', 'Consistency Test 3' ])
    end
  end
end
