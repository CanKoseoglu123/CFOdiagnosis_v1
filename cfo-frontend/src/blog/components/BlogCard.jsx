// src/blog/components/BlogCard.jsx
// Blog post card - Image-forward design (Innovid-inspired)

import { Link } from 'react-router-dom';
import { formatDate } from '../utils/blogUtils';
import { BRAND_COLORS } from '../../components/Logo';

export default function BlogCard({ post }) {
  const { slug, title, image, date, readingTime } = post;

  return (
    <Link
      to={`/blog/${slug}`}
      className="group block bg-white overflow-hidden"
    >
      {/* Image - Takes up most of the card */}
      <div className="aspect-[4/3] bg-slate-100 overflow-hidden rounded-lg">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${BRAND_COLORS.navy}10` }}
          >
            {/* Placeholder with gradient pattern */}
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${BRAND_COLORS.navy}15 0%, ${BRAND_COLORS.navy}05 100%)`,
              }}
            >
              <span
                className="text-5xl font-bold opacity-20"
                style={{ color: BRAND_COLORS.navy }}
              >
                {title.charAt(0)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content - Minimal, below image */}
      <div className="pt-4">
        <h3
          className="text-lg font-semibold leading-tight group-hover:underline line-clamp-2"
          style={{ color: BRAND_COLORS.navy }}
        >
          {title}
        </h3>

        <p className="text-sm text-slate-500 mt-2">
          {formatDate(date)} • {readingTime} min read
        </p>
      </div>
    </Link>
  );
}
