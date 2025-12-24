import React from 'react'
import { createRoot } from 'react-dom/client'

const App: React.FC = () => {
  return (
    <div>
      <h1>Passkey Todo Board</h1>
      <p>React with TypeScript is working!</p>
    </div>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<App />)
}