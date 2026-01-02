import { Loader2 } from 'lucide-react';

/**
 * Loading state when PDF is being generated
 * @param {Object} props
 * @param {string} props.message - Loading message to display
 */
function LoadingState({ message = 'Generating your Executive Report...' }) {
  return (
    <div className="py-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>

      <h2 className="text-xl font-semibold text-slate-800 mb-3">
        Generating Report
      </h2>

      <p className="text-slate-600 max-w-md mx-auto">
        {message}
      </p>

      <div className="mt-8 max-w-xs mx-auto">
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
        <p className="text-sm text-slate-500 mt-2">This may take a few seconds...</p>
      </div>
    </div>
  );
}

export default LoadingState;
