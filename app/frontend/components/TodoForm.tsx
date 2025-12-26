import React, { useState } from 'react';
import { TodoFormData, TodoApiResponse } from '../types/todo';
import { ErrorMessage } from './ErrorMessage';
import { api } from '../utils/api';
import { NetworkError, isNetworkError } from '../utils/networkError';

interface TodoFormProps {
  onTodoCreated?: (todo: any) => void;
  className?: string;
}

export function TodoForm({ onTodoCreated, className = '' }: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | Error | NetworkError | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Todo title cannot be empty');
      return;
    }

    setIsLoading(true);

    try {
      const data = await api.post('/todos', { title: trimmedTitle });

      if (data.success && data.todo) {
        setTitle('');
        setError(null);

        if (onTodoCreated) {
          onTodoCreated(data.todo);
        }
      } else {
        if (data.errors && data.errors.length > 0) {
          setError(data.errors.join(', '));
        } else {
          setError(data.error || 'Failed to create todo');
        }
      }
    } catch (err) {
      console.error('Todo creation error:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const retrySubmit = async () => {
    if (title.trim()) {
      await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  return (
    <div className={`mb-6 ${className}`}>
      <form onSubmit={handleSubmit} className="card p-4">
        <div className="mb-2">
          <label htmlFor="todo-title" className="block mb-2 font-medium text-gray-dark text-sm">
            Add a new todo
          </label>
          <div className="flex gap-2">
            <input
              id="todo-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className={`input-field flex-1 ${error ? 'error' : ''}`}
              disabled={isLoading}
              maxLength={255}
            />
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="btn-primary whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <span className="spinner-sm" aria-hidden="true"></span>
                  Adding...
                </>
              ) : (
                'Add Todo'
              )}
            </button>
          </div>
        </div>

        {error && (
          <ErrorMessage
            error={error}
            onDismiss={clearError}
            onRetry={isNetworkError(error) ? retrySubmit : undefined}
          />
        )}
      </form>
    </div>
  );
}
