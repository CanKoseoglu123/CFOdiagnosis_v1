import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth()

  const NAVY = '#1a365d'
  const GOLD = '#c9a050'

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: 40,
        maxWidth: 480
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
              <path d="M8 8 L42 8 L42 42 L8 42 Z" fill="none" stroke={NAVY} strokeWidth="6"/>
              <path d="M58 8 L92 8 L92 42 L58 42 Z" fill="none" stroke={NAVY} strokeWidth="6"/>
              <path d="M8 58 L42 58 L42 92 L8 92 Z" fill="none" stroke={NAVY} strokeWidth="6"/>
              <path d="M58 58 L92 58 L92 92 L58 92 Z" fill="none" stroke={NAVY} strokeWidth="6"/>
              <path d="M50 30 L70 50 L50 70 L30 50 Z" fill={GOLD}/>
            </svg>
            <span style={{ fontWeight: 700, fontSize: 20, color: NAVY }}>
              CFO LENS <span style={{ fontWeight: 300, color: '#7b8fa3' }}>AI</span>
            </span>
          </Link>
        </div>

        {/* 404 Message */}
        <h1 style={{
          fontSize: 72,
          fontWeight: 700,
          color: NAVY,
          margin: '0 0 8px 0',
          lineHeight: 1
        }}>
          404
        </h1>
        <h2 style={{
          fontSize: 24,
          fontWeight: 600,
          color: NAVY,
          margin: '0 0 16px 0'
        }}>
          Page Not Found
        </h2>
        <p style={{
          fontSize: 15,
          color: '#64748B',
          margin: '0 0 32px 0',
          lineHeight: 1.6
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Navigation Options */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/"
            style={{
              padding: '12px 24px',
              background: NAVY,
              color: '#FFF',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Go to Home
          </Link>
          {isAuthenticated && (
            <Link
              to="/dashboard"
              style={{
                padding: '12px 24px',
                background: '#FFF',
                color: NAVY,
                border: `1px solid ${NAVY}`,
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
