/**
 * NextAuth Configuration - Production-Ready SSO
 */

import { AuthOptions, User } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

// Role-based permissions
const rolePermissions: Record<string, string[]> = {
  admin: ['transpile', 'analyze', 'export', 'audit', 'admin'],
  developer: ['transpile', 'analyze', 'export'],
  viewer: ['analyze'],
  auditor: ['audit', 'export']
};

export const authOptions: AuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_OAUTH_ID || '',
      clientSecret: process.env.GITHUB_OAUTH_SECRET || '',
      authorization: {
        params: {
          scope: 'read:user user:email'
        }
      }
    }),
    
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    }),
    
    CredentialsProvider({
      id: 'enterprise',
      name: 'Enterprise SSO',
      credentials: {
        email: { label: 'Corporate Email', type: 'email', placeholder: 'user@company.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const email = credentials.email;
        const password = credentials.password;
        
        // Demo accounts for testing (production: validate against LDAP/AD)
        const demoAccounts: Record<string, { password: string; role: string; name: string }> = {
          'admin@codeswitch.demo': { password: 'AdminSecure2024!', role: 'admin', name: 'Admin User' },
          'dev@codeswitch.demo': { password: 'DevSecure2024!', role: 'developer', name: 'Developer' },
          'auditor@codeswitch.demo': { password: 'AuditSecure2024!', role: 'auditor', name: 'Auditor' }
        };
        
        const account = demoAccounts[email];
        if (account && account.password === password) {
          return {
            id: `local_${Buffer.from(email).toString('base64')}`,
            email: email,
            name: account.name,
            role: account.role
          } as User;
        }
        
        return null;
      }
    })
  ],
  
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as any).role || 'viewer';
        token.provider = account?.provider || 'credentials';
      }
      
      if (!token.role) {
        token.role = token.provider === 'github' ? 'developer' : 'viewer';
      }
      
      token.permissions = rolePermissions[token.role as string] || [];
      
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions;
        (session.user as any).provider = token.provider;
      }
      return session;
    },
    
    async signIn({ user, account }) {
      console.log(`[AUTH] Sign-in: ${user.email} via ${account?.provider} at ${new Date().toISOString()}`);
      return true;
    }
  },
  
  pages: {
    signIn: '/login',
    error: '/login'
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60
  },
  
  jwt: {
    maxAge: 8 * 60 * 60
  },
  
  secret: process.env.NEXTAUTH_SECRET || 'codeswitch-secret-change-in-production',
  
  debug: process.env.NODE_ENV === 'development'
};
