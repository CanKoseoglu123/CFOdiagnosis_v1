// src/blog/components/BlogCard.jsx
// Blog post card - Text-focused design (Innovid-inspired, no images)

import { Link } from 'react-router-dom';
import { formatDate } from '../utils/blogUtils';
import { BRAND_COLORS } from '../../components/Logo';

export default function BlogCard({ post }) {
  const { slug, title, excerpt, date, readingTime, tags, series } = post;

  // Get up to 3 labels for display at bottom
  const labels = [];
  if (series) labels.push(series);
  if (tags?.length) {
    const remainingSlots = 3 - labels.length;
    labels.push(...tags.slice(0, remainingSlots));
  }
  const displayLabels = labels.slice(0, 3);

  return (
    <Link
      to={`/blog/${slug}`}
      className="group flex flex-col bg-white p-6 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all h-full"
    >
      {/* Title */}
      <h3
        className="text-lg font-semibold leading-tight group-hover:underline line-clamp-2 mb-2"
        style={{ color: BRAND_COLORS.navy }}
      >
        {title}
      </h3>

      {/* Excerpt */}
      {excerpt && (
        <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">
          {excerpt}
        </p>
      )}

      {/* Meta */}
      <p className="text-sm text-slate-500 mb-3">
        {formatDate(date)} • {readingTime} min read
      </p>

      {/* Labels at bottom */}
      {displayLabels.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
          {displayLabels.map((label, index) => (
            <span
              key={index}
              className="text-xs font-medium px-2 py-1"
              style={{
                backgroundColor: `${BRAND_COLORS.navy}08`,
                color: BRAND_COLORS.navy,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
