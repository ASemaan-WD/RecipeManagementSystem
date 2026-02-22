import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';

/**
 * Edge-safe auth configuration.
 * This file must NOT import Prisma or any Node.js-only modules so it can
 * run inside the Edge Runtime (middleware).
 *
 * The full `auth.ts` re-exports everything with the PrismaAdapter attached.
 */
export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id as string;
        token.username =
          (user as unknown as { username: string | null }).username ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.username = (token.username as string | null) ?? null;
      return session;
    },
  },
} satisfies NextAuthConfig;
