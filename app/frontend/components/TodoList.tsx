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

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleTodoCreated = useCallback((newTodo: Todo) => {
    setTodos(prevTodos => [...prevTodos, newTodo]);
  }, []);

  const handleTodoUpdated = useCallback((updatedTodo: Todo) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === updatedTodo.id ? updatedTodo : todo
      )
    );
  }, []);

  const handleTodoDeleted = useCallback((todoId: number) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== todoId));
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as number);
    setReorderError(null);
  }, []);

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

    const reorderedTodos = arrayMove(todos, activeIndex, overIndex);
    setTodos(reorderedTodos);

    const updates: TodoReorderUpdate[] = reorderedTodos.map((todo, index) => ({
      id: todo.id,
      position: index + 1,
    }));

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
        setTodos(todos);
        setReorderError(data.error || 'Failed to reorder todos');
      }
    } catch (err) {
      console.error('Reorder error:', err);
      setTodos(todos);
      setReorderError('Network error. Please try again.');
    } finally {
      setIsReordering(false);
    }
  }, [todos]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

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

  const activeTodo = activeId ? todos.find(todo => todo.id === activeId) : null;

  if (isLoading && todos.length === 0) {
    return (
      <div className={`max-w-xl mx-auto p-4 ${className}`}>
        <div className="flex flex-col items-center justify-center py-12 text-gray-text">
          <div className="spinner-lg border-gray-border-light border-t-primary mb-4" aria-hidden="true"></div>
          <p>Loading your todos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-xl mx-auto p-4 ${className}`}>
      <div className="text-center mb-8">
        <h1 className="m-0 mb-2 text-gray-dark text-3xl font-semibold">My Todos</h1>
        <p className="m-0 text-gray-text text-sm">
          {counts.all === 0
            ? 'No todos yet'
            : `${counts.open} open, ${counts.done} done`
          }
        </p>
      </div>

      <TodoForm onTodoCreated={handleTodoCreated} />

      {error && (
        <div className="error-alert mb-4" role="alert">
          <div className="flex items-center justify-between gap-4">
            <span className="flex-1 text-sm">{error}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="py-1 px-2 border border-danger rounded bg-white text-danger text-xs cursor-pointer transition-colors duration-200 hover:bg-danger-bg"
                onClick={handleRetry}
              >
                Retry
              </button>
              <button
                type="button"
                className="bg-transparent border-none text-xl text-danger cursor-pointer p-0 leading-none hover:text-danger-hover"
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
        <div className="warning-alert mb-4" role="alert">
          <div className="flex items-center justify-between gap-4">
            <span className="flex-1 text-sm">{reorderError}</span>
            <button
              type="button"
              className="bg-transparent border-none text-xl text-warning-text cursor-pointer p-0 leading-none hover:text-amber-800"
              onClick={clearReorderError}
              aria-label="Dismiss reorder error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {todos.length > 0 && (
        <div className="flex gap-2 mb-4 p-2 bg-gray-light rounded-lg">
          <button
            type="button"
            className={`py-2 px-3 border rounded-md bg-transparent text-gray-text text-sm cursor-pointer transition-all duration-200 hover:bg-white hover:text-gray-dark
              ${filter === 'all' ? 'bg-white border-gray-border text-gray-dark font-medium' : 'border-transparent'}`}
            onClick={() => setFilter('all')}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            className={`py-2 px-3 border rounded-md bg-transparent text-gray-text text-sm cursor-pointer transition-all duration-200 hover:bg-white hover:text-gray-dark
              ${filter === 'open' ? 'bg-white border-gray-border text-gray-dark font-medium' : 'border-transparent'}`}
            onClick={() => setFilter('open')}
          >
            Open ({counts.open})
          </button>
          <button
            type="button"
            className={`py-2 px-3 border rounded-md bg-transparent text-gray-text text-sm cursor-pointer transition-all duration-200 hover:bg-white hover:text-gray-dark
              ${filter === 'done' ? 'bg-white border-gray-border text-gray-dark font-medium' : 'border-transparent'}`}
            onClick={() => setFilter('done')}
          >
            Done ({counts.done})
          </button>
        </div>
      )}

      <div className="relative">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-12 text-gray-text">
            {todos.length === 0 ? (
              <>
                <div className="text-5xl mb-4" aria-hidden="true">📝</div>
                <h3 className="m-0 mb-2 text-gray-dark text-xl font-medium">No todos yet</h3>
                <p className="m-0 text-sm leading-relaxed">Add your first todo above to get started!</p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4" aria-hidden="true">🔍</div>
                <h3 className="m-0 mb-2 text-gray-dark text-xl font-medium">No {filter} todos</h3>
                <p className="m-0 text-sm leading-relaxed">
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
                <div className="rotate-[5deg] shadow-2xl">
                  <TodoItem
                    todo={activeTodo}
                    className="border-primary bg-gray-light"
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {(isLoading && todos.length > 0) || isReordering ? (
        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-lg gap-2">
          <div className="spinner-md border-gray-border-light border-t-primary" aria-hidden="true"></div>
          {isReordering && <span className="text-sm text-gray-text">Reordering...</span>}
        </div>
      ) : null}
    </div>
  );
}
