import { Logo, BRAND_COLORS } from '../components/Logo';
import PublicNav from '../components/PublicNav';
import PageSEO from '../components/PageSEO';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageSEO
        title="Terms of Service"
        description="Terms of Service for CFO Lens AI. Read our terms governing the use of the FP&A maturity diagnostic platform."
        path="/terms"
      />
      <PublicNav ctaLabel="Get Started" />

      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: BRAND_COLORS.gold }}>
          Legal
        </p>
        <h1 className="text-3xl font-bold mb-2" style={{ color: BRAND_COLORS.navy }}>
          Terms of Service
        </h1>
        <p className="text-sm text-slate-500 mb-12">
          Last updated: April 2026
        </p>

        <div className="prose prose-slate max-w-none [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-slate-600 [&_p]:mb-4 [&_ul]:text-sm [&_ul]:text-slate-600 [&_li]:mb-2" style={{ '--tw-prose-headings': BRAND_COLORS.navy }}>

          <h2 style={{ color: BRAND_COLORS.navy }}>1. Acceptance of Terms</h2>
          <p>
            By accessing or using CFO Lens AI ("the Platform"), operated by CFO Lens AI ("we", "us", "our"),
            you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.
          </p>

          <h2 style={{ color: BRAND_COLORS.navy }}>2. Description of Service</h2>
          <p>
            CFO Lens AI provides an FP&A maturity diagnostic platform that helps finance leaders assess their
            function's capabilities, identify gaps, and build prioritized action plans. The Platform includes
            questionnaire-based assessments, scoring engines, benchmarking, and report generation.
          </p>

          <h2 style={{ color: BRAND_COLORS.navy }}>3. Accounts & Access</h2>
          <p>
            You must create an account to use the diagnostic features. You are responsible for maintaining
            the confidentiality of your login credentials and for all activity under your account.
            You must provide accurate information during registration.
          </p>

          <h2 style={{ color: BRAND_COLORS.navy }}>4. Subscriptions & Payment</h2>
          <p>
            The Platform offers free and paid tiers. Paid subscriptions are billed annually through
            Stripe. You may cancel at any time; access continues until the end of the billing period.
            Refunds are handled on a case-by-case basis. Prices are listed on our Pricing page and
            may change with 30 days' notice.
          </p>

          <h2 style={{ color: BRAND_COLORS.navy }}>5. Your Data</h2>
          <p>
            You retain ownership of all data you input into the Platform, including company profiles,
            assessment responses, and calibration inputs. We process your data solely to deliver
            the diagnostic service. See our Privacy Policy for details on how we handle your information.
          </p>

          <h2 style={{ color: BRAND_COLORS.navy }}>6. AI-Generated Content</h2>
          <p>
            Parts of the Platform use AI to generate interpretations, recommendations, and narrative
            content. AI-generated content is provided for informational purposes only. It does not
            constitute professional financial, legal, or consulting advice. You are responsible for
            evaluating and acting on any recommendations.
          </p>

          <h2 style={{ color: BRAND_COLORS.navy }}>7. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6">
            <li>Use the Platform for any unlawful purpose</li>
            <li>Attempt to reverse-engineer the scoring methodology</li>
            <li>Share your account credentials with unauthorized parties</li>
            <li>Scrape, crawl, or automate access to the Platform</li>
            <li>Misrepresent assessment results as certified audits or professional opinions</li>
          </ul>

          <h2 style={{ color: BRAND_COLORS.navy }}>8. Intellectual Property</h2>
          <p>
            The Platform, including its scoring methodology, question sets, benchmarks, and design,
            is the intellectual property of CFO Lens AI. Your subscription grants a limited,
            non-exclusive, non-transferable license to use the Platform for internal business purposes.
          </p>

          <h2 style={{ color: BRAND_COLORS.navy }}>9. Limitation of Liability</h2>
          <p>
            The Platform is provided "as is" without warranty of any kind. We are not liable for any
            indirect, incidental, or consequential damages arising from your use of the Platform.
            Our total liability is limited to the fees you have paid in the 12 months preceding the claim.
          </p>

          <h2 style={{ color: BRAND_COLORS.navy }}>10. Termination</h2>
          <p>
            We may suspend or terminate your access if you violate these terms. You may delete your
            account at any time. Upon termination, your right to use the Platform ceases, but your
            data will be retained for 90 days before deletion unless you request earlier removal.
          </p>

          <h2 style={{ color: BRAND_COLORS.navy }}>11. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Material changes will be communicated
            via email or in-app notification. Continued use after changes constitutes acceptance.
          </p>

          <h2 style={{ color: BRAND_COLORS.navy }}>12. Contact</h2>
          <p>
            For questions about these terms, contact us at{' '}
            <a href="mailto:hello@cfo-lens.com" className="font-medium underline" style={{ color: BRAND_COLORS.navy }}>
              hello@cfo-lens.com
            </a>.
          </p>
        </div>
      </main>

      <footer
        className="py-12 px-6 border-t border-slate-200"
        style={{ backgroundColor: `${BRAND_COLORS.navy}05` }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Logo size="sm" />
            <p className="text-sm text-slate-500">
              Diagnostic intelligence for finance leaders everywhere.
            </p>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} CFO Lens AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
