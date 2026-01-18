// Handle password reset callback from email link
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Brand colors
const NAVY = '#1e3a5f'
const GOLD = '#c9a050'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { updatePassword, recoveryMode, user, clearRecoveryMode } = useAuth()
  const navigate = useNavigate()

  // If no recovery session after timeout, redirect to forgot-password
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!recoveryMode && !user) {
        navigate('/forgot-password')
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [recoveryMode, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await updatePassword(password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => clearRecoveryMode()
  }, [clearRecoveryMode])

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ background: '#FFF', borderRadius: 12, padding: 40, width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
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

          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#16A34A" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: NAVY }}>
              Password Updated
            </h1>
            <p style={{ color: '#64748B', lineHeight: 1.6 }}>
              Your password has been reset successfully. Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ background: '#FFF', borderRadius: 12, padding: 40, width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
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

        <h1 style={{ fontSize: 24, fontWeight: 600, textAlign: 'center', marginBottom: 12, color: NAVY }}>
          Set New Password
        </h1>
        <p style={{ color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
          Enter your new password below.
        </p>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            required
            minLength={8}
            style={{ width: '100%', padding: 14, border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 12, fontSize: 15, boxSizing: 'border-box', outline: 'none' }}
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            style={{ width: '100%', padding: 14, border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 20, fontSize: 15, boxSizing: 'border-box', outline: 'none' }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: 14, background: NAVY, color: '#FFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
