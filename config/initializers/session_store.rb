# Configure session store with security settings
Rails.application.config.session_store :cookie_store, 
  key: '_passkey_todo_board_session',
  httponly: true,
  same_site: :lax,
  secure: Rails.env.production?,
  expire_after: 24.hours