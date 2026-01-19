// src/pages/BlogPostPage.jsx
// Individual blog post page - Innovid-inspired design with gradient hero

import { useParams, Link, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Logo, BRAND_COLORS } from '../components/Logo';
import BlogSEO from '../blog/components/BlogSEO';
import { MDXComponents } from '../blog/components/MDXComponents';
import { getPostBySlug, getLatestPosts } from '../blog';
import { formatDate } from '../blog/utils/blogUtils';
import { Mail, Linkedin, Twitter, Facebook, ArrowRight } from 'lucide-react';
import BlogCard from '../blog/components/BlogCard';

export default function BlogPostPage() {
  const { slug } = useParams();
  const { isAuthenticated, user, signOut } = useAuth();

  // Scroll to top on mount or when slug changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const post = getPostBySlug(slug);

  // 404 if post not found
  if (!post) {
    return <Navigate to="/resources" replace />;
  }

  const { title, excerpt, date, readingTime, author, Component, tags, series } = post;

  // Get first tag or series as category
  const category = tags?.[0] || series || null;

  // Get related posts (excluding current)
  const relatedPosts = getLatestPosts(4, false).filter(p => p.slug !== slug).slice(0, 3);

  // Share URLs
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareUrls = {
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(currentUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
  };

  return (
    <div className="min-h-screen bg-white">
      <BlogSEO post={post} />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* NAVIGATION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left side: Logo + Nav Links */}
          <div className="flex items-center">
            <Link to="/">
              <Logo size="sm" />
            </Link>

            {/* Divider */}
            <div className="hidden sm:block h-6 w-px bg-slate-200 mx-6" />

            {/* Nav Links */}
            <div className="hidden sm:flex items-center gap-1">
              <Link
                to="/platform"
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Platform
              </Link>
              <Link
                to="/blog"
                className="px-3 py-2 text-sm font-medium transition-colors"
                style={{ color: BRAND_COLORS.navy }}
              >
                Blog
              </Link>
              <Link
                to="/about"
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                About
              </Link>
            </div>
          </div>

          {/* Right side: Auth */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex flex-col items-end mr-2">
                  <span className="text-sm font-medium text-slate-700">Welcome back</span>
                  <span className="text-xs text-slate-500">{user?.email}</span>
                </div>
                <Link
                  to="/"
                  className="px-4 py-2 text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  Dashboard
                </Link>
                <button
                  onClick={signOut}
                  className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/request-access"
                  className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
                >
                  Request Access
                </Link>
                <Link
                  to="/login"
                  className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: BRAND_COLORS.navy }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HERO SECTION - Gradient with decorative elements */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section
        className="pt-24 pb-12 px-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #C5E3F6 0%, #E3F1FA 40%, #FFFFFF 100%)',
        }}
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Large circle - top right */}
          <div
            className="absolute -right-20 -top-20 w-96 h-96 rounded-full"
            style={{
              background: `radial-gradient(circle, ${BRAND_COLORS.navy}08 0%, transparent 70%)`,
            }}
          />
          {/* Medium circle - right side */}
          <div
            className="absolute right-10 top-1/2 w-64 h-64 rounded-full"
            style={{
              background: `radial-gradient(circle, ${BRAND_COLORS.navy}06 0%, transparent 70%)`,
            }}
          />
          {/* Small circle - left side */}
          <div
            className="absolute -left-10 top-1/3 w-48 h-48 rounded-full"
            style={{
              background: `radial-gradient(circle, ${BRAND_COLORS.navy}05 0%, transparent 70%)`,
            }}
          />
          {/* Large faded letter - decorative */}
          <div
            className="absolute right-16 top-20 text-[200px] font-bold leading-none select-none"
            style={{ color: `${BRAND_COLORS.navy}04` }}
          >
            ?
          </div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-8">
            <Link
              to="/blog"
              className="hover:underline"
              style={{ color: BRAND_COLORS.navy }}
            >
              Resources
            </Link>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">Blog</span>
            {category && (
              <>
                <span className="text-slate-300">|</span>
                <span
                  className="font-medium"
                  style={{ color: BRAND_COLORS.navy }}
                >
                  {category}
                </span>
              </>
            )}
          </div>

          {/* Title and Share Row */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight flex-1"
              style={{ color: BRAND_COLORS.navy }}
            >
              {title}
            </h1>

            {/* Share Icons */}
            <div className="flex items-center gap-4 lg:pt-2">
              <span className="text-sm text-slate-500 hidden sm:block">Share this post</span>
              <div className="flex items-center gap-2">
                <a
                  href={shareUrls.email}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                  title="Share via Email"
                >
                  <Mail className="w-5 h-5" style={{ color: BRAND_COLORS.navy }} />
                </a>
                <a
                  href={shareUrls.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                  title="Share on LinkedIn"
                >
                  <Linkedin className="w-5 h-5" style={{ color: BRAND_COLORS.navy }} />
                </a>
                <a
                  href={shareUrls.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                  title="Share on X"
                >
                  <Twitter className="w-5 h-5" style={{ color: BRAND_COLORS.navy }} />
                </a>
                <a
                  href={shareUrls.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                  title="Share on Facebook"
                >
                  <Facebook className="w-5 h-5" style={{ color: BRAND_COLORS.navy }} />
                </a>
              </div>
            </div>
          </div>

          {/* Author Info */}
          <div className="flex items-center gap-4">
            {/* Avatar placeholder */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: BRAND_COLORS.navy }}
            >
              {(author || 'CFO Lens Team').charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-slate-800">
                By {author || 'CFO Lens Team'}
              </div>
              <div className="text-sm" style={{ color: BRAND_COLORS.gold }}>
                {formatDate(date)} • {readingTime} min read
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ARTICLE CONTENT */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <article className="px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="prose-wrapper">
            <Component components={MDXComponents} />
          </div>
        </div>
      </article>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* RELATED POSTS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {relatedPosts.length > 0 && (
        <section className="py-16 px-6 bg-slate-50 border-t border-slate-200">
          <div className="max-w-6xl mx-auto">
            <h2
              className="text-2xl font-bold mb-8"
              style={{ color: BRAND_COLORS.navy }}
            >
              More Articles
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map(relatedPost => (
                <BlogCard key={relatedPost.slug} post={relatedPost} />
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                style={{ color: BRAND_COLORS.navy }}
              >
                View All Posts
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FOOTER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <footer
        className="py-12 px-6 border-t border-slate-200"
        style={{ backgroundColor: `${BRAND_COLORS.navy}05` }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Logo size="sm" />
            <p className="text-sm text-slate-500">
              The diagnosis and action plan phase of a consulting engagement—compressed
              into hours, at a fraction of the cost.
            </p>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} CFO Lens AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
