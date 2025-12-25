class Api::TodosController < ApplicationController
  skip_before_action :verify_authenticity_token,
                      only: %i[index show create update destroy reorder]
  before_action :require_authentication
  before_action :set_todo, only: [ :show, :update, :destroy ]
  before_action :verify_todo_ownership, only: [ :show, :update, :destroy ]

  # GET /api/todos
  def index
    @todos = current_user.todos.ordered
    render json: { todos: @todos.as_json(only: [ :id, :title, :status, :position, :created_at ]) }
  end

  # GET /api/todos/:id
  def show
    render json: { todo: @todo.as_json(only: [ :id, :title, :status, :position, :created_at ]) }
  end

  # POST /api/todos
  def create
    @todo = current_user.todos.build(todo_params)

    # Assign next available position
    max_position = current_user.todos.maximum(:position) || 0
    @todo.position = max_position + 1

    if @todo.save
      render json: {
        success: true,
        todo: @todo.as_json(only: [ :id, :title, :status, :position, :created_at ])
      }, status: :created
    else
      render json: {
        error: "Todo creation failed",
        errors: @todo.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # PATCH /api/todos/:id
  def update
    if @todo.update(todo_params)
      render json: {
        success: true,
        todo: @todo.as_json(only: [ :id, :title, :status, :position, :created_at ])
      }
    else
      render json: {
        error: "Todo update failed",
        errors: @todo.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/todos/:id
  def destroy
    @todo.destroy

    # Maintain position integrity by updating positions of remaining todos
    current_user.todos.where("position > ?", @todo.position).update_all("position = position - 1")

    render json: { success: true, message: "Todo deleted successfully" }
  end

  # PATCH /api/todos/reorder
  def reorder
    updates = params[:updates] || []

    if updates.empty?
      return render json: { error: "No updates provided" }, status: :bad_request
    end

    # Validate update format
    updates.each do |update|
      unless update[:id].present? && update[:position].present? && update[:position].to_i > 0
        return render json: { error: "Invalid update format. Each update must have id and positive position" }, status: :bad_request
      end
    end

    # Verify all todos belong to current user
    todo_ids = updates.map { |update| update[:id] }
    user_todos = current_user.todos.where(id: todo_ids)

    if user_todos.count != todo_ids.count
      return render json: { error: "Unauthorized access to todos" }, status: :forbidden
    end

    # Handle single todo reordering (most common case for drag-and-drop)
    if updates.length == 1
      handle_single_todo_reorder(updates.first, user_todos.first)
    else
      # Handle multiple todo reordering with conflict resolution
      handle_multiple_todo_reorder(updates, user_todos)
    end

    render json: { success: true, message: "Todos reordered successfully" }
  rescue ActiveRecord::RecordInvalid => e
    render json: { error: "Reorder failed", errors: e.record.errors.full_messages }, status: :unprocessable_entity
  rescue => e
    Rails.logger.error "Reorder error: #{e.message}"
    render json: { error: "Reorder failed" }, status: :internal_server_error
  end

  private

  def todo_params
    if params[:todo].is_a?(ActionController::Parameters)
      # フロントから { todo: { title: ... } } で来た場合
      params.require(:todo).permit(:title, :status)
    else
      # フロントから { title: ... } で来た場合
      params.permit(:title, :status)
    end
  end


  def set_todo
    @todo = Todo.find_by(id: params[:id])

    unless @todo
      render json: { error: "Todo not found" }, status: :not_found
    end
  end

  def verify_todo_ownership
    return unless @todo

    unless @todo.user_id == current_user.id
      render json: { error: "Unauthorized access to todo" }, status: :forbidden
    end
  end

  # Normalize positions to be sequential starting from 1
  def normalize_positions_for_user(user)
    todos = user.todos.order(:position)
    todos.each_with_index do |todo, index|
      expected_position = index + 1
      if todo.position != expected_position
        todo.update_column(:position, expected_position)
      end
    end
  end

  # Handle single todo reordering (drag-and-drop)
  def handle_single_todo_reorder(update, todo)
    new_position = update[:position].to_i
    old_position = todo.position

    return if new_position == old_position

    ActiveRecord::Base.transaction do
      # Get all todos for this user in order
      all_todos = current_user.todos.ordered.to_a

      # Step 1: Move all todos to temporary negative positions to avoid conflicts
      all_todos.each_with_index do |todo_item, index|
        todo_item.update_column(:position, -(index + 1))
      end

      # Step 2: Remove the todo being moved from its current position
      moved_todo = all_todos.delete_at(old_position - 1)  # Convert to 0-based index

      # Step 3: Insert it at the new position
      insert_index = [ new_position - 1, 0 ].max  # Convert to 0-based index, ensure >= 0
      insert_index = [ insert_index, all_todos.length ].min  # Ensure <= array length
      all_todos.insert(insert_index, moved_todo)

      # Step 4: Update all positions to match the new order
      all_todos.each_with_index do |todo_item, index|
        new_pos = index + 1
        todo_item.update_column(:position, new_pos)
      end
    end
  end

  # Handle multiple todo reordering with conflict resolution
  def handle_multiple_todo_reorder(updates, user_todos)
    ActiveRecord::Base.transaction do
      # Step 1: Temporarily move all affected todos to negative positions to avoid conflicts
      temp_position_offset = -1000
      updates.each_with_index do |update, index|
        todo = user_todos.find(update[:id])
        todo.update!(position: temp_position_offset - index)
      end

      # Step 2: Sort updates by target position to process them in order
      sorted_updates = updates.sort_by { |update| update[:position].to_i }

      # Step 3: Process position conflicts by reassigning positions sequentially
      position_assignments = {}
      used_positions = Set.new

      # Get all current positions for this user (excluding the ones being moved)
      todo_ids = updates.map { |update| update[:id] }
      current_positions = current_user.todos.where.not(id: todo_ids).pluck(:position)
      used_positions.merge(current_positions)

      # Assign positions, resolving conflicts
      sorted_updates.each do |update|
        desired_position = update[:position].to_i

        # Skip invalid positions
        next if desired_position <= 0

        # Find the next available position starting from the desired position
        final_position = desired_position
        while used_positions.include?(final_position)
          final_position += 1
        end

        position_assignments[update[:id]] = final_position
        used_positions.add(final_position)
      end

      # Step 4: Apply the final position assignments
      position_assignments.each do |todo_id, final_position|
        todo = user_todos.find(todo_id)
        todo.update!(position: final_position)
      end

      # Step 5: Normalize all positions to be sequential starting from 1
      normalize_positions_for_user(current_user)
    end
  end
end
