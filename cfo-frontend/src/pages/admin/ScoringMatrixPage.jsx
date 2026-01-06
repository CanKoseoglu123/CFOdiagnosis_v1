// src/pages/admin/ScoringMatrixPage.jsx
// VS-27b: Admin UI for managing persona scoring matrix

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import useAdmin from '../../hooks/useAdmin';
import {
  Settings, Save, RotateCcw, History, Check, AlertTriangle,
  ChevronDown, ChevronUp, Loader, Shield, ArrowLeft
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Persona display config
const PERSONAS = {
  platform: { name: 'Platform', color: '#3B82F6' },
  growth: { name: 'Growth', color: '#10B981' },
  margin: { name: 'Margin', color: '#F59E0B' },
  governance: { name: 'Governance', color: '#6366F1' },
  stewardship: { name: 'Stewardship', color: '#8B5CF6' },
  resilience: { name: 'Resilience', color: '#EF4444' }
};

const PERSONA_ORDER = ['platform', 'growth', 'margin', 'governance', 'stewardship', 'resilience'];

// Input row component - displays an input's values with score editors
function InputSection({ input, onChange, expanded, onToggleExpand }) {
  const [localInput, setLocalInput] = useState(input);

  useEffect(() => {
    setLocalInput(input);
  }, [input]);

  const handleScoreChange = (valueIndex, personaId, newScore) => {
    const updatedInput = { ...localInput };
    updatedInput.values = [...localInput.values];
    updatedInput.values[valueIndex] = {
      ...localInput.values[valueIndex],
      scores: {
        ...localInput.values[valueIndex].scores,
        [personaId]: parseInt(newScore, 10) || 0
      }
    };
    setLocalInput(updatedInput);
    onChange(updatedInput);
  };

  return (
    <div className="border border-gray-200 rounded mb-2 bg-white">
      <button
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
      >
        <div>
          <span className="font-semibold text-gray-800">{input.label}</span>
          <span className="ml-2 text-xs text-gray-500">({input.id})</span>
        </div>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 min-w-[200px]">Value</th>
                {PERSONA_ORDER.map(pId => (
                  <th
                    key={pId}
                    className="text-center py-2 px-2 min-w-[80px]"
                    style={{ color: PERSONAS[pId].color }}
                  >
                    {PERSONAS[pId].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {localInput.values.filter(v => !v.hidden).map((val, valIdx) => (
                <tr key={val.value} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 pr-4">
                    <span className="font-medium text-gray-700">{val.label}</span>
                    <span className="ml-1 text-xs text-gray-400">({val.value})</span>
                  </td>
                  {PERSONA_ORDER.map(pId => (
                    <td key={pId} className="text-center py-2 px-1">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={val.scores[pId] || 0}
                        onChange={(e) => handleScoreChange(valIdx, pId, e.target.value)}
                        className="w-14 px-2 py-1 border border-gray-300 rounded text-center text-sm
                          focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Version history modal
function HistoryModal({ isOpen, onClose, history, onActivate, currentVersion }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Version History</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <div className="p-6 max-h-96 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No custom versions saved yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((ver) => (
                <div
                  key={ver.id}
                  className={`p-3 rounded border flex items-center justify-between
                    ${ver.active ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                >
                  <div>
                    <div className="font-medium text-gray-800">{ver.version}</div>
                    <div className="text-xs text-gray-500">
                      {ver.created_by} - {new Date(ver.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {ver.active ? (
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Active</span>
                  ) : (
                    <button
                      onClick={() => onActivate(ver.id)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                    >
                      Activate
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ScoringMatrixPage() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const [matrix, setMatrix] = useState(null);
  const [defaultMatrix, setDefaultMatrix] = useState(null);
  const [isDefault, setIsDefault] = useState(true);
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expandedInputs, setExpandedInputs] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);

  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
    };
  }, []);

  // Load matrix
  const loadMatrix = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/admin/scoring-matrix`, { headers });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Admin access required');
        }
        throw new Error('Failed to load scoring matrix');
      }

      const data = await response.json();
      setMatrix(data.matrix || data.defaultMatrix);
      setDefaultMatrix(data.defaultMatrix);
      setIsDefault(data.isDefault);
      setVersion(data.version);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Load history
  const loadHistory = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/admin/scoring-matrix/history`, { headers });
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      loadMatrix();
      loadHistory();
    }
  }, [adminLoading, isAdmin, loadMatrix, loadHistory]);

  // Handle input change
  const handleInputChange = (updatedInput) => {
    setMatrix(prev => ({
      ...prev,
      inputs: prev.inputs.map(inp =>
        inp.id === updatedInput.id ? updatedInput : inp
      )
    }));
    setHasChanges(true);
  };

  // Save matrix
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/admin/scoring-matrix`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ matrix })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      const data = await response.json();
      setVersion(data.version);
      setIsDefault(false);
      setHasChanges(false);
      setSuccess('Matrix saved successfully');
      loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Reset to default
  const handleReset = () => {
    if (defaultMatrix) {
      setMatrix(JSON.parse(JSON.stringify(defaultMatrix)));
      setHasChanges(true);
    }
  };

  // Activate version
  const handleActivate = async (versionId) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/admin/scoring-matrix/${versionId}/activate`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to activate version');
      }

      setShowHistory(false);
      loadMatrix();
      loadHistory();
      setSuccess('Version activated');
    } catch (err) {
      setError(err.message);
    }
  };

  // Toggle input expansion
  const toggleExpand = (inputId) => {
    setExpandedInputs(prev => ({
      ...prev,
      [inputId]: !prev[inputId]
    }));
  };

  // Auth check
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size={40} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield size={48} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:underline"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500">Loading scoring matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-slate-800 text-white py-6">
        <div className="max-w-5xl mx-auto px-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-300 hover:text-white mb-3 text-sm"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <Settings size={24} className="text-blue-400" />
            <div>
              <h1 className="text-xl font-bold">Scoring Matrix Administration</h1>
              <p className="text-sm text-gray-400">
                Configure persona scoring weights for company classification
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Status bar */}
        <div className="bg-white border border-gray-200 rounded p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-500">Status:</span>{' '}
              <span className={isDefault ? 'text-gray-600' : 'text-blue-600 font-medium'}>
                {isDefault ? 'Using Default' : `Custom (${version})`}
              </span>
            </div>
            {hasChanges && (
              <span className="flex items-center gap-1 text-amber-600 text-sm">
                <AlertTriangle size={14} />
                Unsaved changes
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadHistory();
                setShowHistory(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300
                rounded hover:bg-gray-50"
            >
              <History size={14} />
              History
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300
                rounded hover:bg-gray-50"
            >
              <RotateCcw size={14} />
              Reset to Default
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`flex items-center gap-1 px-4 py-1.5 text-sm rounded font-medium
                ${hasChanges && !saving
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded p-3 mb-4 text-green-700 text-sm flex items-center gap-2">
            <Check size={16} />
            {success}
          </div>
        )}

        {/* Persona legend */}
        <div className="bg-white border border-gray-200 rounded p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Persona Reference</h3>
          <div className="flex flex-wrap gap-4">
            {PERSONA_ORDER.map(pId => (
              <div key={pId} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: PERSONAS[pId].color }}
                />
                <span className="text-sm text-gray-600">{PERSONAS[pId].name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Input sections */}
        <div className="space-y-2">
          {matrix?.inputs?.map((input) => (
            <InputSection
              key={input.id}
              input={input}
              onChange={handleInputChange}
              expanded={expandedInputs[input.id] || false}
              onToggleExpand={() => toggleExpand(input.id)}
            />
          ))}
        </div>
      </div>

      {/* History modal */}
      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        onActivate={handleActivate}
        currentVersion={version}
      />
    </div>
  );
}
