import React from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-light">
      <header className="bg-white border-b border-gray-border-light py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="no-underline text-inherit">
            <h1 className="m-0 text-gray-dark text-2xl font-semibold">Passkey ToDo Board</h1>
          </Link>
          <nav className="flex items-center gap-8">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-gray-text no-underline font-medium py-2 border-b-2 transition-all duration-200 hover:text-gray-dark ${
                  isActive ? 'text-primary border-primary' : 'border-transparent'
                }`
              }
              end
            >
              Todos
            </NavLink>
            <NavLink
              to="/account"
              className={({ isActive }) =>
                `text-gray-text no-underline font-medium py-2 border-b-2 transition-all duration-200 hover:text-gray-dark ${
                  isActive ? 'text-primary border-primary' : 'border-transparent'
                }`
              }
            >
              Account
            </NavLink>
            <div className="flex items-center gap-4">
              <span className="text-gray-text text-sm">User #{user?.id}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-outline py-2 px-4"
              >
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4">
        <Outlet />
      </main>
    </div>
  );
}
