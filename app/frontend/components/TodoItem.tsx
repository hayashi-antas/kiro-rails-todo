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
    <div className={`card mb-2 transition-shadow duration-200 hover:shadow-md ${todo.status === 'done' ? 'opacity-70' : ''} ${className}`}>
      <div className="p-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200 flex-shrink-0 mt-0.5 cursor-pointer
              ${todo.status === 'done'
                ? 'bg-success border-success text-white'
                : 'bg-white border-gray-border hover:border-primary'
              }
              ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
            onClick={handleStatusToggle}
            disabled={isLoading}
            aria-label={`Mark as ${todo.status === 'open' ? 'done' : 'open'}`}
          >
            {todo.status === 'done' && (
              <span className="text-xs font-bold" aria-hidden="true">✓</span>
            )}
          </button>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  className={`input-field py-1.5 px-2 text-sm ${error ? 'error' : ''}`}
                  disabled={isLoading}
                  maxLength={255}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleEditSave}
                    disabled={isLoading || !editTitle.trim()}
                    className="btn-primary py-1 px-2 text-xs"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleEditCancel}
                    disabled={isLoading}
                    className="btn-outline py-1 px-2 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <span className={`text-sm leading-relaxed text-gray-dark break-words ${todo.status === 'done' ? 'line-through text-gray-text' : ''}`}>
                  {todo.title}
                </span>
                <span className="text-xs text-gray-text">
                  {formatDate(todo.created_at)}
                </span>
              </div>
            )}
          </div>
        </div>

        {!isEditing && (
          <div className="flex gap-1 ml-auto flex-shrink-0">
            <button
              type="button"
              onClick={handleEditStart}
              disabled={isLoading}
              className="w-8 h-8 border-none bg-transparent cursor-pointer rounded flex items-center justify-center text-sm transition-colors duration-200 hover:bg-gray-light disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Edit todo"
            >
              ✏️
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="w-8 h-8 border-none bg-transparent cursor-pointer rounded flex items-center justify-center text-sm transition-colors duration-200 hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Delete todo"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-alert mx-3 mb-3 py-2 px-3 flex items-center justify-between text-sm" role="alert">
          <span className="flex-1">{error}</span>
          <button
            type="button"
            className="bg-transparent border-none text-lg text-danger cursor-pointer p-0 leading-none ml-2 hover:text-danger-hover"
            onClick={clearError}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
