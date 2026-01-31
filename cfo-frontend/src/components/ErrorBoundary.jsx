import { Component } from 'react'

const BRAND_COLORS = {
  navy: '#1a365d',
  gold: '#c9a050',
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8FAFC',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            maxWidth: 480,
            textAlign: 'center',
            padding: '48px 24px',
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 4,
              background: BRAND_COLORS.navy,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 700,
              margin: '0 auto 24px',
            }}>
              !
            </div>
            <h1 style={{
              color: BRAND_COLORS.navy,
              fontSize: 20,
              fontWeight: 600,
              margin: '0 0 12px',
            }}>
              Something went wrong
            </h1>
            <p style={{
              color: '#64748B',
              fontSize: 14,
              lineHeight: 1.6,
              margin: '0 0 32px',
            }}>
              An unexpected error occurred. Please reload the page to continue.
              If the problem persists, contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: BRAND_COLORS.navy,
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
