import React, { useState } from 'react';
import { TodoFormData, TodoApiResponse } from '../types/todo';

interface TodoFormProps {
  onTodoCreated?: (todo: any) => void;
  className?: string;
}

export function TodoForm({ onTodoCreated, className = '' }: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    
    // Validate title
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Todo title cannot be empty');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ title: trimmedTitle }),
      });

      const data: TodoApiResponse = await response.json();

      if (response.ok && data.success && data.todo) {
        // Clear form
        setTitle('');
        setError(null);
        
        // Notify parent component
        if (onTodoCreated) {
          onTodoCreated(data.todo);
        }
      } else {
        // Handle validation errors
        if (data.errors && data.errors.length > 0) {
          setError(data.errors.join(', '));
        } else {
          setError(data.error || 'Failed to create todo');
        }
      }
    } catch (err) {
      console.error('Todo creation error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className={`todo-form ${className}`}>
      <form onSubmit={handleSubmit} className="todo-form-content">
        <div className="form-group">
          <label htmlFor="todo-title" className="form-label">
            Add a new todo
          </label>
          <div className="input-group">
            <input
              id="todo-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className={`form-input ${error ? 'error' : ''}`}
              disabled={isLoading}
              maxLength={255}
            />
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="submit-button"
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner" aria-hidden="true"></span>
                  Adding...
                </>
              ) : (
                'Add Todo'
              )}
            </button>
          </div>
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
      </form>

      <style jsx>{`
        .todo-form {
          margin-bottom: 1.5rem;
        }

        .todo-form-content {
          background: white;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          padding: 1rem;
        }

        .form-group {
          margin-bottom: 0.5rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #24292f;
          font-size: 0.875rem;
        }

        .input-group {
          display: flex;
          gap: 0.5rem;
        }

        .form-input {
          flex: 1;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d9e0;
          border-radius: 6px;
          font-size: 0.875rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #0969da;
          box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.1);
        }

        .form-input.error {
          border-color: #d1242f;
        }

        .form-input:disabled {
          background-color: #f6f8fa;
          color: #656d76;
          cursor: not-allowed;
        }

        .submit-button {
          padding: 0.5rem 1rem;
          border: 1px solid #1f883d;
          border-radius: 6px;
          background: #1f883d;
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: background-color 0.2s;
          white-space: nowrap;
        }

        .submit-button:hover:not(:disabled) {
          background: #1a7f37;
        }

        .submit-button:disabled {
          background: #94a3b8;
          border-color: #94a3b8;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 0.875rem;
          height: 0.875rem;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
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