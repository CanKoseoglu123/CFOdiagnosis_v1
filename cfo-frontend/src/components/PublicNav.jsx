// src/components/PublicNav.jsx
// Shared navigation for public pages (Landing, Platform, Blog, About, Pricing)
// Desktop: horizontal links + auth buttons
// Mobile (<640px): hamburger menu with slide-in drawer

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo, BRAND_COLORS } from './Logo';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { to: '/platform', label: 'Platform' },
  { to: '/roadmap', label: 'Roadmap' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
  { to: '/pricing', label: 'Pricing' },
];

/**
 * @param {Object} props
 * @param {string} [props.ctaLabel] - Label for the unauthenticated CTA button (default: "Get Started")
 * @param {string} [props.ctaTo] - Link target for the unauthenticated CTA (default: "/login")
 * @param {Object} [props.ctaState] - React Router state for the CTA link
 * @param {string} [props.authLabel] - Label for the authenticated primary button (default: "Dashboard")
 * @param {string} [props.authTo] - Link target for the authenticated primary button (default: "/")
 */
export default function PublicNav({
  ctaLabel = 'Get Started',
  ctaTo = '/login',
  ctaState,
  authLabel = 'Dashboard',
  authTo = '/',
}) {
  const { isAuthenticated, user, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Determine active link by matching pathname prefix
  function isActive(to) {
    if (to === '/blog') {
      return location.pathname === '/blog' || location.pathname.startsWith('/blog/');
    }
    return location.pathname === to;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left side: Logo + Nav Links */}
        <div className="flex items-center">
          <Link to="/">
            <Logo size="sm" />
          </Link>

          {/* Divider - desktop only */}
          <div className="hidden sm:block h-6 w-px bg-slate-200 mx-6" />

          {/* Nav Links - desktop only */}
          <div className="hidden sm:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(link.to) ? '' : 'text-slate-600 hover:text-slate-900'
                }`}
                style={isActive(link.to) ? { color: BRAND_COLORS.navy } : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right side: Auth + Hamburger */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-sm font-medium text-slate-700">Welcome back</span>
                <span className="text-xs text-slate-500">{user?.email}</span>
              </div>
              <Link
                to={authTo}
                className="px-4 py-2 text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: BRAND_COLORS.navy }}
              >
                {authLabel}
              </Link>
              <button
                onClick={signOut}
                className="hidden sm:block px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:block px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to={ctaTo}
                state={ctaState}
                className="hidden sm:block px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ backgroundColor: BRAND_COLORS.navy }}
              >
                {ctaLabel}
              </Link>
            </>
          )}

          {/* Hamburger - mobile only */}
          <button
            onClick={() => setMobileOpen(true)}
            className="sm:hidden p-2 text-slate-600 hover:text-slate-900"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 sm:hidden"
          onClick={() => setMobileOpen(false)}
        >
          {/* Drawer panel */}
          <div
            className="absolute top-0 right-0 w-64 h-full bg-white border-l border-slate-200"
            style={{ animation: 'publicNavSlideIn 0.2s ease-out' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="flex items-center justify-between px-4 h-16 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-700">Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-700"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links */}
            <div className="py-2">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block px-4 py-3 text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'bg-slate-50'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  style={isActive(link.to) ? { color: BRAND_COLORS.navy } : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth section */}
            <div className="border-t border-slate-200 px-4 py-4 space-y-3">
              {isAuthenticated ? (
                <>
                  <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                  <Link
                    to={authTo}
                    className="block w-full text-center px-4 py-2 text-sm font-medium text-white transition-colors"
                    style={{ backgroundColor: BRAND_COLORS.navy }}
                  >
                    {authLabel}
                  </Link>
                  <button
                    onClick={signOut}
                    className="block w-full text-center px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block w-full text-center px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to={ctaTo}
                    state={ctaState}
                    className="block w-full text-center px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: BRAND_COLORS.navy }}
                  >
                    {ctaLabel}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inline keyframe for slide animation */}
      <style>{`
        @keyframes publicNavSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </nav>
  );
}
