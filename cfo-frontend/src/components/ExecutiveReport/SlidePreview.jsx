import { Edit2 } from 'lucide-react';

/**
 * Wrapper for individual slide preview with 16:9 aspect ratio
 * @param {Object} props
 * @param {number} props.slideNumber - Current slide number
 * @param {number} props.totalSlides - Total slides in deck
 * @param {string} props.title - Slide title
 * @param {Function} [props.onEditTitle] - Title edit handler (if editable)
 * @param {boolean} props.isEditable - Whether slide is editable
 * @param {React.ReactNode} props.children - Slide content
 */
function SlidePreview({
  slideNumber,
  totalSlides,
  title,
  onEditTitle,
  isEditable,
  children
}) {
  return (
    <div className="slide-preview border border-slate-200 bg-white shadow-sm">
      {/* Slide header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50">
        <span className="text-xs text-slate-500 font-medium">
          {slideNumber} / {totalSlides}
        </span>
        {isEditable && onEditTitle && (
          <button
            onClick={() => {
              const newTitle = prompt('Edit slide title:', title);
              if (newTitle && newTitle !== title) {
                onEditTitle(newTitle);
              }
            }}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            Edit Title
          </button>
        )}
      </div>

      {/* Slide content area - 16:9 aspect ratio */}
      <div className="relative" style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 p-6 overflow-hidden">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{title}</h2>
          <div className="h-[calc(100%-2.5rem)]">
            {children}
          </div>
        </div>
      </div>

      {/* Slide footer preview */}
      <div className="px-4 py-1.5 border-t border-slate-100 bg-slate-50">
        <span className="text-[10px] text-slate-400">
          Generated: {new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC
        </span>
      </div>
    </div>
  );
}

export default SlidePreview;
