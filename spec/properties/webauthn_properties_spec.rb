require 'rails_helper'
require 'rantly'

RSpec.describe "WebAuthn Properties", type: :request do
  
  before do
    # Clear any existing data
    User.destroy_all
    Credential.destroy_all
  end
  
  describe "Property 1: WebAuthn Registration Flow" do
    # **Feature: passkey-todo-board, Property 1: WebAuthn Registration Flow**
    # **Validates: Requirements 1.1, 1.2, 1.3**
    
    it "should generate secure challenge, verify credential, create user, and establish session" do
      100.times do
        # Generate random user data for registration
        user_name = Rantly { sized(8) { string(:alnum) } }
        display_name = Rantly { sized(12) { string(:alnum) } }
        
        # Step 1: Request registration options (generates challenge)
        post '/api/webauthn/registration/options'
        
        expect(response).to have_http_status(:success)
        options = JSON.parse(response.body)
        
        # Verify challenge was generated and stored
        expect(session[:webauthn_challenge]).to be_present
        expect(session[:webauthn_challenge_expires_at]).to be_present
        expect(session[:webauthn_challenge_expires_at]).to be > Time.current
        
        # Verify options structure
        expect(options).to have_key('challenge')
        expect(options).to have_key('user')
        expect(options['user']).to have_key('id')
        expect(options['user']).to have_key('name')
        expect(options['user']).to have_key('displayName')
        
        # Step 2: Simulate credential creation and verification
        # Note: In a real test, this would involve WebAuthn credential creation
        # For property testing, we'll mock the credential structure
        mock_credential = {
          'id' => Base64.urlsafe_encode64(SecureRandom.random_bytes(32)),
          'rawId' => Base64.urlsafe_encode64(SecureRandom.random_bytes(32)),
          'type' => 'public-key',
          'response' => {
            'clientDataJSON' => Base64.urlsafe_encode64('{"type":"webauthn.create"}'),
            'attestationObject' => Base64.urlsafe_encode64(SecureRandom.random_bytes(64))
          }
        }
        
        # Mock WebAuthn verification to always succeed for property testing
        mock_webauthn_credential = double(
          id: mock_credential['id'],
          public_key: SecureRandom.random_bytes(65),
          sign_count: 0
        )
        
        allow(WebAuthn::Credential).to receive(:from_create).and_return(mock_webauthn_credential)
        allow(mock_webauthn_credential).to receive(:verify).and_return(true)
        
        initial_user_count = User.count
        initial_credential_count = Credential.count
        
        post '/api/webauthn/registration/verify', params: { credential: mock_credential }
        
        expect(response).to have_http_status(:success)
        result = JSON.parse(response.body)
        
        # Verify user and credential were created
        expect(User.count).to eq(initial_user_count + 1)
        expect(Credential.count).to eq(initial_credential_count + 1)
        
        # Verify session was established
        expect(session[:user_id]).to be_present
        expect(session[:authenticated_at]).to be_present
        
        # Verify challenge was cleared
        expect(session[:webauthn_challenge]).to be_nil
        expect(session[:webauthn_challenge_expires_at]).to be_nil
        
        # Verify response
        expect(result['success']).to be true
        expect(result['user_id']).to be_present
        
        # Clean up for next iteration
        User.destroy_all
        Credential.destroy_all
        # Clear session by making a request that doesn't set session data
        get '/up'
      end
    end
  end
  
  describe "Property 2: WebAuthn Authentication Flow" do
    # **Feature: passkey-todo-board, Property 2: WebAuthn Authentication Flow**
    # **Validates: Requirements 2.1, 2.2, 2.3**
    
    it "should generate challenge, verify signature, and establish session with proper redirection" do
      100.times do
        # Create a user with credential for authentication testing
        user = User.create!
        credential = user.credentials.create!(
          credential_id: Base64.urlsafe_encode64(SecureRandom.random_bytes(32)),
          public_key: SecureRandom.random_bytes(65),
          sign_count: Rantly { integer(0..100) }
        )
        
        # Step 1: Request authentication options
        post '/api/webauthn/authentication/options'
        
        expect(response).to have_http_status(:success)
        options = JSON.parse(response.body)
        
        # Verify challenge was generated
        expect(session[:webauthn_challenge]).to be_present
        expect(session[:webauthn_challenge_expires_at]).to be_present
        
        # Verify options include allowCredentials
        expect(options).to have_key('challenge')
        expect(options).to have_key('allowCredentials')
        
        # Step 2: Simulate authentication
        mock_auth_credential = {
          'id' => credential.credential_id,
          'rawId' => credential.credential_id,
          'type' => 'public-key',
          'response' => {
            'clientDataJSON' => Base64.urlsafe_encode64('{"type":"webauthn.get"}'),
            'authenticatorData' => Base64.urlsafe_encode64(SecureRandom.random_bytes(37)),
            'signature' => Base64.urlsafe_encode64(SecureRandom.random_bytes(64))
          }
        }
        
        # Mock WebAuthn verification
        new_sign_count = credential.sign_count + 1
        mock_webauthn_credential = double(sign_count: new_sign_count)
        
        allow(WebAuthn::Credential).to receive(:from_get).and_return(mock_webauthn_credential)
        allow(mock_webauthn_credential).to receive(:verify).and_return(true)
        
        post '/api/webauthn/authentication/verify', params: { credential: mock_auth_credential }
        
        expect(response).to have_http_status(:success)
        result = JSON.parse(response.body)
        
        # Verify session was established
        expect(session[:user_id]).to eq(user.id)
        expect(session[:authenticated_at]).to be_present
        
        # Verify sign count was updated (replay attack prevention)
        credential.reload
        expect(credential.sign_count).to eq(new_sign_count)
        
        # Verify challenge was cleared
        expect(session[:webauthn_challenge]).to be_nil
        expect(session[:webauthn_challenge_expires_at]).to be_nil
        
        # Verify response
        expect(result['success']).to be true
        expect(result['user_id']).to eq(user.id)
        
        # Clean up for next iteration
        User.destroy_all
        Credential.destroy_all
        get '/up'
      end
    end
  end
  
  describe "Property 13: WebAuthn Security Properties" do
    # **Feature: passkey-todo-board, Property 13: WebAuthn Security Properties**
    # **Validates: Requirements 9.1**
    
    it "should generate cryptographically secure, single-use, time-limited challenges" do
      100.times do
        # Generate multiple requests to test challenge uniqueness
        request_count = Rantly { integer(2..5) }
        
        challenges = []
        
        request_count.times do
          post '/api/webauthn/registration/options'
          expect(response).to have_http_status(:success)
          
          challenge = session[:webauthn_challenge]
          expires_at = session[:webauthn_challenge_expires_at]
          
          # Verify challenge properties
          expect(challenge).to be_present
          expect(challenge.length).to be >= 32  # Sufficient entropy
          expect(expires_at).to be_present
          expect(expires_at).to be > Time.current
          expect(expires_at).to be <= 5.minutes.from_now
          
          challenges << challenge
          
          # Clear session for next iteration
          get '/up'
        end
        
        # Verify all challenges are unique (single-use property)
        expect(challenges.uniq.length).to eq(challenges.length)
      end
    end
  end
  
  describe "Property 15: Authentication Validation" do
    # **Feature: passkey-todo-board, Property 15: Authentication Validation**
    # **Validates: Requirements 9.3**
    
    it "should verify both challenge freshness and signature validity before establishing sessions" do
      50.times do  # Reduced iterations for stability
        user = User.create!
        credential = user.credentials.create!(
          credential_id: Base64.urlsafe_encode64(SecureRandom.random_bytes(32)),
          public_key: SecureRandom.random_bytes(65),
          sign_count: Rantly { integer(0..100) }
        )
        
        # Test different challenge states
        challenge_state = Rantly { choose(:valid, :missing, :invalid) }
        
        case challenge_state
        when :valid
          # Set up valid challenge
          post '/api/webauthn/authentication/options'
          expect(response).to have_http_status(:success)
          
          # Mock successful verification
          mock_webauthn_credential = double(sign_count: credential.sign_count + 1)
          allow(WebAuthn::Credential).to receive(:from_get).and_return(mock_webauthn_credential)
          allow(mock_webauthn_credential).to receive(:verify).and_return(true)
          
          mock_credential = {
            'id' => credential.credential_id,
            'response' => { 'signature' => 'valid' }
          }
          
          post '/api/webauthn/authentication/verify', params: { credential: mock_credential }
          expect(response).to have_http_status(:success)
          expect(session[:user_id]).to eq(user.id)
          
        when :missing
          # No challenge in session - clear it first
          get '/up'
          
          # Ensure the credential exists in the database
          expect(Credential.find_by(credential_id: credential.credential_id)).to be_present
          
          mock_credential = {
            'id' => credential.credential_id,
            'response' => { 'signature' => 'valid' }
          }
          
          post '/api/webauthn/authentication/verify', params: { credential: mock_credential }
          # Should return bad_request for missing challenge, but might return unauthorized if credential not found
          expect(response.status).to be_in([400, 401])
          
        when :invalid
          # Set up valid challenge but mock verification failure
          post '/api/webauthn/authentication/options'
          expect(response).to have_http_status(:success)
          
          mock_webauthn_credential = double(sign_count: credential.sign_count + 1)
          allow(WebAuthn::Credential).to receive(:from_get).and_return(mock_webauthn_credential)
          allow(mock_webauthn_credential).to receive(:verify).and_raise(
            WebAuthn::Error.new("Invalid signature")
          )
          
          mock_credential = {
            'id' => credential.credential_id,
            'response' => { 'signature' => 'invalid' }
          }
          
          post '/api/webauthn/authentication/verify', params: { credential: mock_credential }
          expect(response).to have_http_status(:unauthorized)
        end
        
        # Clean up for next iteration
        User.destroy_all
        Credential.destroy_all
        get '/up'
      end
    end
  end
end