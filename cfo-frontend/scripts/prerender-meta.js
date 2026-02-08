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
    path: '/login',
    title: 'Sign In | CFO Lens AI',
    description: 'Sign in to access your FP&A maturity diagnostic, dashboard, and executive reports.',
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Sign In', path: '/login' }],
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sharedNav() {
  return `
  <nav>
    <a href="/">Home</a>
    <a href="/platform">Platform</a>
    <a href="/pricing">Pricing</a>
    <a href="/blog">Blog</a>
    <a href="/about">About</a>
    <a href="/roadmap">Roadmap</a>
    <a href="/login">Sign In</a>
  </nav>`;
}

function sharedFooter() {
  return `
  <footer>
    <p>JavaScript is required for the full interactive diagnostic. This page provides a readable summary for non-JS clients.</p>
    <p>LLM files: <a href="/llms.txt">llms.txt</a> \u00b7 <a href="/llms-full.txt">llms-full.txt</a></p>
  </footer>`;
}

function renderHomeFallback() {
  return `
<main>
  ${sharedNav()}
  <h1>FP&amp;A Maturity Assessment for CFOs</h1>
  <p>CFO Lens AI is a deterministic FP&amp;A maturity diagnostic that compresses a 6-figure consulting engagement into hours. It evaluates 97 binary questions across 9 objectives and benchmarks results by industry and company profile.</p>
  <section>
    <h2>What You Get</h2>
    <ul>
      <li>Objective-level maturity scores with critical gate analysis</li>
      <li>Benchmark comparisons and gap analysis</li>
      <li>Prioritized action plan (War Room)</li>
      <li>Executive-ready PDF report</li>
    </ul>
  </section>
  <section>
    <h2>Start</h2>
    <p>Begin with a free tier (2 objectives) or upgrade to unlock all 9 objectives.</p>
    <p><a href="/pricing">See pricing</a> or <a href="/login">sign in</a>.</p>
  </section>
  ${sharedFooter()}
</main>`;
}

function renderPlatformFallback() {
  return `
<main>
  ${sharedNav()}
  <h1>Platform Overview</h1>
  <p>CFO Lens AI provides a structured diagnostic with deterministic scoring, calibration multipliers, and critical gates to ensure maturity levels reflect real capability.</p>
  <section>
    <h2>Core Capabilities</h2>
    <ul>
      <li>97-question FP&amp;A diagnostic across 9 objectives and 3 themes</li>
      <li>Industry benchmark calibration and persona-aware targets</li>
      <li>Root-cause gap analysis and action prioritization</li>
      <li>Executive PDF reporting</li>
    </ul>
  </section>
  ${sharedFooter()}
</main>`;
}

function renderAboutFallback() {
  return `
<main>
  ${sharedNav()}
  <h1>About CFO Lens</h1>
  <p>CFO Lens AI is built by finance practitioners who have led FP&amp;A transformations and wanted a faster, more affordable diagnostic than traditional consulting.</p>
  <section>
    <h2>Mission</h2>
    <p>Help finance leaders identify maturity gaps quickly and move to action with a clear, prioritized roadmap.</p>
  </section>
  ${sharedFooter()}
</main>`;
}

function renderPricingFallback() {
  return `
<main>
  ${sharedNav()}
  <h1>Pricing</h1>
  <p>Choose a free tier to assess 2 objectives or upgrade to access the full diagnostic.</p>
  <section>
    <h2>Free</h2>
    <ul>
      <li>2 objectives unlocked</li>
      <li>Basic maturity scores</li>
    </ul>
  </section>
  <section>
    <h2>Pro</h2>
    <ul>
      <li>All 9 objectives</li>
      <li>Full benchmarks and gap analysis</li>
      <li>War Room action plan</li>
      <li>Executive PDF report</li>
    </ul>
  </section>
  ${sharedFooter()}
</main>`;
}

function renderRoadmapFallback() {
  return `
<main>
  ${sharedNav()}
  <h1>Product Roadmap</h1>
  <p>Diagnostic intelligence for the entire finance function. See what's live, what's coming next, and join the waitlist.</p>
  ${sharedFooter()}
</main>`;
}

function renderBlogIndexFallback(posts) {
  const items = posts.map(post => `
    <li>
      <a href="/blog/${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a>
      ${post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : ''}
    </li>
  `).join('');

  return `
<main>
  ${sharedNav()}
  <h1>FP&amp;A Insights &amp; Best Practices</h1>
  <p>Articles on FP&amp;A maturity, forecasting, budgeting, and finance transformation.</p>
  <ul>
    ${items || '<li>No posts available.</li>'}
  </ul>
  ${sharedFooter()}
</main>`;
}

function renderBlogPostFallback(post) {
  return `
<main>
  ${sharedNav()}
  <article>
    <h1>${escapeHtml(post.title)}</h1>
    ${post.date ? `<p>Published: ${escapeHtml(post.date)}</p>` : ''}
    ${post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : ''}
    <p><a href="/blog">Back to blog</a></p>
  </article>
  ${sharedFooter()}
</main>`;
}

function renderLoginFallback() {
  return `
<main>
  ${sharedNav()}
  <h1>Sign In</h1>
  <p>Sign in to access your diagnostics, dashboard, and reports.</p>
  <section>
    <h2>What You'll Access</h2>
    <ul>
      <li>Saved assessments and benchmarking</li>
      <li>War Room action plan</li>
      <li>Executive PDF reports</li>
    </ul>
  </section>
  <p>If you do not have an account, start with the free tier on the <a href="/pricing">pricing</a> page.</p>
  ${sharedFooter()}
</main>`;
}

function getFallbackForRoute(route, blogPosts = []) {
  switch (route.path) {
    case '/':
      return renderHomeFallback();
    case '/platform':
      return renderPlatformFallback();
    case '/about':
      return renderAboutFallback();
    case '/pricing':
      return renderPricingFallback();
    case '/roadmap':
      return renderRoadmapFallback();
    case '/blog':
      return renderBlogIndexFallback(blogPosts);
    case '/login':
      return renderLoginFallback();
    default:
      return '';
  }
}

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

function injectFallback(html, fallbackHtml) {
  if (!fallbackHtml) return html;
  return html.replace('<div id="root"></div>', `<div id="root">${fallbackHtml}</div>`);
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
  const blogPosts = getBlogPosts();

  // Prerender static routes
  for (const route of routes) {
    const injectedMeta = injectMeta(template, route);
    const fallback = getFallbackForRoute(route, blogPosts);
    const injected = injectFallback(injectedMeta, fallback);

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

    const injectedMeta = injectMeta(template, blogRoute);
    const fallback = renderBlogPostFallback(post);
    const injected = injectFallback(injectedMeta, fallback);
    const blogDir = path.join(distDir, 'blog', post.slug);
    fs.mkdirSync(blogDir, { recursive: true });
    fs.writeFileSync(path.join(blogDir, 'index.html'), injected);
    blogCount++;
  }

  console.log(`\u2713 Prerendered meta tags for ${routes.length} routes + ${blogCount} blog posts`);
}

prerender();
