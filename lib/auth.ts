import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth(() => {
  return {
    adapter: PrismaAdapter(db), // ✅ NOW runs at runtime only

    session: { strategy: 'jwt' },

    pages: {
      signIn: '/login',
      error: '/login',
    },

    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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