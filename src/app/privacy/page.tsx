import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to home
      </Link>

      <h1 className="mb-2 text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">
        Last updated: February 22, 2026
      </p>

      <div className="prose dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold">1. Introduction</h2>
          <p className="text-muted-foreground">
            Recipe Management System (&quot;we&quot;, &quot;our&quot;, or
            &quot;us&quot;) respects your privacy. This Privacy Policy explains
            how we collect, use, store, and share your information when you use
            our AI-enhanced recipe management platform (&quot;the
            Service&quot;).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. Information We Collect</h2>

          <h3 className="mt-4 text-lg font-medium">
            2.1 Information from Authentication Providers
          </h3>
          <p className="text-muted-foreground">
            When you sign in using Google or GitHub, we receive your name, email
            address, and profile picture from the authentication provider. We
            use this information solely to create and manage your account. We do
            not request access to your contacts, files, or any other data beyond
            basic profile information.
          </p>

          <h3 className="mt-4 text-lg font-medium">
            2.2 Information You Provide
          </h3>
          <p className="text-muted-foreground">
            We collect information you voluntarily provide, including:
          </p>
          <ul className="text-muted-foreground list-disc space-y-1 pl-6">
            <li>Username you choose during onboarding</li>
            <li>Recipes you create (name, ingredients, steps, images)</li>
            <li>Comments and ratings you submit</li>
            <li>Shopping lists you create</li>
            <li>Recipe tags and collections you organize</li>
          </ul>

          <h3 className="mt-4 text-lg font-medium">
            2.3 Automatically Collected Information
          </h3>
          <p className="text-muted-foreground">
            We collect standard web server logs including your IP address,
            browser type, and pages visited. We use this information for
            security and to improve the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            3. How We Use Your Information
          </h2>
          <p className="text-muted-foreground">We use your information to:</p>
          <ul className="text-muted-foreground list-disc space-y-1 pl-6">
            <li>Provide and maintain the Service</li>
            <li>Authenticate your identity and manage your account</li>
            <li>
              Display your recipes and profile to other users as you choose
            </li>
            <li>
              Generate AI-powered recipe suggestions, nutritional estimates, and
              ingredient substitutions
            </li>
            <li>
              Send you important notifications about the Service (e.g., security
              alerts)
            </li>
            <li>Prevent abuse and enforce our Terms of Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            4. How We Use Google User Data
          </h2>
          <p className="text-muted-foreground">
            Our use of information received from Google APIs adheres to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements. Specifically:
          </p>
          <ul className="text-muted-foreground list-disc space-y-1 pl-6">
            <li>
              We only request access to your basic profile information (name,
              email, profile picture) for authentication purposes
            </li>
            <li>
              We do not use Google user data for advertising or marketing
              purposes
            </li>
            <li>
              We do not sell, lease, or share Google user data with third
              parties except as required to provide the Service
            </li>
            <li>
              We do not use Google user data to train AI models or for any
              purpose unrelated to providing the Service
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. Data Storage & Security</h2>
          <p className="text-muted-foreground">
            Your data is stored securely in a PostgreSQL database hosted on Neon
            (cloud infrastructure). Images are stored on Vercel Blob Storage. We
            implement industry-standard security measures including encrypted
            connections (TLS/SSL), secure authentication tokens, and rate
            limiting to protect your data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">6. Data Sharing</h2>
          <p className="text-muted-foreground">
            We do not sell your personal information. We may share your
            information only in the following circumstances:
          </p>
          <ul className="text-muted-foreground list-disc space-y-1 pl-6">
            <li>
              <strong>With your consent:</strong> When you share recipes
              publicly or with specific users
            </li>
            <li>
              <strong>Service providers:</strong> We use third-party services
              (Vercel for hosting, Neon for database, OpenAI for AI features)
              that process data on our behalf
            </li>
            <li>
              <strong>Legal requirements:</strong> When required by law or to
              protect our rights
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">7. Third-Party AI Services</h2>
          <p className="text-muted-foreground">
            Our AI features (recipe generation, nutritional analysis, ingredient
            substitution, image generation) use OpenAI&apos;s API. When you use
            these features, relevant recipe data (such as ingredient lists) is
            sent to OpenAI for processing. We do not send your personal
            information (name, email) to OpenAI. Please review{' '}
            <a
              href="https://openai.com/policies/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              OpenAI&apos;s Privacy Policy
            </a>{' '}
            for details on how they handle data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">8. Your Rights</h2>
          <p className="text-muted-foreground">You have the right to:</p>
          <ul className="text-muted-foreground list-disc space-y-1 pl-6">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Export your recipe data</li>
            <li>Withdraw consent for data processing at any time</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            To exercise these rights, please contact us at{' '}
            <a
              href="mailto:support@recipemanagement.app"
              className="text-primary hover:underline"
            >
              support@recipemanagement.app
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">9. Cookies</h2>
          <p className="text-muted-foreground">
            We use essential cookies for authentication and session management.
            We do not use tracking cookies or third-party analytics cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">10. Children&apos;s Privacy</h2>
          <p className="text-muted-foreground">
            The Service is not intended for children under 13. We do not
            knowingly collect personal information from children under 13. If we
            become aware that we have collected personal information from a
            child under 13, we will take steps to delete that information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">11. Changes to This Policy</h2>
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time. We will notify
            users of significant changes by updating the &quot;Last
            updated&quot; date. Your continued use of the Service after changes
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">12. Contact</h2>
          <p className="text-muted-foreground">
            If you have questions about this Privacy Policy, please contact us
            at{' '}
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
