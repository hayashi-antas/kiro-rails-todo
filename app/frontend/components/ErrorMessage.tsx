import React, { useState } from 'react'
import { NetworkError, getUserFriendlyErrorMessage } from '../utils/networkError'

interface ErrorMessageProps {
  error: string | Error | NetworkError
  title?: string
  onDismiss?: () => void
  onRetry?: () => void | Promise<void>
  className?: string
  showDetails?: boolean
}

/**
 * Reusable error message component with user-friendly messaging and retry functionality
 */
export function ErrorMessage({ 
  error, 
  title, 
  onDismiss, 
  onRetry, 
  className = '',
  showDetails = false
}: ErrorMessageProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  const errorMessage = getUserFriendlyErrorMessage(error)
  const errorTitle = title || getErrorTitle(error)

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return

    setIsRetrying(true)
    try {
      await onRetry()
    } catch (err) {
      console.error('Retry failed:', err)
    } finally {
      setIsRetrying(false)
    }
  }

  const getErrorIcon = () => {
    if (error instanceof NetworkError) {
      switch (error.code) {
        case 'NETWORK_ERROR':
        case 'TIMEOUT':
          return '🌐'
        case 'AUTH_ERROR':
          return '🔒'
        case 'SERVER_ERROR':
          return '⚠️'
        default:
          return '❌'
      }
    }
    return '❌'
  }

  return (
    <div className={`error-message ${className}`} role="alert">
      <div className="error-message-content">
        <div className="error-message-header">
          <span className="error-message-icon" aria-hidden="true">
            {getErrorIcon()}
          </span>
          <div className="error-message-text">
            <div className="error-message-title">{errorTitle}</div>
            <div className="error-message-description">{errorMessage}</div>
          </div>
        </div>

        {showDetails && error instanceof Error && (
          <details className="error-message-details">
            <summary>Technical Details</summary>
            <pre className="error-message-stack">
              {error.stack || error.message}
            </pre>
          </details>
        )}

        <div className="error-message-actions">
          {onRetry && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className="error-message-button retry-button"
            >
              {isRetrying ? (
                <>
                  <span className="loading-spinner" aria-hidden="true"></span>
                  Retrying...
                </>
              ) : (
                'Try Again'
              )}
            </button>
          )}
          
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="error-message-button dismiss-button"
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .error-message {
          background: #fff5f5;
          border: 1px solid #fed7d7;
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
        }

        .error-message-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .error-message-header {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .error-message-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .error-message-text {
          flex: 1;
          min-width: 0;
        }

        .error-message-title {
          font-weight: 600;
          color: #c53030;
          margin-bottom: 0.25rem;
          font-size: 0.875rem;
        }

        .error-message-description {
          color: #742a2a;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .error-message-details {
          border: 1px solid #fed7d7;
          border-radius: 6px;
          padding: 0.75rem;
          background: #fef5e7;
        }

        .error-message-details summary {
          cursor: pointer;
          font-weight: 500;
          color: #c53030;
          font-size: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .error-message-stack {
          background: #2d3748;
          color: #e2e8f0;
          padding: 0.75rem;
          border-radius: 4px;
          font-size: 0.625rem;
          line-height: 1.4;
          overflow-x: auto;
          margin: 0;
        }

        .error-message-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .error-message-button {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .retry-button {
          background: #1f883d;
          color: white;
          border: 1px solid #1f883d;
        }

        .retry-button:hover:not(:disabled) {
          background: #1a7f37;
          border-color: #1a7f37;
        }

        .retry-button:disabled {
          background: #94a3b8;
          border-color: #94a3b8;
          cursor: not-allowed;
        }

        .dismiss-button {
          background: white;
          color: #656d76;
          border: 1px solid #d1d9e0;
        }

        .dismiss-button:hover {
          background: #f6f8fa;
          border-color: #bbb;
        }

        .loading-spinner {
          width: 0.75rem;
          height: 0.75rem;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

/**
 * Get appropriate title for different error types
 */
function getErrorTitle(error: string | Error | NetworkError): string {
  if (error instanceof NetworkError) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Network Error'
      case 'TIMEOUT':
        return 'Connection Timeout'
      case 'SERVER_ERROR':
        return 'Server Error'
      case 'AUTH_ERROR':
        return 'Authentication Required'
      case 'FORBIDDEN':
        return 'Access Denied'
      case 'NOT_FOUND':
        return 'Not Found'
      default:
        return 'Error'
    }
  }
  
  return 'Error'
}