Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Root route serves the React application
  root "home#index"

  # API routes
  namespace :api do
    # WebAuthn routes
    post "webauthn/registration/options", to: "webauthn#registration_options"
    post "webauthn/registration/verify", to: "webauthn#registration_verify"
    post "webauthn/authentication/options", to: "webauthn#authentication_options"
    post "webauthn/authentication/verify", to: "webauthn#authentication_verify"

    # Session management
    post :logout, to: "sessions#destroy"

    # Test-only route for setting up authenticated sessions in tests
    if Rails.env.test?
      post "test/sign_in", to: "test#sign_in"
    end

    # Todo routes
    resources :todos, except: [ :new, :edit ] do
      collection do
        patch :reorder
      end
    end
  end

    # /api 以外のすべてのパスを home#index に飛ばす（SPA用）
    get "*path", to: "home#index",
      constraints: ->(req) { !req.xhr? && req.format.html? }
end
