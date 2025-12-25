import React, { Component, ReactNode } from 'react'
import { ErrorMessage } from './ErrorMessage'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

/**
 * Error boundary component that catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error)
    console.error('Error info:', errorInfo)
    
    this.setState({
      errorInfo
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, { extra: errorInfo })
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h2 className="error-boundary-title">Something went wrong</h2>
            <ErrorMessage 
              error={this.state.error}
              onRetry={this.handleRetry}
              title="Application Error"
            />
            
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="error-boundary-details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-boundary-stack">
                  {this.state.error.stack}
                </pre>
                <pre className="error-boundary-info">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>

          <style jsx>{`
            .error-boundary {
              min-height: 400px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 2rem;
              background: #f6f8fa;
            }

            .error-boundary-content {
              max-width: 600px;
              width: 100%;
              background: white;
              border: 1px solid #e1e5e9;
              border-radius: 8px;
              padding: 2rem;
              text-align: center;
            }

            .error-boundary-title {
              margin: 0 0 1rem 0;
              color: #24292f;
              font-size: 1.5rem;
              font-weight: 600;
            }

            .error-boundary-details {
              margin-top: 1.5rem;
              text-align: left;
              border: 1px solid #e1e5e9;
              border-radius: 6px;
              padding: 1rem;
              background: #f6f8fa;
            }

            .error-boundary-details summary {
              cursor: pointer;
              font-weight: 500;
              margin-bottom: 0.5rem;
            }

            .error-boundary-stack,
            .error-boundary-info {
              background: #24292f;
              color: #f0f6fc;
              padding: 1rem;
              border-radius: 6px;
              font-size: 0.75rem;
              line-height: 1.4;
              overflow-x: auto;
              margin: 0.5rem 0;
            }
          `}</style>
        </div>
      )
    }

    return this.props.children
  }
}