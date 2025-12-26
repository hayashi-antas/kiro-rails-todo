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
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 mb-2">
      <div
        className="flex items-center justify-center w-6 h-10 cursor-grab text-gray-text rounded transition-all duration-200 mt-3 hover:bg-gray-light hover:text-gray-dark active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <span className="text-sm leading-none select-none" aria-hidden="true">⋮⋮</span>
      </div>

      <div className="flex-1 min-w-0">
        <TodoItem
          todo={todo}
          onTodoUpdated={onTodoUpdated}
          onTodoDeleted={onTodoDeleted}
          className={isDragging ? 'shadow-lg rotate-2' : ''}
        />
      </div>
    </div>
  );
}
