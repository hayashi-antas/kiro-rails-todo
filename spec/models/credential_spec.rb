require 'rails_helper'

RSpec.describe Credential, type: :model do
  describe "associations" do
    it "belongs to user" do
      expect(Credential.reflect_on_association(:user).macro).to eq(:belongs_to)
    end
    
    it "is destroyed when user is destroyed" do
      user = User.create!
      credential = user.credentials.create!(
        credential_id: "test_credential_id",
        public_key: "test_public_key",
        sign_count: 0
      )
      
      expect { user.destroy }.to change(Credential, :count).by(-1)
    end
  end

  describe "validations" do
    let(:user) { User.create! }
    
    it "validates presence of credential_id" do
      credential = user.credentials.build(public_key: "test_key", sign_count: 0)
      expect(credential).not_to be_valid
      expect(credential.errors[:credential_id]).to include("can't be blank")
    end
    
    it "validates uniqueness of credential_id" do
      user.credentials.create!(
        credential_id: "duplicate_id",
        public_key: "test_key",
        sign_count: 0
      )
      
      duplicate_credential = user.credentials.build(
        credential_id: "duplicate_id",
        public_key: "another_key",
        sign_count: 0
      )
      
      expect(duplicate_credential).not_to be_valid
      expect(duplicate_credential.errors[:credential_id]).to include("has already been taken")
    end
    
    it "validates presence of public_key" do
      credential = user.credentials.build(credential_id: "test_id", sign_count: 0)
      expect(credential).not_to be_valid
      expect(credential.errors[:public_key]).to include("can't be blank")
    end
    
    it "validates presence of sign_count" do
      credential = Credential.new(credential_id: "test_id", public_key: "test_key", user: user)
      credential.sign_count = nil
      expect(credential).not_to be_valid
      expect(credential.errors[:sign_count]).to include("can't be blank")
    end
    
    it "validates sign_count is non-negative" do
      credential = user.credentials.build(
        credential_id: "test_id",
        public_key: "test_key",
        sign_count: -1
      )
      expect(credential).not_to be_valid
      expect(credential.errors[:sign_count]).to include("must be greater than or equal to 0")
    end
    
    it "allows sign_count of zero" do
      credential = user.credentials.build(
        credential_id: "test_id",
        public_key: "test_key",
        sign_count: 0
      )
      expect(credential).to be_valid
    end
  end
end
