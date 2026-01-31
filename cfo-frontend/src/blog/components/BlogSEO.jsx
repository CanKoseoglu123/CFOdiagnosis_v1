// src/blog/components/BlogSEO.jsx
// SEO component for blog posts - meta tags, Open Graph, JSON-LD

import { Helmet } from 'react-helmet-async';
import { BASE_URL, SITE_NAME } from '../../lib/constants';

const DEFAULT_IMAGE = '/og-default.png';

export default function BlogSEO({ post, isListPage = false }) {
  // List page (blog index)
  if (isListPage) {
    return (
      <Helmet>
        <title>FP&A Insights & Best Practices | {SITE_NAME}</title>
        <meta
          name="description"
          content="Insights and best practices for finance leaders. Explore articles on FP&A, forecasting, budgeting, and finance transformation."
        />
        <link rel="canonical" href={`${BASE_URL}/blog`} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`FP&A Insights & Best Practices | ${SITE_NAME}`} />
        <meta
          property="og:description"
          content="Insights and best practices for finance leaders."
        />
        <meta property="og:url" content={`${BASE_URL}/blog`} />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:image" content={`${BASE_URL}${DEFAULT_IMAGE}`} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@CFO_Diagnostics" />
        <meta name="twitter:title" content={`FP&A Insights & Best Practices | ${SITE_NAME}`} />
        <meta
          name="twitter:description"
          content="Insights and best practices for finance leaders."
        />
        <meta name="twitter:image" content={`${BASE_URL}${DEFAULT_IMAGE}`} />
      </Helmet>
    );
  }

  // Individual post page
  const { title, excerpt, image, date, author, slug, tags } = post;
  const url = `${BASE_URL}/blog/${slug}`;
  const imageUrl = image ? `${BASE_URL}${image}` : `${BASE_URL}${DEFAULT_IMAGE}`;

  // JSON-LD structured data for blog post
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: excerpt,
    image: imageUrl,
    datePublished: date,
    author: {
      '@type': 'Organization',
      name: author || SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/Logo horizontal.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{title} | {SITE_NAME}</title>
      <meta name="description" content={excerpt} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={excerpt} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="article:published_time" content={date} />
      {tags?.map(tag => (
        <meta property="article:tag" content={tag} key={tag} />
      ))}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@CFO_Diagnostics" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={excerpt} />
      <meta name="twitter:image" content={imageUrl} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
