require 'rails_helper'
require 'rantly/rspec_extensions'

RSpec.describe User, type: :model do
  describe "associations" do
    it "has many credentials" do
      expect(User.reflect_on_association(:credentials).macro).to eq(:has_many)
    end

    it "has many todos" do
      expect(User.reflect_on_association(:todos).macro).to eq(:has_many)
    end
  end

  describe "Property 14: Credential Storage Security" do
    # **Feature: passkey-todo-board, Property 14: Credential Storage Security**
    # **Validates: Requirements 9.2**
    it "never stores private key material on the server" do
      property_of {
        # Generate random credential data
        credential_id = Rantly { string }
        public_key_data = Rantly { string }
        sign_count = Rantly { range(0, 1000) }
        
        [credential_id, public_key_data, sign_count]
      }.check(100) do |credential_id, public_key_data, sign_count|
        user = User.create!
        credential = user.credentials.create!(
          credential_id: credential_id,
          public_key: public_key_data,
          sign_count: sign_count
        )
        
        # Verify that only public key material is stored
        # The public_key field should contain only public key data, never private keys
        expect(credential.public_key).to eq(public_key_data)
        expect(credential.public_key).not_to include("private")
        expect(credential.public_key).not_to include("PRIVATE KEY")
        
        # Verify that the credential model has no fields for private key storage
        expect(credential.attributes.keys).not_to include("private_key")
        expect(credential.attributes.keys).not_to include("private_key_material")
        
        # Verify that the stored data is exactly what was provided (public key only)
        reloaded_credential = Credential.find(credential.id)
        expect(reloaded_credential.public_key).to eq(public_key_data)
      end
    end
  end
end
