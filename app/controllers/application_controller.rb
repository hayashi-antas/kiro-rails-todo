class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Changes to the importmap will invalidate the etag for HTML responses
  stale_when_importmap_changes
  
  before_action :configure_session_security
  
  protected
  
  def current_user
    @current_user ||= User.find(session[:user_id]) if session[:user_id]
  rescue ActiveRecord::RecordNotFound
    # Handle case where user was deleted but session still exists
    reset_session
    nil
  end
  
  def authenticated?
    current_user.present? && session[:authenticated_at].present? && session_valid?
  end
  
  def require_authentication
    unless authenticated?
      render json: { error: "Authentication required" }, status: :unauthorized
    end
  end
  
  def configure_session_security
    # Session security is configured in config/initializers/session_store.rb
    # Here we just handle session timeout
    if session[:authenticated_at] && session[:authenticated_at] < 24.hours.ago
      reset_session
    end
  end
  
  private
  
  def session_valid?
    # Check if session hasn't expired (24 hours)
    return false unless session[:authenticated_at]
    session[:authenticated_at] > 24.hours.ago
  end
end
