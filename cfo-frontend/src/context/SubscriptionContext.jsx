/**
 * SubscriptionContext
 *
 * Provides subscription state management for the app.
 * Fetches status from /api/billing/subscription and caches it.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { isStripeEnabled, isSubscriptionRequired, FREE_TIER_OBJECTIVES } from '../config/features';

const API_URL = import.meta.env.VITE_API_URL || 'https://cfodiagnosisv1-production.up.railway.app';

const SubscriptionContext = createContext(null);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export function SubscriptionProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch subscription status from backend
  const fetchSubscription = useCallback(async () => {
    // If Stripe not enabled, everyone is "paid"
    if (!isStripeEnabled()) {
      setSubscription({ status: 'not_required', isPaid: true });
      setIsLoading(false);
      return;
    }

    if (!isAuthenticated || !user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setSubscription(null);
        setIsLoading(false);
        return;
      }
      const token = session.access_token;

      const response = await fetch(`${API_URL}/api/billing/subscription`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err.message);
      // Default to free tier on error
      setSubscription({ status: 'error', isPaid: false });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Fetch on mount and auth change
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Derived values
  const isPaid = subscription?.isPaid ?? false;
  const tier = subscription?.source === 'override' ? 'override' : (isPaid ? 'paid' : 'free');

  // Check if subscription is required for full access
  const subscriptionRequired = isSubscriptionRequired();

  // Check if user can access all objectives
  const hasFullAccess = isPaid || !subscriptionRequired;

  // Check if a specific objective is accessible
  const canAccessObjective = useCallback((objectiveId) => {
    if (hasFullAccess) return true;
    return FREE_TIER_OBJECTIVES.includes(objectiveId);
  }, [hasFullAccess]);

  // Get accessible objectives list
  const getAccessibleObjectives = useCallback((allObjectives) => {
    if (hasFullAccess) return allObjectives;
    return allObjectives.filter(obj => FREE_TIER_OBJECTIVES.includes(obj.id || obj.objectiveId));
  }, [hasFullAccess]);

  // Refresh subscription data
  const refreshSubscription = useCallback(async () => {
    await fetchSubscription();
  }, [fetchSubscription]);

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      isLoading,
      error,
      isPaid,
      tier,
      hasFullAccess,
      subscriptionRequired,
      canAccessObjective,
      getAccessibleObjectives,
      refreshSubscription,
      FREE_TIER_OBJECTIVES,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
