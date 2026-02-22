import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

import { ThemeProvider } from '@/providers/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Recipe Management System',
    template: '%s | Recipe Management System',
  },
  description: 'AI-Enhanced Recipe Management Platform',
  verification: {
    google: 'RZy1AAybIqEYkko9JygCF6ReubfnbhIT0iJ0a9wW3lQ',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="bg-background text-foreground ring-ring fixed top-2 left-2 z-[100] -translate-y-full rounded-md px-4 py-2 text-sm font-medium opacity-0 ring-2 transition-all focus:translate-y-0 focus:opacity-100"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <AuthProvider>
            <QueryProvider>{children}</QueryProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
