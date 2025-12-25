# WebAuthn configuration
WebAuthn.configure do |config|
  # These will be overridden per-request in the controller
  config.allowed_origins = Rails.env.production? ? [ ENV["WEBAUTHN_ORIGIN"] ] : [ "http://localhost:3000" ]
  config.rp_name = "Passkey ToDo Board"
  config.rp_id = Rails.env.production? ? ENV["WEBAUTHN_RP_ID"] : "localhost"

  # Algorithm preferences (ES256 is most widely supported)
  config.algorithms = [ "ES256", "PS256", "RS256" ]
end
