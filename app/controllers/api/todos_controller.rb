class Api::TodosController < ApplicationController
  protect_from_forgery with: :null_session
  before_action :require_authentication
  before_action :set_todo, only: [:show, :update, :destroy]
  before_action :verify_todo_ownership, only: [:show, :update, :destroy]
  
  # GET /api/todos
  def index
    @todos = current_user.todos.ordered
    render json: { todos: @todos.as_json(only: [:id, :title, :status, :position, :created_at]) }
  end
  
  # GET /api/todos/:id
  def show
    render json: { todo: @todo.as_json(only: [:id, :title, :status, :position, :created_at]) }
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
        todo: @todo.as_json(only: [:id, :title, :status, :position, :created_at]) 
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
        todo: @todo.as_json(only: [:id, :title, :status, :position, :created_at]) 
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
    current_user.todos.where('position > ?', @todo.position).update_all('position = position - 1')
    
    render json: { success: true, message: "Todo deleted successfully" }
  end
  
  # PATCH /api/todos/reorder
  def reorder
    updates = params[:updates] || []
    
    if updates.empty?
      return render json: { error: "No updates provided" }, status: :bad_request
    end
    
    # Verify all todos belong to current user
    todo_ids = updates.map { |update| update[:id] }
    user_todos = current_user.todos.where(id: todo_ids)
    
    if user_todos.count != todo_ids.count
      return render json: { error: "Unauthorized access to todos" }, status: :forbidden
    end
    
    # Update positions in a transaction
    ActiveRecord::Base.transaction do
      updates.each do |update|
        todo = user_todos.find(update[:id])
        todo.update!(position: update[:position])
      end
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
    params.permit(:title, :status)
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
end