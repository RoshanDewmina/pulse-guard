import { NextAuthOptions } from 'next-auth';
import { prisma } from '@tokiflow/db';
import { createAuditLog, AuditAction } from './audit';

export interface SAMLConfig {
  idpUrl: string;
  idpCert: string;
  spCert: string;
  spKey: string;
  spEntityId: string;
  acsUrl: string;
  sloUrl?: string;
  nameIdFormat?: string;
  attributeMapping?: {
    email?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
}

export function createSAMLProvider(config: SAMLConfig) {
  return {
    id: 'saml',
    name: 'SAML SSO',
    type: 'oauth' as const,
    authorization: {
      url: `${config.idpUrl}/sso/saml`,
      params: {
        scope: 'openid email profile',
      },
    },
    token: `${config.idpUrl}/oauth/token`,
    userinfo: `${config.idpUrl}/oauth/userinfo`,
    clientId: config.spEntityId,
    clientSecret: config.spCert,
    profile(profile: any) {
      return {
        id: profile.sub || profile.id,
        email: profile.email,
        name: profile.name || `${profile.given_name} ${profile.family_name}`.trim(),
        image: profile.picture,
      };
    },
  };
}

export async function handleSAMLLogin(user: any, account: any, profile: any, orgId: string) {
  try {
    // Check if user exists
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: {
        Membership: {
          where: { orgId },
        },
      },
    });

    if (!dbUser) {
      // Create new user
      dbUser = await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: new Date(),
        },
        include: {
          Membership: {
            where: { orgId },
          },
        },
      });

      // Log user creation
      await createAuditLog({
        action: AuditAction.USER_CREATED,
        orgId,
        userId: dbUser.id,
        meta: { method: 'saml', provider: 'saml' },
      });
    }

    // Check if user is already a member of the organization
    if (dbUser.Membership.length === 0) {
      // Add user to organization
      await prisma.membership.create({
        data: {
          id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: dbUser.id,
          orgId,
          role: 'MEMBER', // Default role for SAML users
          updatedAt: new Date(),
        },
      });

      // Log member addition
      await createAuditLog({
        action: AuditAction.ORG_MEMBER_ADDED,
        orgId,
        userId: dbUser.id,
        meta: { method: 'saml', role: 'MEMBER' },
      });
    }

    // Log successful SAML login
    await createAuditLog({
      action: AuditAction.LOGIN_SUCCESS,
      orgId,
      userId: dbUser.id,
      meta: { method: 'saml', provider: 'saml' },
    });

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      image: dbUser.image,
    };
  } catch (error) {
    console.error('SAML login error:', error);
    throw error;
  }
}

export function getSAMLConfig(orgId: string): SAMLConfig | null {
  // In a real implementation, this would fetch from database
  // For now, return null to indicate SAML is not configured
  return null;
}
