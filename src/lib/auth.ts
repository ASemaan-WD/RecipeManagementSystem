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
        const s = session as
          | { username?: string; name?: string; image?: string | null }
          | undefined;

        // Apply client-provided values directly
        if (s?.username) token.username = s.username;
        if (s?.name !== undefined) token.name = s.name;
        // NextAuth maps token.picture → session.user.image
        if (s?.image !== undefined) token.picture = s.image;

        // Fallback: re-fetch from DB when no client values provided
        if (!s?.username && s?.name === undefined && s?.image === undefined) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.userId as string },
            select: { username: true, name: true, image: true },
          });
          if (dbUser) {
            token.username = dbUser.username;
            token.name = dbUser.name;
            token.picture = dbUser.image;
          }
        }
      }
      return token;
    },
  },
});
