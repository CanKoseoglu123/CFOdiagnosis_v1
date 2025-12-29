/**
 * VS-32d: Planning Wizard Component
 *
 * 3-step wizard for collecting planning context before AI generates action proposal.
 * Steps: Target Level → Bandwidth (with optional team size) → Priority Focus
 */

import { useState } from 'react';

export function PlanningWizard({ currentLevel, teamSizeKnown, onComplete }) {
  const [step, setStep] = useState(1);
  const [planning, setPlanning] = useState({
    target_maturity_level: null,
    bandwidth: null,
    priority_focus: [],
    team_size_override: null,
  });

  const update = (partial) => {
    setPlanning(prev => ({ ...prev, ...partial }));
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress bar */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div
            key={s}
            className={`flex-1 h-2 ${s <= step ? 'bg-primary' : 'bg-slate-200'}`}
          />
        ))}
      </div>

      {step === 1 && (
        <Step1Target
          currentLevel={currentLevel}
          value={planning.target_maturity_level}
          onChange={(v) => update({ target_maturity_level: v })}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <Step2Bandwidth
          value={planning.bandwidth}
          teamSizeKnown={teamSizeKnown}
          teamSizeOverride={planning.team_size_override}
          onChange={(bandwidth, teamSize) => update({ bandwidth, team_size_override: teamSize })}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <Step3Priority
          value={planning.priority_focus}
          onChange={(v) => update({ priority_focus: v })}
          onBack={() => setStep(2)}
          onComplete={() => onComplete(planning)}
        />
      )}
    </div>
  );
}

function Step1Target({ currentLevel, value, onChange, onNext }) {
  const options = [
    { level: currentLevel, label: `Stay at Level ${currentLevel}`, desc: 'Consolidate and stabilize' },
    { level: currentLevel + 1, label: `Reach Level ${currentLevel + 1}`, desc: 'Next maturity tier' },
    { level: currentLevel + 2, label: `Reach Level ${currentLevel + 2}`, desc: 'Ambitious 2-level jump' },
  ].filter(o => o.level <= 4);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Where do you want to be in 18-24 months?</h3>
      <p className="text-sm text-slate-500 mb-4">You're currently at Level {currentLevel}</p>

      <div className="space-y-3">
        {options.map(opt => (
          <label
            key={opt.level}
            className={`flex items-start gap-3 p-4 border cursor-pointer ${
              value === opt.level ? 'border-primary bg-primary/5' : 'hover:border-slate-400'
            }`}
          >
            <input
              type="radio"
              name="target"
              checked={value === opt.level}
              onChange={() => onChange(opt.level)}
              className="mt-1"
            />
            <div>
              <span className="font-medium">{opt.label}</span>
              <p className="text-sm text-slate-500">{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!value}
        className="mt-6 w-full py-2 bg-primary text-white disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}

function Step2Bandwidth({ value, teamSizeKnown, teamSizeOverride, onChange, onBack, onNext }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">What's your team's bandwidth?</h3>

      {/* Ask for team size if not known */}
      {!teamSizeKnown && (
        <div className="mb-6 p-4 bg-slate-50">
          <label className="block text-sm font-medium mb-2">
            How many people are on your FP&A team?
          </label>
          <select
            value={teamSizeOverride || ''}
            onChange={(e) => onChange(value, e.target.value ? parseInt(e.target.value) : null)}
            className="w-full p-2 border"
          >
            <option value="">Select...</option>
            <option value="1">1-2 people</option>
            <option value="3">3-5 people</option>
            <option value="6">6-10 people</option>
            <option value="11">11+ people</option>
          </select>
        </div>
      )}

      <div className="space-y-3">
        {[
          { id: 'limited', label: 'Limited', desc: 'Day-to-day operations consume most capacity' },
          { id: 'moderate', label: 'Moderate', desc: 'Some room for projects alongside BAU' },
          { id: 'available', label: 'Available', desc: 'Dedicated capacity for transformation' },
        ].map(opt => (
          <label
            key={opt.id}
            className={`flex items-start gap-3 p-4 border cursor-pointer ${
              value === opt.id ? 'border-primary bg-primary/5' : 'hover:border-slate-400'
            }`}
          >
            <input
              type="radio"
              name="bandwidth"
              checked={value === opt.id}
              onChange={() => onChange(opt.id, teamSizeOverride)}
              className="mt-1"
            />
            <div>
              <span className="font-medium">{opt.label}</span>
              <p className="text-sm text-slate-500">{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={onBack} className="flex-1 py-2 border">Back</button>
        <button
          onClick={onNext}
          disabled={!value}
          className="flex-1 py-2 bg-primary text-white disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function Step3Priority({ value, onChange, onBack, onComplete }) {
  const options = [
    { id: 'critical_gaps', label: 'Close critical control gaps', desc: 'Risk reduction' },
    { id: 'forecast_accuracy', label: 'Improve forecast accuracy', desc: 'Decision quality' },
    { id: 'efficiency', label: 'Reduce manual effort', desc: 'Efficiency gains' },
    { id: 'strategic', label: 'Better support strategic decisions', desc: 'Business influence' },
  ];

  const toggle = (id) => {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else if (value.length < 2) {
      onChange([...value, id]);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">What's most important to address first?</h3>
      <p className="text-sm text-slate-500 mb-4">Select up to 2</p>

      <div className="space-y-3">
        {options.map(opt => (
          <label
            key={opt.id}
            className={`flex items-start gap-3 p-4 border cursor-pointer ${
              value.includes(opt.id) ? 'border-primary bg-primary/5' : 'hover:border-slate-400'
            }`}
          >
            <input
              type="checkbox"
              checked={value.includes(opt.id)}
              onChange={() => toggle(opt.id)}
              disabled={!value.includes(opt.id) && value.length >= 2}
              className="mt-1"
            />
            <div>
              <span className="font-medium">{opt.label}</span>
              <p className="text-sm text-slate-500">{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={onBack} className="flex-1 py-2 border">Back</button>
        <button
          onClick={onComplete}
          className="flex-1 py-2 bg-primary text-white"
        >
          Generate Plan
        </button>
      </div>
    </div>
  );
}

export default PlanningWizard;
