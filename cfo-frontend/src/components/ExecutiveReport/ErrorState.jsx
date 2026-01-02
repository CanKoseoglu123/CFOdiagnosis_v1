import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Error state when PDF generation fails
 * @param {Object} props
 * @param {string} props.error - Error message
 * @param {Function} props.onRetry - Retry handler
 */
function ErrorState({ error, onRetry }) {
  return (
    <div className="py-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>

      <h2 className="text-xl font-semibold text-slate-800 mb-3">
        PDF Generation Failed
      </h2>

      <p className="text-slate-600 max-w-md mx-auto mb-4">
        {error || 'An unexpected error occurred while generating your report.'}
      </p>

      <p className="text-sm text-slate-500 max-w-md mx-auto mb-8">
        This may be a temporary issue. Please try again.
      </p>

      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>

      <p className="text-sm text-slate-500 mt-6">
        If the problem persists, please{' '}
        <a href="mailto:support@cfo-lens.com" className="text-primary hover:underline">
          contact support
        </a>.
      </p>
    </div>
  );
}

export default ErrorState;
