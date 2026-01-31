// scripts/prerender-meta.js
// Post-build: generates route-specific index.html files with baked-in meta tags
// so non-JS crawlers (AI bots, social media scrapers) see correct OG/meta/JSON-LD.
// Runs after vite build — reads dist/index.html as template, creates subdirectories.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '../dist');

const BASE_URL = 'https://cfodiagnosisv1.vercel.app';
const SITE_NAME = 'CFO Lens AI';
const DEFAULT_IMAGE = `${BASE_URL}/Logo horizontal.png`;
const LOGO_URL = `${BASE_URL}/Logo horizontal.png`;

// Route-specific meta for each public page
const routes = [
  {
    path: '/',
    title: 'FP&A Maturity Diagnostic | CFO Lens AI',
    description: 'Assess your FP&A function\'s maturity in hours, not months. 97-question diagnostic with industry benchmarks, gap analysis, and actionable transformation roadmaps.',
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
    title: 'Platform | CFO Lens AI',
    description: 'One diagnostic methodology for every corner of finance. Context-aware benchmarks, root-cause analysis, and a simulation engine across FP&A, Accounting, Treasury, and beyond.',
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
    title: 'About | CFO Lens AI',
    description: 'Built by finance practitioners who lived the gap between where FP&A teams are and where they need to be. CFO Lens compresses months of consulting into hours.',
    schemas: [],
  },
  {
    path: '/pricing',
    title: 'Pricing | CFO Lens AI',
    description: 'Free FP&A diagnostic with 2 objectives. Pro tier unlocks all 9 objectives, industry benchmarks, War Room action planning, and executive PDF reports.',
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
    path: '/blog',
    title: 'Blog | CFO Lens AI',
    description: 'Insights and best practices for finance leaders. Explore articles on FP&A, forecasting, budgeting, and finance transformation.',
    schemas: [],
  },
];

function injectMeta(html, route) {
  const url = `${BASE_URL}${route.path === '/' ? '' : route.path}`;

  // Build meta tags
  // Build JSON-LD scripts
  const jsonLdScripts = route.schemas.map(schema =>
    `<script type="application/ld+json">${JSON.stringify(schema)}</script>`
  ).join('\n    ');

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
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${route.title}" />
    <meta property="og:description" content="${route.description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${DEFAULT_IMAGE}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${route.title}" />
    <meta name="twitter:description" content="${route.description}" />
    <meta name="twitter:image" content="${DEFAULT_IMAGE}" />
    ${jsonLdScripts}
  `;

  result = result.replace('</head>', `${injection}</head>`);
  return result;
}

function prerender() {
  const templatePath = path.join(distDir, 'index.html');

  if (!fs.existsSync(templatePath)) {
    console.error('dist/index.html not found. Run vite build first.');
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, 'utf-8');

  for (const route of routes) {
    const injected = injectMeta(template, route);

    if (route.path === '/') {
      // Overwrite the root index.html
      fs.writeFileSync(templatePath, injected);
    } else {
      // Create subdirectory with index.html
      // Strip leading slash to prevent path.join from treating it as absolute
      const routeDir = path.join(distDir, route.path.replace(/^\//, ''));
      fs.mkdirSync(routeDir, { recursive: true });
      fs.writeFileSync(path.join(routeDir, 'index.html'), injected);
    }
  }

  console.log(`\u2713 Prerendered meta tags for ${routes.length} routes`);
}

prerender();
