import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasOrgAccess, isOrgAdmin } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { z } from 'zod';

const testConfigSchema = z.object({
  orgId: z.string().min(1),
  idpUrl: z.string().url(),
  idpCert: z.string().min(1),
  spCert: z.string().min(1),
  spKey: z.string().min(1),
  spEntityId: z.string().min(1),
  acsUrl: z.string().url(),
});

// POST /api/saml/test - Test SAML configuration
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { orgId, ...configData } = testConfigSchema.parse(body);

    const isAdmin = await isOrgAdmin(session.user.id, orgId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Basic validation of SAML configuration
    const validationResults = {
      idpUrl: {
        valid: true,
        message: 'IDP URL is valid',
      },
      certificates: {
        valid: true,
        message: 'Certificates are valid',
      },
      entityId: {
        valid: true,
        message: 'Entity ID is valid',
      },
      acsUrl: {
        valid: true,
        message: 'ACS URL is valid',
      },
    };

    // Validate IDP URL
    try {
      new URL(configData.idpUrl);
    } catch {
      validationResults.idpUrl = {
        valid: false,
        message: 'Invalid IDP URL format',
      };
    }

    // Validate ACS URL
    try {
      new URL(configData.acsUrl);
    } catch {
      validationResults.acsUrl = {
        valid: false,
        message: 'Invalid ACS URL format',
      };
    }

    // Basic certificate validation (check if they look like PEM certificates)
    const certRegex = /-----BEGIN CERTIFICATE-----[\s\S]*-----END CERTIFICATE-----/;
    const keyRegex = /-----BEGIN PRIVATE KEY-----[\s\S]*-----END PRIVATE KEY-----/;

    if (!certRegex.test(configData.idpCert)) {
      validationResults.certificates = {
        valid: false,
        message: 'IDP certificate is not in valid PEM format',
      };
    }

    if (!certRegex.test(configData.spCert)) {
      validationResults.certificates = {
        valid: false,
        message: 'SP certificate is not in valid PEM format',
      };
    }

    if (!keyRegex.test(configData.spKey)) {
      validationResults.certificates = {
        valid: false,
        message: 'SP private key is not in valid PEM format',
      };
    }

    // Validate entity ID
    if (!configData.spEntityId || configData.spEntityId.length < 3) {
      validationResults.entityId = {
        valid: false,
        message: 'Entity ID must be at least 3 characters',
      };
    }

    const allValid = Object.values(validationResults).every(result => result.valid);

    return NextResponse.json({
      success: allValid,
      message: allValid ? 'SAML configuration is valid' : 'SAML configuration has errors',
      validation: validationResults,
    });
  } catch (error) {
    console.error('Error testing SAML config:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
