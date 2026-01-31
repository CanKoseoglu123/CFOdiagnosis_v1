// src/components/PageSEO.jsx
// Reusable SEO component for public pages — meta tags, Open Graph, Twitter Card, JSON-LD

import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://cfodiagnosisv1.vercel.app';
const SITE_NAME = 'CFO Lens AI';
const DEFAULT_IMAGE = '/Logo horizontal.png';

export default function PageSEO({ title, description, path, type = 'website', image, schemas = [] }) {
  const url = `${BASE_URL}${path}`;
  const imageUrl = `${BASE_URL}${image || DEFAULT_IMAGE}`;
  const fullTitle = `${title} | ${SITE_NAME}`;

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
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* JSON-LD Structured Data */}
      {schemas.map((schema, i) => (
        <script type="application/ld+json" key={i}>
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
