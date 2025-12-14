// src/App.jsx
// Main app with authentication routing

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AuthPage from './pages/AuthPage'
import DiagnosticInput from './DiagnosticInput'
import FinanceDiagnosticReport from './FinanceDiagnosticReport'
import { LogOut, User } from 'lucide-react'

function Home() {
  const { isAuthenticated, profile, signOut } = useAuth()

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#F8FAFC', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <header style={{ 
        background: '#FFF', 
        borderBottom: '1px solid #E5E7EB',
        padding: '16px 20px',
      }}>
        <div style={{ 
          maxWidth: 1100, 
          margin: '0 auto', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#111827' }}>
            Finance Diagnostic
          </div>
          
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280', fontSize: 14 }}>
                <User size={16} />
                {profile?.full_name || profile?.email}
              </div>
              <button
                onClick={signOut}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#FFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 13,
                  color: '#374151',
                  cursor: 'pointer',
                }}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              style={{
                background: '#4F46E5',
                color: '#FFF',
                padding: '8px 20px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 65px)',
      }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
            Finance Diagnostic Platform
          </h1>
          <p style={{ color: '#64748B', marginBottom: 40 }}>
            Assess your finance maturity and get actionable recommendations
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <Link 
                to="/assess" 
                style={{
                  background: '#4F46E5',
                  color: '#FFF',
                  padding: '16px 32px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 16
                }}
              >
                Start Assessment
              </Link>
            ) : (
              <Link 
                to="/login" 
                style={{
                  background: '#4F46E5',
                  color: '#FFF',
                  padding: '16px 32px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 16
                }}
              >
                Sign In to Start
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<AuthPage />} />
      <Route 
        path="/assess" 
        element={
          <ProtectedRoute>
            <DiagnosticInput />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/report/:runId" 
        element={
          <ProtectedRoute>
            <FinanceDiagnosticReport />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
