import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import dns from 'dns';
import { promisify } from 'util';

const resolveCname = promisify(dns.resolveCname);
const resolveTxt = promisify(dns.resolveTxt);

interface DomainVerificationResult {
  verified: boolean;
  cnameRecord?: string;
  expectedCname: string;
  txtRecord?: string;
  expectedTxt: string;
  error?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const statusPage = await prisma.statusPage.findUnique({
      where: { id },
      include: {
        org: {
          include: {
            memberships: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!statusPage) {
      return NextResponse.json({ error: 'Status page not found' }, { status: 404 });
    }

    // Check if user has access
    const membership = statusPage.org.memberships[0];
    if (!membership || membership.role === 'VIEWER' as any) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!statusPage.customDomain) {
      return NextResponse.json(
        { error: 'No custom domain configured' },
        { status: 400 }
      );
    }

    // Perform DNS verification
    const result = await verifyCustomDomain(statusPage.customDomain, statusPage.id);

    if (result.verified) {
      // Update status page to mark domain as verified
      await prisma.statusPage.update({
        where: { id },
        data: {
          customDomain: statusPage.customDomain,
          // Store verification status in metadata if needed
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          orgId: statusPage.orgId,
          userId: session.user.id,
          action: 'DOMAIN_VERIFIED',
          targetId: statusPage.id,
          meta: {
            domain: statusPage.customDomain,
          },
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to verify domain:', error);
    return NextResponse.json(
      { error: 'Failed to verify domain', details: (error as Error).message },
      { status: 500 }
    );
  }
}

async function verifyCustomDomain(
  domain: string,
  statusPageId: string
): Promise<DomainVerificationResult> {
  const expectedCname = process.env.CUSTOM_DOMAIN_CNAME || 'status.saturn.co';
  const expectedTxt = `saturn-verification=${statusPageId}`;

  const result: DomainVerificationResult = {
    verified: false,
    expectedCname,
    expectedTxt,
  };

  try {
    // Check CNAME record
    try {
      const cnameRecords = await resolveCname(domain);
      result.cnameRecord = cnameRecords[0];

      if (cnameRecords.some(record => record === expectedCname || record.endsWith(expectedCname))) {
        result.verified = true;
      }
    } catch (cnameError: any) {
      if (cnameError.code !== 'ENODATA' && cnameError.code !== 'ENOTFOUND') {
        throw cnameError;
      }
      result.error = 'CNAME record not found';
    }

    // Alternative: Check TXT record for verification
    try {
      const txtRecords = await resolveTxt(domain);
      const flatTxtRecords = txtRecords.flat();
      result.txtRecord = flatTxtRecords.join('; ');

      if (flatTxtRecords.some(record => record.includes(expectedTxt))) {
        result.verified = true;
      }
    } catch (txtError: any) {
      if (txtError.code !== 'ENODATA' && txtError.code !== 'ENOTFOUND') {
        console.error('TXT lookup error:', txtError);
      }
    }

    if (!result.verified && !result.error) {
      result.error = 'DNS records do not match expected values';
    }

    return result;
  } catch (error) {
    console.error('Domain verification error:', error);
    return {
      verified: false,
      expectedCname,
      expectedTxt,
      error: `DNS verification failed: ${(error as Error).message}`,
    };
  }
}

