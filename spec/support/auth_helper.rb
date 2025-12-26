module AuthHelper
  def sign_in_as(user)
    post '/api/test/sign_in', params: { user_id: user.id }
  end

  def sign_out
    post '/api/logout'
  end
end

RSpec.configure do |config|
  config.include AuthHelper, type: :request
end
