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
    <div className="app-layout">
      <header className="app-header">
        <div className="header-content">
          <Link to="/" className="app-title">
            <h1>Passkey ToDo Board</h1>
          </Link>
          <nav className="header-nav">
            <NavLink 
              to="/" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end
            >
              Todos
            </NavLink>
            <NavLink 
              to="/account" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Account
            </NavLink>
            <div className="header-actions">
              <span className="user-info">User #{user?.id}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="logout-button"
              >
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      </header>
      
      <main className="app-main">
        <Outlet />
      </main>

      <style jsx>{`
        .app-layout {
          min-height: 100vh;
          background: #f6f8fa;
        }

        .app-header {
          background: white;
          border-bottom: 1px solid #e1e5e9;
          padding: 1rem 0;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .app-title {
          text-decoration: none;
          color: inherit;
        }

        .app-title h1 {
          margin: 0;
          color: #24292f;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .header-nav {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .nav-link {
          color: #656d76;
          text-decoration: none;
          font-weight: 500;
          padding: 0.5rem 0;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .nav-link:hover {
          color: #24292f;
        }

        .nav-link.active {
          color: #0969da;
          border-bottom-color: #0969da;
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
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
      `}</style>
    </div>
  );
}