// src/blog/components/MDXComponents.jsx
// Styled components for MDX content - matches landing page aesthetic

import { BRAND_COLORS } from '../../components/Logo';

// Custom components for use within MDX content
export function Callout({ type = 'info', children }) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    insight: 'text-slate-700',
    tip: 'bg-green-50 border-green-200 text-green-800',
  };

  // Insight type uses hero-matching gradient background
  const isInsight = type === 'insight';

  return (
    <div
      className={`border-l-4 p-5 my-6 ${styles[type] || styles.info}`}
      style={isInsight ? {
        background: 'linear-gradient(135deg, #E3F1FA 0%, #F0F7FC 100%)',
        borderColor: BRAND_COLORS.navy,
      } : undefined}
    >
      {children}
    </div>
  );
}

export function KeyTakeaway({ children }) {
  return (
    <div className="bg-slate-50 border border-slate-200 p-5 my-6">
      <div
        className="text-xs font-bold uppercase tracking-wider mb-2"
        style={{ color: BRAND_COLORS.gold }}
      >
        Key Takeaway
      </div>
      <div className="text-slate-700">{children}</div>
    </div>
  );
}

// MDX component overrides
export const MDXComponents = {
  // Headings
  h1: ({ children, ...props }) => (
    <h1
      className="text-3xl font-bold mt-8 mb-4"
      style={{ color: BRAND_COLORS.navy }}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="text-2xl font-bold mt-8 mb-3 pb-2 border-b border-slate-200"
      style={{ color: BRAND_COLORS.navy }}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="text-xl font-semibold mt-6 mb-2"
      style={{ color: BRAND_COLORS.navy }}
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      className="text-lg font-semibold mt-4 mb-2"
      style={{ color: BRAND_COLORS.navy }}
      {...props}
    >
      {children}
    </h4>
  ),

  // Paragraphs
  p: ({ children, ...props }) => (
    <p className="text-slate-700 leading-relaxed mb-4" {...props}>
      {children}
    </p>
  ),

  // Lists
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-outside ml-6 text-slate-700 mb-4 space-y-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-outside ml-6 text-slate-700 mb-4 space-y-2" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),

  // Links
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="font-medium underline hover:no-underline"
      style={{ color: BRAND_COLORS.navy }}
      {...props}
    >
      {children}
    </a>
  ),

  // Code
  pre: ({ children, ...props }) => (
    <pre
      className="bg-slate-800 text-slate-100 p-4 overflow-x-auto mb-4 text-sm"
      {...props}
    >
      {children}
    </pre>
  ),
  code: ({ children, className, ...props }) => {
    // Check if it's inline code (no className) or a code block
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="bg-slate-100 text-slate-800 px-1.5 py-0.5 text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }
    return <code className={className} {...props}>{children}</code>;
  },

  // Blockquotes
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 pl-4 my-6 italic text-slate-600"
      style={{ borderColor: BRAND_COLORS.gold }}
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Tables
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto mb-6">
      <table className="w-full border border-slate-200" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-slate-50" {...props}>{children}</thead>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border border-slate-200 px-4 py-2 text-left text-sm font-semibold text-slate-700"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border border-slate-200 px-4 py-2 text-sm text-slate-600" {...props}>
      {children}
    </td>
  ),

  // Horizontal rule
  hr: (props) => (
    <hr className="my-8 border-t border-slate-200" {...props} />
  ),

  // Strong and emphasis
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-slate-800" {...props}>{children}</strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>{children}</em>
  ),

  // Images
  img: ({ src, alt, ...props }) => (
    <figure className="my-6">
      <img
        src={src}
        alt={alt}
        className="w-full border border-slate-200"
        {...props}
      />
      {alt && (
        <figcaption className="text-sm text-slate-500 mt-2 text-center">
          {alt}
        </figcaption>
      )}
    </figure>
  ),

  // Custom components
  Callout,
  KeyTakeaway,
};

export default MDXComponents;
