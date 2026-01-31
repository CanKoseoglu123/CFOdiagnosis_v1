// src/pages/ResourcesPage.jsx (Blog page)
// Blog listing page - Innovid-inspired design with search and filter

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo, BRAND_COLORS } from '../components/Logo';
import PublicNav from '../components/PublicNav';
import BlogCard from '../blog/components/BlogCard';
import BlogSEO from '../blog/components/BlogSEO';
import { getAllPosts } from '../blog';
import { Search, ChevronDown } from 'lucide-react';

export default function ResourcesPage() {
  const { isAuthenticated, user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const allPosts = getAllPosts();

  // Filter posts by search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return allPosts;
    const query = searchQuery.toLowerCase();
    return allPosts.filter(post =>
      post.title.toLowerCase().includes(query) ||
      post.excerpt?.toLowerCase().includes(query)
    );
  }, [allPosts, searchQuery]);

  return (
    <div className="min-h-screen bg-white">
      <BlogSEO isListPage />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* NAVIGATION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <PublicNav />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HEADER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-8 px-6 border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <h1
            className="text-4xl sm:text-5xl font-bold"
            style={{ color: BRAND_COLORS.navy }}
          >
            Explore all blogs
          </h1>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SEARCH & FILTER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-6 sm:items-end justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            {/* Filter (placeholder - disabled) */}
            <div className="w-full sm:w-64">
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Filter by topic
              </label>
              <div className="relative">
                <select
                  disabled
                  className="w-full appearance-none pl-4 pr-10 py-3 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                >
                  <option>Coming soon</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* POST GRID */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="py-8 px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          {filteredPosts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map(post => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-16">
              <p className="text-slate-500 mb-2">
                No articles found for "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm font-medium hover:underline"
                style={{ color: BRAND_COLORS.navy }}
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-slate-500">
                No articles published yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

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
