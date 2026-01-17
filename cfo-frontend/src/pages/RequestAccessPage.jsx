// src/pages/RequestAccessPage.jsx
// Contact form for requesting access to the platform

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Botpoison from '@botpoison/browser'
import { CheckCircle, AlertCircle, Loader2, ArrowLeft, ChevronDown } from 'lucide-react'

// Brand colors
const NAVY = '#1e3a5f'
const GOLD = '#c9a050'

// Environment variables
const FORMSPARK_ID = import.meta.env.VITE_FORMSPARK_ID
const BOTPOISON_KEY = import.meta.env.VITE_BOTPOISON_KEY

const TOPIC_OPTIONS = [
  { value: '', label: 'Select a topic...' },
  { value: 'demo', label: 'Demo Request' },
  { value: 'partnership', label: 'Partnership Inquiry' },
  { value: 'general', label: 'General Question' },
  { value: 'other', label: 'Other' }
]

export default function RequestAccessPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: '',
    message: ''
  })
  const [honeypot, setHoneypot] = useState('') // Spam trap
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [botpoison, setBotpoison] = useState(null)

  // Initialize Botpoison
  useEffect(() => {
    if (BOTPOISON_KEY) {
      const bp = new Botpoison({ publicKey: BOTPOISON_KEY })
      setBotpoison(bp)
    }
  }, [])

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    setError(null)
  }

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const isValid = () => {
    const valid = (
      formData.name.trim().length >= 1 &&
      isValidEmail(formData.email) &&
      formData.topic !== '' &&
      formData.message.trim().length >= 1
    )
    return valid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Honeypot check - if filled, silently "succeed" (it's a bot)
    if (honeypot) {
      setIsSubmitted(true)
      return
    }

    if (!isValid()) {
      setError('Please fill in all fields correctly.')
      return
    }

    if (!FORMSPARK_ID) {
      setError('Form configuration error. Please try again later.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Get Botpoison challenge token if available
      let botpoisonToken = null
      if (botpoison) {
        const { solution } = await botpoison.challenge()
        botpoisonToken = solution
      }

      const topicLabel = TOPIC_OPTIONS.find(t => t.value === formData.topic)?.label || formData.topic

      const response = await fetch(`https://submit-form.com/${FORMSPARK_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          topic: topicLabel,
          message: formData.message.trim(),
          _email: {
            subject: `CFO Lens AI Access Request: ${topicLabel}`
          },
          ...(botpoisonToken && { _botpoison: botpoisonToken })
        })
      })

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        throw new Error('Submission failed')
      }
    } catch (err) {
      console.error('Form submission error:', err)
      setError('Unable to submit your request. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Success state
  if (isSubmitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: 20 }}>
        <div style={{ background: '#FFF', borderRadius: 12, padding: 48, width: '100%', maxWidth: 440, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <CheckCircle size={56} color="#22C55E" style={{ margin: '0 auto 20px' }} />
          <h1 style={{ fontSize: 24, fontWeight: 600, color: NAVY, marginBottom: 12 }}>
            Request Received
          </h1>
          <p style={{ color: '#6B7280', lineHeight: 1.6, marginBottom: 32 }}>
            Thank you for your interest in CFO Lens AI. We'll review your request and respond within 1-2 business days.
          </p>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              background: NAVY,
              color: '#FFF',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: 15
            }}
          >
            <ArrowLeft size={18} />
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: 20 }}>
      <div style={{ background: '#FFF', borderRadius: 12, padding: 40, width: '100%', maxWidth: 440, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
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
          Request Access
        </h1>

        <p style={{ textAlign: 'center', color: '#6B7280', marginBottom: 28, fontSize: 14, lineHeight: 1.6 }}>
          CFO Lens AI is currently invite-only. Request access below and we'll be in touch within 1-2 business days.
        </p>

        {error && (
          <div style={{
            background: '#FEE2E2',
            color: '#991B1B',
            padding: 12,
            marginBottom: 20,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Honeypot - hidden from real users */}
          <input
            type="text"
            name="_gotcha"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500, color: '#374151' }}>
              Name <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange('name')}
              required
              style={{
                width: '100%',
                padding: 14,
                border: '1px solid #E5E7EB',
                fontSize: 15,
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500, color: '#374151' }}>
              Email <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange('email')}
              required
              style={{
                width: '100%',
                padding: 14,
                border: '1px solid #E5E7EB',
                fontSize: 15,
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          {/* Topic */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500, color: '#374151' }}>
              Topic <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={formData.topic}
                onChange={handleChange('topic')}
                required
                style={{
                  width: '100%',
                  padding: 14,
                  paddingRight: 40,
                  border: '1px solid #E5E7EB',
                  fontSize: 15,
                  boxSizing: 'border-box',
                  outline: 'none',
                  background: '#FFF',
                  appearance: 'none',
                  cursor: 'pointer',
                  color: formData.topic ? '#1F2937' : '#9CA3AF'
                }}
              >
                {TOPIC_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9CA3AF',
                  pointerEvents: 'none'
                }}
              />
            </div>
          </div>

          {/* Message */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500, color: '#374151' }}>
              Message <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <textarea
              placeholder="Tell us about your interest in CFO Lens AI..."
              value={formData.message}
              onChange={handleChange('message')}
              required
              rows={4}
              style={{
                width: '100%',
                padding: 14,
                border: '1px solid #E5E7EB',
                fontSize: 15,
                boxSizing: 'border-box',
                outline: 'none',
                resize: 'vertical',
                minHeight: 100,
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting || !isValid()}
            style={{
              width: '100%',
              padding: 14,
              background: (isSubmitting || !isValid()) ? '#9CA3AF' : NAVY,
              color: '#FFF',
              border: 'none',
              fontSize: 15,
              fontWeight: 600,
              cursor: (isSubmitting || !isValid()) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </form>

        {/* Footer links */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link
            to="/login"
            style={{ fontSize: 14, color: NAVY, fontWeight: 500, textDecoration: 'none' }}
          >
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
