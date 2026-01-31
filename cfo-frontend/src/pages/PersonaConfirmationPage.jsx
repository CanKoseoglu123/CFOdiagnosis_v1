// src/pages/PersonaConfirmationPage.jsx
// VS-27c: Persona Confirmation Page - displays classification result, allows persona switch

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AppShell from '../components/AppShell';
import WorkflowSidebar from '../components/WorkflowSidebar';
import SetupHelpModal from '../components/SetupHelpModal';
import {
  Building2,
  TrendingUp,
  Calculator,
  ShieldCheck,
  Landmark,
  LifeBuoy,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  RefreshCw,
  Loader,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import useStepTransition from '../hooks/useStepTransition';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Auth helper - gets current session token
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
  };
};

// Brand colors
const NAVY = '#1e3a5f';
const GOLD = '#c9a050';

// Persona definitions (matches backend personas.json)
const PERSONAS = {
  platform: {
    id: 'platform',
    name: 'Complex Multi-Entity',
    tagline: 'Harmonizing complexity across entities and systems',
    description: 'Organizations managing significant structural complexity — multiple legal entities, diverse ERP landscapes, or active M&A integration. Finance is constantly battling data fragmentation, reconciliation bottlenecks, and consolidation deadlines.',
    corePain: 'Our close takes too long and data doesn\'t reconcile.',
    icon: Building2,
    color: '#3B82F6'
  },
  growth: {
    id: 'growth',
    name: 'High-Growth / Venture',
    tagline: 'Prioritizing speed and capital allocation over rigid control',
    description: 'Fast-scaling organizations where the finance function is racing to keep pace with the business. Investor expectations drive a relentless reporting cadence. Cash runway visibility is existential.',
    corePain: 'Investors want answers faster than we can produce them.',
    icon: TrendingUp,
    color: '#10B981'
  },
  margin: {
    id: 'margin',
    name: 'Margin-Focused Operator',
    tagline: 'Maximizing value through unit economics and efficiency',
    description: 'Businesses where margin discipline is the primary value lever — whether scaling steadily, holding position, or fighting decline. The CFO is a margin guardian, obsessing over cost allocation accuracy and working capital optimization.',
    corePain: 'We don\'t know our true cost-to-serve.',
    icon: Calculator,
    color: '#F59E0B'
  },
  governance: {
    id: 'governance',
    name: 'Governance-First',
    tagline: 'Auditability and compliance as a competitive foundation',
    description: 'Organizations where regulatory requirements, audit scrutiny, or public market obligations make control and documentation non-negotiable. Every process needs a paper trail; every model needs version control.',
    corePain: 'We can\'t afford audit findings or control gaps.',
    icon: ShieldCheck,
    color: '#6366F1'
  },
  stewardship: {
    id: 'stewardship',
    name: 'Long-Term Steward',
    tagline: 'Sustainable value and resilience across generations',
    description: 'Family-owned or closely-held private businesses with a multi-generational perspective. Speed matters less than sustainability. The CFO serves as guardian of long-term value, balancing family dynamics with business discipline.',
    corePain: 'We need to balance family priorities with business discipline.',
    icon: Landmark,
    color: '#8B5CF6'
  },
  resilience: {
    id: 'resilience',
    name: 'Liquidity & Resilience',
    tagline: 'Navigating transition with radical transparency and control',
    description: 'Organizations facing financial pressure — whether from market headwinds, operational challenges, or capital structure strain. Cash is oxygen. The finance function shifts from business partnering to survival mode.',
    corePain: 'Will we make payroll? Are we covenant compliant?',
    icon: LifeBuoy,
    color: '#EF4444'
  }
};

export default function PersonaConfirmationPage() {
  const { runId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateStep } = useStepTransition();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [switching, setSwitching] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const isReviewMode = searchParams.get('review') === 'true';

  // Fetch company profile via diagnostic run
  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);

        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/diagnostic-runs/${runId}/company-profile`, {
          headers
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('No company profile found. Please complete company setup first.');
          }
          throw new Error('Failed to load company profile');
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [runId]);

  // Classification data
  const classification = profile?.classification;
  const primaryPersonaId = classification?.persona;
  const primaryPersona = PERSONAS[primaryPersonaId];
  const scores = classification?.scores || {};
  const confidence = classification?.confidence || 'medium';
  const override = classification?.override;

  // Calculate score gap for alternative persona
  const sortedPersonas = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topScore = sortedPersonas[0]?.[1] || 0;
  const secondScore = sortedPersonas[1]?.[1] || 0;
  const scoreGap = topScore - secondScore;

  const showCloseScoreWarning = scoreGap <= 2;
  const showAlternative = scoreGap <= 10 && sortedPersonas.length > 1;
  const alternativePersonaId = sortedPersonas.find(([personaId]) => personaId !== primaryPersonaId)?.[0];
  const alternativePersona = PERSONAS[alternativePersonaId];

  // Handle persona switch - direct switch without requiring reason
  const handleSwitch = async () => {
    if (!alternativePersonaId || !profile?.id || switching) return;

    setSwitching(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/company-profiles/${profile.id}/persona`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          selected_persona: alternativePersonaId,
          reason: null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to switch persona');
      }

      const updated = await response.json();
      setProfile(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSwitching(false);
    }
  };

  // Handle confirmation
  const handleConfirm = async () => {
    await updateStep(runId, 'pillar_setup');
    const reviewParam = isReviewMode ? '?review=true' : '';
    navigate(`/run/${runId}/setup/pillar${reviewParam}`);
  };

  // Handle back to company setup
  const handleBack = () => {
    navigate(`/run/${runId}/setup/company?review=true`);
  };

  // Render persona card - always shows full description
  const renderPersonaCard = (persona, isPrimary = false, showFullDescription = false) => {
    if (!persona) return null;
    const Icon = persona.icon;

    return (
      <div
        className={`border-2 rounded-lg p-4 sm:p-6 transition-all ${
          isPrimary
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
        style={isPrimary ? { borderColor: persona.color } : {}}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${persona.color}15` }}
          >
            <Icon size={22} style={{ color: persona.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">{persona.name}</h3>
              {isPrimary && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded"
                  style={{ backgroundColor: persona.color, color: 'white' }}
                >
                  Your Persona
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2">{persona.tagline}</p>
            {/* Always show description for detailed understanding */}
            {showFullDescription && (
              <p className="text-sm text-gray-500 mt-2">{persona.description}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading classification results...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(`/run/${runId}/setup/company`)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Back to Company Setup
          </button>
        </div>
      </div>
    );
  }

  const mobileHeader = (
    <div className="flex items-center gap-3 text-white text-sm min-w-0">
      <span className="font-medium truncate">Setup · Persona</span>
      <span className="text-xs text-slate-400 shrink-0">2/3</span>
    </div>
  );

  return (
    <AppShell
      sidebarContent={
        <WorkflowSidebar
          currentStep="setup"
          completedSteps={[]}
          runId={runId}
          isFinalized={false}
        />
      }
      mobileHeaderContent={mobileHeader}
    >
      <div className="min-h-screen bg-gray-50">
        <SetupHelpModal
          title="Your Finance Persona"
          mainText="Based on your inputs, we've classified your organization into one of six finance archetypes. Review the persona below and confirm it feels right. If it doesn't match how you see your organization, select a different one—you know your business best."
          whyTitle="Why this matters:"
          whyText="Your persona determines the maturity targets we'll measure you against. A high-growth company is benchmarked differently than a governance-focused enterprise. Getting this right ensures your recommendations are relevant, not generic."
        />
        {/* Main Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Your Organization's Persona
            </h1>
            <p className="text-gray-600">
              Review the classification below. If it doesn't feel right, you can switch to an alternative.
            </p>
          </div>

          {/* Confidence Warning */}
          {showCloseScoreWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Close Classification</p>
                <p className="text-sm text-amber-700">
                  Your inputs suggest two equally valid personas. Review both options below and choose the one that best represents your organization's priorities.
                </p>
              </div>
            </div>
          )}

          {/* Override Notice */}
          {override && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Persona Override Active</p>
                <p className="text-sm text-blue-700">
                  You switched from {PERSONAS[override.from_persona]?.name || override.from_persona} to {PERSONAS[override.to_persona]?.name || override.to_persona}.
                  {override.reason && ` Reason: "${override.reason}"`}
                </p>
              </div>
            </div>
          )}

          {/* Primary Persona - always show full description when alternatives exist */}
          <div className="mb-6">
            {renderPersonaCard(primaryPersona, true, showAlternative || showDetails)}
          </div>

          {/* Show Details Toggle - only show if no alternatives */}
          {!showAlternative && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 mx-auto"
            >
              {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showDetails ? 'Hide details' : 'Show more details'}
            </button>
          )}

          {/* Alternative Persona (if close scores) - show detailed descriptions for both */}
          {showAlternative && (
            <div className="mb-6">
              <div className="border-t border-gray-200 pt-6 mt-2">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Alternative classification:
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Your inputs also align with this persona. Review both options and select
                  the one that best represents your organization's current priorities and challenges.
                </p>
                <div
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={handleSwitch}
                >
                  {renderPersonaCard(alternativePersona, false, true)}
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Click to switch to this persona
                </p>
              </div>
            </div>
          )}

          {/* Switching indicator */}
          {switching && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-center gap-3">
              <Loader className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm text-blue-700">Switching persona...</span>
            </div>
          )}

          {/* Classification Breakdown */}
          {showDetails && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Classification Breakdown</h3>
              <div className="space-y-2">
                {sortedPersonas.map(([personaId, score]) => {
                  const persona = PERSONAS[personaId];
                  if (!persona) return null;
                  const isTop = personaId === primaryPersonaId;
                  const percentage = topScore > 0 ? Math.round((score / topScore) * 100) : 0;

                  return (
                    <div key={personaId} className="flex items-center gap-2 sm:gap-3">
                      <div className="w-24 sm:w-32 text-xs sm:text-sm text-gray-600 truncate">
                        {persona.name}
                      </div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: isTop ? persona.color : '#9CA3AF'
                          }}
                        />
                      </div>
                      <div className="w-12 sm:w-16 text-right text-xs sm:text-sm text-gray-500">
                        {score} pts
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Confidence: <span className="font-medium capitalize">{confidence}</span>
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-8">
            <button
              onClick={handleBack}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={18} />
              Edit Company Info
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white rounded transition-colors font-medium"
              style={{ backgroundColor: NAVY }}
            >
              Confirm & Continue
              <ArrowRight size={18} />
            </button>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
