// components/AppShell.jsx
// Consistent layout wrapper for all authenticated pages
// Desktop: Fixed 280px sidebar + scrollable main
// Mobile (<1024px): Header with hamburger menu, no sidebar

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut } from 'lucide-react';
import './AppShell.css';

export default function AppShell({
  sidebarContent,    // Page-specific sidebar content
  mobileBottomNav,   // Optional mobile bottom navigation
  children
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  return (
    <div className="app-shell">
      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <span className="logo-text">CFO Diagnostic</span>
        </div>

        <div className="sidebar-content">
          {sidebarContent}
        </div>

        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user">
              <span className="sidebar-user-email">{user.email}</span>
            </div>
          )}
          <button className="logout-button" onClick={handleSignOut}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header - hidden on desktop */}
      <header className="app-mobile-header">
        <div className="mobile-logo">CFO Diagnostic</div>
        <button
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <span>CFO Diagnostic</span>
              <button onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <div className="mobile-menu-content">
              {sidebarContent}
            </div>
            <div className="mobile-menu-footer">
              {user && (
                <div className="sidebar-user">
                  <span className="sidebar-user-email">{user.email}</span>
                </div>
              )}
              <button className="logout-button" onClick={handleSignOut}>
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="app-main">
        {children}
      </main>

      {/* Mobile Bottom Nav - hidden on desktop */}
      {mobileBottomNav && (
        <nav className="app-mobile-nav">
          {mobileBottomNav}
        </nav>
      )}
    </div>
  );
}
