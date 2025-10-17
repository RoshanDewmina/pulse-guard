import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@tokiflow/db';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@tokiflow/db', () => ({
  prisma: {
    membership: {
      findUnique: jest.fn(),
    },
    incident: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    incidentEvent: {
      create: jest.fn(),
    },
    alertChannel: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('@/lib/slack/threading', () => ({
  updateIncidentMessage: jest.fn(() => Promise.resolve()),
  postAcknowledgmentReply: jest.fn(() => Promise.resolve()),
  postResolutionReply: jest.fn(() => Promise.resolve()),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('/api/incidents - Incident Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET - List Incidents', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const { GET } = await import('@/app/api/incidents/route');
      const request = new NextRequest('http://localhost:3000/api/incidents?orgId=org-1');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 if orgId is missing', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      const { GET } = await import('@/app/api/incidents/route');
      const request = new NextRequest('http://localhost:3000/api/incidents');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('orgId is required');
    });

    it('should return 403 if user lacks access', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      (prisma.membership.findUnique as jest.Mock).mockResolvedValue(null);

      const { GET } = await import('@/app/api/incidents/route');
      const request = new NextRequest('http://localhost:3000/api/incidents?orgId=org-1');
      const response = await GET(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Access denied');
    });

    it('should list all incidents for organization', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        orgId: 'org-1',
        role: 'OWNER',
      });

      const mockIncidents = [
        {
          id: 'inc-1',
          kind: 'MISSED',
          status: 'OPEN',
          openedAt: new Date('2024-10-15T10:00:00Z'),
          Monitor: {
            id: 'mon-1',
            name: 'API Health Check',
            status: 'MISSED',
          },
        },
        {
          id: 'inc-2',
          kind: 'FAIL',
          status: 'ACKED',
          openedAt: new Date('2024-10-15T09:00:00Z'),
          acknowledgedAt: new Date('2024-10-15T09:05:00Z'),
          Monitor: {
            id: 'mon-2',
            name: 'Database Backup',
            status: 'FAILING',
          },
        },
      ];

      (prisma.incident.findMany as jest.Mock).mockResolvedValue(mockIncidents);

      const { GET } = await import('@/app/api/incidents/route');
      const request = new NextRequest('http://localhost:3000/api/incidents?orgId=org-1');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.incidents).toHaveLength(2);
      expect(data.incidents[0].kind).toBe('MISSED');
      expect(data.incidents[1].kind).toBe('FAIL');
    });

    it('should filter incidents by status', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        orgId: 'org-1',
      });

      (prisma.incident.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'inc-1',
          status: 'OPEN',
          Monitor: { id: 'mon-1', name: 'Test', status: 'MISSED' },
        },
      ]);

      const { GET } = await import('@/app/api/incidents/route');
      const request = new NextRequest('http://localhost:3000/api/incidents?orgId=org-1&status=OPEN');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(prisma.incident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'OPEN',
          }),
        })
      );
    });

    it('should filter incidents by kind', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        orgId: 'org-1',
      });

      (prisma.incident.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'inc-1',
          kind: 'MISSED',
          Monitor: { id: 'mon-1', name: 'Test', status: 'MISSED' },
        },
      ]);

      const { GET } = await import('@/app/api/incidents/route');
      const request = new NextRequest('http://localhost:3000/api/incidents?orgId=org-1&kind=MISSED');
      await GET(request);

      expect(prisma.incident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            kind: 'MISSED',
          }),
        })
      );
    });

    it('should respect limit parameter', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        orgId: 'org-1',
      });

      (prisma.incident.findMany as jest.Mock).mockResolvedValue([]);

      const { GET } = await import('@/app/api/incidents/route');
      const request = new NextRequest('http://localhost:3000/api/incidents?orgId=org-1&limit=50');
      await GET(request);

      expect(prisma.incident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });
  });

  describe('POST /api/incidents/[id]/ack - Acknowledge Incident', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);
    });

    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const { POST } = await import('@/app/api/incidents/[id]/ack/route');
      const request = new NextRequest('http://localhost:3000/api/incidents/inc-1/ack', {
        method: 'POST',
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'inc-1' }) });

      expect(response.status).toBe(401);
    });

    it('should return 404 if incident not found', async () => {
      (prisma.incident.findUnique as jest.Mock).mockResolvedValue(null);

      const { POST } = await import('@/app/api/incidents/[id]/ack/route');
      const request = new NextRequest('http://localhost:3000/api/incidents/inc-1/ack', {
        method: 'POST',
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'inc-1' }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Incident not found');
    });

    it('should return 403 if user lacks access', async () => {
      (prisma.incident.findUnique as jest.Mock).mockResolvedValue({
        id: 'inc-1',
        Monitor: { orgId: 'org-1' },
      });

      (prisma.membership.findUnique as jest.Mock).mockResolvedValue(null);

      const { POST } = await import('@/app/api/incidents/[id]/ack/route');
      const request = new NextRequest('http://localhost:3000/api/incidents/inc-1/ack', {
        method: 'POST',
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'inc-1' }) });

      expect(response.status).toBe(403);
    });

    it('should successfully acknowledge incident', async () => {
      const mockIncident = {
        id: 'inc-1',
        status: 'OPEN',
        Monitor: { id: 'mon-1', orgId: 'org-1', name: 'Test Monitor' },
      };

      (prisma.incident.findUnique as jest.Mock).mockResolvedValue(mockIncident);

      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        orgId: 'org-1',
      });

      const updatedIncident = {
        ...mockIncident,
        status: 'ACKED',
        acknowledgedAt: new Date(),
      };

      (prisma.incident.update as jest.Mock).mockResolvedValue(updatedIncident);
      (prisma.incidentEvent.create as jest.Mock).mockResolvedValue({});
      (prisma.alertChannel.findFirst as jest.Mock).mockResolvedValue(null);

      const { POST } = await import('@/app/api/incidents/[id]/ack/route');
      const request = new NextRequest('http://localhost:3000/api/incidents/inc-1/ack', {
        method: 'POST',
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'inc-1' }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.incident.status).toBe('ACKED');
      expect(data.incident.acknowledgedAt).toBeDefined();

      // Verify incident was updated
      expect(prisma.incident.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inc-1' },
          data: expect.objectContaining({
            status: 'ACKED',
          }),
        })
      );

      // Verify event was created
      expect(prisma.incidentEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            incidentId: 'inc-1',
            eventType: 'acknowledged',
            message: expect.stringContaining('test@example.com'),
          }),
        })
      );
    });

    it('should update Slack message if available', async () => {
      const mockIncident = {
        id: 'inc-1',
        status: 'OPEN',
        slackMessageTs: '1234567890.123456',
        slackChannelId: 'C12345',
        Monitor: { id: 'mon-1', orgId: 'org-1' },
      };

      (prisma.incident.findUnique as jest.Mock).mockResolvedValue(mockIncident);
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ orgId: 'org-1' });
      (prisma.incident.update as jest.Mock).mockResolvedValue({
        ...mockIncident,
        status: 'ACKED',
      });
      (prisma.incidentEvent.create as jest.Mock).mockResolvedValue({});
      (prisma.alertChannel.findFirst as jest.Mock).mockResolvedValue({
        type: 'SLACK',
        configJson: { accessToken: 'xoxb-slack-token' },
      });

      const { updateIncidentMessage, postAcknowledgmentReply } = await import(
        '@/lib/slack/threading'
      );

      const { POST } = await import('@/app/api/incidents/[id]/ack/route');
      const request = new NextRequest('http://localhost:3000/api/incidents/inc-1/ack', {
        method: 'POST',
      });
      await POST(request, { params: Promise.resolve({ id: 'inc-1' }) });

      // Slack functions should be called (async)
      expect(updateIncidentMessage).toHaveBeenCalled();
      expect(postAcknowledgmentReply).toHaveBeenCalled();
    });
  });

  describe('POST /api/incidents/[id]/resolve - Resolve Incident', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);
    });

    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const { POST } = await import('@/app/api/incidents/[id]/resolve/route');
      const request = new NextRequest('http://localhost:3000/api/incidents/inc-1/resolve', {
        method: 'POST',
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'inc-1' }) });

      expect(response.status).toBe(401);
    });

    it('should return 404 if incident not found', async () => {
      (prisma.incident.findUnique as jest.Mock).mockResolvedValue(null);

      const { POST } = await import('@/app/api/incidents/[id]/resolve/route');
      const request = new NextRequest('http://localhost:3000/api/incidents/inc-1/resolve', {
        method: 'POST',
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'inc-1' }) });

      expect(response.status).toBe(404);
    });

    it('should successfully resolve incident', async () => {
      const mockIncident = {
        id: 'inc-1',
        status: 'ACKED',
        Monitor: { id: 'mon-1', orgId: 'org-1', name: 'Test Monitor' },
      };

      (prisma.incident.findUnique as jest.Mock).mockResolvedValue(mockIncident);
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        orgId: 'org-1',
      });

      const resolvedIncident = {
        ...mockIncident,
        status: 'RESOLVED',
        resolvedAt: new Date(),
      };

      (prisma.incident.update as jest.Mock).mockResolvedValue(resolvedIncident);
      (prisma.incidentEvent.create as jest.Mock).mockResolvedValue({});
      (prisma.alertChannel.findFirst as jest.Mock).mockResolvedValue(null);

      const { POST } = await import('@/app/api/incidents/[id]/resolve/route');
      const request = new NextRequest('http://localhost:3000/api/incidents/inc-1/resolve', {
        method: 'POST',
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'inc-1' }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.incident.status).toBe('RESOLVED');
      expect(data.incident.resolvedAt).toBeDefined();

      // Verify incident was resolved
      expect(prisma.incident.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inc-1' },
          data: expect.objectContaining({
            status: 'RESOLVED',
          }),
        })
      );

      // Verify event was created
      expect(prisma.incidentEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'resolved',
            message: expect.stringContaining('test@example.com'),
          }),
        })
      );
    });

    it('should update Slack message on resolution', async () => {
      const mockIncident = {
        id: 'inc-1',
        status: 'OPEN',
        slackMessageTs: '1234567890.123456',
        slackChannelId: 'C12345',
        Monitor: { id: 'mon-1', orgId: 'org-1' },
      };

      (prisma.incident.findUnique as jest.Mock).mockResolvedValue(mockIncident);
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ orgId: 'org-1' });
      (prisma.incident.update as jest.Mock).mockResolvedValue({
        ...mockIncident,
        status: 'RESOLVED',
      });
      (prisma.incidentEvent.create as jest.Mock).mockResolvedValue({});
      (prisma.alertChannel.findFirst as jest.Mock).mockResolvedValue({
        type: 'SLACK',
        configJson: { accessToken: 'xoxb-slack-token' },
      });

      const { updateIncidentMessage, postResolutionReply } = await import('@/lib/slack/threading');

      const { POST } = await import('@/app/api/incidents/[id]/resolve/route');
      const request = new NextRequest('http://localhost:3000/api/incidents/inc-1/resolve', {
        method: 'POST',
      });
      await POST(request, { params: Promise.resolve({ id: 'inc-1' }) });

      // Slack functions should be called
      expect(updateIncidentMessage).toHaveBeenCalled();
      expect(postResolutionReply).toHaveBeenCalled();
    });
  });
});

