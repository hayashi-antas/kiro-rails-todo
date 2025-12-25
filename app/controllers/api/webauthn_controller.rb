class Api::WebauthnController < ApplicationController
  skip_before_action :verify_authenticity_token,
                    only: %i[
                      registration_options
                      registration_verify
                      authentication_options
                      authentication_verify
                    ]

  before_action :set_webauthn_origin
  # POST /api/webauthn/registration/options
  def registration_options
    # user_handle（ユーザー固有ID）を生成
    user_handle = WebAuthn.generate_user_id

    # Create registration options
    options = WebAuthn::Credential.options_for_create(
      user: {
        id: user_handle,
        name: "user_#{SecureRandom.hex(8)}",
        display_name: "Passkey User"
      },
      exclude: []
    )

    # ✅ ここが重要：実際にブラウザへ渡す options.challenge をセッションに保存する
    session[:webauthn_challenge] = options.challenge
    session[:webauthn_challenge_expires_at] = 5.minutes.from_now

    # ついでに user_handle も覚えておきたいなら（今は使ってないけど）
    session[:webauthn_user_handle] = user_handle

    render json: options
  rescue => e
    Rails.logger.error "WebAuthn registration options error: #{e.message}"
    render json: { error: "Failed to generate registration options" }, status: :internal_server_error
  end


  # POST /api/webauthn/registration/verify
  def registration_verify
    challenge = session[:webauthn_challenge]
    challenge_expires_at = session[:webauthn_challenge_expires_at]

    # Validate challenge exists and hasn't expired
    if challenge.blank? || challenge_expires_at.blank? || Time.current > challenge_expires_at
      return render json: { error: "Invalid or expired challenge" }, status: :bad_request
    end

    begin
      # Verify the WebAuthn credential
      webauthn_credential = WebAuthn::Credential.from_create(
        params[:credential]
      )

      # Verify the challenge
      webauthn_credential.verify(challenge)

      # Create user and store credential
      user = User.create!
      credential = user.credentials.create!(
        credential_id: webauthn_credential.id,
        public_key: webauthn_credential.public_key,
        sign_count: webauthn_credential.sign_count
      )

      # Clear challenge from session
      session.delete(:webauthn_challenge)
      session.delete(:webauthn_challenge_expires_at)

      # Establish authenticated session
      session[:user_id] = user.id
      session[:authenticated_at] = Time.current

      render json: { success: true, user_id: user.id }
    rescue WebAuthn::Error => e
      Rails.logger.error "WebAuthn registration verification error: #{e.message}"
      render json: { error: "Registration verification failed" }, status: :bad_request
    rescue => e
      Rails.logger.error "Registration error: #{e.message}"
      render json: { error: "Registration failed" }, status: :internal_server_error
    end
  end

  # POST /api/webauthn/authentication/options
  def authentication_options
    # 登録済みクレデンシャルの ID を取得
    credential_ids = Credential.pluck(:credential_id)

    # options_for_get にチャレンジ生成を任せる
    options = WebAuthn::Credential.options_for_get(
      allow: credential_ids
    )

    # options.challenge をセッションに保存（registration と同じパターン）
    session[:webauthn_challenge] = options.challenge
    session[:webauthn_challenge_expires_at] = 5.minutes.from_now

    render json: options
  rescue => e
    Rails.logger.error "WebAuthn authentication options error: #{e.message}"
    render json: { error: "Failed to generate authentication options" }, status: :internal_server_error
  end

  # POST /api/webauthn/authentication/verify
  def authentication_verify
    challenge = session[:webauthn_challenge]
    challenge_expires_at = session[:webauthn_challenge_expires_at]

    # Validate challenge
    if challenge.blank? || challenge_expires_at.blank? || Time.current > challenge_expires_at
      return render json: { error: "Invalid or expired challenge" }, status: :bad_request
    end

    begin
      credential_id = params[:credential][:id]
      stored_credential = Credential.find_by(credential_id: credential_id)

      if stored_credential.nil?
        return render json: { error: "Credential not found" }, status: :unauthorized
      end

      # Verify the authentication
      webauthn_credential = WebAuthn::Credential.from_get(
        params[:credential]
      )

      # Verify with stored public key and sign count
      webauthn_credential.verify(
        challenge,
        public_key: stored_credential.public_key,
        sign_count: stored_credential.sign_count
      )

      # Update sign count to prevent replay attacks
      stored_credential.update!(sign_count: webauthn_credential.sign_count)

      # Clear challenge
      session.delete(:webauthn_challenge)
      session.delete(:webauthn_challenge_expires_at)

      # Establish session
      session[:user_id] = stored_credential.user_id
      session[:authenticated_at] = Time.current

      render json: { success: true, user_id: stored_credential.user_id }
    rescue WebAuthn::Error => e
      Rails.logger.error "WebAuthn authentication verification error: #{e.message}"
      render json: { error: "Authentication verification failed" }, status: :unauthorized
    rescue => e
      Rails.logger.error "Authentication error: #{e.message}"
      render json: { error: "Authentication failed" }, status: :internal_server_error
    end
  end

  private

  def set_webauthn_origin
    WebAuthn.configure do |config|
      config.allowed_origins = [ request.base_url ]
      config.rp_name = "Passkey ToDo Board"
      config.rp_id = request.host
    end
  end
end
