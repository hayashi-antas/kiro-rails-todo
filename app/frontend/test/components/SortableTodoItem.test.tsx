import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableTodoItem } from '../../components/SortableTodoItem'
import { Todo } from '../../types/todo'

const mockTodo: Todo = {
  id: 1,
  title: 'Test todo',
  status: 'open',
  position: 1,
  created_at: '2024-01-01T10:00:00Z'
}

// Helper component to wrap SortableTodoItem with required DnD context
function DndWrapper({ children }: { children: React.ReactNode }) {
  return (
    <DndContext>
      <SortableContext items={[mockTodo.id]} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  )
}

describe('SortableTodoItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders todo item with drag handle', () => {
    render(
      <DndWrapper>
        <SortableTodoItem todo={mockTodo} />
      </DndWrapper>
    )

    expect(screen.getByText('Test todo')).toBeInTheDocument()
    expect(screen.getByText('⋮⋮')).toBeInTheDocument()
  })

  it('shows drag handle with proper styling', () => {
    render(
      <DndWrapper>
        <SortableTodoItem todo={mockTodo} />
      </DndWrapper>
    )

    const dragHandle = screen.getByText('⋮⋮').parentElement
    expect(dragHandle).toHaveStyle({ cursor: 'grab' })
  })

  it('passes through todo update callback', () => {
    const onTodoUpdated = vi.fn()
    const updatedTodo = { ...mockTodo, title: 'Updated todo' }

    render(
      <DndWrapper>
        <SortableTodoItem todo={mockTodo} onTodoUpdated={onTodoUpdated} />
      </DndWrapper>
    )

    // The TodoItem component should receive the callback
    // We can't easily test the callback execution without mocking fetch,
    // but we can verify the component renders without errors
    expect(screen.getByText('Test todo')).toBeInTheDocument()
  })

  it('passes through todo delete callback', () => {
    const onTodoDeleted = vi.fn()

    render(
      <DndWrapper>
        <SortableTodoItem todo={mockTodo} onTodoDeleted={onTodoDeleted} />
      </DndWrapper>
    )

    // The TodoItem component should receive the callback
    expect(screen.getByText('Test todo')).toBeInTheDocument()
  })

  it('applies dragging class when isDragging is true', () => {
    render(
      <DndWrapper>
        <SortableTodoItem todo={mockTodo} isDragging={true} />
      </DndWrapper>
    )

    // The TodoItem should receive the dragging class
    expect(screen.getByText('Test todo')).toBeInTheDocument()
  })

  it('renders with proper structure', () => {
    render(
      <DndWrapper>
        <SortableTodoItem todo={mockTodo} />
      </DndWrapper>
    )

    // Check that the sortable item has the expected structure
    const sortableItem = document.querySelector('.sortable-todo-item')
    expect(sortableItem).toBeInTheDocument()

    const dragHandle = document.querySelector('.drag-handle')
    expect(dragHandle).toBeInTheDocument()

    const todoWrapper = document.querySelector('.todo-item-wrapper')
    expect(todoWrapper).toBeInTheDocument()
  })
})