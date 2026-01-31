// src/components/PageSEO.jsx
// Reusable SEO component for public pages — meta tags, Open Graph, Twitter Card, JSON-LD

import { Helmet } from 'react-helmet-async';
import { BASE_URL, SITE_NAME } from '../lib/constants';

const DEFAULT_IMAGE = '/og-default.png';

export default function PageSEO({ title, description, path, type = 'website', image, schemas = [], breadcrumbs }) {
  const url = `${BASE_URL}${path}`;
  const imageUrl = `${BASE_URL}${image || DEFAULT_IMAGE}`;
  const fullTitle = `${title} | ${SITE_NAME}`;

  // Build BreadcrumbList JSON-LD if breadcrumbs provided
  const breadcrumbSchema = breadcrumbs ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: `${BASE_URL}${crumb.path}`,
    })),
  } : null;

  const allSchemas = breadcrumbSchema ? [...schemas, breadcrumbSchema] : schemas;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@CFO_Diagnostics" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* JSON-LD Structured Data */}
      {allSchemas.map((schema, i) => (
        <script type="application/ld+json" key={i}>
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
