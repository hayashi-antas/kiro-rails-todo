import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface PasskeyAuthenticationProps {
  onSuccess?: () => void;
  className?: string;
}

export function PasskeyAuthentication({ onSuccess, className = '' }: PasskeyAuthenticationProps) {
  const { login, isLoading, error, clearError } = useAuth();

  const handleLogin = async () => {
    clearError();
    await login();
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className={`passkey-authentication ${className}`}>
      <div className="authentication-content">
        <h2>Sign In with Passkey</h2>
        <p>
          Use your device's built-in authentication to securely sign in to your account.
        </p>
        
        {error && (
          <div className="error-message" role="alert">
            <strong>Sign In Failed:</strong> {error}
            <button 
              type="button" 
              className="error-dismiss"
              onClick={clearError}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        <div className="authentication-actions">
          <button
            type="button"
            onClick={handleLogin}
            disabled={isLoading}
            className="login-button primary"
            aria-describedby={error ? "authentication-error" : undefined}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner" aria-hidden="true"></span>
                Signing In...
              </>
            ) : (
              <>
                <span className="passkey-icon" aria-hidden="true">🔐</span>
                Sign In with Passkey
              </>
            )}
          </button>
        </div>

        <div className="authentication-help">
          <details>
            <summary>Having trouble signing in?</summary>
            <div className="help-content">
              <p>Make sure you:</p>
              <ul>
                <li>Have previously created a Passkey for this site</li>
                <li>Are using the same device or have synced Passkeys enabled</li>
                <li>Have your device's authentication method (Face ID, Touch ID, etc.) set up</li>
              </ul>
              <p>
                If you're still having issues, you may need to create a new Passkey.
              </p>
            </div>
          </details>
        </div>
      </div>

      <style jsx>{`
        .passkey-authentication {
          max-width: 400px;
          margin: 0 auto;
          padding: 2rem;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          background: white;
        }

        .authentication-content h2 {
          margin: 0 0 1rem 0;
          color: #24292f;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .authentication-content p {
          margin: 0 0 1.5rem 0;
          color: #656d76;
          line-height: 1.5;
        }

        .error-message {
          background: #fff5f5;
          border: 1px solid #fed7d7;
          border-radius: 6px;
          padding: 0.75rem;
          margin-bottom: 1rem;
          color: #c53030;
          position: relative;
        }

        .error-dismiss {
          position: absolute;
          top: 0.5rem;
          right: 0.75rem;
          background: none;
          border: none;
          font-size: 1.25rem;
          color: #c53030;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .error-dismiss:hover {
          color: #9b2c2c;
        }

        .authentication-actions {
          margin-bottom: 1.5rem;
        }

        .login-button {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #0969da;
          border-radius: 6px;
          background: #0969da;
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: background-color 0.2s;
        }

        .login-button:hover:not(:disabled) {
          background: #0860ca;
        }

        .login-button:disabled {
          background: #94a3b8;
          border-color: #94a3b8;
          cursor: not-allowed;
        }

        .passkey-icon {
          font-size: 1rem;
        }

        .loading-spinner {
          width: 1rem;
          height: 1rem;
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

        .authentication-help {
          border-top: 1px solid #e1e5e9;
          padding-top: 1rem;
        }

        .authentication-help details {
          color: #656d76;
        }

        .authentication-help summary {
          cursor: pointer;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .authentication-help summary:hover {
          color: #24292f;
        }

        .authentication-help details[open] summary {
          margin-bottom: 0.75rem;
        }

        .help-content {
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .help-content p {
          margin: 0 0 0.5rem 0;
        }

        .help-content ul {
          margin: 0.5rem 0;
          padding-left: 1.25rem;
        }

        .help-content li {
          margin-bottom: 0.25rem;
        }
      `}</style>
    </div>
  );
}