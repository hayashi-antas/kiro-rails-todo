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

  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 text-white">
          <h1 className="m-0 mb-2 text-3xl font-bold  text-white!">Passkey ToDo Board</h1>
          <p className="m-0 text-lg text-white!">Secure, passwordless task management</p>
        </div>

        <div className="flex bg-white/10 rounded-lg p-1 mb-6">
          <button
            type="button"
            className={`flex-1 py-3 px-4 border-none bg-transparent text-white text-sm font-medium rounded-md cursor-pointer transition-all duration-200 hover:bg-white/10 ${
              mode === 'login' ? 'bg-white text-indigo-500!' : ''
            }`}
            onClick={() => setMode('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-3 px-4 border-none bg-transparent text-white text-sm font-medium rounded-md cursor-pointer transition-all duration-200 hover:bg-white/10 ${
              mode === 'register' ? 'bg-white text-indigo-500!' : ''
            }`}
            onClick={() => setMode('register')}
          >
            Create Account
          </button>
        </div>

        <div className="mb-6">
          {mode === 'login' ? (
            <PasskeyAuthentication />
          ) : (
            <PasskeyRegistration />
          )}
        </div>

        <div className="text-center text-white">
          <p className="m-0 text-white!">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="bg-transparent border-none text-white underline cursor-pointer p-0 hover:opacity-80"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
