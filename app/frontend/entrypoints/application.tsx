import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../hooks/useAuth'
import { AuthPage } from '../pages/AuthPage'
import { TodoPage } from '../pages/TodoPage'
import { AccountPage } from '../pages/AccountPage'
import { Layout } from '../components/Layout'
import { ProtectedRoute } from '../components/ProtectedRoute'

import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../hooks/useAuth'
import { AuthPage } from '../pages/AuthPage'
import { TodoPage } from '../pages/TodoPage'
import { AccountPage } from '../pages/AccountPage'
import { Layout } from '../components/Layout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { ErrorBoundary } from '../components/ErrorBoundary'

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public route for authentication */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected routes with layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<TodoPage />} />
              <Route path="account" element={<AccountPage />} />
            </Route>
            
            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<App />)
}