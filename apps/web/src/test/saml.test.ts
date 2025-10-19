import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getSAMLConfig, POST as createSAMLConfig, DELETE as deleteSAMLConfig } from '@/app/api/saml/config/route';
import { POST as testSAMLConfig } from '@/app/api/saml/test/route';
import { prisma } from '@tokiflow/db';

// Mock NextAuth
const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
};

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve(mockSession)),
}));

describe('SAML Configuration API Endpoints', () => {
  let testOrgId: string;
  let testSAMLConfigId: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.sAMLConfig.deleteMany({
      where: { orgId: 'test-org-id' },
    });
    await prisma.org.deleteMany({
      where: { name: 'Test Org' },
    });

    // Create test organization
    const org = await prisma.org.create({
      data: {
        id: 'test-org-id',
        name: 'Test Org',
        slug: 'test-org',
      },
    });
    testOrgId = org.id;

    // Create membership
    await prisma.membership.create({
      data: {
        id: 'test-membership-id',
        userId: 'test-user-id',
        orgId: testOrgId,
        role: 'ADMIN',
        updatedAt: new Date(),
      },
    });

    // Create test SAML config
    const samlConfig = await prisma.sAMLConfig.create({
      data: {
        id: 'test-saml-config-id',
        orgId: testOrgId,
        name: 'Test SAML Config',
        idpUrl: 'https://test-idp.com/sso/saml',
        idpCert: '-----BEGIN CERTIFICATE-----\nTEST_CERT\n-----END CERTIFICATE-----',
        spCert: '-----BEGIN CERTIFICATE-----\nSP_CERT\n-----END CERTIFICATE-----',
        spKey: '-----BEGIN PRIVATE KEY-----\nSP_KEY\n-----END PRIVATE KEY-----',
        spEntityId: 'urn:test:sp',
        acsUrl: 'https://test-app.com/api/auth/callback/saml',
        sloUrl: 'https://test-app.com/api/auth/signout/saml',
        nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        attributeMapping: {
          email: 'email',
          name: 'name',
          firstName: 'given_name',
          lastName: 'family_name',
        },
        isEnabled: false,
      },
    });
    testSAMLConfigId = samlConfig.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.sAMLConfig.deleteMany({
      where: { orgId: 'test-org-id' },
    });
    await prisma.org.deleteMany({
      where: { name: 'Test Org' },
    });
  });

  describe('GET /api/saml/config', () => {
    it('should get SAML configuration for organization', async () => {
      const request = new NextRequest(`http://localhost:3000/api/saml/config?orgId=${testOrgId}`);

      const response = await getSAMLConfig(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(testSAMLConfigId);
      expect(data.name).toBe('Test SAML Config');
      expect(data.idpUrl).toBe('https://test-idp.com/sso/saml');
      expect(data.spEntityId).toBe('urn:test:sp');
      expect(data.acsUrl).toBe('https://test-app.com/api/auth/callback/saml');
      expect(data.isEnabled).toBe(false);
    });

    it('should return 404 if SAML config not found', async () => {
      const request = new NextRequest('http://localhost:3000/api/saml/config?orgId=non-existent-org');

      const response = await getSAMLConfig(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('SAML configuration not found');
    });
  });

  describe('POST /api/saml/config', () => {
    it('should create new SAML configuration', async () => {
      const request = new NextRequest('http://localhost:3000/api/saml/config', {
        method: 'POST',
        body: JSON.stringify({
          orgId: testOrgId,
          name: 'New SAML Config',
          idpUrl: 'https://new-idp.com/sso/saml',
          idpCert: '-----BEGIN CERTIFICATE-----\nNEW_IDP_CERT\n-----END CERTIFICATE-----',
          spCert: '-----BEGIN CERTIFICATE-----\nNEW_SP_CERT\n-----END CERTIFICATE-----',
          spKey: '-----BEGIN PRIVATE KEY-----\nNEW_SP_KEY\n-----END PRIVATE KEY-----',
          spEntityId: 'urn:new:sp',
          acsUrl: 'https://new-app.com/api/auth/callback/saml',
          sloUrl: 'https://new-app.com/api/auth/signout/saml',
          nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
          attributeMapping: {
            email: 'email',
            name: 'name',
          },
          isEnabled: false,
        }),
      });

      const response = await createSAMLConfig(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data.name).toBe('New SAML Config');
      expect(data.idpUrl).toBe('https://new-idp.com/sso/saml');
      expect(data.spEntityId).toBe('urn:new:sp');
      expect(data.isEnabled).toBe(false);
    });

    it('should update existing SAML configuration', async () => {
      const request = new NextRequest('http://localhost:3000/api/saml/config', {
        method: 'POST',
        body: JSON.stringify({
          orgId: testOrgId,
          name: 'Updated SAML Config',
          idpUrl: 'https://updated-idp.com/sso/saml',
          idpCert: '-----BEGIN CERTIFICATE-----\nUPDATED_IDP_CERT\n-----END CERTIFICATE-----',
          spCert: '-----BEGIN CERTIFICATE-----\nUPDATED_SP_CERT\n-----END CERTIFICATE-----',
          spKey: '-----BEGIN PRIVATE KEY-----\nUPDATED_SP_KEY\n-----END PRIVATE KEY-----',
          spEntityId: 'urn:updated:sp',
          acsUrl: 'https://updated-app.com/api/auth/callback/saml',
          isEnabled: true,
        }),
      });

      const response = await createSAMLConfig(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Updated SAML Config');
      expect(data.idpUrl).toBe('https://updated-idp.com/sso/saml');
      expect(data.isEnabled).toBe(true);
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/saml/config', {
        method: 'POST',
        body: JSON.stringify({
          orgId: testOrgId,
          // Missing required fields
        }),
      });

      const response = await createSAMLConfig(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid input');
    });

    it('should validate URL formats', async () => {
      const request = new NextRequest('http://localhost:3000/api/saml/config', {
        method: 'POST',
        body: JSON.stringify({
          orgId: testOrgId,
          name: 'Invalid URL Config',
          idpUrl: 'invalid-url',
          idpCert: '-----BEGIN CERTIFICATE-----\nCERT\n-----END CERTIFICATE-----',
          spCert: '-----BEGIN CERTIFICATE-----\nCERT\n-----END CERTIFICATE-----',
          spKey: '-----BEGIN PRIVATE KEY-----\nKEY\n-----END PRIVATE KEY-----',
          spEntityId: 'urn:test:sp',
          acsUrl: 'invalid-url',
        }),
      });

      const response = await createSAMLConfig(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid input');
    });
  });

  describe('DELETE /api/saml/config', () => {
    it('should delete SAML configuration', async () => {
      const request = new NextRequest(`http://localhost:3000/api/saml/config?orgId=${testOrgId}`, {
        method: 'DELETE',
      });

      const response = await deleteSAMLConfig(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify it's deleted
      const deletedConfig = await prisma.sAMLConfig.findUnique({
        where: { orgId: testOrgId },
      });
      expect(deletedConfig).toBeNull();
    });

    it('should return 404 if SAML config not found', async () => {
      const request = new NextRequest('http://localhost:3000/api/saml/config?orgId=non-existent-org', {
        method: 'DELETE',
      });

      const response = await deleteSAMLConfig(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('SAML configuration not found');
    });
  });

  describe('POST /api/saml/test', () => {
    it('should test valid SAML configuration', async () => {
      const request = new NextRequest('http://localhost:3000/api/saml/test', {
        method: 'POST',
        body: JSON.stringify({
          orgId: testOrgId,
          idpUrl: 'https://test-idp.com/sso/saml',
          idpCert: '-----BEGIN CERTIFICATE-----\nTEST_CERT\n-----END CERTIFICATE-----',
          spCert: '-----BEGIN CERTIFICATE-----\nSP_CERT\n-----END CERTIFICATE-----',
          spKey: '-----BEGIN PRIVATE KEY-----\nSP_KEY\n-----END PRIVATE KEY-----',
          spEntityId: 'urn:test:sp',
          acsUrl: 'https://test-app.com/api/auth/callback/saml',
        }),
      });

      const response = await testSAMLConfig(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('SAML configuration is valid');
      expect(data.validation).toHaveProperty('idpUrl');
      expect(data.validation).toHaveProperty('certificates');
      expect(data.validation).toHaveProperty('entityId');
      expect(data.validation).toHaveProperty('acsUrl');
    });

    it('should detect invalid URL formats', async () => {
      const request = new NextRequest('http://localhost:3000/api/saml/test', {
        method: 'POST',
        body: JSON.stringify({
          orgId: testOrgId,
          idpUrl: 'invalid-url',
          idpCert: '-----BEGIN CERTIFICATE-----\nTEST_CERT\n-----END CERTIFICATE-----',
          spCert: '-----BEGIN CERTIFICATE-----\nSP_CERT\n-----END CERTIFICATE-----',
          spKey: '-----BEGIN PRIVATE KEY-----\nSP_KEY\n-----END PRIVATE KEY-----',
          spEntityId: 'urn:test:sp',
          acsUrl: 'invalid-url',
        }),
      });

      const response = await testSAMLConfig(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.message).toBe('SAML configuration has errors');
      expect(data.validation.idpUrl.valid).toBe(false);
      expect(data.validation.acsUrl.valid).toBe(false);
    });

    it('should detect invalid certificate formats', async () => {
      const request = new NextRequest('http://localhost:3000/api/saml/test', {
        method: 'POST',
        body: JSON.stringify({
          orgId: testOrgId,
          idpUrl: 'https://test-idp.com/sso/saml',
          idpCert: 'invalid-cert',
          spCert: 'invalid-cert',
          spKey: 'invalid-key',
          spEntityId: 'urn:test:sp',
          acsUrl: 'https://test-app.com/api/auth/callback/saml',
        }),
      });

      const response = await testSAMLConfig(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.validation.certificates.valid).toBe(false);
    });

    it('should detect invalid entity ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/saml/test', {
        method: 'POST',
        body: JSON.stringify({
          orgId: testOrgId,
          idpUrl: 'https://test-idp.com/sso/saml',
          idpCert: '-----BEGIN CERTIFICATE-----\nTEST_CERT\n-----END CERTIFICATE-----',
          spCert: '-----BEGIN CERTIFICATE-----\nSP_CERT\n-----END CERTIFICATE-----',
          spKey: '-----BEGIN PRIVATE KEY-----\nSP_KEY\n-----END PRIVATE KEY-----',
          spEntityId: 'ab', // Too short
          acsUrl: 'https://test-app.com/api/auth/callback/saml',
        }),
      });

      const response = await testSAMLConfig(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.validation.entityId.valid).toBe(false);
    });
  });
});
