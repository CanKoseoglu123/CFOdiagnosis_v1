import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SlidePreview from './SlidePreview';

// Slide configurations
const SLIDE_CONFIGS = [
  { key: 'cover', title: 'FP&A Maturity Assessment', required: true },
  { key: 'key_messages', title: 'Key Messages', required: false },
  { key: 'objectives_practices', title: 'Objectives & Practices', required: true },
  { key: 'priority_matrix', title: 'Priority Matrix', required: true },
  { key: 'projected_impact', title: 'Projected Impact', required: true },
  { key: 'objective_journey', title: 'Objective Journey', required: true },
  { key: 'committed_actions', title: 'Committed Actions', required: true },
];

/**
 * Carousel for navigating slide previews
 * @param {Object} props
 * @param {string} props.runId - Diagnostic run ID
 * @param {Object} props.customizations - Report customizations
 * @param {boolean} props.isEditable - Whether slides are editable
 * @param {Function} props.onTitleEdit - Title edit handler
 * @param {Function} props.onCustomizationsChange - Customizations change handler
 * @param {Object} props.report - Report data
 * @param {Array} props.actionPlan - Action plan items
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

  // Render placeholder content for each slide type
  const renderSlideContent = (slideKey) => {
    switch (slideKey) {
      case 'cover':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-sm text-slate-500 mb-2">{report?.context?.company?.name || 'Company Name'}</div>
            <div className="text-2xl font-bold text-slate-800 mb-1">{getSlideTitle('cover')}</div>
            <div className="text-slate-600">Executive Report</div>
            <div className="text-sm text-slate-400 mt-4">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        );

      case 'key_messages':
        return (
          <div className="space-y-3">
            <div className="text-slate-500 text-sm">AI-synthesized insights (Coming Soon)</div>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="h-3 bg-slate-200 rounded w-1/2 mb-2" />
                  <div className="h-2 bg-slate-100 rounded w-full mb-1" />
                  <div className="h-2 bg-slate-100 rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
        );

      case 'objectives_practices':
        return (
          <div className="space-y-2">
            <div className="text-sm text-slate-500">Maturity footprint visualization</div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="h-8 bg-slate-100 rounded border border-slate-200" />
              ))}
            </div>
          </div>
        );

      case 'priority_matrix':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="w-48 h-32 border-2 border-slate-300 rounded relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-xs text-slate-400 -mt-4">Impact</div>
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-slate-400 -ml-6">Effort</div>
              <div className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full" />
              <div className="absolute top-4 left-4 w-3 h-3 bg-amber-400 rounded-full" />
              <div className="absolute bottom-4 right-8 w-3 h-3 bg-blue-400 rounded-full" />
            </div>
          </div>
        );

      case 'projected_impact':
        return (
          <div className="space-y-4">
            <div className="flex gap-4 justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-800">{report?.overall_score || 42}%</div>
                <div className="text-xs text-slate-500">Current</div>
              </div>
              <div className="text-2xl text-slate-300">→</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{(report?.overall_score || 42) + 15}%</div>
                <div className="text-xs text-slate-500">Projected</div>
              </div>
            </div>
            <div className="h-20 bg-slate-50 rounded border border-slate-200 flex items-center justify-center">
              <span className="text-slate-400 text-sm">Score projection chart</span>
            </div>
          </div>
        );

      case 'objective_journey':
        return (
          <div className="space-y-2">
            <div className="text-sm text-slate-500">Journey from current to target state</div>
            <div className="space-y-1">
              {['Budget Foundation', 'Financial Controls', 'Variance Analysis', 'Forecasting'].slice(0, 4).map(obj => (
                <div key={obj} className="flex items-center gap-2 text-xs">
                  <div className="w-24 truncate text-slate-600">{obj}</div>
                  <div className="flex-1 h-2 bg-slate-100 rounded">
                    <div className="h-full bg-primary rounded" style={{ width: `${Math.random() * 60 + 20}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'committed_actions':
        return (
          <div className="space-y-2">
            <div className="text-sm text-slate-500">{actionPlan.length || 0} committed actions</div>
            <div className="space-y-1 max-h-32 overflow-hidden">
              {(actionPlan.length > 0 ? actionPlan.slice(0, 4) : [
                { question_id: '1', timeline: '6m', owner: 'CFO' },
                { question_id: '2', timeline: '12m', owner: 'FP&A Director' },
                { question_id: '3', timeline: '6m', owner: 'Controller' }
              ]).map((action, i) => (
                <div key={i} className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded">
                  <div className="flex-1 truncate text-slate-600">Action item {i + 1}</div>
                  <div className="text-slate-400">{action.timeline}</div>
                  <div className="text-slate-400">{action.owner}</div>
                </div>
              ))}
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
