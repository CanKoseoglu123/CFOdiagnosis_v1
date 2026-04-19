import { Link } from 'react-router-dom';
import { Logo, BRAND_COLORS } from './Logo';

export default function Footer({ variant = 'full' }) {
  if (variant === 'minimal') {
    return (
      <footer
        className="py-12 px-6 border-t border-slate-200"
        style={{ backgroundColor: `${BRAND_COLORS.navy}05` }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Logo size="sm" />
            <p className="text-sm text-slate-500">
              Diagnostic intelligence for finance leaders everywhere.
            </p>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} CFO Lens AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className="py-12 px-6 border-t border-slate-200"
      style={{ backgroundColor: `${BRAND_COLORS.navy}05` }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="sm:col-span-2">
            <Logo size="sm" />
            <p className="text-sm text-slate-500 mt-4 max-w-md">
              The diagnosis and action plan phase of a consulting engagement&mdash;compressed
              into hours, at a fraction of the cost.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/platform" className="text-sm text-slate-500 hover:text-slate-700">
                  Platform
                </Link>
              </li>
              <li>
                <Link to="/roadmap" className="text-sm text-slate-500 hover:text-slate-700">
                  Roadmap
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-slate-500 hover:text-slate-700">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-slate-500 hover:text-slate-700">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-slate-500 hover:text-slate-700">
                  About
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-slate-500 hover:text-slate-700">
                  Terms
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-slate-500 hover:text-slate-700">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} CFO Lens AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
