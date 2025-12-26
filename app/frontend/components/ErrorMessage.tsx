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
    <div className={`error-alert my-4 ${className}`} role="alert">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0 mt-0.5" aria-hidden="true">
            {getErrorIcon()}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-danger mb-1 text-sm">{errorTitle}</div>
            <div className="text-red-900 text-sm leading-relaxed">{errorMessage}</div>
          </div>
        </div>

        {showDetails && error instanceof Error && (
          <details className="border border-danger-border rounded-md p-3 bg-amber-50">
            <summary className="cursor-pointer font-medium text-danger text-xs mb-2">Technical Details</summary>
            <pre className="bg-slate-700 text-slate-200 p-3 rounded text-[0.625rem] leading-relaxed overflow-x-auto m-0">
              {error.stack || error.message}
            </pre>
          </details>
        )}

        <div className="flex gap-2 justify-end flex-wrap">
          {onRetry && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className="btn-primary py-2 px-4 text-xs"
            >
              {isRetrying ? (
                <>
                  <span className="spinner-sm" aria-hidden="true"></span>
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
              className="btn-outline py-2 px-4 text-xs"
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

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
