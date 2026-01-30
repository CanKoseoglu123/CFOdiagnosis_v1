// src/pages/AuthPage.jsx
// Email + password authentication - Sign Up (new users) and Sign In (returning users)

import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, User, Building2, Briefcase, AlertCircle, Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import FeedbackButton from '../components/FeedbackButton'

// Map Supabase auth errors to user-friendly messages
function getFriendlyAuthError(error) {
  const status = error?.status
  const msg = (error?.message || '').toLowerCase()

  if (msg.includes('invalid login credentials')) {
    return 'Incorrect email or password.'
  }
  if (msg.includes('user already registered')) {
    return 'An account with this email already exists. Try signing in.'
  }
  if (msg.includes('password') && msg.includes('at least')) {
    return error.message
  }
  if (status === 429 || msg.includes('rate')) {
    return 'Too many attempts. Please wait a few minutes before trying again.'
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Connection error. Please check your internet and try again.'
  }
  return error?.message || 'An unexpected error occurred. Please try again.'
}

// VS-Security: Validate redirect path to prevent open redirect attacks
function validateRedirectPath(path) {
  if (!path || typeof path !== 'string') return '/dashboard'
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
    return '/dashboard'
  }
  return path
}

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin'

  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const { signUp, signIn, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = validateRedirectPath(location.state?.from?.pathname)

  // If user is already logged in, redirect them
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true })
    }
  }, [user, navigate, from])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      let result

      if (mode === 'signup') {
        result = await signUp(email, password, {
          full_name: fullName,
          company,
          position,
        })
      } else {
        result = await signIn(email, password)
      }

      if (result.error) {
        setError(getFriendlyAuthError(result.error))
      }
      // On success, onAuthStateChange in AuthContext picks up the session
      // and the useEffect above redirects the user
    } catch (err) {
      console.error('Auth error:', err)
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError(null)
    setPassword('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#FFF',
        borderRadius: 2,
        border: '1px solid #E5E7EB',
        padding: 40,
        width: '100%',
        maxWidth: 400,
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'inline-block', marginBottom: 16, textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
                <path d="M8 8 L42 8 L42 42 L8 42 Z" fill="none" stroke="#1a365d" strokeWidth="6"/>
                <path d="M58 8 L92 8 L92 42 L58 42 Z" fill="none" stroke="#1a365d" strokeWidth="6"/>
                <path d="M8 58 L42 58 L42 92 L8 92 Z" fill="none" stroke="#1a365d" strokeWidth="6"/>
                <path d="M58 58 L92 58 L92 92 L58 92 Z" fill="none" stroke="#1a365d" strokeWidth="6"/>
                <path d="M50 30 L70 50 L50 70 L30 50 Z" fill="#c9a050"/>
              </svg>
              <span style={{ fontWeight: 700, fontSize: 18, color: '#1a365d' }}>
                CFO LENS <span style={{ fontWeight: 300, color: '#7b8fa3' }}>AI</span>
              </span>
            </div>
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>
            {mode === 'signin'
              ? 'Sign in to your account'
              : 'Start your finance maturity journey'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 2,
            padding: 12,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <AlertCircle size={18} color="#DC2626" />
            <span style={{ color: '#991B1B', fontSize: 14 }}>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 42px',
                  border: '1px solid #E5E7EB',
                  borderRadius: 2,
                  fontSize: 15,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: mode === 'signup' ? 16 : 24 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 42px',
                  border: '1px solid #E5E7EB',
                  borderRadius: 2,
                  fontSize: 15,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword
                  ? <EyeOff size={18} color="#9CA3AF" />
                  : <Eye size={18} color="#9CA3AF" />}
              </button>
            </div>
          </div>

          {/* Sign Up Only Fields */}
          {mode === 'signup' && (
            <>
              {/* Full Name */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 42px',
                      border: '1px solid #E5E7EB',
                      borderRadius: 2,
                      fontSize: 15,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Company */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  Company
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={18} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Corp"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 42px',
                      border: '1px solid #E5E7EB',
                      borderRadius: 2,
                      fontSize: 15,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Position */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  Position
                </label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={18} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="CFO"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 42px',
                      border: '1px solid #E5E7EB',
                      borderRadius: 2,
                      fontSize: 15,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#9CA3AF' : '#1a365d',
              color: '#FFF',
              border: 'none',
              borderRadius: 2,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <span style={{ color: '#6B7280', fontSize: 14 }}>
            {mode === 'signin' ? "Need an account? " : 'Already have an account? '}
          </span>
          <button
            onClick={toggleMode}
            style={{
              background: 'none',
              border: 'none',
              color: '#1a365d',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          input:focus {
            border-color: #1a365d !important;
            box-shadow: 0 0 0 3px rgba(26, 54, 93, 0.1);
          }
        `}</style>
      </div>

      {/* Feedback Button */}
      <FeedbackButton currentPage="auth" />
    </div>
  )
}
