import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { ErrorMessage } from '../../components/ErrorMessage'
import { NetworkError } from '../../utils/networkError'

describe('ErrorMessage', () => {
  it('renders error message', () => {
    render(<ErrorMessage error="Something went wrong" />)
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders with custom title', () => {
    render(<ErrorMessage error="Test error" title="Custom Error" />)
    
    expect(screen.getByText('Custom Error')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('shows dismiss button when onDismiss provided', () => {
    const onDismiss = vi.fn()
    render(<ErrorMessage error="Test error" onDismiss={onDismiss} />)
    
    const dismissButton = screen.getByRole('button', { name: /dismiss/i })
    expect(dismissButton).toBeInTheDocument()
    
    fireEvent.click(dismissButton)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('shows retry button when onRetry provided', () => {
    const onRetry = vi.fn()
    render(<ErrorMessage error="Test error" onRetry={onRetry} />)
    
    const retryButton = screen.getByRole('button', { name: /try again/i })
    expect(retryButton).toBeInTheDocument()
    
    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('handles NetworkError objects', () => {
    const networkError = new NetworkError('Connection failed', 'NETWORK_ERROR')
    render(<ErrorMessage error={networkError} />)
    
    expect(screen.getByText('Unable to connect to the server. Please check your internet connection and try again.')).toBeInTheDocument()
    expect(screen.getByText(/network error/i)).toBeInTheDocument()
  })

  it('handles Error objects', () => {
    const error = new Error('Generic error')
    render(<ErrorMessage error={error} />)
    
    expect(screen.getByText('Generic error')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <ErrorMessage error="Test error" className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('shows loading state during retry', () => {
    const onRetry = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    render(<ErrorMessage error="Test error" onRetry={onRetry} />)
    
    const retryButton = screen.getByRole('button', { name: /try again/i })
    fireEvent.click(retryButton)
    
    expect(screen.getByText(/retrying/i)).toBeInTheDocument()
  })

  it('provides user-friendly messages for common network errors', () => {
    const timeoutError = new NetworkError('Request timeout', 'TIMEOUT')
    render(<ErrorMessage error={timeoutError} />)
    
    expect(screen.getByText(/connection timed out/i)).toBeInTheDocument()
  })

  it('provides user-friendly messages for auth errors', () => {
    const authError = new NetworkError('Unauthorized', 'AUTH_ERROR')
    render(<ErrorMessage error={authError} />)
    
    expect(screen.getAllByText(/authentication required/i)).toHaveLength(2) // Title and description
  })
})