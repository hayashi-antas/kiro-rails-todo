import React from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '../hooks/useAuth'
import { AuthPage } from '../pages/AuthPage'

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthPage />
    </AuthProvider>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<App />)
}