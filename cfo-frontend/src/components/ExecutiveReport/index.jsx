import { useState, useEffect, useCallback } from 'react';
import { Download, Save, Lock, FileText } from 'lucide-react';
import LockedState from './LockedState';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import SlideCarousel from './SlideCarousel';

const API_URL = import.meta.env.VITE_API_URL || 'https://cfodiagnosisv1-production.up.railway.app';

/**
 * Executive Report page - PDF export with preview and editing
 * @param {Object} props
 * @param {string} props.runId - Diagnostic run ID
 * @param {Object} props.report - Report data
 * @param {Array} props.actionPlan - Action plan items
 * @param {boolean} props.isFinalized - Whether run is finalized
 * @param {string} props.companyName - Company name
 */
function ExecutiveReport({
  runId,
  report = {},
  actionPlan = [],
  isFinalized = false,
  companyName = ''
}) {
  const [customizations, setCustomizations] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saved' | 'error'
  const [pdfState, setPdfState] = useState({ status: 'idle', error: null });
  // status: 'idle' | 'generating' | 'ready' | 'error'

  const hasActions = actionPlan && actionPlan.length > 0;

  // Fetch customizations on mount
  useEffect(() => {
    if (runId) {
      fetchCustomizations();
    }
  }, [runId]);

  const fetchCustomizations = async () => {
    try {
      const token = localStorage.getItem('supabase_token');
      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/report-customizations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomizations(data.customizations || getDefaultCustomizations());
      } else {
        setCustomizations(getDefaultCustomizations());
      }
    } catch (err) {
      console.error('Failed to fetch customizations:', err);
      setCustomizations(getDefaultCustomizations());
    }
  };

  const getDefaultCustomizations = () => ({
    slide_titles: {
      cover: 'FP&A Maturity Assessment',
      key_messages: 'Key Messages',
      objectives_practices: 'Objectives & Practices',
      priority_matrix: 'Priority Matrix',
      projected_impact: 'Projected Impact',
      objective_journey: 'Objective Journey',
      committed_actions: 'Committed Actions'
    },
    slide_visibility: {
      key_messages: false
    },
    key_messages: null,
    action_labels: {}
  });

  const saveCustomizations = useCallback(async () => {
    if (!customizations || isFinalized) return;

    setIsSaving(true);
    setSaveStatus(null);

    try {
      const token = localStorage.getItem('supabase_token');
      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/report-customizations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customizations })
      });

      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      console.error('Failed to save customizations:', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [runId, customizations, isFinalized]);

  const handleTitleEdit = (slideKey, newTitle) => {
    if (isFinalized) return;

    setCustomizations(prev => ({
      ...prev,
      slide_titles: {
        ...prev?.slide_titles,
        [slideKey]: newTitle
      }
    }));
  };

  const handleCustomizationsChange = (newCustomizations) => {
    if (isFinalized) return;
    setCustomizations(newCustomizations);
  };

  const handleGeneratePdf = async () => {
    setPdfState({ status: 'generating', error: null });

    try {
      const token = localStorage.getItem('supabase_token');
      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/report/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setPdfState({ status: 'ready', error: null });
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate PDF');
      }
    } catch (err) {
      setPdfState({ status: 'error', error: err.message });
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const token = localStorage.getItem('supabase_token');
      const res = await fetch(`${API_URL}/diagnostic-runs/${runId}/report/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `executive-report-${runId.slice(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to download PDF');
      }
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download PDF. Please try again.');
    }
  };

  // Locked state - no actions yet
  if (!hasActions) {
    return <LockedState runId={runId} />;
  }

  // Loading state - generating PDF
  if (pdfState.status === 'generating') {
    return <LoadingState message="Generating your Executive Report..." />;
  }

  // Error state - PDF generation failed
  if (pdfState.status === 'error') {
    return (
      <ErrorState
        error={pdfState.error}
        onRetry={handleGeneratePdf}
      />
    );
  }

  return (
    <div className="executive-report py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-600" />
            Executive Report
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isFinalized
              ? 'Your report is finalized. Download the PDF below.'
              : 'Preview and customize your boardroom-ready report.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isFinalized ? (
            <>
              <button
                onClick={saveCustomizations}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>

              {saveStatus === 'saved' && (
                <span className="text-sm text-green-600">Saved!</span>
              )}
              {saveStatus === 'error' && (
                <span className="text-sm text-red-600">Failed to save</span>
              )}
            </>
          ) : (
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          )}
        </div>
      </div>

      {/* Finalized notice */}
      {isFinalized && (
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 border border-slate-200 mb-6">
          <Lock className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-600">
            This report was finalized and cannot be edited. Download the PDF to share with stakeholders.
          </span>
        </div>
      )}

      {/* Slide carousel */}
      {customizations && (
        <SlideCarousel
          runId={runId}
          customizations={customizations}
          isEditable={!isFinalized}
          onTitleEdit={handleTitleEdit}
          onCustomizationsChange={handleCustomizationsChange}
          report={report}
          actionPlan={actionPlan}
        />
      )}

      {/* Edit hint */}
      {!isFinalized && (
        <div className="flex items-center gap-2 mt-6 px-4 py-3 bg-blue-50 border border-blue-100 text-sm text-blue-700">
          <span className="font-medium">Tip:</span>
          <span>
            Click "Edit Title" on any slide to customize. Changes are saved as draft until you finalize from the Action Planning tab.
          </span>
        </div>
      )}
    </div>
  );
}

export default ExecutiveReport;
