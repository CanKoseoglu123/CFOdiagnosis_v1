/**
 * SubscriptionsTab
 *
 * Admin component for managing user subscriptions.
 * Features:
 * - List all users with subscription status
 * - Filter by status (All, Active, Free, Override)
 * - Search by email
 * - Grant/revoke free access
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BRAND_COLORS } from '../Logo';
import {
  RefreshCw,
  Search,
  CreditCard,
  Gift,
  X,
  Check,
  ChevronDown,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';

import { API_URL } from '../../lib/constants';

// Status badge component
function StatusBadge({ status, isPaid }) {
  const configs = {
    active: { label: 'Active', className: 'bg-green-100 text-green-700' },
    override: { label: 'Override', className: 'bg-purple-100 text-purple-700' },
    trialing: { label: 'Trial', className: 'bg-blue-100 text-blue-700' },
    past_due: { label: 'Past Due', className: 'bg-amber-100 text-amber-700' },
    canceled: { label: 'Canceled', className: 'bg-red-100 text-red-700' },
    free: { label: 'Free', className: 'bg-slate-100 text-slate-600' },
    none: { label: 'Free', className: 'bg-slate-100 text-slate-600' },
  };

  const config = configs[status] || configs.none;

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${config.className}`}>
      {config.label}
    </span>
  );
}

// Grant access modal
function GrantAccessModal({ user, onClose, onGrant }) {
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onGrant(user.userId, reason, expiresAt || null);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Grant Free Access</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Granting access to <strong>{user.email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g., Beta tester, Partner, Team member"
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-slate-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Expires (optional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-slate-500"
            />
            <p className="text-xs text-slate-500 mt-1">Leave blank for permanent access</p>
          </div>

          {error && (
            <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white rounded disabled:opacity-50"
              style={{ backgroundColor: BRAND_COLORS.navy }}
            >
              {loading ? 'Granting...' : 'Grant Access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SubscriptionsTab() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [emailSearch, setEmailSearch] = useState('');
  const [grantingUser, setGrantingUser] = useState(null);

  // Fetch subscriptions
  async function fetchSubscriptions() {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (emailSearch) params.set('email', emailSearch);

      const res = await fetch(`${API_URL}/api/admin/subscriptions?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (res.status === 403) {
        throw new Error('Admin access denied');
      }

      if (!res.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Grant access
  async function handleGrantAccess(userId, reason, expiresAt) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const res = await fetch(`${API_URL}/api/admin/subscriptions/${userId}/grant`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason, expiresAt })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to grant access');
    }

    // Refresh list
    fetchSubscriptions();
  }

  // Revoke access
  async function handleRevokeAccess(userId) {
    if (!confirm('Revoke free access for this user?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const res = await fetch(`${API_URL}/api/admin/subscriptions/${userId}/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to revoke access');
      }

      fetchSubscriptions();
    } catch (err) {
      console.error('Error revoking access:', err);
      alert(err.message);
    }
  }

  // Fetch on mount and filter change
  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubscriptions();
    }, 300);
    return () => clearTimeout(timer);
  }, [emailSearch]);

  // Format date
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-slate-500"
          >
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="free">Free</option>
            <option value="override">Override</option>
            <option value="active">Active</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        {/* Email search */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={emailSearch}
            onChange={e => setEmailSearch(e.target.value)}
            placeholder="Search by email..."
            className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-slate-500"
          />
        </div>

        {/* Refresh */}
        <button
          onClick={fetchSubscriptions}
          disabled={loading}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="text-sm text-slate-600 mb-4">
        {total} user{total !== 1 ? 's' : ''} found
      </div>

      {/* Table */}
      {loading && users.length === 0 ? (
        <div className="text-center py-12">
          <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
          <p className="text-slate-500">Loading subscriptions...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No users found matching your criteria.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-600">Email</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Plan</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Joined</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.userId} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-900">{user.email || 'No email'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={user.status} isPaid={user.isPaid} />
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {user.subscription?.planType || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    {user.status === 'override' ? (
                      <button
                        onClick={() => handleRevokeAccess(user.userId)}
                        className="text-xs font-medium text-red-600 hover:text-red-800"
                      >
                        Revoke
                      </button>
                    ) : !user.isPaid ? (
                      <button
                        onClick={() => setGrantingUser(user)}
                        className="text-xs font-medium hover:underline"
                        style={{ color: BRAND_COLORS.navy }}
                      >
                        Grant Access
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grant modal */}
      {grantingUser && (
        <GrantAccessModal
          user={grantingUser}
          onClose={() => setGrantingUser(null)}
          onGrant={handleGrantAccess}
        />
      )}
    </div>
  );
}
