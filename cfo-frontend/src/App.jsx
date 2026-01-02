// src/App.jsx
// Layer 2: Protected routes added - /assess and /report require login

import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import DiagnosticInput from './DiagnosticInput'
import FinanceDiagnosticReport from './FinanceDiagnosticReport'
import PillarReport from './pages/PillarReport'
import CalibrationPage from './pages/CalibrationPage'
import CompanySetupPage from './pages/CompanySetupPage'
import PillarSetupPage from './pages/PillarSetupPage'
import IntroPage from './IntroPage'
import SelectPillarPage from './pages/SelectPillarPage'
import AdminPage from './pages/AdminPage'
// VS-30: Theme-based assessment pages
import AssessFoundation from './pages/AssessFoundation'
import AssessFuture from './pages/AssessFuture'
import AssessIntelligence from './pages/AssessIntelligence'
import { useState } from 'react'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  // Brand colors
  const NAVY = '#1e3a5f'
  const GOLD = '#c9a050'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ background: '#FFF', borderRadius: 12, padding: 40, width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            {/* Simple logo icon */}
            <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
              <path d="M8 8 L42 8 L42 42 L8 42 Z" fill="none" stroke={NAVY} strokeWidth="6"/>
              <path d="M58 8 L92 8 L92 42 L58 42 Z" fill="none" stroke={NAVY} strokeWidth="6"/>
              <path d="M8 58 L42 58 L42 92 L8 92 Z" fill="none" stroke={NAVY} strokeWidth="6"/>
              <path d="M58 58 L92 58 L92 92 L58 92 Z" fill="none" stroke={NAVY} strokeWidth="6"/>
              <path d="M50 30 L70 50 L50 70 L30 50 Z" fill={GOLD}/>
            </svg>
            <span style={{ fontWeight: 700, fontSize: 20, color: NAVY }}>CFO LENS <span style={{ fontWeight: 300, color: '#7b8fa3' }}>AI</span></span>
          </Link>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 600, textAlign: 'center', marginBottom: 24, color: NAVY }}>
          Sign In
        </h1>

        {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
            style={{ width: '100%', padding: 14, border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 12, fontSize: 15, boxSizing: 'border-box', outline: 'none' }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
            style={{ width: '100%', padding: 14, border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 20, fontSize: 15, boxSizing: 'border-box', outline: 'none' }} />
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 14, background: NAVY, color: '#FFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Please wait...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#9CA3AF' }}>
          Invite-only access. Contact admin for an account.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/select-pillar" element={
            <ProtectedRoute>
              <SelectPillarPage />
            </ProtectedRoute>
          } />
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
          {/* VS-30: Theme-based assessment routes */}
          <Route path="/assess/foundation" element={
            <ProtectedRoute>
              <AssessFoundation />
            </ProtectedRoute>
          } />
          <Route path="/assess/future" element={
            <ProtectedRoute>
              <AssessFuture />
            </ProtectedRoute>
          } />
          <Route path="/assess/intelligence" element={
            <ProtectedRoute>
              <AssessIntelligence />
            </ProtectedRoute>
          } />
          {/* Legacy single-page assessment (still functional) */}
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
          {/* Admin Dashboard */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
