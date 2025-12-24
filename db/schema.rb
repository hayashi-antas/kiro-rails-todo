# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2025_12_24_073045) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "credentials", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "credential_id", null: false
    t.text "public_key", null: false
    t.integer "sign_count", default: 0
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["credential_id"], name: "index_credentials_on_credential_id", unique: true
    t.index ["user_id"], name: "index_credentials_on_user_id"
  end

  create_table "todos", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "position", null: false
    t.integer "status", default: 0
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id", "position"], name: "index_todos_on_user_id_and_position", unique: true
    t.index ["user_id"], name: "index_todos_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "credentials", "users"
  add_foreign_key "todos", "users"
end
