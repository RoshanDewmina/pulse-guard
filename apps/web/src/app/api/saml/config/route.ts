import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasOrgAccess, isOrgAdmin } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { z } from 'zod';
import { createAuditLog, AuditAction } from '@/lib/audit';

const samlConfigSchema = z.object({
  name: z.string().min(1).max(100),
  idpUrl: z.string().url(),
  idpCert: z.string().min(1),
  spCert: z.string().min(1),
  spKey: z.string().min(1),
  spEntityId: z.string().min(1),
  acsUrl: z.string().url(),
  sloUrl: z.string().url().optional(),
  nameIdFormat: z.string().optional().default('urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'),
  attributeMapping: z.object({
    email: z.string().optional(),
    name: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }).optional(),
  isEnabled: z.boolean().optional().default(false),
});

// GET /api/saml/config - Get SAML configuration for organization
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    const hasAccess = await hasOrgAccess(session.user.id, orgId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const samlConfig = await prisma.sAMLConfig.findUnique({
      where: { orgId },
      select: {
        id: true,
        name: true,
        idpUrl: true,
        spEntityId: true,
        acsUrl: true,
        sloUrl: true,
        nameIdFormat: true,
        attributeMapping: true,
        isEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!samlConfig) {
      return NextResponse.json({ error: 'SAML configuration not found' }, { status: 404 });
    }

    return NextResponse.json(samlConfig);
  } catch (error) {
    console.error('Error fetching SAML config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/saml/config - Create or update SAML configuration
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { orgId, ...configData } = body;

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    const isAdmin = await isOrgAdmin(session.user.id, orgId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const validatedData = samlConfigSchema.parse(configData);

    // Check if SAML config already exists
    const existingConfig = await prisma.sAMLConfig.findUnique({
      where: { orgId },
    });

    let samlConfig;
    if (existingConfig) {
      // Update existing config
      samlConfig = await prisma.sAMLConfig.update({
        where: { orgId },
        data: {
          ...validatedData,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          idpUrl: true,
          spEntityId: true,
          acsUrl: true,
          sloUrl: true,
          nameIdFormat: true,
          attributeMapping: true,
          isEnabled: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Log SAML config update
      await createAuditLog({
        action: AuditAction.ORG_UPDATED,
        orgId,
        userId: session.user.id,
        meta: { 
          type: 'saml_config_updated',
          name: samlConfig.name,
          isEnabled: samlConfig.isEnabled,
        },
      });
    } else {
      // Create new config
      samlConfig = await prisma.sAMLConfig.create({
        data: {
          orgId,
          ...validatedData,
        },
        select: {
          id: true,
          name: true,
          idpUrl: true,
          spEntityId: true,
          acsUrl: true,
          sloUrl: true,
          nameIdFormat: true,
          attributeMapping: true,
          isEnabled: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Log SAML config creation
      await createAuditLog({
        action: AuditAction.ORG_UPDATED,
        orgId,
        userId: session.user.id,
        meta: { 
          type: 'saml_config_created',
          name: samlConfig.name,
          isEnabled: samlConfig.isEnabled,
        },
      });
    }

    return NextResponse.json(samlConfig, { status: existingConfig ? 200 : 201 });
  } catch (error) {
    console.error('Error creating/updating SAML config:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/saml/config - Delete SAML configuration
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    const isAdmin = await isOrgAdmin(session.user.id, orgId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingConfig = await prisma.sAMLConfig.findUnique({
      where: { orgId },
    });

    if (!existingConfig) {
      return NextResponse.json({ error: 'SAML configuration not found' }, { status: 404 });
    }

    await prisma.sAMLConfig.delete({
      where: { orgId },
    });

    // Log SAML config deletion
    await createAuditLog({
      action: AuditAction.ORG_UPDATED,
      orgId,
      userId: session.user.id,
      meta: { 
        type: 'saml_config_deleted',
        name: existingConfig.name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting SAML config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
