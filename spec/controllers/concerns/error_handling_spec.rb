# frozen_string_literal: true

require 'rails_helper'

# Test controller to test the ErrorHandling concern
class TestController < ApplicationController
  def raise_standard_error
    raise StandardError, 'Test standard error'
  end

  def raise_not_found
    raise ActiveRecord::RecordNotFound, 'Test record not found'
  end

  def raise_validation_error
    user = User.new
    user.validate!
    raise ActiveRecord::RecordInvalid.new(user)
  end

  def raise_parameter_missing
    params.require(:missing_param)
  end

  def success_action
    render json: { success: true, message: 'Success' }
  end

  private

  def current_user
    @current_user ||= User.create! if params[:authenticated] == 'true'
  end
end

RSpec.describe 'ErrorHandling concern', type: :controller do
  controller(TestController) do
    # Define routes for test actions
    def raise_standard_error
      super
    end

    def raise_not_found
      super
    end

    def raise_validation_error
      super
    end

    def raise_parameter_missing
      super
    end

    def success_action
      super
    end
  end

  before do
    # Add test routes
    routes.draw do
      get 'raise_standard_error' => 'test#raise_standard_error'
      get 'raise_not_found' => 'test#raise_not_found'
      get 'raise_validation_error' => 'test#raise_validation_error'
      get 'raise_parameter_missing' => 'test#raise_parameter_missing'
      get 'success_action' => 'test#success_action'
    end
  end

  describe 'error handling' do
    it 'handles StandardError with generic message in production' do
      allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new('production'))
      
      get :raise_standard_error
      
      expect(response).to have_http_status(:internal_server_error)
      json_response = JSON.parse(response.body)
      expect(json_response['error']).to eq('An unexpected error occurred. Please try again.')
      expect(json_response).not_to have_key('type')
      expect(json_response).not_to have_key('backtrace')
    end

    it 'handles StandardError with detailed message in development' do
      allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new('development'))
      
      get :raise_standard_error
      
      expect(response).to have_http_status(:internal_server_error)
      json_response = JSON.parse(response.body)
      expect(json_response['error']).to eq('Test standard error')
      expect(json_response['type']).to eq('StandardError')
      expect(json_response).to have_key('backtrace')
    end

    it 'handles ActiveRecord::RecordNotFound' do
      get :raise_not_found
      
      expect(response).to have_http_status(:not_found)
      json_response = JSON.parse(response.body)
      expect(json_response['error']).to eq('Resource not found')
    end

    it 'handles ActiveRecord::RecordInvalid' do
      get :raise_validation_error
      
      expect(response).to have_http_status(:unprocessable_entity)
      json_response = JSON.parse(response.body)
      expect(json_response['error']).to eq('Validation failed')
      expect(json_response).to have_key('errors')
      expect(json_response['errors']).to be_an(Array)
    end

    it 'handles ActionController::ParameterMissing' do
      get :raise_parameter_missing
      
      expect(response).to have_http_status(:bad_request)
      json_response = JSON.parse(response.body)
      expect(json_response['error']).to include('Missing required parameter')
    end

    it 'logs error context information' do
      expect(Rails.logger).to receive(:error) do |&block|
        log_data = JSON.parse(block.call)
        expect(log_data['message']).to eq('Test standard error')
        expect(log_data['exception']).to eq('StandardError')
        expect(log_data['context']['controller']).to eq('TestController')
        expect(log_data['context']['action']).to eq('raise_standard_error')
        expect(log_data['context']).to have_key('request_id')
        expect(log_data['context']).to have_key('timestamp')
      end

      get :raise_standard_error
    end

    it 'includes user context when user is authenticated' do
      expect(Rails.logger).to receive(:error) do |&block|
        log_data = JSON.parse(block.call)
        expect(log_data['context']).to have_key('user_id')
        expect(log_data['context']['user_id']).to be_a(Integer)
      end

      get :raise_standard_error, params: { authenticated: 'true' }
    end
  end

  describe 'helper methods' do
    before do
      # Set up a proper controller instance for testing helper methods
      allow(controller).to receive(:render).and_return(true)
    end

    it 'renders error responses' do
      expect(controller).to receive(:render).with(
        json: { error: 'Test error message', errors: ['Error 1', 'Error 2'] },
        status: :bad_request
      )
      
      controller.send(:render_error, 'Test error message', status: :bad_request, errors: ['Error 1', 'Error 2'])
    end

    it 'renders success responses' do
      expect(controller).to receive(:render).with(
        json: { success: true, message: 'Success message', data: 'test' }
      )
      
      controller.send(:render_success, { data: 'test' }, message: 'Success message')
    end
  end
end