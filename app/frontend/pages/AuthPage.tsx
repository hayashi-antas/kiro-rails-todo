import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PasskeyRegistration } from '../components/PasskeyRegistration';
import { PasskeyAuthentication } from '../components/PasskeyAuthentication';
import { useAuth } from '../hooks/useAuth';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to intended page or home when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Don't render anything if authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Passkey ToDo Board</h1>
          <p>Secure, passwordless task management</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`tab-button ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`tab-button ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            Create Account
          </button>
        </div>

        <div className="auth-content">
          {mode === 'login' ? (
            <PasskeyAuthentication />
          ) : (
            <PasskeyRegistration />
          )}
        </div>

        <div className="auth-footer">
          <p>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="link-button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .auth-container {
          width: 100%;
          max-width: 480px;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
          color: white;
        }

        .auth-header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .auth-header p {
          margin: 0;
          opacity: 0.9;
          font-size: 1.1rem;
        }

        .auth-tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 0.25rem;
          margin-bottom: 1.5rem;
        }

        .tab-button {
          flex: 1;
          padding: 0.75rem 1rem;
          border: none;
          background: transparent;
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .tab-button.active {
          background: white;
          color: #667eea;
        }

        .auth-content {
          margin-bottom: 1.5rem;
        }

        .auth-footer {
          text-align: center;
          color: white;
        }

        .auth-footer p {
          margin: 0;
          opacity: 0.9;
        }

        .link-button {
          background: none;
          border: none;
          color: white;
          text-decoration: underline;
          cursor: pointer;
          font-size: inherit;
          padding: 0;
        }

        .link-button:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}