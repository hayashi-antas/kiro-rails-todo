class Api::TestController < ApplicationController
  skip_before_action :verify_authenticity_token

  def sign_in
    unless Rails.env.test?
      render json: { error: "Not available" }, status: :not_found
      return
    end

    user = User.find(params[:user_id])
    session[:user_id] = user.id
    session[:authenticated_at] = Time.current

    render json: { success: true, user_id: user.id }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "User not found" }, status: :not_found
  end
end
