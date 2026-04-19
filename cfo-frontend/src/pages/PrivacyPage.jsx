import { BRAND_COLORS } from '../components/Logo';
import PublicNav from '../components/PublicNav';
import PageSEO from '../components/PageSEO';
import Footer from '../components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageSEO
        title="Privacy Policy"
        description="Privacy Policy for CFO Lens AI. Learn how we collect, use, and protect your data on the FP&A maturity diagnostic platform."
        path="/privacy"
      />
      <PublicNav ctaLabel="Get Started" />

      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: BRAND_COLORS.gold }}>
          Legal
        </p>
        <h1 className="text-3xl font-bold mb-2" style={{ color: BRAND_COLORS.navy }}>
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500 mb-12">
          Last updated: April 2026
        </p>

        <div className="prose prose-slate max-w-none [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-slate-600 [&_p]:mb-4 [&_ul]:text-sm [&_ul]:text-slate-600 [&_li]:mb-2" style={{ '--tw-prose-headings': BRAND_COLORS.navy }}>

          <h2 style={{ color: BRAND_COLORS.navy }}>1. Information We Collect</h2>
          <p>We collect information you provide directly:</p>
          <ul className="list-disc pl-6">
            <li><strong>Account information:</strong> Email address and password when you create an account</li>
            <li><strong>Company profile:</strong> Industry, company size, revenue range, and region during diagnostic setup</li>
            <li><strong>Assessment responses:</strong> Your answers to diagnostic questions</li>
            <li><strong>Calibration inputs:</strong> Pain points and context you provide to calibrate results</li>
            <li><strong>Payment information:</strong> Processed by Stripe; we do not store card details</li>
          </ul>

          <p>We collect automatically:</p>
          <ul className="list-disc pl-6">
            <li><strong>Usage data:</strong> Pages visited, features used, session duration</li>
            <li><strong>Device information:</strong> Browser type, operating system, screen resolution</li>
            <li><strong>Analytics:</strong> Aggregated, anonymized usage patterns via Vercel Analytics</li>
          </ul>

          <h2 style={{ color: BRAND_COLORS.navy }}>2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-6">
            <li>Deliver the diagnostic service: scoring, benchmarking, and report generation</li>
            <li>Tailor benchmarks to your company's industry, size, and persona</li>
            <li>Generate AI-powered interpretations and recommendations</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send transactional emails (password reset, account confirmation)</li>
            <li>Improve the Platform based on aggregated, anonymized usage patterns</li>
          </ul>

          <h2 style={{ color: BRAND_COLORS.navy }}>3. Data Processing & AI</h2>
          <p>
            Your assessment responses are processed by our deterministic scoring engine. AI interpretation
            features send anonymized data to third-party AI providers (OpenAI) to generate narrative
            content. Company-identifying information is not included in AI prompts. AI-generated
            content is not used to train third-party models.
          </p>

          <h2 style={{ color: BRAND_COLORS.navy }}>4. Data Storage & Security</h2>
          <p>
            Your data is stored in Supabase (PostgreSQL) with row-level security policies.
            All data is encrypted in transit (TLS) and at rest. We use industry-standard
            security practices including access controls, audit logging, and regular security reviews.
          </p>

          <h2 style={{ color: BRAND_COLORS.navy }}>5. Data Sharing</h2>
          <p>We do not sell your data. We share data only with:</p>
          <ul className="list-disc pl-6">
            <li><strong>Supabase:</strong> Database hosting and authentication</li>
            <li><strong>Stripe:</strong> Payment processing</li>
            <li><strong>OpenAI:</strong> AI-powered interpretations (anonymized data only)</li>
            <li><strong>Vercel:</strong> Hosting and anonymized analytics</li>
            <li><strong>Resend:</strong> Transactional email delivery</li>
          </ul>

          <h2 style={{ color: BRAND_COLORS.navy }}>6. Data Retention</h2>
          <p>
            Your assessment data is retained as long as your account is active. If you delete your
            account, your data will be removed within 90 days. Anonymized, aggregated data used
            for benchmarking may be retained indefinitely.
          </p>

          <h2 style={{ color: BRAND_COLORS.navy }}>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6">
            <li>Access your data through the Platform dashboard</li>
            <li>Export your assessment results and reports</li>
            <li>Request deletion of your account and associated data</li>
            <li>Opt out of non-essential communications</li>
          </ul>
          <p>
            For EU/EEA users: You have additional rights under GDPR including data portability,
            rectification, and the right to lodge a complaint with a supervisory authority.
          </p>

          <h2 style={{ color: BRAND_COLORS.navy }}>8. Cookies</h2>
          <p>
            We use essential cookies for authentication and session management. We use Vercel
            Analytics for anonymized usage tracking. We do not use third-party advertising cookies
            or tracking pixels.
          </p>

          <h2 style={{ color: BRAND_COLORS.navy }}>9. Children's Privacy</h2>
          <p>
            The Platform is designed for business professionals. We do not knowingly collect
            data from anyone under 16. If you believe we have collected such data, contact us
            immediately.
          </p>

          <h2 style={{ color: BRAND_COLORS.navy }}>10. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. Material changes will be communicated
            via email. The "last updated" date at the top reflects the most recent revision.
          </p>

          <h2 style={{ color: BRAND_COLORS.navy }}>11. Contact</h2>
          <p>
            For privacy-related questions or data requests, contact us at{' '}
            <a href="mailto:hello@cfo-lens.com" className="font-medium underline" style={{ color: BRAND_COLORS.navy }}>
              hello@cfo-lens.com
            </a>.
          </p>
        </div>
      </main>

      <Footer variant="minimal" />
    </div>
  );
}
