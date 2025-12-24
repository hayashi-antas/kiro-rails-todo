class CreateTodos < ActiveRecord::Migration[8.1]
  def change
    create_table :todos do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.integer :status, default: 0
      t.integer :position, null: false

      t.timestamps
    end
    
    add_index :todos, [:user_id, :position], unique: true
  end
end
