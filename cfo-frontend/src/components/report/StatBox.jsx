// src/components/report/StatBox.jsx
// Gartner-style stat box for header quick stats

export default function StatBox({ label, value, sublabel, highlight, alert }) {
  return (
    <div className={`
      px-4 py-2 border rounded-sm text-center min-w-[80px]
      ${highlight
        ? 'bg-blue-50 border-primary/30'
        : 'bg-white border-slate-300'
      }
    `}>
      <div className={`text-2xl font-bold ${alert ? 'text-red-600' : 'text-navy'}`}>
        {value}
      </div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      {sublabel && (
        <div className="text-xs text-slate mt-0.5">{sublabel}</div>
      )}
    </div>
  );
}
