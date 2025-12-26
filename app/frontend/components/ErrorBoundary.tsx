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

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

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
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8 bg-gray-light">
          <div className="max-w-xl w-full card p-8 text-center">
            <h2 className="m-0 mb-4 text-gray-dark text-2xl font-semibold">Something went wrong</h2>
            <ErrorMessage
              error={this.state.error}
              onRetry={this.handleRetry}
              title="Application Error"
            />

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-6 text-left border border-gray-border-light rounded-md p-4 bg-gray-light">
                <summary className="cursor-pointer font-medium mb-2">Error Details (Development Only)</summary>
                <pre className="bg-gray-dark text-gray-100 p-4 rounded-md text-xs leading-relaxed overflow-x-auto my-2">
                  {this.state.error.stack}
                </pre>
                <pre className="bg-gray-dark text-gray-100 p-4 rounded-md text-xs leading-relaxed overflow-x-auto my-2">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
