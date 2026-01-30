import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'

// Handle stale chunk errors after deployments (old hashed files removed by Vercel).
// Vite emits this event when a dynamic import fails to load.
window.addEventListener('vite:preloadError', () => {
  const reloaded = sessionStorage.getItem('chunk-reload')
  if (!reloaded) {
    sessionStorage.setItem('chunk-reload', '1')
    window.location.reload()
  }
})
sessionStorage.removeItem('chunk-reload')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)
