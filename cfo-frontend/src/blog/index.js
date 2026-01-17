import { calculateReadingTime, sortPostsByDate } from './utils/blogUtils';

// Import all MDX files from the content/blog directory
const modules = import.meta.glob('/content/blog/*.mdx', { eager: true });

// Process all posts
export const posts = Object.entries(modules).map(([path, module]) => {
  const { frontmatter, default: Component } = module;

  // Extract filename from path for fallback slug
  const filename = path.split('/').pop().replace('.mdx', '');

  return {
    ...frontmatter,
    slug: frontmatter.slug || filename,
    Component,
    // Calculate reading time from the component's string representation
    // This is a rough estimate; actual content length varies
    readingTime: frontmatter.readingTime || 5,
  };
});

// Sort posts by date (newest first)
export const sortedPosts = sortPostsByDate(posts);

/**
 * Get a single post by slug
 * @param {string} slug - The post slug
 * @returns {Object|undefined} - The post object or undefined
 */
export function getPostBySlug(slug) {
  return posts.find(post => post.slug === slug);
}

/**
 * Get featured posts
 * @param {number} limit - Maximum number to return
 * @returns {Array} - Featured posts
 */
export function getFeaturedPosts(limit = 1) {
  const featured = sortedPosts.filter(post => post.featured);
  return featured.length > 0 ? featured.slice(0, limit) : sortedPosts.slice(0, limit);
}

/**
 * Get latest posts (excluding featured)
 * @param {number} limit - Maximum number to return
 * @param {boolean} excludeFeatured - Whether to exclude featured posts
 * @returns {Array} - Latest posts
 */
export function getLatestPosts(limit = 6, excludeFeatured = false) {
  if (excludeFeatured) {
    const featured = getFeaturedPosts(1);
    const featuredSlugs = new Set(featured.map(p => p.slug));
    return sortedPosts.filter(p => !featuredSlugs.has(p.slug)).slice(0, limit);
  }
  return sortedPosts.slice(0, limit);
}

/**
 * Get all posts for the resources page
 * @returns {Array} - All posts sorted by date
 */
export function getAllPosts() {
  return sortedPosts;
}
