// scripts/prerender-meta.js
// Post-build: generates route-specific index.html files with baked-in meta tags
// so non-JS crawlers (AI bots, social media scrapers) see correct OG/meta/JSON-LD.
// Runs after vite build — reads dist/index.html as template, creates subdirectories.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '../dist');

const BASE_URL = 'https://cfo-lens.com';
const SITE_NAME = 'CFO Lens AI';
const DEFAULT_IMAGE = `${BASE_URL}/og-default.png`;
const LOGO_URL = `${BASE_URL}/Logo horizontal.png`;

// Route-specific meta for each public page
const routes = [
  {
    path: '/',
    title: 'FP&A Maturity Assessment Tool for CFOs | CFO Lens AI',
    description: 'Free FP&A maturity assessment for CFOs. 97-question diagnostic with industry benchmarks, gap analysis, and prioritized action plans. Results in one session.',
    breadcrumbs: [{ name: 'Home', path: '/' }],
    schemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'CFO Lens AI',
        url: BASE_URL,
        logo: LOGO_URL,
        description: 'AI-powered FP&A maturity assessment platform that compresses a 6-figure consulting engagement into hours.',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'CFO Lens AI',
        url: BASE_URL,
        description: 'AI-powered FP&A maturity assessment platform for CFOs and finance leaders.',
      },
    ],
  },
  {
    path: '/platform',
    title: 'FP&A Diagnostic Platform | CFO Lens AI',
    description: 'FP&A diagnostic platform with deterministic scoring, context-aware benchmarks, root-cause gap analysis, War Room action planning, and executive PDF reports.',
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Platform', path: '/platform' }],
    schemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'CFO Lens AI',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: 'AI-powered FP&A maturity diagnostic platform with 97-question assessment, industry benchmarks, and executive reporting.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'Free tier with 2 objectives. Pro tier unlocks all 9 objectives.',
        },
      },
    ],
  },
  {
    path: '/about',
    title: 'About \u2014 Built by Finance Practitioners | CFO Lens AI',
    description: 'Built by finance practitioners who lived the gap between where FP&A teams are and where they need to be. CFO Lens compresses months of consulting into hours.',
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }],
    schemas: [],
  },
  {
    path: '/pricing',
    title: 'Pricing \u2014 FP&A Assessment Plans | CFO Lens AI',
    description: 'Free FP&A diagnostic with 2 objectives. Pro tier unlocks all 9 objectives, industry benchmarks, War Room action planning, and executive PDF reports.',
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Pricing', path: '/pricing' }],
    schemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is an FP&A maturity assessment?',
            acceptedAnswer: { '@type': 'Answer', text: 'An FP&A maturity assessment evaluates how advanced your Financial Planning and Analysis function is across key capabilities like budgeting, forecasting, scenario modeling, and strategic influence. It identifies gaps between your current state and best practice, providing a clear roadmap for improvement.' },
          },
          {
            '@type': 'Question',
            name: 'How long does the diagnostic take?',
            acceptedAnswer: { '@type': 'Answer', text: 'Most CFOs complete the full 97-question diagnostic in 60 to 90 minutes. The questions are binary (yes/no) and organized by objective, so progress is steady and transparent.' },
          },
          {
            '@type': 'Question',
            name: 'How is this different from hiring a consultant?',
            acceptedAnswer: { '@type': 'Answer', text: 'A traditional FP&A maturity assessment by a consulting firm costs six figures and takes months. CFO Lens delivers comparable diagnostic depth in hours at a fraction of the cost, using a deterministic scoring engine calibrated to your industry, size, and persona.' },
          },
          {
            '@type': 'Question',
            name: 'What payment methods do you accept?',
            acceptedAnswer: { '@type': 'Answer', text: 'We accept all major credit cards via Stripe. EU customers can pay in EUR, others pay in USD.' },
          },
          {
            '@type': 'Question',
            name: 'Can I try before I buy?',
            acceptedAnswer: { '@type': 'Answer', text: 'Yes. The free tier gives you access to 2 objectives so you can experience the diagnostic before upgrading.' },
          },
          {
            '@type': 'Question',
            name: 'What happens to my data if I cancel?',
            acceptedAnswer: { '@type': 'Answer', text: 'Your diagnostic data is retained. You can still view your results but will not be able to access premium features or start new full assessments.' },
          },
        ],
      },
    ],
  },
  {
    path: '/roadmap',
    title: 'Product Roadmap \u2014 Finance Diagnostic Modules | CFO Lens AI',
    description: "Diagnostic intelligence for the entire finance function. See what's live, what's coming next, and join the waitlist.",
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Roadmap', path: '/roadmap' }],
    schemas: [],
  },
  {
    path: '/blog',
    title: 'FP&A Insights & Best Practices | CFO Lens AI',
    description: 'Insights and best practices for finance leaders. Explore articles on FP&A, forecasting, budgeting, and finance transformation.',
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }],
    schemas: [],
  },
];

function buildBreadcrumbSchema(breadcrumbs) {
  if (!breadcrumbs || breadcrumbs.length === 0) return '';
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: `${BASE_URL}${crumb.path}`,
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

function injectMeta(html, route) {
  const url = `${BASE_URL}${route.path === '/' ? '' : route.path}`;

  // Build JSON-LD scripts
  const jsonLdScripts = route.schemas.map(schema =>
    `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
  ).join('\n    ');

  const breadcrumbScript = buildBreadcrumbSchema(route.breadcrumbs);

  // Remove fallback JSON-LD from template and replace title/description
  let result = html
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/, '')
    .replace(/<title>.*?<\/title>/, `<title>${route.title}</title>`)
    .replace(
      /<meta name="description" content=".*?" \/>/,
      `<meta name="description" content="${route.description}" />`
    );

  // Inject OG, Twitter, canonical, and new JSON-LD before </head>
  const injection = `
    <!-- Prerendered meta for ${route.path} -->
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="${route.ogType || 'website'}" />
    <meta property="og:title" content="${route.title}" />
    <meta property="og:description" content="${route.description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${route.ogImage || DEFAULT_IMAGE}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@CFO_Diagnostics" />
    <meta name="twitter:title" content="${route.title}" />
    <meta name="twitter:description" content="${route.description}" />
    <meta name="twitter:image" content="${route.ogImage || DEFAULT_IMAGE}" />
    ${jsonLdScripts}
    ${breadcrumbScript}
  `;

  result = result.replace('</head>', `${injection}</head>`);
  return result;
}

function getBlogPosts() {
  const blogDir = path.join(__dirname, '../content/blog');
  const posts = [];

  if (!fs.existsSync(blogDir)) return posts;

  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(blogDir, file), 'utf-8');
    const { data } = matter(content);
    if (data.slug) {
      posts.push(data);
    }
  }

  return posts;
}

function prerender() {
  const templatePath = path.join(distDir, 'index.html');

  if (!fs.existsSync(templatePath)) {
    console.error('dist/index.html not found. Run vite build first.');
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, 'utf-8');

  // Prerender static routes
  for (const route of routes) {
    const injected = injectMeta(template, route);

    if (route.path === '/') {
      // Overwrite the root index.html
      fs.writeFileSync(templatePath, injected);
    } else {
      // Create subdirectory with index.html
      const routeDir = path.join(distDir, route.path.replace(/^\//, ''));
      fs.mkdirSync(routeDir, { recursive: true });
      fs.writeFileSync(path.join(routeDir, 'index.html'), injected);
    }
  }

  // Prerender blog posts
  const blogPosts = getBlogPosts();
  let blogCount = 0;

  for (const post of blogPosts) {
    const blogRoute = {
      path: `/blog/${post.slug}`,
      title: `${post.title} | ${SITE_NAME}`,
      description: post.excerpt || '',
      ogType: 'article',
      ogImage: post.image ? `${BASE_URL}${post.image}` : DEFAULT_IMAGE,
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: post.title, path: `/blog/${post.slug}` },
      ],
      schemas: [
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt || '',
          image: post.image ? `${BASE_URL}${post.image}` : DEFAULT_IMAGE,
          datePublished: post.date,
          author: {
            '@type': 'Organization',
            name: post.author || SITE_NAME,
          },
          publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            logo: {
              '@type': 'ImageObject',
              url: LOGO_URL,
            },
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${BASE_URL}/blog/${post.slug}`,
          },
        },
      ],
    };

    const injected = injectMeta(template, blogRoute);
    const blogDir = path.join(distDir, 'blog', post.slug);
    fs.mkdirSync(blogDir, { recursive: true });
    fs.writeFileSync(path.join(blogDir, 'index.html'), injected);
    blogCount++;
  }

  console.log(`\u2713 Prerendered meta tags for ${routes.length} routes + ${blogCount} blog posts`);
}

prerender();
