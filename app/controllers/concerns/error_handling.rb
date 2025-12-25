# frozen_string_literal: true

module ErrorHandling
  extend ActiveSupport::Concern

  included do
    rescue_from StandardError, with: :handle_standard_error
    rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :handle_validation_error
    rescue_from ActionController::ParameterMissing, with: :handle_parameter_missing
  end

  private

  def handle_standard_error(exception)
    log_error(exception)
    
    if Rails.env.development?
      render json: { 
        error: exception.message,
        type: exception.class.name,
        backtrace: exception.backtrace&.first(10)
      }, status: :internal_server_error
    else
      render json: { 
        error: 'An unexpected error occurred. Please try again.' 
      }, status: :internal_server_error
    end
  end

  def handle_not_found(exception)
    log_error(exception, level: :warn)
    render json: { error: 'Resource not found' }, status: :not_found
  end

  def handle_validation_error(exception)
    log_error(exception, level: :warn)
    render json: { 
      error: 'Validation failed',
      errors: exception.record.errors.full_messages
    }, status: :unprocessable_entity
  end

  def handle_parameter_missing(exception)
    log_error(exception, level: :warn)
    render json: { 
      error: "Missing required parameter: #{exception.param}" 
    }, status: :bad_request
  end

  def log_error(exception, level: :error, context: {})
    error_context = {
      controller: self.class.name,
      action: action_name,
      params: params.except(:controller, :action).to_unsafe_h,
      user_id: current_user&.id,
      request_id: request.request_id,
      user_agent: request.user_agent,
      ip_address: request.remote_ip,
      timestamp: Time.current.iso8601
    }.merge(context)

    case level
    when :warn
      Rails.logger.warn do
        {
          message: exception.message,
          exception: exception.class.name,
          context: error_context
        }.to_json
      end
    when :error
      Rails.logger.error do
        {
          message: exception.message,
          exception: exception.class.name,
          backtrace: exception.backtrace&.first(20),
          context: error_context
        }.to_json
      end
    end

    # In production, you might want to send critical errors to an external service
    if Rails.env.production? && level == :error
      # Example: Send to error monitoring service
      # ErrorMonitoringService.capture_exception(exception, context: error_context)
    end
  end

  def render_error(message, status: :unprocessable_entity, errors: nil)
    response_data = { error: message }
    response_data[:errors] = errors if errors.present?
    
    render json: response_data, status: status
  end

  def render_success(data = {}, message: nil)
    response_data = { success: true }
    response_data[:message] = message if message
    response_data.merge!(data)
    
    render json: response_data
  end
end