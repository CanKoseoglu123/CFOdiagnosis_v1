// Request password reset email
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Brand colors
const NAVY = '#1e3a5f'
const GOLD = '#c9a050'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
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

          <h1 style={{ fontSize: 24, fontWeight: 600, textAlign: 'center', marginBottom: 16, color: NAVY }}>
            Check Your Email
          </h1>
          <p style={{ color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
            We've sent a password reset link to <strong style={{ color: NAVY }}>{email}</strong>.
            Click the link in the email to reset your password.
          </p>
          <div style={{ textAlign: 'center' }}>
            <Link to="/login" style={{ color: NAVY, fontWeight: 500, textDecoration: 'none' }}>
              Back to Login
            </Link>
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
          Reset Password
        </h1>
        <p style={{ color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            style={{ width: '100%', padding: 14, border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 16, fontSize: 15, boxSizing: 'border-box', outline: 'none' }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: 14, background: NAVY, color: '#FFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/login" style={{ fontSize: 14, color: '#64748B', textDecoration: 'none' }}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
