// src/components/report/TabButton.jsx
// Gartner-style underlined tab button

export default function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        py-3 text-sm font-medium border-b-2 -mb-px transition-colors
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        ${active
          ? 'border-primary text-primary'
          : 'border-transparent text-slate-500 hover:text-navy'
        }
      `}
    >
      {children}
    </button>
  );
}
