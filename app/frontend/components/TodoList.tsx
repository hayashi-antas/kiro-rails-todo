import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Todo, TodoListResponse, TodoReorderUpdate, TodoReorderResponse } from '../types/todo';
import { TodoForm } from './TodoForm';
import { TodoItem } from './TodoItem';
import { SortableTodoItem } from './SortableTodoItem';

interface TodoListProps {
  className?: string;
}

export function TodoList({ className = '' }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load todos from API
  const loadTodos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/todos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
      });

      if (response.ok) {
        const data: TodoListResponse = await response.json();
        setTodos(data.todos || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load todos');
      }
    } catch (err) {
      console.error('Todo loading error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load todos on component mount
  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // Handle new todo creation
  const handleTodoCreated = useCallback((newTodo: Todo) => {
    setTodos(prevTodos => [...prevTodos, newTodo]);
  }, []);

  // Handle todo updates
  const handleTodoUpdated = useCallback((updatedTodo: Todo) => {
    setTodos(prevTodos => 
      prevTodos.map(todo => 
        todo.id === updatedTodo.id ? updatedTodo : todo
      )
    );
  }, []);

  // Handle todo deletion
  const handleTodoDeleted = useCallback((todoId: number) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== todoId));
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as number);
    setReorderError(null);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeIndex = todos.findIndex(todo => todo.id === active.id);
    const overIndex = todos.findIndex(todo => todo.id === over.id);

    if (activeIndex === -1 || overIndex === -1) {
      return;
    }

    // Optimistically update the UI
    const reorderedTodos = arrayMove(todos, activeIndex, overIndex);
    setTodos(reorderedTodos);

    // Calculate new positions
    const updates: TodoReorderUpdate[] = reorderedTodos.map((todo, index) => ({
      id: todo.id,
      position: index + 1,
    }));

    // Send reorder request to API
    setIsReordering(true);
    try {
      const response = await fetch('/api/todos/reorder', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ updates }),
      });

      const data: TodoReorderResponse = await response.json();

      if (!response.ok || !data.success) {
        // Revert the optimistic update on failure
        setTodos(todos);
        setReorderError(data.error || 'Failed to reorder todos');
      }
    } catch (err) {
      console.error('Reorder error:', err);
      // Revert the optimistic update on network error
      setTodos(todos);
      setReorderError('Network error. Please try again.');
    } finally {
      setIsReordering(false);
    }
  }, [todos]);

  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // Filter todos based on current filter
  const filteredTodos = todos.filter(todo => {
    switch (filter) {
      case 'open':
        return todo.status === 'open';
      case 'done':
        return todo.status === 'done';
      default:
        return true;
    }
  });

  // Get counts for filter buttons
  const counts = {
    all: todos.length,
    open: todos.filter(todo => todo.status === 'open').length,
    done: todos.filter(todo => todo.status === 'done').length,
  };

  const clearError = () => {
    setError(null);
  };

  const clearReorderError = () => {
    setReorderError(null);
  };

  const handleRetry = () => {
    loadTodos();
  };

  // Get the active todo for drag overlay
  const activeTodo = activeId ? todos.find(todo => todo.id === activeId) : null;

  if (isLoading && todos.length === 0) {
    return (
      <div className={`todo-list ${className}`}>
        <div className="loading-state">
          <div className="loading-spinner" aria-hidden="true"></div>
          <p>Loading your todos...</p>
        </div>

        <style jsx>{`
          .todo-list {
            max-width: 600px;
            margin: 0 auto;
            padding: 1rem;
          }

          .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem 1rem;
            color: #656d76;
          }

          .loading-spinner {
            width: 2rem;
            height: 2rem;
            border: 3px solid #e1e5e9;
            border-top: 3px solid #0969da;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`todo-list ${className}`}>
      <div className="todo-list-header">
        <h1>My Todos</h1>
        <p className="todo-count">
          {counts.all === 0 
            ? 'No todos yet' 
            : `${counts.open} open, ${counts.done} done`
          }
        </p>
      </div>

      <TodoForm onTodoCreated={handleTodoCreated} />

      {error && (
        <div className="error-message" role="alert">
          <div className="error-content">
            <span className="error-text">{error}</span>
            <div className="error-actions">
              <button 
                type="button" 
                className="retry-button"
                onClick={handleRetry}
              >
                Retry
              </button>
              <button 
                type="button" 
                className="error-dismiss"
                onClick={clearError}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {reorderError && (
        <div className="error-message reorder-error" role="alert">
          <div className="error-content">
            <span className="error-text">{reorderError}</span>
            <button 
              type="button" 
              className="error-dismiss"
              onClick={clearReorderError}
              aria-label="Dismiss reorder error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {todos.length > 0 && (
        <div className="todo-filters">
          <button
            type="button"
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            className={`filter-button ${filter === 'open' ? 'active' : ''}`}
            onClick={() => setFilter('open')}
          >
            Open ({counts.open})
          </button>
          <button
            type="button"
            className={`filter-button ${filter === 'done' ? 'active' : ''}`}
            onClick={() => setFilter('done')}
          >
            Done ({counts.done})
          </button>
        </div>
      )}

      <div className="todo-items">
        {filteredTodos.length === 0 ? (
          <div className="empty-state">
            {todos.length === 0 ? (
              <>
                <div className="empty-icon" aria-hidden="true">📝</div>
                <h3>No todos yet</h3>
                <p>Add your first todo above to get started!</p>
              </>
            ) : (
              <>
                <div className="empty-icon" aria-hidden="true">🔍</div>
                <h3>No {filter} todos</h3>
                <p>
                  {filter === 'open' 
                    ? 'All your todos are completed!' 
                    : 'No completed todos yet.'
                  }
                </p>
              </>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext 
              items={filteredTodos.map(todo => todo.id)} 
              strategy={verticalListSortingStrategy}
            >
              {filteredTodos.map(todo => (
                <SortableTodoItem
                  key={todo.id}
                  todo={todo}
                  onTodoUpdated={handleTodoUpdated}
                  onTodoDeleted={handleTodoDeleted}
                  isDragging={activeId === todo.id}
                />
              ))}
            </SortableContext>
            
            <DragOverlay>
              {activeTodo ? (
                <div className="drag-overlay">
                  <TodoItem
                    todo={activeTodo}
                    className="dragging-overlay"
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {(isLoading && todos.length > 0) || isReordering ? (
        <div className="loading-overlay">
          <div className="loading-spinner" aria-hidden="true"></div>
          {isReordering && <span className="loading-text">Reordering...</span>}
        </div>
      ) : null}

      <style jsx>{`
        .todo-list {
          max-width: 600px;
          margin: 0 auto;
          padding: 1rem;
        }

        .todo-list-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .todo-list-header h1 {
          margin: 0 0 0.5rem 0;
          color: #24292f;
          font-size: 2rem;
          font-weight: 600;
        }

        .todo-count {
          margin: 0;
          color: #656d76;
          font-size: 0.875rem;
        }

        .error-message {
          background: #fff5f5;
          border: 1px solid #fed7d7;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
          color: #c53030;
        }

        .error-message.reorder-error {
          background: #fffbeb;
          border-color: #fed7aa;
          color: #92400e;
        }

        .error-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .error-text {
          flex: 1;
          font-size: 0.875rem;
        }

        .error-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .retry-button {
          padding: 0.25rem 0.5rem;
          border: 1px solid #c53030;
          border-radius: 4px;
          background: white;
          color: #c53030;
          font-size: 0.75rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .retry-button:hover {
          background: #fff5f5;
        }

        .error-dismiss {
          background: none;
          border: none;
          font-size: 1.25rem;
          color: #c53030;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .error-dismiss:hover {
          color: #9b2c2c;
        }

        .todo-filters {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding: 0.5rem;
          background: #f6f8fa;
          border-radius: 8px;
        }

        .filter-button {
          padding: 0.5rem 0.75rem;
          border: 1px solid transparent;
          border-radius: 6px;
          background: transparent;
          color: #656d76;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-button:hover {
          background: white;
          color: #24292f;
        }

        .filter-button.active {
          background: white;
          border-color: #d1d9e0;
          color: #24292f;
          font-weight: 500;
        }

        .todo-items {
          position: relative;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: #656d76;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          color: #24292f;
          font-size: 1.25rem;
          font-weight: 500;
        }

        .empty-state p {
          margin: 0;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          gap: 0.5rem;
        }

        .loading-text {
          font-size: 0.875rem;
          color: #656d76;
        }

        .loading-spinner {
          width: 1.5rem;
          height: 1.5rem;
          border: 2px solid #e1e5e9;
          border-top: 2px solid #0969da;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .drag-overlay {
          transform: rotate(5deg);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .drag-overlay :global(.todo-item) {
          border-color: #0969da;
          background: #f6f8fa;
        }
      `}</style>
    </div>
  );
}