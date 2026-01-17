// src/blog/components/FeaturedCard.jsx
// Featured/hero blog post card - larger horizontal layout

import { Link } from 'react-router-dom';
import { formatDate } from '../utils/blogUtils';
import { BRAND_COLORS } from '../../components/Logo';
import { ArrowRight } from 'lucide-react';

export default function FeaturedCard({ post }) {
  const { slug, title, excerpt, image, date, readingTime, author } = post;

  return (
    <Link
      to={`/resources/${slug}`}
      className="group block border border-slate-200 bg-white hover:border-slate-300 transition-colors"
    >
      <div className="grid md:grid-cols-2 gap-0">
        {/* Image - Left side on desktop */}
        <div className="aspect-[16/9] md:aspect-auto bg-slate-100 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div
              className="w-full h-full min-h-[240px] flex items-center justify-center"
              style={{ backgroundColor: `${BRAND_COLORS.navy}10` }}
            >
              <span className="text-6xl font-bold" style={{ color: BRAND_COLORS.navy }}>
                {title.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Content - Right side on desktop */}
        <div className="p-6 md:p-8 flex flex-col justify-center">
          <p
            className="text-sm font-medium uppercase tracking-wide mb-3"
            style={{ color: BRAND_COLORS.gold }}
          >
            Featured Article
          </p>

          <h2
            className="text-2xl md:text-3xl font-bold mb-3 group-hover:underline"
            style={{ color: BRAND_COLORS.navy }}
          >
            {title}
          </h2>

          <p className="text-sm text-slate-500 mb-4">
            {readingTime} min read · {formatDate(date)}
            {author && ` · ${author}`}
          </p>

          {excerpt && (
            <p className="text-slate-600 mb-6 line-clamp-3 leading-relaxed">
              {excerpt}
            </p>
          )}

          <span
            className="inline-flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all"
            style={{ color: BRAND_COLORS.navy }}
          >
            Read Article
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
