import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';
import authConfig from '@/lib/auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = user.id as string;
        token.username =
          (user as unknown as { username: string | null }).username ?? null;
      }
      if (trigger === 'update') {
        // If the client passed a username via update({ username }), use it directly
        const clientUsername = (session as { username?: string } | undefined)
          ?.username;
        if (clientUsername) {
          token.username = clientUsername;
        } else {
          // Fallback: re-fetch from DB
          const dbUser = await prisma.user.findUnique({
            where: { id: token.userId as string },
            select: { username: true },
          });
          if (dbUser) {
            token.username = dbUser.username;
          }
        }
      }
      return token;
    },
  },
});
