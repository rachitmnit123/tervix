import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';

export const { handlers, signIn, signOut, auth } = NextAuth(async () => {
  const { db } = await import('@/lib/db');

  return {
    adapter: PrismaAdapter(db),
    session: { strategy: 'jwt' },
    checks: ['state'],  // 👈 disables PKCE, fixes InvalidCheck error

    pages: {
      signIn: '/login',
      error: '/login',
    },

    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        authorization: {
          params: {
            prompt: 'consent',
            access_type: 'offline',
            response_type: 'code',
          },
        },
        profile(profile) {
          return {
            id: profile.sub,
            name: profile.name,
            email: profile.email,
            image: profile.picture,
            title: 'Software Engineer',
            techStack: [],
          };
        },
      }),
    ],

    callbacks: {
      async jwt({ token, user }) {
        if (user) token.id = user.id;
        return token;
      },
      async session({ session, token }) {
        if (token?.id) {
          session.user!.id = token.id as string;
        }
        return session;
      },
    },
  };
});