class User < ApplicationRecord
  has_many :credentials, dependent: :destroy
  has_many :todos, dependent: :destroy
end
