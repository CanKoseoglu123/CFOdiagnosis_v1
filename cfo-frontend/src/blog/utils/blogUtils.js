import { format, parseISO } from 'date-fns';

/**
 * Calculate reading time for a given text
 * @param {string} text - The text content to analyze
 * @returns {number} - Estimated reading time in minutes
 */
export function calculateReadingTime(text) {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const time = Math.ceil(words / wordsPerMinute);
  return Math.max(1, time); // Minimum 1 minute
}

/**
 * Format a date string for display
 * @param {string} dateString - ISO date string (e.g., "2024-01-15")
 * @returns {string} - Formatted date (e.g., "Jan 15, 2024")
 */
export function formatDate(dateString) {
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - The text to slugify
 * @returns {string} - URL-friendly slug
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

/**
 * Sort posts by date (newest first)
 * @param {Array} posts - Array of post objects with date property
 * @returns {Array} - Sorted array of posts
 */
export function sortPostsByDate(posts) {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });
}

/**
 * Get featured posts (marked with featured: true)
 * @param {Array} posts - Array of post objects
 * @param {number} limit - Maximum number of featured posts to return
 * @returns {Array} - Featured posts
 */
export function getFeaturedPosts(posts, limit = 1) {
  return posts.filter(post => post.featured).slice(0, limit);
}

/**
 * Get the latest posts
 * @param {Array} posts - Array of post objects
 * @param {number} limit - Maximum number of posts to return
 * @returns {Array} - Latest posts
 */
export function getLatestPosts(posts, limit = 6) {
  return sortPostsByDate(posts).slice(0, limit);
}
