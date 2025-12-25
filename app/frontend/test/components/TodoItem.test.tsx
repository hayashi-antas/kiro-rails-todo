import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TodoItem } from '../../components/TodoItem'
import { Todo } from '../../types/todo'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock confirm dialog
const mockConfirm = vi.fn()
global.confirm = mockConfirm

const mockTodo: Todo = {
  id: 1,
  title: 'Test todo',
  status: 'open',
  position: 1,
  created_at: '2024-01-01T10:00:00Z'
}

describe('TodoItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
    mockConfirm.mockClear()
  })

  it('renders todo correctly', () => {
    render(<TodoItem todo={mockTodo} />)

    expect(screen.getByText('Test todo')).toBeInTheDocument()
    expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument()
    expect(screen.getByLabelText('Mark as done')).toBeInTheDocument()
    expect(screen.getByLabelText('Edit todo')).toBeInTheDocument()
    expect(screen.getByLabelText('Delete todo')).toBeInTheDocument()
  })

  it('renders completed todo correctly', () => {
    const completedTodo = { ...mockTodo, status: 'done' as const }
    render(<TodoItem todo={completedTodo} />)

    expect(screen.getByText('Test todo')).toBeInTheDocument()
    expect(screen.getByText('✓')).toBeInTheDocument()
    expect(screen.getByLabelText('Mark as open')).toBeInTheDocument()
  })

  it('toggles todo status successfully', async () => {
    const updatedTodo = { ...mockTodo, status: 'done' as const }
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, todo: updatedTodo })
    })

    const onTodoUpdated = vi.fn()
    render(<TodoItem todo={mockTodo} onTodoUpdated={onTodoUpdated} />)

    const statusButton = screen.getByLabelText('Mark as done')
    fireEvent.click(statusButton)

    await waitFor(() => {
      expect(onTodoUpdated).toHaveBeenCalledWith(updatedTodo)
    })

    expect(mockFetch).toHaveBeenCalledWith(`/api/todos/${mockTodo.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ status: 'done' })
    })
  })

  it('enters edit mode when edit button clicked', () => {
    render(<TodoItem todo={mockTodo} />)

    const editButton = screen.getByLabelText('Edit todo')
    fireEvent.click(editButton)

    expect(screen.getByDisplayValue('Test todo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('saves edited todo successfully', async () => {
    const updatedTodo = { ...mockTodo, title: 'Updated todo' }
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, todo: updatedTodo })
    })

    const onTodoUpdated = vi.fn()
    render(<TodoItem todo={mockTodo} onTodoUpdated={onTodoUpdated} />)

    // Enter edit mode
    fireEvent.click(screen.getByLabelText('Edit todo'))

    // Change title
    const input = screen.getByDisplayValue('Test todo')
    fireEvent.change(input, { target: { value: 'Updated todo' } })

    // Save changes
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(onTodoUpdated).toHaveBeenCalledWith(updatedTodo)
    })

    expect(mockFetch).toHaveBeenCalledWith(`/api/todos/${mockTodo.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ title: 'Updated todo' })
    })

    // Should exit edit mode
    expect(screen.queryByDisplayValue('Updated todo')).not.toBeInTheDocument()
  })

  it('cancels edit without saving', () => {
    render(<TodoItem todo={mockTodo} />)

    // Enter edit mode
    fireEvent.click(screen.getByLabelText('Edit todo'))

    // Change title
    const input = screen.getByDisplayValue('Test todo')
    fireEvent.change(input, { target: { value: 'Changed title' } })

    // Cancel changes
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    // Should exit edit mode and not make API call
    expect(screen.queryByDisplayValue('Changed title')).not.toBeInTheDocument()
    expect(screen.getByText('Test todo')).toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('saves on Enter key press', async () => {
    const updatedTodo = { ...mockTodo, title: 'Updated todo' }
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, todo: updatedTodo })
    })

    const onTodoUpdated = vi.fn()
    render(<TodoItem todo={mockTodo} onTodoUpdated={onTodoUpdated} />)

    // Enter edit mode
    fireEvent.click(screen.getByLabelText('Edit todo'))

    // Change title and press Enter
    const input = screen.getByDisplayValue('Test todo')
    fireEvent.change(input, { target: { value: 'Updated todo' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(onTodoUpdated).toHaveBeenCalledWith(updatedTodo)
    })
  })

  it('cancels on Escape key press', () => {
    render(<TodoItem todo={mockTodo} />)

    // Enter edit mode
    fireEvent.click(screen.getByLabelText('Edit todo'))

    // Change title and press Escape
    const input = screen.getByDisplayValue('Test todo')
    fireEvent.change(input, { target: { value: 'Changed title' } })
    fireEvent.keyDown(input, { key: 'Escape' })

    // Should exit edit mode without saving
    expect(screen.queryByDisplayValue('Changed title')).not.toBeInTheDocument()
    expect(screen.getByText('Test todo')).toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('prevents saving empty title', async () => {
    render(<TodoItem todo={mockTodo} />)

    // Enter edit mode
    fireEvent.click(screen.getByLabelText('Edit todo'))

    // Clear title
    const input = screen.getByDisplayValue('Test todo')
    fireEvent.change(input, { target: { value: '   ' } })

    // Try to save (button should be disabled, but we can submit via keydown)
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText('Todo title cannot be empty')).toBeInTheDocument()
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('deletes todo after confirmation', async () => {
    mockConfirm.mockReturnValue(true)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })

    const onTodoDeleted = vi.fn()
    render(<TodoItem todo={mockTodo} onTodoDeleted={onTodoDeleted} />)

    const deleteButton = screen.getByLabelText('Delete todo')
    fireEvent.click(deleteButton)

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this todo?')

    await waitFor(() => {
      expect(onTodoDeleted).toHaveBeenCalledWith(mockTodo.id)
    })

    expect(mockFetch).toHaveBeenCalledWith(`/api/todos/${mockTodo.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'same-origin'
    })
  })

  it('cancels deletion when not confirmed', () => {
    mockConfirm.mockReturnValue(false)

    render(<TodoItem todo={mockTodo} />)

    const deleteButton = screen.getByLabelText('Delete todo')
    fireEvent.click(deleteButton)

    expect(mockConfirm).toHaveBeenCalled()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('handles update API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Update failed' })
    })

    render(<TodoItem todo={mockTodo} />)

    const statusButton = screen.getByLabelText('Mark as done')
    fireEvent.click(statusButton)

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument()
    })
  })

  it('handles delete API error', async () => {
    mockConfirm.mockReturnValue(true)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Delete failed' })
    })

    render(<TodoItem todo={mockTodo} />)

    const deleteButton = screen.getByLabelText('Delete todo')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('Delete failed')).toBeInTheDocument()
    })
  })

  it('allows dismissing error messages', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Update failed' })
    })

    render(<TodoItem todo={mockTodo} />)

    const statusButton = screen.getByLabelText('Mark as done')
    fireEvent.click(statusButton)

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument()
    })

    // Click dismiss button
    const dismissButton = screen.getByLabelText('Dismiss error')
    fireEvent.click(dismissButton)

    await waitFor(() => {
      expect(screen.queryByText('Update failed')).not.toBeInTheDocument()
    })
  })

  it('formats dates correctly', () => {
    const todoWithDifferentYear = {
      ...mockTodo,
      created_at: '2023-12-25T10:00:00Z'
    }

    render(<TodoItem todo={todoWithDifferentYear} />)

    expect(screen.getByText('Dec 25, 2023')).toBeInTheDocument()
  })

  it('does not save when title unchanged', async () => {
    render(<TodoItem todo={mockTodo} />)

    // Enter edit mode
    fireEvent.click(screen.getByLabelText('Edit todo'))

    // Save without changing title
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    // Should exit edit mode without API call
    expect(screen.queryByDisplayValue('Test todo')).not.toBeInTheDocument()
    expect(screen.getByText('Test todo')).toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()
  })
})