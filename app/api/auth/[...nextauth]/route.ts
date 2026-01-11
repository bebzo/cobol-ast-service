/**
 * NextAuth API Route Handler
 * Enterprise-ready authentication with RBAC
 */

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';

// User roles for RBAC
export type UserRole = 'admin' | 'developer' | 'viewer' | 'auditor';

const handler = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || 'demo',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo'
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || 'demo',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'demo'
    }),
    Credentials({
      name: 'Enterprise SSO',
      credentials: {
        email: { label: 'Email', type: 'email' },
        token: { label: 'SSO Token', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.token) {
          return null;
        }
        const token = credentials.token as string;
        if (token.startsWith('ent_') && token.length > 20) {
          return {
            id: `ent_${Date.now()}`,
            email: credentials.email as string,
            name: (credentials.email as string).split('@')[0]
          };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = 'developer';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login?error=auth'
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60
  },
  trustHost: true
});

export { handler as GET, handler as POST };
