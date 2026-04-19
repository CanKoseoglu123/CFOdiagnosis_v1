import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BRAND_COLORS } from '../components/Logo'

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
      <div className="text-center p-10 max-w-md">
        {/* Logo */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 no-underline">
            <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
              <path d="M8 8 L42 8 L42 42 L8 42 Z" fill="none" stroke={BRAND_COLORS.navy} strokeWidth="6"/>
              <path d="M58 8 L92 8 L92 42 L58 42 Z" fill="none" stroke={BRAND_COLORS.navy} strokeWidth="6"/>
              <path d="M8 58 L42 58 L42 92 L8 92 Z" fill="none" stroke={BRAND_COLORS.navy} strokeWidth="6"/>
              <path d="M58 58 L92 58 L92 92 L58 92 Z" fill="none" stroke={BRAND_COLORS.navy} strokeWidth="6"/>
              <path d="M50 30 L70 50 L50 70 L30 50 Z" fill={BRAND_COLORS.gold}/>
            </svg>
            <span className="font-bold text-xl" style={{ color: BRAND_COLORS.navy }}>
              CFO LENS <span className="font-light text-slate-400">AI</span>
            </span>
          </Link>
        </div>

        <h1 className="text-7xl font-bold m-0 mb-2 leading-none" style={{ color: BRAND_COLORS.navy }}>
          404
        </h1>
        <h2 className="text-2xl font-semibold m-0 mb-4" style={{ color: BRAND_COLORS.navy }}>
          Page Not Found
        </h2>
        <p className="text-sm text-slate-500 m-0 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            to="/"
            className="px-6 py-3 text-sm font-semibold text-white no-underline inline-block"
            style={{ backgroundColor: BRAND_COLORS.navy }}
          >
            Go to Home
          </Link>
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className="px-6 py-3 text-sm font-semibold no-underline inline-block border"
              style={{ color: BRAND_COLORS.navy, borderColor: BRAND_COLORS.navy }}
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
