class Api::SessionsController < ApplicationController
    # protect_from_forgery with: :null_session
    skip_before_action :verify_authenticity_token, only: :destroy
  # POST /api/logout
  def destroy
    begin
      session.delete(:user_id)
      session.delete(:authenticated_at)
      reset_session

      render json: { success: true, message: "Logged out successfully" }
    rescue => e
      Rails.logger.error "Logout error: #{e.message}"
      render json: { error: "Logout failed" }, status: :internal_server_error
    end
  end
end
