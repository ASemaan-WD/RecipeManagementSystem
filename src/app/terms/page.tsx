import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to home
      </Link>

      <h1 className="mb-2 text-3xl font-bold tracking-tight">
        Terms of Service
      </h1>
      <p className="text-muted-foreground mb-8">
        Last updated: February 22, 2026
      </p>

      <div className="prose dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By accessing or using Recipe Management System (&quot;the
            Service&quot;), you agree to be bound by these Terms of Service. If
            you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. Description of Service</h2>
          <p className="text-muted-foreground">
            Recipe Management System is an AI-enhanced recipe management
            platform that allows users to create, organize, share, and discover
            recipes. The Service includes features such as AI-powered recipe
            generation, nutritional analysis, ingredient substitution, and
            social sharing.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. User Accounts</h2>
          <p className="text-muted-foreground">
            To use certain features of the Service, you must create an account
            using a supported authentication provider (Google or GitHub). You
            are responsible for maintaining the confidentiality of your account
            and for all activities that occur under your account. You agree to
            provide accurate and complete information when creating your
            account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">4. User Content</h2>
          <p className="text-muted-foreground">
            You retain ownership of any recipes, comments, ratings, and other
            content you submit to the Service (&quot;User Content&quot;). By
            submitting User Content, you grant us a non-exclusive, worldwide,
            royalty-free license to use, display, and distribute your content
            within the Service. You are solely responsible for your User Content
            and represent that you have all necessary rights to submit it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. Acceptable Use</h2>
          <p className="text-muted-foreground">You agree not to:</p>
          <ul className="text-muted-foreground list-disc space-y-1 pl-6">
            <li>Use the Service for any unlawful purpose</li>
            <li>Submit content that is offensive, harmful, or misleading</li>
            <li>
              Attempt to gain unauthorized access to any part of the Service
            </li>
            <li>Interfere with or disrupt the operation of the Service</li>
            <li>
              Use automated means to access the Service without our permission
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">6. AI-Generated Content</h2>
          <p className="text-muted-foreground">
            The Service uses artificial intelligence to generate recipe
            suggestions, nutritional estimates, and ingredient substitutions.
            AI-generated content is provided for informational purposes only and
            may not always be accurate. You should verify nutritional
            information, allergen details, and cooking instructions
            independently. We are not liable for any harm resulting from
            reliance on AI-generated content.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">7. Intellectual Property</h2>
          <p className="text-muted-foreground">
            The Service and its original content (excluding User Content),
            features, and functionality are owned by Recipe Management System
            and are protected by international copyright, trademark, and other
            intellectual property laws.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">8. Termination</h2>
          <p className="text-muted-foreground">
            We may terminate or suspend your account and access to the Service
            at our sole discretion, without notice, for conduct that we believe
            violates these Terms of Service or is harmful to other users, us, or
            third parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">9. Disclaimer of Warranties</h2>
          <p className="text-muted-foreground">
            The Service is provided &quot;as is&quot; and &quot;as
            available&quot; without warranties of any kind, either express or
            implied. We do not warrant that the Service will be uninterrupted,
            error-free, or secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">10. Limitation of Liability</h2>
          <p className="text-muted-foreground">
            To the fullest extent permitted by law, Recipe Management System
            shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages resulting from your use of or
            inability to use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">11. Changes to Terms</h2>
          <p className="text-muted-foreground">
            We reserve the right to modify these terms at any time. We will
            notify users of significant changes by updating the &quot;Last
            updated&quot; date. Your continued use of the Service after changes
            constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">12. Contact</h2>
          <p className="text-muted-foreground">
            If you have questions about these Terms of Service, please contact
            us at{' '}
            <a
              href="mailto:support@recipemanagement.app"
              className="text-primary hover:underline"
            >
              support@recipemanagement.app
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
