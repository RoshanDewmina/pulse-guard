import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@tokiflow/db';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
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
        });

        if (!user || !user.password) {
          throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.imageUrl,
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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
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
  callbacks: {
    async signIn({ user, account, profile }) {
      // When a user signs in with OAuth for the first time, create an organization
      if (account && (account.provider === 'google' || account.provider === 'email')) {
        const existingMembership = await prisma.membership.findFirst({
          where: { userId: user.id },
        });

        // Only create org if user doesn't have one
        if (!existingMembership) {
          const userName = user.name || user.email?.split('@')[0] || 'User';
          const timestamp = Date.now();
          
          await prisma.org.create({
            data: {
              name: `${userName}'s Organization`,
              slug: `${user.email?.split('@')[0]}-${timestamp}`,
              memberships: {
                create: {
                  userId: user.id,
                  role: 'OWNER',
                },
              },
              subscriptionPlan: {
                create: {
                  plan: 'FREE',
                  monitorLimit: 5,
                  userLimit: 1,
                },
              },
            },
          });
          console.log(`✅ Created organization for new user: ${user.email}`);
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
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
      memberships: {
        include: {
          org: {
            include: {
              subscriptionPlan: true,
            },
          },
        },
      },
    },
  });
}

// Helper to get user's primary org
export async function getUserPrimaryOrg(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: {
      org: {
        include: {
          subscriptionPlan: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return membership?.org;
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

