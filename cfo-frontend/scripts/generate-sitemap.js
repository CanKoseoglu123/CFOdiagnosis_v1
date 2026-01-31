// scripts/generate-sitemap.js
// Generates sitemap.xml from static routes and blog posts

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://cfo-lens.com';

// Static pages with their priorities
const staticPages = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/blog', priority: 0.9, changefreq: 'weekly' },
  { path: '/platform', priority: 0.8, changefreq: 'monthly' },
  { path: '/about', priority: 0.6, changefreq: 'monthly' },
  { path: '/pricing', priority: 0.7, changefreq: 'monthly' },
  { path: '/roadmap', priority: 0.7, changefreq: 'monthly' },
];

function generateSitemap() {
  const blogDir = path.join(__dirname, '../content/blog');
  const publicDir = path.join(__dirname, '../public');

  // Collect blog post URLs
  const blogUrls = [];

  if (fs.existsSync(blogDir)) {
    const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx'));

    for (const file of files) {
      const filePath = path.join(blogDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(content);

      if (data.slug) {
        blogUrls.push({
          path: `/blog/${data.slug}`,
          lastmod: data.date,
          priority: data.featured ? 0.8 : 0.6,
          changefreq: 'monthly',
        });
      }
    }
  }

  // Combine all URLs
  const allUrls = [...staticPages, ...blogUrls];

  // Generate XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(({ path: urlPath, lastmod, priority, changefreq }) => `  <url>
    <loc>${BASE_URL}${urlPath}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write sitemap
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
  console.log(`✓ Sitemap generated with ${allUrls.length} URLs`);
}

generateSitemap();
