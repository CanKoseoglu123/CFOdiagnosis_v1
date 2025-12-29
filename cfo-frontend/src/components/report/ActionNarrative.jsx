/**
 * VS-32d: Action Narrative Component
 *
 * Displays the AI-generated narrative (SCAO format) for the action plan.
 * Situation → Challenge → Approach → Outcome
 */

export function ActionNarrative({ narrative }) {
  if (!narrative) return null;

  const sections = [
    { key: 'situation', label: 'Situation', icon: '1' },
    { key: 'challenge', label: 'Challenge', icon: '2' },
    { key: 'approach', label: 'Approach', icon: '3' },
    { key: 'expected_outcome', label: 'Expected Outcome', icon: '4' },
  ];

  return (
    <div className="bg-slate-50 border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
        Executive Summary
      </h3>

      <div className="space-y-4">
        {sections.map(({ key, label, icon }) => (
          <div key={key} className="flex gap-4">
            <div className="flex-shrink-0 w-6 h-6 bg-primary text-white text-xs font-semibold flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-700">{label}</h4>
              <p className="text-sm text-slate-600 mt-1">{narrative[key]}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActionNarrative;
