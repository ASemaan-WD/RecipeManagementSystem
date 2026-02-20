import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

const FOOTER_LINKS = [
  { label: 'About', href: '#' },
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
] as const;

export function Footer() {
  return (
    <>
      <Separator />
      <footer className="text-muted-foreground text-sm">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6 sm:px-6 md:flex-row md:justify-between lg:px-8">
          <p>&copy; 2026 Recipe Management System</p>

          <nav className="flex gap-4" aria-label="Footer navigation">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <p>Built with Next.js</p>
        </div>
      </footer>
    </>
  );
}
