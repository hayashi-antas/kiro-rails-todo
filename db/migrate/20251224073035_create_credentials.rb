class CreateCredentials < ActiveRecord::Migration[8.1]
  def change
    create_table :credentials do |t|
      t.references :user, null: false, foreign_key: true
      t.string :credential_id, null: false
      t.text :public_key, null: false
      t.integer :sign_count, default: 0

      t.timestamps
    end
    add_index :credentials, :credential_id, unique: true
  end
end
