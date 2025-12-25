import React, { useState } from 'react';
import { PasskeyRegistration } from '../components/PasskeyRegistration';
import { PasskeyAuthentication } from '../components/PasskeyAuthentication';
import { TodoList } from '../components/TodoList';
import { useAuth } from '../hooks/useAuth';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { isAuthenticated, logout, user } = useAuth();

  // If already authenticated, show the todo list
  if (isAuthenticated) {
    return (
      <div className="app-page">
        <header className="app-header">
          <div className="header-content">
            <h1>Passkey ToDo Board</h1>
            <div className="header-actions">
              <span className="user-info">User #{user?.id}</span>
              <button
                type="button"
                onClick={logout}
                className="logout-button"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>
        
        <main className="app-main">
          <TodoList />
        </main>

        <style jsx>{`
          .app-page {
            min-height: 100vh;
            background: #f6f8fa;
          }

          .app-header {
            background: white;
            border-bottom: 1px solid #e1e5e9;
            padding: 1rem 0;
          }

          .header-content {
            max-width: 600px;
            margin: 0 auto;
            padding: 0 1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .header-content h1 {
            margin: 0;
            color: #24292f;
            font-size: 1.5rem;
            font-weight: 600;
          }

          .header-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .user-info {
            color: #656d76;
            font-size: 0.875rem;
          }

          .logout-button {
            padding: 0.5rem 1rem;
            border: 1px solid #d1d9e0;
            border-radius: 6px;
            background: white;
            color: #24292f;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s;
          }

          .logout-button:hover {
            background: #f6f8fa;
            border-color: #bbb;
          }

          .app-main {
            padding: 2rem 0;
          }
        `}</style>
      </div>
    );
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

        .success-message {
          background: white;
          padding: 3rem 2rem;
          border-radius: 8px;
          text-align: center;
        }

        .success-message h2 {
          margin: 0 0 1rem 0;
          color: #1f883d;
          font-size: 1.5rem;
        }

        .success-message p {
          margin: 0;
          color: #656d76;
        }
      `}</style>
    </div>
  );
}