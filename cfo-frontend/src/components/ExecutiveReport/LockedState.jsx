import { Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Locked state when no actions have been selected in the War Room
 * @param {Object} props
 * @param {string} props.runId - Diagnostic run ID
 */
function LockedState({ runId }) {
  return (
    <div className="py-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-6">
        <Lock className="w-8 h-8 text-slate-400" />
      </div>

      <h2 className="text-xl font-semibold text-slate-800 mb-3">
        Executive Report Locked
      </h2>

      <p className="text-slate-600 max-w-md mx-auto mb-8">
        Complete your action plan in the War Room before generating your Executive Report.
        Select at least one action item to proceed.
      </p>

      <Link
        to={`/report/${runId}?tab=actions`}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
      >
        Go to Action Planning
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export default LockedState;
