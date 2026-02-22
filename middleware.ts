import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import authConfig from '@/lib/auth.config';

const protectedRoutes = [
  '/dashboard',
  '/recipes/new',
  '/my-recipes',
  '/my-collection',
  '/shopping-lists',
  '/settings',
  '/shared-with-me',
];

const protectedPrefixes = ['/ai/', '/shopping-lists/'];

function isProtectedRoute(pathname: string): boolean {
  if (protectedRoutes.includes(pathname)) return true;
  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix)))
    return true;
  if (/^\/recipes\/[^/]+\/edit$/.test(pathname)) return true;
  return false;
}

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  const pathname = nextUrl.pathname;

  // Unauthenticated users accessing protected routes -> redirect to /login
  if (!isAuthenticated && isProtectedRoute(pathname)) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // Authenticated users on /login -> redirect to /dashboard
  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  if (isAuthenticated) {
    const hasUsername = !!req.auth?.user?.username;
    const isOnboarding = pathname === '/onboarding';
    const isApiRoute = pathname.startsWith('/api');

    // Authenticated without username -> redirect to /onboarding (skip API routes and /onboarding itself)
    if (!hasUsername && !isOnboarding && !isApiRoute) {
      return NextResponse.redirect(new URL('/onboarding', nextUrl));
    }

    // Authenticated with username on /onboarding -> redirect to /dashboard
    if (hasUsername && isOnboarding) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
