// src/App.jsx
// Layer 2: Protected routes added - /assess and /report require login

import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DiagnosticInput from './DiagnosticInput'
import FinanceDiagnosticReport from './FinanceDiagnosticReport'
import PillarReport from './pages/PillarReport'
import CalibrationPage from './pages/CalibrationPage'
import CompanySetupPage from './pages/CompanySetupPage'
import PillarSetupPage from './pages/PillarSetupPage'
import IntroPage from './IntroPage'
import { LogOut } from 'lucide-react'
import { useState } from 'react'

function LoginPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password, fullName)
      }
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ background: '#FFF', borderRadius: 16, padding: 40, width: '100%', maxWidth: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 24 }}>
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </h1>
        
        {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required
              style={{ width: '100%', padding: 12, border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 12, fontSize: 15, boxSizing: 'border-box' }} />
          )}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
            style={{ width: '100%', padding: 12, border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 12, fontSize: 15, boxSizing: 'border-box' }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
            style={{ width: '100%', padding: 12, border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 16, fontSize: 15, boxSizing: 'border-box' }} />
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 14, background: '#4F46E5', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            {loading ? 'Loading...' : (mode === 'login' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#6B7280' }}>
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} 
            style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 600, cursor: 'pointer' }}>
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  )
}

function Home() {
  const { isAuthenticated, user, signOut, loading } = useAuth()

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'system-ui' }}>
      <header style={{ background: '#FFF', borderBottom: '1px solid #E5E7EB', padding: '16px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Finance Diagnostic</div>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ color: '#6B7280', fontSize: 14 }}>{user?.email}</span>
              <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          ) : (
            <Link to="/login" style={{ background: '#4F46E5', color: '#FFF', padding: '8px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>Sign In</Link>
          )}
        </div>
      </header>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 65px)' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Finance Diagnostic Platform</h1>
          <p style={{ color: '#64748B', marginBottom: 40 }}>Assess your finance maturity and get actionable recommendations</p>
          {isAuthenticated ? (
            <Link to="/assess" style={{ background: '#4F46E5', color: '#FFF', padding: '16px 32px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 16 }}>
              Start Assessment
            </Link>
          ) : (
            <Link to="/login" style={{ background: '#4F46E5', color: '#FFF', padding: '16px 32px', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 16 }}>
              Sign In to Start
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          {/* Legacy route redirect */}
          <Route path="/run/:runId/setup" element={<Navigate to="company" replace />} />
          <Route path="/run/:runId/setup/company" element={
            <ProtectedRoute>
              <CompanySetupPage />
            </ProtectedRoute>
          } />
          <Route path="/run/:runId/setup/pillar" element={
            <ProtectedRoute>
              <PillarSetupPage />
            </ProtectedRoute>
          } />
          <Route path="/run/:runId/intro" element={
            <ProtectedRoute>
              <IntroPage />
            </ProtectedRoute>
          } />
          <Route path="/assess" element={
            <ProtectedRoute>
              <DiagnosticInput />
            </ProtectedRoute>
          } />
          <Route path="/run/:runId/calibrate" element={
            <ProtectedRoute>
              <CalibrationPage />
            </ProtectedRoute>
          } />
          <Route path="/report/:runId" element={
            <ProtectedRoute>
              <PillarReport />
            </ProtectedRoute>
          } />
          <Route path="/report-legacy/:runId" element={
            <ProtectedRoute>
              <FinanceDiagnosticReport />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
