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

// Determine if a referrer is external (different origin) or internal
function getReferrerType(referrer) {
  if (!referrer) return null;

  try {
    // Internal paths start with /
    if (referrer.startsWith('/')) {
      return 'internal';
    }

    // Check if it's a full URL
    const referrerUrl = new URL(referrer);
    const currentOrigin = window.location.origin;

    // Same origin = internal, different origin = external
    return referrerUrl.origin === currentOrigin ? 'internal' : 'external';
  } catch {
    // If URL parsing fails, assume external if it looks like a URL
    return referrer.includes('://') ? 'external' : 'internal';
  }
}

// Track a page visit
async function trackVisit(pagePath, queryString, referrer, referrerType) {
  // Skip tracking if API_URL is not configured
  if (!API_URL) {
    console.debug('Visitor tracking disabled: VITE_API_URL not configured');
    return;
  }

  try {
    await fetch(`${API_URL}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page_path: pagePath,
        query_string: queryString || null,
        referrer: referrer || null,
        referrer_type: referrerType,
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
    const fullPath = location.pathname + location.search;

    // Don't track the same full path twice in a row
    if (fullPath === lastTrackedPath.current) {
      return;
    }

    // Determine referrer and type
    let referrer;
    let referrerType;

    if (initialLoad.current) {
      // First page load - use document.referrer (external source)
      referrer = document.referrer || null;
      referrerType = getReferrerType(referrer);
    } else {
      // Internal navigation - use previous path
      referrer = lastTrackedPath.current;
      referrerType = 'internal';
    }

    // Track the visit with separate path and query string
    trackVisit(
      location.pathname,
      location.search || null,
      referrer,
      referrerType
    );

    lastTrackedPath.current = fullPath;
    initialLoad.current = false;
  }, [location.pathname, location.search]);
}

export default useVisitorTracking;
