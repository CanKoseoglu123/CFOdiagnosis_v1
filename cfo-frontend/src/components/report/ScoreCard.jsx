// src/components/report/ScoreCard.jsx
// Executive summary score display with progress bar

export default function ScoreCard({ score }) {
  return (
    <div className="bg-white border border-slate-300 rounded-sm p-4">
      {/* Header */}
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
        EXECUTION SCORE
      </div>

      {/* Large score - just the number, no circle */}
      <div className="text-5xl font-bold text-navy mb-2">
        {score}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Threshold markers */}
      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
        <span>0%</span>
        <span className="text-slate-400">|50%</span>
        <span className="text-slate-400">|80%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
