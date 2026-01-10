// Visitor tracking hook
// Tracks page visits to /track endpoint for analytics

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

// Generate or retrieve a session ID for grouping visits
function getSessionId() {
  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    // Use substring instead of deprecated substr
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
}

// Track a page visit
async function trackVisit(pagePath, referrer = null) {
  try {
    await fetch(`${API_URL}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page_path: pagePath,
        referrer: referrer || document.referrer || null,
        session_id: getSessionId(),
      }),
    });
  } catch (err) {
    // Silently fail - tracking should not affect user experience
    console.debug('Visitor tracking failed:', err);
  }
}

/**
 * Hook to automatically track page visits
 * Tracks on initial load and on route changes
 */
export function useVisitorTracking() {
  const location = useLocation();
  const lastTrackedPath = useRef(null);
  const initialLoad = useRef(true);

  useEffect(() => {
    // Don't track the same path twice in a row
    if (location.pathname === lastTrackedPath.current) {
      return;
    }

    // Track the visit
    const referrer = initialLoad.current ? document.referrer : lastTrackedPath.current;
    trackVisit(location.pathname, referrer);

    lastTrackedPath.current = location.pathname;
    initialLoad.current = false;
  }, [location.pathname]);
}

export default useVisitorTracking;
