// src/components/report/PlanningQuestionnaire.jsx
// VS-32: Collect planning context for capacity calculation
// Used before generating action proposals

import React, { useState } from 'react';
import { Users, Clock, Target, Settings } from 'lucide-react';

const BANDWIDTH_OPTIONS = [
  { value: 'minimal', label: 'Minimal', description: 'Team is at capacity with current responsibilities' },
  { value: 'limited', label: 'Limited', description: 'Some capacity for small improvements' },
  { value: 'moderate', label: 'Moderate', description: 'Reasonable capacity for improvement initiatives' },
  { value: 'significant', label: 'Significant', description: 'Strong capacity for transformation projects' },
];

const TIME_HORIZON_OPTIONS = [
  { value: '6m', label: '6 Months', description: 'Quick wins and urgent improvements' },
  { value: '12m', label: '12 Months', description: 'Balanced near-term and medium-term goals' },
  { value: '24m', label: '24 Months', description: 'Strategic transformation initiatives' },
];

const FOCUS_AREA_OPTIONS = [
  { value: 'efficiency', label: 'Operational Efficiency' },
  { value: 'accuracy', label: 'Data Accuracy & Quality' },
  { value: 'speed', label: 'Faster Close & Reporting' },
  { value: 'insights', label: 'Better Business Insights' },
  { value: 'automation', label: 'Process Automation' },
  { value: 'integration', label: 'System Integration' },
];

export default function PlanningQuestionnaire({ onSubmit, currentLevel = 2 }) {
  const [formData, setFormData] = useState({
    target_level: Math.min(currentLevel + 1, 4),
    bandwidth: 'moderate',
    team_size: 5,
    focus_areas: [],
    time_horizon: '12m',
    constraints: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleFocusToggle = (area) => {
    setFormData(prev => ({
      ...prev,
      focus_areas: prev.focus_areas.includes(area)
        ? prev.focus_areas.filter(a => a !== area)
        : [...prev.focus_areas, area].slice(0, 3) // Max 3 focus areas
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Failed to submit planning context:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-primary-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-primary-100 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-navy-900">Planning Context</h3>
            <p className="text-sm text-slate-500">Help us tailor recommendations to your capacity</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Team Size */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-navy-900 mb-3">
            <Users className="w-4 h-4 text-slate-400" />
            Finance Team Size
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="50"
              value={formData.team_size}
              onChange={(e) => setFormData(prev => ({ ...prev, team_size: parseInt(e.target.value) }))}
              className="flex-1 h-2 bg-slate-200 rounded-sm appearance-none cursor-pointer"
            />
            <span className="w-16 text-center text-sm font-semibold text-primary-700 bg-primary-50 px-3 py-1 rounded-sm">
              {formData.team_size} FTE{formData.team_size > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Bandwidth */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-navy-900 mb-3">
            <Clock className="w-4 h-4 text-slate-400" />
            Available Bandwidth
          </label>
          <div className="grid grid-cols-2 gap-2">
            {BANDWIDTH_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, bandwidth: opt.value }))}
                className={`p-3 text-left rounded-sm border transition-colors ${
                  formData.bandwidth === opt.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-medium text-navy-900">{opt.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{opt.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Time Horizon */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-navy-900 mb-3">
            <Clock className="w-4 h-4 text-slate-400" />
            Planning Horizon
          </label>
          <div className="flex gap-2">
            {TIME_HORIZON_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, time_horizon: opt.value }))}
                className={`flex-1 p-3 text-center rounded-sm border transition-colors ${
                  formData.time_horizon === opt.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-medium text-navy-900">{opt.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{opt.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Focus Areas */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-navy-900 mb-1">
            <Target className="w-4 h-4 text-slate-400" />
            Priority Focus Areas
          </label>
          <p className="text-xs text-slate-500 mb-3">Select up to 3 areas</p>
          <div className="flex flex-wrap gap-2">
            {FOCUS_AREA_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleFocusToggle(opt.value)}
                className={`px-3 py-1.5 text-sm rounded-sm border transition-colors ${
                  formData.focus_areas.includes(opt.value)
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Constraints */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-navy-900 mb-3">
            <Settings className="w-4 h-4 text-slate-400" />
            Known Constraints (Optional)
          </label>
          <textarea
            value={formData.constraints}
            onChange={(e) => setFormData(prev => ({ ...prev, constraints: e.target.value }))}
            placeholder="E.g., budget freeze until Q2, ERP migration in progress, key hire pending..."
            rows={2}
            className="w-full p-3 border border-slate-200 rounded-sm text-sm text-slate-700 placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* Target Level */}
        <div className="p-4 bg-slate-50 rounded-sm">
          <label className="text-sm font-medium text-navy-900 mb-2 block">
            Target Maturity Level
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(level => (
              <button
                key={level}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, target_level: level }))}
                disabled={level < currentLevel}
                className={`flex-1 p-2 rounded-sm border text-sm font-medium transition-colors ${
                  formData.target_level === level
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : level < currentLevel
                    ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                L{level}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Current level: L{currentLevel} | Recommended target: L{Math.min(currentLevel + 1, 4)}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
        <button
          type="submit"
          disabled={submitting || formData.focus_areas.length === 0}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
        >
          {submitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating Plan...
            </>
          ) : (
            'Generate Action Plan'
          )}
        </button>
      </div>
    </form>
  );
}
