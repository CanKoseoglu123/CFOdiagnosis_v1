// src/hooks/useAdmin.js
// VS-27b: Hook to check if current user has admin privileges

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Cache admin status to avoid repeated API calls
let adminStatusCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * useAdmin - Hook to check admin status
 *
 * @returns {Object} { isAdmin, loading, error, refresh }
 */
export default function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(adminStatusCache);
  const [loading, setLoading] = useState(adminStatusCache === null);
  const [error, setError] = useState(null);

  const checkAdmin = useCallback(async (forceRefresh = false) => {
    // Return cached value if valid and not forcing refresh
    if (!forceRefresh && adminStatusCache !== null && cacheTimestamp) {
      const age = Date.now() - cacheTimestamp;
      if (age < CACHE_TTL) {
        setIsAdmin(adminStatusCache);
        setLoading(false);
        return adminStatusCache;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        // Not logged in - definitely not admin
        adminStatusCache = false;
        cacheTimestamp = Date.now();
        setIsAdmin(false);
        setLoading(false);
        return false;
      }

      // Call admin check endpoint
      const response = await fetch(`${API_BASE_URL}/api/admin/check`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const adminStatus = data.admin === true;
        adminStatusCache = adminStatus;
        cacheTimestamp = Date.now();
        setIsAdmin(adminStatus);
        setLoading(false);
        return adminStatus;
      } else if (response.status === 403 || response.status === 401) {
        // Not admin or not authenticated
        adminStatusCache = false;
        cacheTimestamp = Date.now();
        setIsAdmin(false);
        setLoading(false);
        return false;
      } else {
        throw new Error(`Admin check failed: ${response.status}`);
      }
    } catch (err) {
      console.error('[useAdmin] Error checking admin status:', err);
      setError(err.message);
      setIsAdmin(false);
      setLoading(false);
      return false;
    }
  }, []);

  // Check admin status on mount
  useEffect(() => {
    checkAdmin();
  }, [checkAdmin]);

  // Listen for auth state changes to refresh admin status
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // Clear cache and re-check
        adminStatusCache = null;
        cacheTimestamp = null;
        checkAdmin(true);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [checkAdmin]);

  // Refresh function to force re-check
  const refresh = useCallback(() => {
    return checkAdmin(true);
  }, [checkAdmin]);

  return {
    isAdmin: isAdmin || false,
    loading,
    error,
    refresh
  };
}

/**
 * Clear the admin status cache (useful for testing or logout)
 */
export function clearAdminCache() {
  adminStatusCache = null;
  cacheTimestamp = null;
}
