require 'rails_helper'

RSpec.describe "Authentication Flow Integration", type: :request do
  describe "WebAuthn Registration Flow" do
    it "generates registration options" do
      post '/api/webauthn/registration/options'

      expect(response).to have_http_status(:success)
      options = JSON.parse(response.body)

      expect(options).to have_key('challenge')
      expect(options).to have_key('user')
      expect(options).to have_key('rp')
    end
  end

  describe "WebAuthn Authentication Flow" do
    let!(:user) { User.create! }
    let!(:credential) do
      user.credentials.create!(
        credential_id: Base64.urlsafe_encode64(SecureRandom.random_bytes(32)),
        public_key: SecureRandom.random_bytes(65),
        sign_count: 50
      )
    end

    it "generates authentication options" do
      post '/api/webauthn/authentication/options'

      expect(response).to have_http_status(:success)
      options = JSON.parse(response.body)

      expect(options).to have_key('challenge')
      expect(options).to have_key('allowCredentials')
    end
  end

  describe "Session Management" do
    let!(:user) { User.create! }

    it "logs out user successfully" do
      sign_in_as(user)

      post '/api/logout'

      expect(response).to have_http_status(:success)
      result = JSON.parse(response.body)
      expect(result['success']).to be true

      get '/api/todos'
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
