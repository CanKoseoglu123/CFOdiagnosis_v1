// src/pages/AdminPage.jsx
// Admin dashboard for viewing sessions and feedback

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Users, MessageSquare, Trash2, ExternalLink, RefreshCw,
  AlertTriangle, CheckCircle, Clock, Lock, Shield, Settings,
  FlaskConical, Play, Loader2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sessions');
  const [sessions, setSessions] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Test Runner state
  const [testScenarios, setTestScenarios] = useState([]);
  const [runningTest, setRunningTest] = useState(null);
  const [testResult, setTestResult] = useState(null);

  // Fetch data on mount and tab change
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      if (activeTab === 'sessions') {
        const res = await fetch(`${API_URL}/admin/sessions`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 403) {
          setError('Admin access denied. Your email is not whitelisted.');
          setLoading(false);
          return;
        }

        if (!res.ok) throw new Error('Failed to fetch sessions');
        setSessions(await res.json());
      } else if (activeTab === 'feedback') {
        const res = await fetch(`${API_URL}/admin/feedback`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 403) {
          setError('Admin access denied. Your email is not whitelisted.');
          setLoading(false);
          return;
        }

        if (!res.ok) throw new Error('Failed to fetch feedback');
        setFeedback(await res.json());
      } else if (activeTab === 'test-runner') {
        const res = await fetch(`${API_URL}/admin/test-scenarios`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 403) {
          setError('Admin access denied. Your email is not whitelisted.');
          setLoading(false);
          return;
        }

        if (!res.ok) throw new Error('Failed to fetch test scenarios');
        setTestScenarios(await res.json());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteSession(id) {
    if (!confirm('Delete this session and all related data? This cannot be undone.')) return;

    setDeleting(id);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/admin/sessions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to delete');
      setSessions(sessions.filter(s => s.id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeleting(null);
    }
  }

  async function deleteFeedback(id) {
    if (!confirm('Delete this feedback?')) return;

    setDeleting(id);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/admin/feedback/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to delete');
      setFeedback(feedback.filter(f => f.id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeleting(null);
    }
  }

  async function runTestScenario(scenarioId) {
    setRunningTest(scenarioId);
    setTestResult(null);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/admin/test-run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scenario_id: scenarioId })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create test run');
      }

      const result = await res.json();
      setTestResult(result);
    } catch (err) {
      setTestResult({ error: err.message });
    } finally {
      setRunningTest(null);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  }

  function getStatusBadge(status) {
    const styles = {
      draft: 'bg-slate-100 text-slate-600',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      locked: 'bg-purple-100 text-purple-700',
    };

    const icons = {
      draft: Clock,
      in_progress: RefreshCw,
      completed: CheckCircle,
      locked: Lock,
    };

    const Icon = icons[status] || Clock;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${styles[status] || styles.draft}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  }

  function getFeedbackTypeBadge(type) {
    const styles = {
      bug: 'bg-red-100 text-red-700',
      confusion: 'bg-amber-100 text-amber-700',
      suggestion: 'bg-blue-100 text-blue-700',
      general: 'bg-slate-100 text-slate-600',
    };

    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${styles[type] || styles.general}`}>
        {type}
      </span>
    );
  }

  // Access denied state
  if (error === 'Admin access denied. Your email is not whitelisted.') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-md text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-4">
            Your email is not authorized for admin access. Contact the system administrator.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded hover:bg-slate-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6" />
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-slate-300 hover:text-white"
            >
              ← Back to App
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'sessions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Sessions
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                {sessions.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'feedback'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Feedback
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                {feedback.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('test-runner')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'test-runner'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              Test Runner
            </button>
            <button
              onClick={() => navigate('/admin/scoring-matrix')}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent text-slate-600 hover:text-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Scoring Matrix
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {activeTab === 'sessions' ? 'All Diagnostic Sessions' : activeTab === 'feedback' ? 'User Feedback' : 'Test Scenario Runner'}
          </h2>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error State */}
        {error && error !== 'Admin access denied. Your email is not whitelisted.' && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded p-8 text-center">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
            <p className="text-slate-500">Loading...</p>
          </div>
        )}

        {/* Sessions Table */}
        {!loading && activeTab === 'sessions' && (
          <div className="bg-white border border-slate-200 rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">User</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Company</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Created</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Finalized</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No sessions found
                      </td>
                    </tr>
                  ) : (
                    sessions.map((session) => (
                      <tr key={session.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">
                            {session.user_name || session.user_email}
                          </div>
                          {session.user_name && (
                            <div className="text-xs text-slate-500">{session.user_email}</div>
                          )}
                          <div className="text-xs text-slate-400 font-mono">{session.id.slice(0, 8)}...</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-800">{session.company_name || '-'}</div>
                          <div className="text-xs text-slate-400">{session.industry || '-'}</div>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(session.status)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatDate(session.created_at)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatDate(session.finalized_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {(session.status === 'completed' || session.status === 'locked') && (
                              <a
                                href={`/report/${session.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                title="View Report"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => deleteSession(session.id)}
                              disabled={deleting === session.id}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Feedback Table */}
        {!loading && activeTab === 'feedback' && (
          <div className="bg-white border border-slate-200 rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Page</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 w-1/3">Message</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">User</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feedback.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No feedback yet
                      </td>
                    </tr>
                  ) : (
                    feedback.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          {getFeedbackTypeBadge(item.type)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.page || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-800 line-clamp-2">{item.message}</div>
                          {item.run_id && (
                            <a
                              href={`/report/${item.run_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View related report →
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-800">{item.user_email || 'Anonymous'}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => deleteFeedback(item.id)}
                              disabled={deleting === item.id}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Test Runner */}
        {!loading && activeTab === 'test-runner' && (
          <div className="space-y-4">
            {/* Test Result Banner */}
            {testResult && (
              <div className={`p-4 rounded border ${testResult.error ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                {testResult.error ? (
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">{testResult.error}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <div>
                        <div className="font-medium text-emerald-800">Test run created successfully</div>
                        <div className="text-sm text-emerald-600">
                          {testResult.scenario} - {testResult.questions_answered} questions answered
                        </div>
                      </div>
                    </div>
                    <a
                      href={testResult.report_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded hover:bg-emerald-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Report
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Scenario Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {testScenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="bg-white border border-slate-200 rounded p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-slate-800">{scenario.name}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      scenario.id === 'perfect' ? 'bg-emerald-100 text-emerald-700' :
                      scenario.id === 'failing' ? 'bg-red-100 text-red-700' :
                      scenario.id === 'critical_block' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {scenario.id === 'perfect' ? 'L4' :
                       scenario.id === 'failing' ? 'L1' :
                       scenario.id === 'l2_ceiling' ? 'L2' :
                       scenario.id === 'l3_ceiling' ? 'L3' :
                       scenario.id === 'critical_block' ? 'Blocked' :
                       'Random'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">{scenario.description}</p>
                  <button
                    onClick={() => runTestScenario(scenario.id)}
                    disabled={runningTest !== null}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-white text-sm font-medium rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {runningTest === scenario.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Run Scenario
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {testScenarios.length === 0 && (
              <div className="bg-white border border-slate-200 rounded p-8 text-center">
                <FlaskConical className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No test scenarios available</p>
              </div>
            )}
          </div>
        )}

        {/* Stats Footer */}
        {!loading && (
          <div className="mt-4 text-sm text-slate-500">
            {activeTab === 'sessions' ? (
              <span>
                {sessions.filter(s => s.status === 'completed' || s.status === 'locked').length} completed,
                {' '}{sessions.filter(s => s.status === 'in_progress').length} in progress,
                {' '}{sessions.filter(s => s.status === 'draft').length} drafts
              </span>
            ) : activeTab === 'feedback' ? (
              <span>
                {feedback.filter(f => f.type === 'bug').length} bugs,
                {' '}{feedback.filter(f => f.type === 'suggestion').length} suggestions,
                {' '}{feedback.filter(f => f.type === 'confusion').length} confusion reports
              </span>
            ) : (
              <span>{testScenarios.length} test scenarios available</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
