import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface PasskeyRegistrationProps {
  onSuccess?: () => void;
  className?: string;
}

export function PasskeyRegistration({ onSuccess, className = '' }: PasskeyRegistrationProps) {
  const { register, isLoading, error, clearError } = useAuth();

  const handleRegister = async () => {
    clearError();
    await register();
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className={`passkey-registration ${className}`}>
      <div className="registration-content">
        <h2>Create Your Passkey</h2>
        <p>
          Set up passwordless authentication using your device's built-in security features.
          This could be Face ID, Touch ID, Windows Hello, or a security key.
        </p>
        
        {error && (
          <div className="error-message" role="alert">
            <strong>Registration Failed:</strong> {error}
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

        <div className="registration-actions">
          <button
            type="button"
            onClick={handleRegister}
            disabled={isLoading}
            className="register-button primary"
            aria-describedby={error ? "registration-error" : undefined}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner" aria-hidden="true"></span>
                Creating Passkey...
              </>
            ) : (
              'Create Passkey'
            )}
          </button>
        </div>

        <div className="registration-help">
          <details>
            <summary>What is a Passkey?</summary>
            <p>
              Passkeys are a secure, passwordless way to sign in. They use your device's 
              built-in authentication (like fingerprint, face recognition, or PIN) and 
              are much more secure than traditional passwords.
            </p>
          </details>
        </div>
      </div>

      <style jsx>{`
        .passkey-registration {
          max-width: 400px;
          margin: 0 auto;
          padding: 2rem;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          background: white;
        }

        .registration-content h2 {
          margin: 0 0 1rem 0;
          color: #24292f;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .registration-content p {
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

        .registration-actions {
          margin-bottom: 1.5rem;
        }

        .register-button {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #1f883d;
          border-radius: 6px;
          background: #1f883d;
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

        .register-button:hover:not(:disabled) {
          background: #1a7f37;
        }

        .register-button:disabled {
          background: #94a3b8;
          border-color: #94a3b8;
          cursor: not-allowed;
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

        .registration-help {
          border-top: 1px solid #e1e5e9;
          padding-top: 1rem;
        }

        .registration-help details {
          color: #656d76;
        }

        .registration-help summary {
          cursor: pointer;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .registration-help summary:hover {
          color: #24292f;
        }

        .registration-help details[open] summary {
          margin-bottom: 0.75rem;
        }

        .registration-help details p {
          margin: 0;
          font-size: 0.875rem;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}