import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TodoForm } from '../../components/TodoForm'
import { api } from '../../utils/api'

// Type declaration for the global helper
declare global {
  function createMockResponse(options: {
    ok: boolean
    status?: number
    statusText?: string
    headers?: Record<string, string>
    json?: () => Promise<any>
    text?: () => Promise<string>
  }): Response
}

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('TodoForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  it('renders form correctly', () => {
    render(<TodoForm />)

    expect(screen.getByLabelText('Add a new todo')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Todo' })).toBeInTheDocument()
  })

  it('prevents submission with empty title', async () => {
    render(<TodoForm />)

    const submitButton = screen.getByRole('button', { name: 'Add Todo' })
    expect(submitButton).toBeDisabled()

    // Try submitting empty form
    fireEvent.click(submitButton)
    
    // Should not make API call
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('shows validation error for whitespace-only title', async () => {
    render(<TodoForm />)

    const input = screen.getByPlaceholderText('What needs to be done?')

    // Enter whitespace-only title
    fireEvent.change(input, { target: { value: '   ' } })
    
    // Submit the form (button should be disabled, but we can submit via form)
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('Todo title cannot be empty')).toBeInTheDocument()
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('creates todo successfully', async () => {
    const mockTodo = {
      id: 1,
      title: 'Test todo',
      status: 'open',
      position: 1,
      created_at: '2024-01-01T10:00:00Z'
    }

    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: true,
      headers: { 'content-type': 'application/json' },
      json: () => Promise.resolve({ success: true, todo: mockTodo })
    }))

    const onTodoCreated = vi.fn()
    render(<TodoForm onTodoCreated={onTodoCreated} />)

    const input = screen.getByPlaceholderText('What needs to be done?')
    const submitButton = screen.getByRole('button', { name: 'Add Todo' })

    // Enter valid title
    fireEvent.change(input, { target: { value: 'Test todo' } })
    expect(submitButton).not.toBeDisabled()

    fireEvent.click(submitButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Adding...')).toBeInTheDocument()
    })

    // Wait for completion
    await waitFor(() => {
      expect(onTodoCreated).toHaveBeenCalledWith(mockTodo)
    })

    // Form should be cleared
    expect(input).toHaveValue('')
    
    // API should be called correctly
    expect(mockFetch).toHaveBeenCalledWith('/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ title: 'Test todo' })
    })
  })

  it('handles API error', async () => {
    // Mock the API client to avoid retry logic issues
    const originalRequest = api.post
    api.post = vi.fn().mockRejectedValue(new Error('HTTP 500: Internal Server Error'))

    render(<TodoForm />)

    const input = screen.getByPlaceholderText('What needs to be done?')
    fireEvent.change(input, { target: { value: 'Test todo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Todo' }))

    // Wait for the loading state to finish and error to appear
    await waitFor(() => {
      expect(screen.queryByText('Adding...')).not.toBeInTheDocument()
    }, { timeout: 5000 })

    // Check for any error message
    await waitFor(() => {
      const errorElement = screen.getByRole('alert')
      expect(errorElement).toBeInTheDocument()
    })

    // Check for the specific error message
    expect(screen.getByText('HTTP 500: Internal Server Error')).toBeInTheDocument()

    // Restore original function
    api.post = originalRequest
  })

  it('handles validation errors from server', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: { 'content-type': 'application/json' },
      json: () => Promise.resolve({ 
        error: 'Validation failed',
        errors: ['Title is too long', 'Title contains invalid characters']
      })
    }))

    render(<TodoForm />)

    const input = screen.getByPlaceholderText('What needs to be done?')
    fireEvent.change(input, { target: { value: 'Test todo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Todo' }))

    await waitFor(() => {
      expect(screen.getByText('HTTP 422: Unprocessable Entity')).toBeInTheDocument()
    })
  })

  it('handles network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<TodoForm />)

    const input = screen.getByPlaceholderText('What needs to be done?')
    fireEvent.change(input, { target: { value: 'Test todo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Todo' }))

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('allows dismissing error messages', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<TodoForm />)

    const input = screen.getByPlaceholderText('What needs to be done?')
    fireEvent.change(input, { target: { value: 'Test todo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Todo' }))

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    // Click dismiss button
    const dismissButton = screen.getByLabelText('Dismiss error')
    fireEvent.click(dismissButton)

    await waitFor(() => {
      expect(screen.queryByText('Network error')).not.toBeInTheDocument()
    })
  })

  it('trims whitespace from title before submission', async () => {
    const mockTodo = {
      id: 1,
      title: 'Test todo',
      status: 'open',
      position: 1,
      created_at: '2024-01-01T10:00:00Z'
    }

    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: true,
      headers: { 'content-type': 'application/json' },
      json: () => Promise.resolve({ success: true, todo: mockTodo })
    }))

    render(<TodoForm />)

    const input = screen.getByPlaceholderText('What needs to be done?')
    fireEvent.change(input, { target: { value: '  Test todo  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Todo' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ title: 'Test todo' })
      })
    })
  })
})