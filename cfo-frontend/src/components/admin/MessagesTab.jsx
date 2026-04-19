/**
 * MessagesTab
 *
 * Admin component for viewing and managing contact form submissions.
 * Features:
 * - List all messages with status
 * - Filter by status (All, New, Read, Archived)
 * - Mark as read, archive, delete
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  RefreshCw,
  Mail,
  MailOpen,
  Archive,
  Trash2,
  Building2,
  ChevronDown,
  AlertCircle,
  Inbox
} from 'lucide-react';

import { API_URL } from '../../lib/constants';

// Status badge component
function StatusBadge({ status }) {
  const configs = {
    new: { label: 'New', className: 'bg-blue-100 text-blue-700', icon: Mail },
    read: { label: 'Read', className: 'bg-slate-100 text-slate-600', icon: MailOpen },
    archived: { label: 'Archived', className: 'bg-gray-100 text-gray-500', icon: Archive },
  };

  const config = configs[status] || configs.new;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// Category badge component
function CategoryBadge({ category }) {
  const configs = {
    general: { label: 'General', className: 'bg-slate-100 text-slate-600' },
    demo: { label: 'Demo', className: 'bg-purple-100 text-purple-700' },
    partnership: { label: 'Partnership', className: 'bg-amber-100 text-amber-700' },
    support: { label: 'Support', className: 'bg-blue-100 text-blue-700' },
  };

  const config = configs[category] || configs.general;

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${config.className}`}>
      {config.label}
    </span>
  );
}

export default function MessagesTab({ getToken, onCountChange }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedMessage, setExpandedMessage] = useState(null);

  // Update parent's count when messages change
  function updateParentCount(msgs) {
    if (onCountChange) {
      const newCount = msgs.filter(m => m.status === 'new').length;
      onCountChange(newCount);
    }
  }

  // Fetch messages
  async function fetchMessages() {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const url = statusFilter === 'all'
        ? `${API_URL}/api/contact/admin/messages`
        : `${API_URL}/api/contact/admin/messages?status=${statusFilter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 403) {
        setError('Admin access denied');
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setMessages(data);
      updateParentCount(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMessages();
  }, [statusFilter]);

  // Update message status
  async function updateStatus(id, newStatus) {
    setActionLoading(id);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/contact/admin/messages/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      // Update local state and parent count
      setMessages(prev => {
        const updated = prev.map(m => m.id === id ? { ...m, status: newStatus } : m);
        updateParentCount(updated);
        return updated;
      });
    } catch (err) {
      alert('Update failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  // Delete message
  async function deleteMessage(id) {
    if (!confirm('Delete this message? This cannot be undone.')) return;

    setActionLoading(id);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/contact/admin/messages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete message');

      // Remove from local state and update parent count
      setMessages(prev => {
        const updated = prev.filter(m => m.id !== id);
        updateParentCount(updated);
        return updated;
      });
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  }

  // Stats
  const newCount = messages.filter(m => m.status === 'new').length;
  const readCount = messages.filter(m => m.status === 'read').length;
  const archivedCount = messages.filter(m => m.status === 'archived').length;

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded p-8 text-center">
        <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
        <p className="text-slate-500">Loading messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <span className="text-red-700">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Messages</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="archived">Archived</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="text-sm text-slate-500">
            {newCount} new, {readCount} read, {archivedCount} archived
          </div>
        </div>

        <button
          onClick={fetchMessages}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Messages table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        {messages.length === 0 ? (
          <div className="p-8 text-center">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No messages found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">From</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 w-1/3">Message</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {messages.map(msg => (
                  <tr
                    key={msg.id}
                    className={`hover:bg-slate-50 ${msg.status === 'new' ? 'bg-blue-50/30' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <StatusBadge status={msg.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{msg.name}</div>
                      <a
                        href={`mailto:${msg.email}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {msg.email}
                      </a>
                      {msg.company_name && (
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          {msg.company_name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <CategoryBadge category={msg.category} />
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className={`text-slate-700 ${expandedMessage === msg.id ? '' : 'line-clamp-2'}`}
                      >
                        {msg.message}
                      </div>
                      {msg.message.length > 100 && (
                        <button
                          onClick={() => setExpandedMessage(expandedMessage === msg.id ? null : msg.id)}
                          className="text-xs text-blue-600 hover:underline mt-1"
                        >
                          {expandedMessage === msg.id ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {formatDate(msg.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {msg.status === 'new' && (
                          <button
                            onClick={() => updateStatus(msg.id, 'read')}
                            disabled={actionLoading === msg.id}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                            title="Mark as read"
                          >
                            <MailOpen className="w-4 h-4" />
                          </button>
                        )}
                        {msg.status !== 'archived' && (
                          <button
                            onClick={() => updateStatus(msg.id, 'archived')}
                            disabled={actionLoading === msg.id}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded disabled:opacity-50"
                            title="Archive"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        {msg.status === 'archived' && (
                          <button
                            onClick={() => updateStatus(msg.id, 'new')}
                            disabled={actionLoading === msg.id}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                            title="Mark as new"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          disabled={actionLoading === msg.id}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
