// src/pages/DashboardPage.jsx
// Dashboard page for managing assessment runs

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Logo, BRAND_COLORS } from '../components/Logo';
import {
  Plus,
  Play,
  Eye,
  Trash2,
  Clock,
  CheckCircle,
  Lock,
  AlertCircle,
  RefreshCw,
  Building2,
  ArrowLeft
} from 'lucide-react';
import { STEP_NAMES, getCompletedSteps } from '../hooks/useStepTransition';

const API_URL = import.meta.env.VITE_API_URL;

// Status badge configurations
const STATUS_BADGES = {
  created: { label: 'Draft', color: 'bg-slate-100 text-slate-600', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Play },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  locked: { label: 'Finalized', color: 'bg-amber-100 text-amber-700', icon: Lock }
};

// Format relative time
function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Get step display text
function getStepDisplay(step) {
  return STEP_NAMES[step] || step;
}

// Delete confirmation modal
function DeleteModal({ run, onConfirm, onCancel }) {
  const companyName = run.company_name || 'Untitled Assessment';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Delete Assessment?</h3>
        </div>

        <p className="text-slate-600 mb-2">
          Are you sure you want to delete the assessment for <strong>{companyName}</strong>?
        </p>
        <p className="text-sm text-slate-500 mb-6">
          This action cannot be undone. All answers, scores, and action plans will be permanently removed.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
          >
            Delete Assessment
          </button>
        </div>
      </div>
    </div>
  );
}

// Single run card
function RunCard({ run, onDelete, onNavigate }) {
  const status = STATUS_BADGES[run.status] || STATUS_BADGES.created;
  const StatusIcon = status.icon;
  const companyName = run.company_name || 'Untitled Assessment';
  const currentStep = run.current_step || 'intro';
  const progressPct = run.assessment_progress_pct || 0;
  const lastActivity = formatRelativeTime(run.last_activity_at || run.created_at);

  // Determine action button
  const isFinalized = run.status === 'locked';
  const isCompleted = run.status === 'completed' || isFinalized;
  const actionLabel = isCompleted ? 'View Report' : 'Resume';
  const ActionIcon = isCompleted ? Eye : Play;

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <h3 className="font-semibold text-slate-900 truncate">{companyName}</h3>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </span>
              <span className="text-slate-400">|</span>
              <span>{lastActivity}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress (only for in-progress runs) */}
      {run.status === 'in_progress' && (
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-slate-600">
              Step: <span className="font-medium">{getStepDisplay(currentStep)}</span>
            </span>
            {currentStep === 'assessment' && (
              <span className="text-slate-500">{progressPct}% complete</span>
            )}
          </div>
          {currentStep === 'assessment' && (
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-3 flex items-center justify-between gap-2">
        <button
          onClick={() => onNavigate(run)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded transition-colors"
          style={{ backgroundColor: BRAND_COLORS.navy }}
        >
          <ActionIcon className="w-4 h-4" />
          {actionLabel}
        </button>

        {/* Delete button (only for non-finalized runs) */}
        {!isFinalized && (
          <button
            onClick={() => onDelete(run)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete assessment"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch runs
  const fetchRuns = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${API_URL}/diagnostic-runs`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch assessments');
      }

      const data = await res.json();
      // Filter out 'created' status runs with no activity (empty shells)
      const actionableRuns = data.filter(r =>
        r.status !== 'created' || r.current_step !== 'intro'
      );
      setRuns(actionableRuns);
    } catch (err) {
      console.error('Error fetching runs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  // Handle navigation to run
  const handleNavigate = (run) => {
    if (run.resume_path) {
      navigate(run.resume_path);
    } else if (run.status === 'completed' || run.status === 'locked') {
      navigate(`/report/${run.id}`);
    } else {
      navigate(`/run/${run.id}/intro`);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const res = await fetch(`${API_URL}/diagnostic-runs/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete');
      }

      // Remove from local state
      setRuns(prev => prev.filter(r => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Error deleting run:', err);
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  // Group runs by status
  const inProgressRuns = runs.filter(r => r.status === 'in_progress' || r.status === 'created');
  const completedRuns = runs.filter(r => r.status === 'completed' || r.status === 'locked');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Logo size="sm" />
            </Link>
            <div className="h-6 w-px bg-slate-200" />
            <h1 className="text-lg font-semibold text-slate-900">My Assessments</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:block">{user?.email}</span>
            <button
              onClick={signOut}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header with actions */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
              <p className="text-slate-600">
                Track and manage your FP&A diagnostic assessments.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchRuns}
                disabled={loading}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <Link
                to="/select-pillar"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded transition-colors"
                style={{ backgroundColor: BRAND_COLORS.navy }}
              >
                <Plus className="w-4 h-4" />
                New Assessment
              </Link>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <p>{error}</p>
              <button
                onClick={fetchRuns}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading && runs.length === 0 && (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-500">Loading your assessments...</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && runs.length === 0 && (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-lg">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No assessments yet</h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                Start your first FP&A diagnostic to understand your finance function's maturity level.
              </p>
              <Link
                to="/select-pillar"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded transition-colors"
                style={{ backgroundColor: BRAND_COLORS.navy }}
              >
                <Plus className="w-4 h-4" />
                Start Your First Assessment
              </Link>
            </div>
          )}

          {/* In Progress Section */}
          {inProgressRuns.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-500" />
                In Progress
                <span className="text-sm font-normal text-slate-500">({inProgressRuns.length})</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inProgressRuns.map(run => (
                  <RunCard
                    key={run.id}
                    run={run}
                    onDelete={setDeleteTarget}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Completed Section */}
          {completedRuns.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Completed
                <span className="text-sm font-normal text-slate-500">({completedRuns.length})</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completedRuns.map(run => (
                  <RunCard
                    key={run.id}
                    run={run}
                    onDelete={setDeleteTarget}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          run={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
