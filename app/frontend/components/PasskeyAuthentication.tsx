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
    <div className={`max-w-md mx-auto p-8 card ${className}`}>
      <div>
        <h2 className="m-0 mb-4 text-gray-dark text-2xl font-semibold">Sign In with Passkey</h2>
        <p className="m-0 mb-6 text-gray-text leading-relaxed">
          Use your device's built-in authentication to securely sign in to your account.
        </p>

        {error && (
          <div className="error-alert mb-4 relative" role="alert">
            <strong>Sign In Failed:</strong> {error}
            <button
              type="button"
              className="absolute top-2 right-3 bg-transparent border-none text-xl text-danger cursor-pointer p-0 leading-none hover:text-danger-hover"
              onClick={clearError}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        <div className="mb-6">
          <button
            type="button"
            onClick={handleLogin}
            disabled={isLoading}
            className="btn-secondary w-full py-3"
            aria-describedby={error ? "authentication-error" : undefined}
          >
            {isLoading ? (
              <>
                <span className="spinner-md" aria-hidden="true"></span>
                Signing In...
              </>
            ) : (
              <>
                <span className="text-base" aria-hidden="true">🔐</span>
                Sign In with Passkey
              </>
            )}
          </button>
        </div>

        <div className="border-t border-gray-border-light pt-4">
          <details className="text-gray-text">
            <summary className="cursor-pointer font-medium mb-2 hover:text-gray-dark">Having trouble signing in?</summary>
            <div className="text-sm leading-relaxed">
              <p className="m-0 mb-2">Make sure you:</p>
              <ul className="my-2 pl-5">
                <li className="mb-1">Have previously created a Passkey for this site</li>
                <li className="mb-1">Are using the same device or have synced Passkeys enabled</li>
                <li className="mb-1">Have your device's authentication method (Face ID, Touch ID, etc.) set up</li>
              </ul>
              <p className="m-0">
                If you're still having issues, you may need to create a new Passkey.
              </p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
