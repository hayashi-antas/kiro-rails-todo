class Credential < ApplicationRecord
  belongs_to :user
  
  validates :credential_id, presence: true, uniqueness: true
  validates :public_key, presence: true
  validates :sign_count, presence: true, numericality: { greater_than_or_equal_to: 0 }
  
  # Store public key as base64 encoded string to avoid encoding issues
  def public_key=(value)
    if value.is_a?(String) && value.encoding == Encoding::BINARY
      super(Base64.strict_encode64(value))
    else
      super(value)
    end
  end
  
  def public_key
    value = super
    return nil if value.nil?
    Base64.strict_decode64(value)
  rescue ArgumentError
    # If it's not base64 encoded, return as is (for backwards compatibility)
    super
  end
end
