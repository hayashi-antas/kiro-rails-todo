import React, { useState } from 'react';
import { Todo, TodoUpdateData, TodoApiResponse } from '../types/todo';

interface TodoItemProps {
  todo: Todo;
  onTodoUpdated?: (todo: Todo) => void;
  onTodoDeleted?: (todoId: number) => void;
  className?: string;
}

export function TodoItem({ todo, onTodoUpdated, onTodoDeleted, className = '' }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusToggle = async () => {
    if (isLoading) return;

    const newStatus = todo.status === 'open' ? 'done' : 'open';
    await updateTodo({ status: newStatus });
  };

  const handleEditStart = () => {
    setIsEditing(true);
    setEditTitle(todo.title);
    setError(null);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditTitle(todo.title);
    setError(null);
  };

  const handleEditSave = async () => {
    const trimmedTitle = editTitle.trim();
    
    if (!trimmedTitle) {
      setError('Todo title cannot be empty');
      return;
    }

    if (trimmedTitle === todo.title) {
      setIsEditing(false);
      return;
    }

    const success = await updateTodo({ title: trimmedTitle });
    if (success) {
      setIsEditing(false);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleDelete = async () => {
    if (isLoading) return;
    
    if (!confirm('Are you sure you want to delete this todo?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (onTodoDeleted) {
          onTodoDeleted(todo.id);
        }
      } else {
        setError(data.error || 'Failed to delete todo');
      }
    } catch (err) {
      console.error('Todo deletion error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTodo = async (updates: TodoUpdateData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify(updates),
      });

      const data: TodoApiResponse = await response.json();

      if (response.ok && data.success && data.todo) {
        if (onTodoUpdated) {
          onTodoUpdated(data.todo);
        }
        return true;
      } else {
        if (data.errors && data.errors.length > 0) {
          setError(data.errors.join(', '));
        } else {
          setError(data.error || 'Failed to update todo');
        }
        return false;
      }
    } catch (err) {
      console.error('Todo update error:', err);
      setError('Network error. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className={`todo-item ${todo.status} ${className}`}>
      <div className="todo-content">
        <div className="todo-main">
          <button
            type="button"
            className={`status-toggle ${todo.status}`}
            onClick={handleStatusToggle}
            disabled={isLoading}
            aria-label={`Mark as ${todo.status === 'open' ? 'done' : 'open'}`}
          >
            {todo.status === 'done' && (
              <span className="checkmark" aria-hidden="true">✓</span>
            )}
          </button>

          <div className="todo-text">
            {isEditing ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  className={`edit-input ${error ? 'error' : ''}`}
                  disabled={isLoading}
                  maxLength={255}
                  autoFocus
                />
                <div className="edit-actions">
                  <button
                    type="button"
                    onClick={handleEditSave}
                    disabled={isLoading || !editTitle.trim()}
                    className="save-button"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleEditCancel}
                    disabled={isLoading}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="todo-display">
                <span className={`todo-title ${todo.status}`}>
                  {todo.title}
                </span>
                <span className="todo-date">
                  {formatDate(todo.created_at)}
                </span>
              </div>
            )}
          </div>
        </div>

        {!isEditing && (
          <div className="todo-actions">
            <button
              type="button"
              onClick={handleEditStart}
              disabled={isLoading}
              className="action-button edit-button"
              aria-label="Edit todo"
            >
              ✏️
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="action-button delete-button"
              aria-label="Delete todo"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message" role="alert">
          <span className="error-text">{error}</span>
          <button 
            type="button" 
            className="error-dismiss"
            onClick={clearError}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <style jsx>{`
        .todo-item {
          background: white;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          margin-bottom: 0.5rem;
          transition: box-shadow 0.2s;
        }

        .todo-item:hover {
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .todo-item.done {
          opacity: 0.7;
        }

        .todo-content {
          padding: 0.75rem;
        }

        .todo-main {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .status-toggle {
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid #d1d9e0;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .status-toggle:hover {
          border-color: #0969da;
        }

        .status-toggle.done {
          background: #1f883d;
          border-color: #1f883d;
          color: white;
        }

        .status-toggle:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .checkmark {
          font-size: 0.75rem;
          font-weight: bold;
        }

        .todo-text {
          flex: 1;
          min-width: 0;
        }

        .todo-display {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .todo-title {
          font-size: 0.875rem;
          line-height: 1.4;
          color: #24292f;
          word-wrap: break-word;
        }

        .todo-title.done {
          text-decoration: line-through;
          color: #656d76;
        }

        .todo-date {
          font-size: 0.75rem;
          color: #656d76;
        }

        .edit-form {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .edit-input {
          width: 100%;
          padding: 0.375rem 0.5rem;
          border: 1px solid #d1d9e0;
          border-radius: 4px;
          font-size: 0.875rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .edit-input:focus {
          outline: none;
          border-color: #0969da;
          box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
        }

        .edit-input.error {
          border-color: #d1242f;
        }

        .edit-actions {
          display: flex;
          gap: 0.5rem;
        }

        .save-button, .cancel-button {
          padding: 0.25rem 0.5rem;
          border: 1px solid;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .save-button {
          background: #1f883d;
          border-color: #1f883d;
          color: white;
        }

        .save-button:hover:not(:disabled) {
          background: #1a7f37;
        }

        .save-button:disabled {
          background: #94a3b8;
          border-color: #94a3b8;
          cursor: not-allowed;
        }

        .cancel-button {
          background: white;
          border-color: #d1d9e0;
          color: #24292f;
        }

        .cancel-button:hover:not(:disabled) {
          background: #f6f8fa;
        }

        .todo-actions {
          display: flex;
          gap: 0.25rem;
          margin-left: auto;
          flex-shrink: 0;
        }

        .action-button {
          width: 2rem;
          height: 2rem;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          transition: background-color 0.2s;
        }

        .action-button:hover:not(:disabled) {
          background: #f6f8fa;
        }

        .action-button:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .delete-button:hover:not(:disabled) {
          background: #fff5f5;
        }

        .error-message {
          background: #fff5f5;
          border: 1px solid #fed7d7;
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          margin-top: 0.5rem;
          color: #c53030;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.875rem;
        }

        .error-text {
          flex: 1;
        }

        .error-dismiss {
          background: none;
          border: none;
          font-size: 1.125rem;
          color: #c53030;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          margin-left: 0.5rem;
        }

        .error-dismiss:hover {
          color: #9b2c2c;
        }
      `}</style>
    </div>
  );
}