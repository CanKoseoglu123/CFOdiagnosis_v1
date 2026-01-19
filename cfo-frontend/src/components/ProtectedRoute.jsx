// src/components/ProtectedRoute.jsx
// Layer 2: Simple protected route - redirects to login if not authenticated
// NAV-002: Preserves return URL so users land back where they intended after login

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui'
      }}>
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    // NAV-002: Preserve the attempted URL to redirect back after login
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  }

  return children
}
