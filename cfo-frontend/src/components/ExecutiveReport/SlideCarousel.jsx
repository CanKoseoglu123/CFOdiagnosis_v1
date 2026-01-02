import { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Target, TrendingUp } from 'lucide-react';
import SlidePreview from './SlidePreview';

// Slide configurations
const SLIDE_CONFIGS = [
  { key: 'cover', title: 'FP&A Maturity Assessment', required: true },
  { key: 'executive_summary', title: 'Executive Summary', required: true },
  { key: 'maturity_footprint', title: 'Maturity Footprint', required: true },
  { key: 'strengths_gaps', title: 'Strengths & Gaps', required: true },
  { key: 'committed_actions', title: 'Committed Actions', required: true },
  { key: 'projected_impact', title: 'Projected Impact', required: true },
];

// Maturity level names
const MATURITY_LABELS = {
  1: 'Emerging',
  2: 'Defined',
  3: 'Managed',
  4: 'Optimized'
};

// Evidence state colors (handles both naming conventions)
const EVIDENCE_COLORS = {
  full: 'bg-blue-600',
  proven: 'bg-blue-600',      // Alternative name for 'full'
  partial: 'bg-teal-500',
  none: 'bg-slate-300',
  gap: 'bg-slate-300',        // Alternative name for 'none'
  not_proven: 'bg-slate-300'  // Alternative name for 'none'
};

/**
 * Carousel for navigating slide previews with real report data
 */
function SlideCarousel({
  runId,
  customizations = {},
  isEditable = false,
  onTitleEdit,
  onCustomizationsChange,
  report = {},
  actionPlan = []
}) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Filter slides based on visibility settings
  const visibleSlides = SLIDE_CONFIGS.filter(slide => {
    if (slide.required) return true;
    if (slide.key === 'key_messages') {
      return customizations?.slide_visibility?.key_messages === true;
    }
    return true;
  });

  const totalSlides = visibleSlides.length;
  const currentConfig = visibleSlides[currentSlide];

  const goToPrev = () => setCurrentSlide(prev => Math.max(0, prev - 1));
  const goToNext = () => setCurrentSlide(prev => Math.min(totalSlides - 1, prev + 1));

  const getSlideTitle = (slideKey) => {
    return customizations?.slide_titles?.[slideKey] ||
      SLIDE_CONFIGS.find(s => s.key === slideKey)?.title ||
      'Untitled Slide';
  };

  const handleTitleEdit = (slideKey, newTitle) => {
    if (onTitleEdit) {
      onTitleEdit(slideKey, newTitle);
    }
  };

  // Extract report data
  const overallScore = Math.round((report.overall_score || 0) * 100);
  const maturityV2 = report.maturity_v2 || {};
  const actualLevel = maturityV2.actual_level ?? report.maturity?.achieved_level ?? 1;
  const levelName = MATURITY_LABELS[actualLevel] || 'Emerging';
  const companyName = report.context?.company_name || report.context?.company?.name || 'Your Company';
  const industry = report.context?.industry || report.context?.company?.industry;

  // Objectives data
  const objectives = (report.objectives || []).map(obj => ({
    id: obj.id || obj.objective_id,
    name: obj.objective_name || obj.title || obj.name,
    score: Math.round(obj.score || 0)
  }));

  // Maturity footprint data
  const maturityFootprint = report.maturity_footprint || {};
  const footprintLevels = maturityFootprint.levels || [];

  // Critical risks
  const criticalRisks = report.critical_risks || [];

  // Grouped initiatives (strengths/opportunities)
  const initiatives = report.grouped_initiatives || [];

  // Calculate projected score based on action plan
  const calculateProjectedScore = () => {
    if (!actionPlan.length) return overallScore;
    // Each action roughly adds 2-5% improvement (simplified projection)
    const improvement = Math.min(actionPlan.length * 3, 25);
    return Math.min(overallScore + improvement, 100);
  };

  // Render slide content based on slide key
  const renderSlideContent = (slideKey) => {
    switch (slideKey) {
      case 'cover':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-sm text-slate-500 mb-2">{companyName}</div>
            <div className="text-2xl font-bold text-slate-800 mb-1">{getSlideTitle('cover')}</div>
            <div className="text-slate-600">Executive Report</div>
            <div className="flex items-center gap-4 mt-4">
              <div className="px-3 py-1 bg-primary text-white text-sm font-medium">
                Level {actualLevel}: {levelName}
              </div>
              <div className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium">
                Score: {overallScore}%
              </div>
            </div>
            <div className="text-sm text-slate-400 mt-4">
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        );

      case 'executive_summary':
        return (
          <div className="space-y-4">
            {/* Score cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded text-center">
                <div className="text-2xl font-bold text-primary">{overallScore}%</div>
                <div className="text-xs text-slate-500">Overall Score</div>
              </div>
              <div className="p-3 bg-slate-50 rounded text-center">
                <div className="text-2xl font-bold text-primary">L{actualLevel}</div>
                <div className="text-xs text-slate-500">{levelName}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded text-center">
                <div className="text-2xl font-bold text-primary">{actionPlan.length}</div>
                <div className="text-xs text-slate-500">Actions Planned</div>
              </div>
            </div>

            {/* Objectives summary */}
            <div>
              <div className="text-xs font-medium text-slate-600 mb-2">Objective Scores</div>
              <div className="space-y-1">
                {objectives.slice(0, 5).map(obj => (
                  <div key={obj.id} className="flex items-center gap-2 text-xs">
                    <div className="w-28 truncate text-slate-600">{obj.name}</div>
                    <div className="flex-1 h-2 bg-slate-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-primary rounded"
                        style={{ width: `${obj.score}%` }}
                      />
                    </div>
                    <div className="w-8 text-right text-slate-500">{obj.score}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'maturity_footprint':
        return (
          <div className="space-y-3">
            <div className="text-xs text-slate-500 mb-2">
              Practice evidence across maturity levels
            </div>

            {footprintLevels.length > 0 ? (
              <div className="space-y-2">
                {footprintLevels.map(level => {
                  const practices = level.practices || [];
                  const fullCount = practices.filter(p => p.evidence_state === 'full' || p.evidence_state === 'proven').length;
                  const partialCount = practices.filter(p => p.evidence_state === 'partial').length;
                  const noneCount = practices.filter(p => p.evidence_state === 'none' || p.evidence_state === 'gap' || p.evidence_state === 'not_proven').length;

                  return (
                    <div key={level.level} className="flex items-center gap-2 text-xs">
                      <div className="w-16 font-medium text-slate-600">
                        L{level.level} {MATURITY_LABELS[level.level]}
                      </div>
                      <div className="flex-1 flex gap-1">
                        {practices.slice(0, 8).map((p, i) => (
                          <div
                            key={i}
                            className={`h-4 flex-1 rounded ${EVIDENCE_COLORS[p.evidence_state] || EVIDENCE_COLORS.none}`}
                            title={`${p.name}: ${p.evidence_state}`}
                          />
                        ))}
                      </div>
                      <div className="w-24 text-xs text-slate-400 text-right">
                        {fullCount}✓ {partialCount}◐ {noneCount}○
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(level => (
                  <div key={level} className="text-center">
                    <div className="text-xs font-medium text-slate-600 mb-1">
                      L{level} {MATURITY_LABELS[level]}
                    </div>
                    <div className="h-12 bg-slate-100 rounded flex items-center justify-center">
                      <span className="text-slate-400 text-xs">No data</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-600 rounded" /> Proven
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-teal-500 rounded" /> Partial
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-slate-300 rounded" /> Gap
              </div>
            </div>
          </div>
        );

      case 'strengths_gaps':
        return (
          <div className="space-y-4">
            {/* Critical Risks */}
            {criticalRisks.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-xs font-medium text-red-600 mb-2">
                  <AlertTriangle className="w-3 h-3" /> Critical Gaps ({criticalRisks.length})
                </div>
                <div className="space-y-1">
                  {criticalRisks.slice(0, 3).map((risk, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs p-2 bg-red-50 rounded">
                      <div className="w-1 h-full bg-red-400 rounded" />
                      <div className="flex-1 text-slate-700">
                        {risk.expert_action?.title || risk.title || risk.question_text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths (from initiatives with high scores) */}
            <div>
              <div className="flex items-center gap-1 text-xs font-medium text-green-600 mb-2">
                <CheckCircle className="w-3 h-3" /> Key Strengths
              </div>
              <div className="space-y-1">
                {objectives.filter(o => o.score >= 60).slice(0, 3).map((obj, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-2 bg-green-50 rounded">
                    <div className="w-1 h-full bg-green-400 rounded" />
                    <div className="flex-1 text-slate-700">{obj.name}</div>
                    <div className="text-green-600 font-medium">{obj.score}%</div>
                  </div>
                ))}
                {objectives.filter(o => o.score >= 60).length === 0 && (
                  <div className="text-xs text-slate-400 italic">No high-scoring objectives yet</div>
                )}
              </div>
            </div>

            {/* Opportunities (low-scoring objectives) */}
            <div>
              <div className="flex items-center gap-1 text-xs font-medium text-amber-600 mb-2">
                <Target className="w-3 h-3" /> Improvement Areas
              </div>
              <div className="space-y-1">
                {objectives.filter(o => o.score < 40).slice(0, 3).map((obj, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-2 bg-amber-50 rounded">
                    <div className="w-1 h-full bg-amber-400 rounded" />
                    <div className="flex-1 text-slate-700">{obj.name}</div>
                    <div className="text-amber-600 font-medium">{obj.score}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'committed_actions':
        return (
          <div className="space-y-3">
            <div className="text-xs text-slate-500">
              {actionPlan.length} action{actionPlan.length !== 1 ? 's' : ''} committed
            </div>

            {actionPlan.length > 0 ? (
              <>
                {/* Action table header */}
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 pb-1 border-b border-slate-200">
                  <div className="flex-1">Action Item</div>
                  <div className="w-12 text-center">Timeline</div>
                  <div className="w-20 text-right">Owner</div>
                </div>

                {/* Action rows */}
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {actionPlan.map((action, i) => (
                    <div
                      key={action.question_id || i}
                      className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded"
                    >
                      <div className="flex-1 truncate text-slate-700">
                        {customizations?.action_labels?.[action.question_id] ||
                         action.label ||
                         action.question_text ||
                         `Action ${i + 1}`}
                      </div>
                      <div className="w-12 text-center text-slate-500">
                        {action.timeline || '-'}
                      </div>
                      <div className="w-20 text-right text-slate-500 truncate">
                        {action.owner || '-'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Timeline summary */}
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div>{actionPlan.filter(a => a.timeline === '6m').length} in 6 months</div>
                  <div>{actionPlan.filter(a => a.timeline === '12m').length} in 12 months</div>
                  <div>{actionPlan.filter(a => a.timeline === '24m').length} in 24 months</div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                <div className="text-sm">No actions committed yet</div>
                <div className="text-xs mt-1">Go to Action Planning to select actions</div>
              </div>
            )}
          </div>
        );

      case 'projected_impact':
        const projectedScore = calculateProjectedScore();
        const improvement = projectedScore - overallScore;

        return (
          <div className="space-y-4">
            {/* Current vs Projected */}
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-600">{overallScore}%</div>
                <div className="text-xs text-slate-500">Current Score</div>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <TrendingUp className="w-5 h-5" />
                <span className="text-green-600 font-medium">+{improvement}%</span>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{projectedScore}%</div>
                <div className="text-xs text-slate-500">Projected Score</div>
              </div>
            </div>

            {/* Progress visualization */}
            <div className="space-y-2">
              <div className="text-xs text-slate-500">Score Progression</div>
              <div className="h-6 bg-slate-100 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-slate-400 absolute left-0"
                  style={{ width: `${overallScore}%` }}
                />
                <div
                  className="h-full bg-green-500 absolute"
                  style={{ left: `${overallScore}%`, width: `${improvement}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Maturity level projection */}
            <div className="p-3 bg-blue-50 rounded text-center">
              <div className="text-xs text-slate-600">
                Completing {actionPlan.length} action{actionPlan.length !== 1 ? 's' : ''} could help you
                {actualLevel < 4 && projectedScore >= 70 ? (
                  <span className="font-medium text-blue-600"> progress toward Level {actualLevel + 1}</span>
                ) : (
                  <span className="font-medium text-blue-600"> strengthen your Level {actualLevel} foundation</span>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-slate-400">
            Slide content placeholder
          </div>
        );
    }
  };

  return (
    <div className="slide-carousel">
      {/* Navigation header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrev}
            disabled={currentSlide === 0}
            className="p-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNext}
            disabled={currentSlide === totalSlides - 1}
            className="p-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Slide indicators */}
        <div className="flex items-center gap-1">
          {visibleSlides.map((slide, index) => (
            <button
              key={slide.key}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide ? 'bg-primary' : 'bg-slate-300 hover:bg-slate-400'
              }`}
              title={getSlideTitle(slide.key)}
            />
          ))}
        </div>

        <div className="text-sm text-slate-500">
          Slide {currentSlide + 1} of {totalSlides}
        </div>
      </div>

      {/* Current slide preview */}
      <SlidePreview
        slideNumber={currentSlide + 1}
        totalSlides={totalSlides}
        title={getSlideTitle(currentConfig.key)}
        onEditTitle={isEditable ? (newTitle) => handleTitleEdit(currentConfig.key, newTitle) : undefined}
        isEditable={isEditable}
      >
        {renderSlideContent(currentConfig.key)}
      </SlidePreview>

      {/* Thumbnail strip */}
      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
        {visibleSlides.map((slide, index) => (
          <button
            key={slide.key}
            onClick={() => setCurrentSlide(index)}
            className={`flex-shrink-0 w-24 border transition-all ${
              index === currentSlide
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="aspect-video bg-slate-50 p-1 text-[8px] text-slate-500 truncate">
              {getSlideTitle(slide.key)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default SlideCarousel;
