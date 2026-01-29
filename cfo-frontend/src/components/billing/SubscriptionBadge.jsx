/**
 * SubscriptionBadge
 *
 * Small badge showing subscription status (Free/Pro).
 * Used in navigation and dashboard.
 */

import React from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { BRAND_COLORS } from '../Logo';

export default function SubscriptionBadge({ showLabel = true, size = 'sm' }) {
  const { isPaid, tier, isLoading, subscriptionRequired } = useSubscription();

  // Don't show badge if subscription is not required (everyone has full access)
  if (!subscriptionRequired) {
    return null;
  }

  if (isLoading) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs bg-slate-100 text-slate-400">
        ...
      </span>
    );
  }

  const isProUser = isPaid || tier === 'override';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  if (isProUser) {
    return (
      <span
        className={`inline-flex items-center rounded-sm font-medium ${sizeClasses[size]}`}
        style={{
          backgroundColor: `${BRAND_COLORS.gold}20`,
          color: BRAND_COLORS.gold,
        }}
      >
        {showLabel ? 'Pro' : ''}
        {!showLabel && (
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L4 7v6c0 5 3.5 9.74 8 11 4.5-1.26 8-6 8-11V7l-8-5zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/>
          </svg>
        )}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-sm font-medium ${sizeClasses[size]} bg-slate-100 text-slate-500`}
    >
      {showLabel ? 'Free' : ''}
    </span>
  );
}
