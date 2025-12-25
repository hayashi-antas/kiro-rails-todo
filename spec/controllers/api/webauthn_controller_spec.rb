require 'rails_helper'

RSpec.describe Api::WebauthnController, type: :controller do
  before do
    # Clear any existing data
    User.destroy_all
    Credential.destroy_all
  end

  describe "POST #registration_options" do
    it "generates registration options with challenge" do
      post :registration_options

      expect(response).to have_http_status(:success)
      options = JSON.parse(response.body)

      # Verify response structure
      expect(options).to have_key('challenge')
      expect(options).to have_key('user')
      expect(options).to have_key('rp')
      expect(options).to have_key('pubKeyCredParams')

      # Verify user structure
      expect(options['user']).to have_key('id')
      expect(options['user']).to have_key('name')
      expect(options['user']).to have_key('displayName')

      # Verify challenge is stored in session
      expect(session[:webauthn_challenge]).to be_present
      expect(session[:webauthn_challenge_expires_at]).to be_present
      expect(session[:webauthn_challenge_expires_at]).to be > Time.current
    end

    it "handles errors gracefully" do
      # Mock WebAuthn to raise an error
      allow(WebAuthn::Credential).to receive(:options_for_create).and_raise(StandardError.new("Test error"))

      post :registration_options

      expect(response).to have_http_status(:internal_server_error)
      result = JSON.parse(response.body)
      expect(result['error']).to eq("Failed to generate registration options")
    end
  end

  describe "POST #registration_verify" do
    let(:mock_credential) do
      {
        'id' => Base64.urlsafe_encode64(SecureRandom.random_bytes(32)),
        'rawId' => Base64.urlsafe_encode64(SecureRandom.random_bytes(32)),
        'type' => 'public-key',
        'response' => {
          'clientDataJSON' => Base64.urlsafe_encode64('{"type":"webauthn.create"}'),
          'attestationObject' => Base64.urlsafe_encode64(SecureRandom.random_bytes(64))
        }
      }
    end

    context "with valid challenge" do
      before do
        session[:webauthn_challenge] = 'valid_challenge'
        session[:webauthn_challenge_expires_at] = 5.minutes.from_now
      end

      it "creates user and credential on successful verification" do
        mock_webauthn_credential = double(
          id: mock_credential['id'],
          public_key: SecureRandom.random_bytes(65),
          sign_count: 0
        )

        allow(WebAuthn::Credential).to receive(:from_create).and_return(mock_webauthn_credential)
        allow(mock_webauthn_credential).to receive(:verify).and_return(true)

        expect {
          post :registration_verify, params: { credential: mock_credential }
        }.to change(User, :count).by(1).and change(Credential, :count).by(1)

        expect(response).to have_http_status(:success)
        result = JSON.parse(response.body)

        expect(result['success']).to be true
        expect(result['user_id']).to be_present

        # Verify session is established
        expect(session[:user_id]).to be_present
        expect(session[:authenticated_at]).to be_present

        # Verify challenge is cleared
        expect(session[:webauthn_challenge]).to be_nil
        expect(session[:webauthn_challenge_expires_at]).to be_nil
      end

      it "handles WebAuthn verification errors" do
        allow(WebAuthn::Credential).to receive(:from_create).and_raise(WebAuthn::Error.new("Invalid credential"))

        expect {
          post :registration_verify, params: { credential: mock_credential }
        }.not_to change(User, :count)

        expect(response).to have_http_status(:bad_request)
        result = JSON.parse(response.body)
        expect(result['error']).to eq("Registration verification failed")
      end
    end

    context "with invalid challenge" do
      it "rejects expired challenge" do
        session[:webauthn_challenge] = 'expired_challenge'
        session[:webauthn_challenge_expires_at] = 1.minute.ago

        post :registration_verify, params: { credential: mock_credential }

        expect(response).to have_http_status(:bad_request)
        result = JSON.parse(response.body)
        expect(result['error']).to eq("Invalid or expired challenge")
      end

      it "rejects missing challenge" do
        post :registration_verify, params: { credential: mock_credential }

        expect(response).to have_http_status(:bad_request)
        result = JSON.parse(response.body)
        expect(result['error']).to eq("Invalid or expired challenge")
      end
    end
  end

  describe "POST #authentication_options" do
    let!(:user) { User.create! }
    let!(:credential) do
      user.credentials.create!(
        credential_id: Base64.urlsafe_encode64(SecureRandom.random_bytes(32)),
        public_key: SecureRandom.random_bytes(65),
        sign_count: 0
      )
    end

    it "generates authentication options with challenge" do
      post :authentication_options

      expect(response).to have_http_status(:success)
      options = JSON.parse(response.body)

      # Verify response structure
      expect(options).to have_key('challenge')
      expect(options).to have_key('allowCredentials')

      # Verify allowCredentials includes existing credential
      expect(options['allowCredentials']).to be_an(Array)

      # Verify challenge is stored in session
      expect(session[:webauthn_challenge]).to be_present
      expect(session[:webauthn_challenge_expires_at]).to be_present
      expect(session[:webauthn_challenge_expires_at]).to be > Time.current
    end

    it "handles errors gracefully" do
      allow(WebAuthn::Credential).to receive(:options_for_get).and_raise(StandardError.new("Test error"))

      post :authentication_options

      expect(response).to have_http_status(:internal_server_error)
      result = JSON.parse(response.body)
      expect(result['error']).to eq("Failed to generate authentication options")
    end
  end

  describe "POST #authentication_verify" do
    let!(:user) { User.create! }
    let!(:credential) do
      user.credentials.create!(
        credential_id: Base64.urlsafe_encode64(SecureRandom.random_bytes(32)),
        public_key: SecureRandom.random_bytes(65),
        sign_count: 50
      )
    end

    let(:mock_auth_credential) do
      {
        'id' => credential.credential_id,
        'rawId' => credential.credential_id,
        'type' => 'public-key',
        'response' => {
          'clientDataJSON' => Base64.urlsafe_encode64('{"type":"webauthn.get"}'),
          'authenticatorData' => Base64.urlsafe_encode64(SecureRandom.random_bytes(37)),
          'signature' => Base64.urlsafe_encode64(SecureRandom.random_bytes(64))
        }
      }
    end

    context "with valid challenge" do
      before do
        session[:webauthn_challenge] = 'valid_challenge'
        session[:webauthn_challenge_expires_at] = 5.minutes.from_now
      end

      it "authenticates user and establishes session" do
        new_sign_count = credential.sign_count + 1
        mock_webauthn_credential = double(sign_count: new_sign_count)

        allow(WebAuthn::Credential).to receive(:from_get).and_return(mock_webauthn_credential)
        allow(mock_webauthn_credential).to receive(:verify).and_return(true)

        post :authentication_verify, params: { credential: mock_auth_credential }

        expect(response).to have_http_status(:success)
        result = JSON.parse(response.body)

        expect(result['success']).to be true
        expect(result['user_id']).to eq(user.id)

        # Verify session is established
        expect(session[:user_id]).to eq(user.id)
        expect(session[:authenticated_at]).to be_present

        # Verify challenge is cleared
        expect(session[:webauthn_challenge]).to be_nil
        expect(session[:webauthn_challenge_expires_at]).to be_nil

        # Verify sign count is updated
        credential.reload
        expect(credential.sign_count).to eq(new_sign_count)
      end

      it "handles WebAuthn verification errors" do
        mock_webauthn_credential = double(sign_count: credential.sign_count + 1)
        allow(WebAuthn::Credential).to receive(:from_get).and_return(mock_webauthn_credential)
        allow(mock_webauthn_credential).to receive(:verify).and_raise(WebAuthn::Error.new("Invalid signature"))

        post :authentication_verify, params: { credential: mock_auth_credential }

        expect(response).to have_http_status(:unauthorized)
        result = JSON.parse(response.body)
        expect(result['error']).to eq("Authentication verification failed")

        # Verify session is not established
        expect(session[:user_id]).to be_nil
      end

      it "rejects unknown credential" do
        unknown_credential = mock_auth_credential.dup
        unknown_credential['id'] = Base64.urlsafe_encode64(SecureRandom.random_bytes(32))

        post :authentication_verify, params: { credential: unknown_credential }

        expect(response).to have_http_status(:unauthorized)
        result = JSON.parse(response.body)
        expect(result['error']).to eq("Credential not found")
      end
    end

    context "with invalid challenge" do
      it "rejects expired challenge" do
        session[:webauthn_challenge] = 'expired_challenge'
        session[:webauthn_challenge_expires_at] = 1.minute.ago

        post :authentication_verify, params: { credential: mock_auth_credential }

        expect(response).to have_http_status(:bad_request)
        result = JSON.parse(response.body)
        expect(result['error']).to eq("Invalid or expired challenge")
      end

      it "rejects missing challenge" do
        post :authentication_verify, params: { credential: mock_auth_credential }

        expect(response).to have_http_status(:bad_request)
        result = JSON.parse(response.body)
        expect(result['error']).to eq("Invalid or expired challenge")
      end
    end
  end
end
