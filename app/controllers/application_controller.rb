class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Changes to the importmap will invalidate the etag for HTML responses
  stale_when_importmap_changes
  
  protected
  
  def current_user
    @current_user ||= User.find(session[:user_id]) if session[:user_id]
  end
  
  def authenticated?
    current_user.present? && session[:authenticated_at].present?
  end
  
  def require_authentication
    unless authenticated?
      render json: { error: "Authentication required" }, status: :unauthorized
    end
  end
  
  def configure_session_security
    # Configure secure session settings
    if Rails.env.production?
      session_options[:secure] = true
    end
    session_options[:httponly] = true
    session_options[:same_site] = :lax
  end
end
