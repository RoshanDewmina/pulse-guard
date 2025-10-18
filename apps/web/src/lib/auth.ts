import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@tokiflow/db';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import type { Adapter } from 'next-auth/adapters';

// Custom adapter that allows OAuth account linking to existing users by bypassing the built-in check
function CustomPrismaAdapter(p: typeof prisma): Adapter {
  const baseAdapter = PrismaAdapter(p);
  
  return {
    ...baseAdapter,
    // Override getUserByEmail to return null during OAuth flow
    // This prevents NextAuth from detecting existing users and throwing OAuthAccountNotLinked
    async getUserByEmail(email) {
      // Return null to allow our signIn callback to handle account linking
      return null;
    },
  };
}

// Build providers array conditionally
const providers: any[] = [
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error('Email and password are required');
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
        include: {
          Account: {
            where: {
              provider: 'credentials'
            }
          }
        }
      });

      if (!user || user.Account.length === 0 || !user.Account[0].access_token) {
        throw new Error('Invalid email or password');
      }

      const hashedPassword = user.Account[0].access_token;
      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        hashedPassword
      );

      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    },
  }),
  EmailProvider({
    server: process.env.EMAIL_SERVER_HOST ? {
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    } : undefined,
    from: process.env.EMAIL_FROM || 'noreply@saturn.co',
    sendVerificationRequest: async ({ identifier, url, provider }) => {
      // Always log to console for debugging
      console.log('\n🔗 Magic Link for', identifier);
      console.log('📧 Sign in URL:', url);
      console.log('');

      // Send actual email if Resend API key is configured
      if (process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const { data, error } = await resend.emails.send({
            from: provider.from,
            to: identifier,
            subject: 'Sign in to Saturn',
            html: `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Sign in to Saturn</title>
                  </head>
                  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                      <h1 style="color: white; margin: 0; font-size: 28px;">Saturn</h1>
                      <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">Cron & Job Monitoring</p>
                    </div>
                    
                    <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                      <h2 style="color: #1f2937; margin-top: 0;">Sign in to your account</h2>
                      
                      <p style="color: #4b5563; font-size: 16px; margin: 20px 0;">
                        Click the button below to sign in to your Saturn account. This link will expire in 24 hours.
                      </p>
                      
                      <div style="text-align: center; margin: 35px 0;">
                        <a href="${url}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; 
                                  padding: 14px 32px; 
                                  text-decoration: none; 
                                  border-radius: 6px; 
                                  font-weight: 600;
                                  font-size: 16px;
                                  display: inline-block;">
                          Sign in to Saturn
                        </a>
                      </div>
                      
                      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                        If you didn't request this email, you can safely ignore it.
                      </p>
                      
                      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                          Or copy and paste this URL into your browser:
                        </p>
                        <p style="color: #6b7280; font-size: 12px; word-break: break-all; margin: 10px 0 0 0;">
                          ${url}
                        </p>
                      </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                      <p>© 2025 Saturn. All rights reserved.</p>
                    </div>
                  </body>
                </html>
              `,
          });

          if (error) {
            console.error('Failed to send magic link email:', error);
          } else {
            console.log('✅ Magic link email sent successfully to', identifier);
          }
        } catch (error) {
          console.error('Error sending magic link email:', error);
        }
      } else {
        console.warn('⚠️  RESEND_API_KEY not configured - magic link only logged to console');
      }
    },
  }),
];

// Only add Google provider if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Allow linking to existing accounts with same email
      allowDangerousEmailAccountLinking: true,
    })
  );
} else {
  console.warn('⚠️  Google OAuth not configured - Google sign-in will not be available');
}

// Also add it to email provider for consistency
const emailProviderIndex = providers.findIndex(p => p.id === 'email');
if (emailProviderIndex !== -1) {
  providers[emailProviderIndex].options = {
    ...providers[emailProviderIndex].options,
    allowDangerousEmailAccountLinking: true,
  };
}

export const authOptions: NextAuthOptions = {
  adapter: CustomPrismaAdapter(prisma),
  providers,
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  session: {
    strategy: 'jwt',
  },
  debug: true,
  // Enable automatic account linking for OAuth providers
  // This allows users to sign in with Google even if they already have an account with email/password
  events: {
    async linkAccount({ user, account, profile }) {
      console.log(`🔗 Account linked: ${account.provider} for user ${user.email}`);
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle OAuth account linking for existing users
      if (account?.type === 'oauth') {
        const userEmail = user.email || profile?.email;
        
        if (!userEmail) {
          console.error('No email provided in OAuth profile');
          return false;
        }

        try {
          // Check if account already linked
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            include: { user: true },
          });

          if (existingAccount) {
            // Account already linked, allow sign-in
            return true;
          }

          // Check if user exists with this email
          const existingUser = await prisma.user.findUnique({
            where: { email: userEmail },
          });

          if (existingUser) {
            // Link the OAuth account to the existing user
            console.log(`🔗 Linking ${account.provider} account to existing user: ${userEmail}`);
            
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                refresh_token: account.refresh_token,
              },
            });
            
            console.log(`✅ Successfully linked ${account.provider} account to user ${existingUser.id}`);
            
            // Update user object to use existing user ID
            user.id = existingUser.id;
            user.email = existingUser.email;
            user.name = existingUser.name || user.name;
            user.image = existingUser.image || user.image;
            
            return true;
          }

          // No existing user, allow adapter to create new user
          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      
      // Allow all non-OAuth sign-ins
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        
        // ALWAYS fetch fresh onboarding status from DB to avoid stale JWT cache
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub as string },
          select: { 
            onboardingCompleted: true,
            // onboardingStep: true, // Field doesn't exist in schema
            // mfaEnabled: true, // Field doesn't exist in schema
          },
        });
        
        session.user.onboardingCompleted = dbUser?.onboardingCompleted ?? false;
        // session.user.onboardingStep = dbUser?.onboardingStep ?? 'NONE'; // Field doesn't exist in schema
        // session.user.mfaEnabled = dbUser?.mfaEnabled ?? false; // Field doesn't exist in schema
      }
      return session;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.sub = user.id;
        
        // Add MFA and onboarding info to JWT token
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            // mfaEnabled: true, // Field doesn't exist in schema
            // onboardingStep: true, // Field doesn't exist in schema
          },
        });
        
        if (dbUser) {
          // token.mfaEnabled = dbUser.mfaEnabled; // Field doesn't exist in schema
          // token.onboardingStep = dbUser.onboardingStep; // Field doesn't exist in schema
        }
      }
      
      // Refresh token data on update trigger
      if (trigger === 'update' && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub as string },
          select: {
            // mfaEnabled: true, // Field doesn't exist in schema
            // onboardingStep: true, // Field doesn't exist in schema
          },
        });
        
        if (dbUser) {
          // token.mfaEnabled = dbUser.mfaEnabled; // Field doesn't exist in schema
          // token.onboardingStep = dbUser.onboardingStep; // Field doesn't exist in schema
        }
      }
      
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper to get current user from session
export async function getCurrentUser(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      Membership: {
        include: {
          Org: {
            include: {
              SubscriptionPlan: true,
            },
          },
        },
      },
    },
  });
}

// Helper to get user's active org (checks cookie first, then defaults to first org)
export async function getUserPrimaryOrg(userId: string, activeOrgId?: string | null) {
  // If activeOrgId is provided (from cookie), try to use that first
  if (activeOrgId) {
    const activeMembership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId: activeOrgId,
        },
      },
      include: {
        Org: {
          include: {
            SubscriptionPlan: true,
          },
        },
      },
    });

    if (activeMembership) {
      return activeMembership.Org;
    }
  }

  // Fall back to first organization
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: {
      Org: {
        include: {
          SubscriptionPlan: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return membership?.Org;
}

// Helper to check if user has access to org
export async function hasOrgAccess(userId: string, orgId: string): Promise<boolean> {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_orgId: {
        userId,
        orgId,
      },
    },
  });

  return !!membership;
}

// Helper to check if user has admin access
export async function isOrgAdmin(userId: string, orgId: string): Promise<boolean> {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_orgId: {
        userId,
        orgId,
      },
    },
  });

  return membership?.role === 'OWNER' || membership?.role === 'ADMIN';
}

