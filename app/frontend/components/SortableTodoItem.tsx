import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Todo } from '../types/todo';
import { TodoItem } from './TodoItem';

interface SortableTodoItemProps {
  todo: Todo;
  onTodoUpdated?: (todo: Todo) => void;
  onTodoDeleted?: (todoId: number) => void;
  isDragging?: boolean;
}

export function SortableTodoItem({ 
  todo, 
  onTodoUpdated, 
  onTodoDeleted, 
  isDragging = false 
}: SortableTodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="sortable-todo-item">
      <div className="drag-handle" {...attributes} {...listeners}>
        <span className="drag-icon" aria-hidden="true">⋮⋮</span>
      </div>
      
      <div className="todo-item-wrapper">
        <TodoItem
          todo={todo}
          onTodoUpdated={onTodoUpdated}
          onTodoDeleted={onTodoDeleted}
          className={isDragging ? 'dragging' : ''}
        />
      </div>

      <style jsx>{`
        .sortable-todo-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .drag-handle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.5rem;
          height: 2.5rem;
          cursor: grab;
          color: #656d76;
          border-radius: 4px;
          transition: all 0.2s;
          margin-top: 0.75rem;
        }

        .drag-handle:hover {
          background: #f6f8fa;
          color: #24292f;
        }

        .drag-handle:active {
          cursor: grabbing;
        }

        .drag-icon {
          font-size: 0.875rem;
          line-height: 1;
          user-select: none;
        }

        .todo-item-wrapper {
          flex: 1;
          min-width: 0;
        }

        .sortable-todo-item :global(.todo-item.dragging) {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: rotate(2deg);
        }
      `}</style>
    </div>
  );
}