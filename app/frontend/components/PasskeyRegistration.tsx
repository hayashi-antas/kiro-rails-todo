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
    <div className={`max-w-md mx-auto p-8 card ${className}`}>
      <div>
        <h2 className="m-0 mb-4 text-gray-dark text-2xl font-semibold">Create Your Passkey</h2>
        <p className="m-0 mb-6 text-gray-text leading-relaxed">
          Set up passwordless authentication using your device's built-in security features.
          This could be Face ID, Touch ID, Windows Hello, or a security key.
        </p>

        {error && (
          <div className="error-alert mb-4 relative" role="alert">
            <strong>Registration Failed:</strong> {error}
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
            onClick={handleRegister}
            disabled={isLoading}
            className="btn-primary w-full py-3"
            aria-describedby={error ? "registration-error" : undefined}
          >
            {isLoading ? (
              <>
                <span className="spinner-md" aria-hidden="true"></span>
                Creating Passkey...
              </>
            ) : (
              'Create Passkey'
            )}
          </button>
        </div>

        <div className="border-t border-gray-border-light pt-4">
          <details className="text-gray-text">
            <summary className="cursor-pointer font-medium mb-2 hover:text-gray-dark">What is a Passkey?</summary>
            <p className="m-0 text-sm leading-relaxed">
              Passkeys are a secure, passwordless way to sign in. They use your device's
              built-in authentication (like fingerprint, face recognition, or PIN) and
              are much more secure than traditional passwords.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
