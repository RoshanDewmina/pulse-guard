import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendTeamsOpened, sendTeamsAcknowledged, sendTeamsResolved } from '../alerts/teams';
import axios from 'axios';

// Mock dependencies
vi.mock('axios');
vi.mock('@tokiflow/db', () => ({
  prisma: {
    incident: {
      findUnique: vi.fn(),
    },
    alertChannel: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

import { prisma } from '@tokiflow/db';

describe('Teams integration', () => {
  const mockIncident = {
    id: 'incident-123',
    status: 'OPEN',
    kind: 'MISSED',
    summary: 'Monitor failed',
    details: 'Job did not run on time',
    openedAt: new Date('2023-01-01T00:00:00Z'),
    acknowledgedAt: null,
    resolvedAt: null,
    monitor: {
      id: 'monitor-123',
      name: 'Test Monitor',
      org: {
        name: 'Test Org',
      },
    },
  };

  const mockChannel = {
    id: 'channel-123',
    type: 'TEAMS',
    configJson: {
      webhookUrl: 'https://outlook.office.com/webhook/test-webhook',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TEAMS_ENABLED = 'true';
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.saturn.sh';
  });

  describe('sendTeamsOpened', () => {
    it('should send opened event successfully', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (axios.post as any).mockResolvedValue({
        status: 200,
        data: { success: true },
      });

      await sendTeamsOpened('incident-123', 'channel-123');

      expect(axios.post).toHaveBeenCalledWith(
        'https://outlook.office.com/webhook/test-webhook',
        expect.objectContaining({
          type: 'message',
          attachments: expect.arrayContaining([
            expect.objectContaining({
              contentType: 'application/vnd.microsoft.card.adaptive',
              content: expect.objectContaining({
                type: 'AdaptiveCard',
                version: '1.4',
                body: expect.arrayContaining([
                  expect.objectContaining({
                    type: 'Container',
                    style: 'emphasis',
                    items: expect.arrayContaining([
                      expect.objectContaining({
                        text: '🚫 Incident Opened: Test Monitor',
                        size: 'large',
                        weight: 'bolder',
                        color: 'attention',
                      }),
                      expect.objectContaining({
                        text: 'Monitor failed',
                        size: 'medium',
                      }),
                    ]),
                  }),
                  expect.objectContaining({
                    type: 'FactSet',
                    facts: expect.arrayContaining([
                      expect.objectContaining({
                        title: 'Monitor',
                        value: 'Test Monitor',
                      }),
                      expect.objectContaining({
                        title: 'Organization',
                        value: 'Test Org',
                      }),
                      expect.objectContaining({
                        title: 'Type',
                        value: 'MISSED',
                      }),
                      expect.objectContaining({
                        title: 'Status',
                        value: 'OPEN',
                      }),
                    ]),
                  }),
                ]),
                actions: expect.arrayContaining([
                  expect.objectContaining({
                    type: 'Action.OpenUrl',
                    title: 'View Incident',
                    url: 'https://app.saturn.sh/app/incidents/incident-123',
                  }),
                  expect.objectContaining({
                    type: 'Action.OpenUrl',
                    title: 'View Monitor',
                    url: 'https://app.saturn.sh/app/monitors/monitor-123',
                  }),
                ]),
              }),
            }),
          ]),
        }),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        })
      );
    });

    it('should skip if Teams disabled', async () => {
      process.env.TEAMS_ENABLED = 'false';

      await sendTeamsOpened('incident-123', 'channel-123');

      expect(prisma.incident.findUnique).not.toHaveBeenCalled();
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should throw error if incident not found', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(null);

      await expect(sendTeamsOpened('incident-123', 'channel-123'))
        .rejects.toThrow('Incident incident-123 not found');
    });

    it('should throw error if channel not found', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(null);

      await expect(sendTeamsOpened('incident-123', 'channel-123'))
        .rejects.toThrow('Invalid Teams channel channel-123');
    });

    it('should throw error if channel is not Teams type', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue({
        ...mockChannel,
        type: 'SLACK',
      });

      await expect(sendTeamsOpened('incident-123', 'channel-123'))
        .rejects.toThrow('Invalid Teams channel channel-123');
    });

    it('should handle API errors', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (axios.post as any).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 400,
          data: { error: 'Invalid webhook URL' },
        },
      });

      await expect(sendTeamsOpened('incident-123', 'channel-123'))
        .rejects.toThrow('Teams webhook error: 400 - {"error":"Invalid webhook URL"}');
    });

    it('should include details section when incident has details', async () => {
      const incidentWithDetails = {
        ...mockIncident,
        details: 'This is a detailed error message that explains what went wrong.',
      };

      (prisma.incident.findUnique as any).mockResolvedValue(incidentWithDetails);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (axios.post as any).mockResolvedValue({ status: 200, data: {} });

      await sendTeamsOpened('incident-123', 'channel-123');

      const callArgs = (axios.post as any).mock.calls[0][1];
      const card = callArgs.attachments[0].content;
      
      expect(card.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'TextBlock',
            text: 'Details',
            weight: 'bolder',
          }),
          expect.objectContaining({
            type: 'TextBlock',
            text: 'This is a detailed error message that explains what went wrong.',
            wrap: true,
          }),
        ])
      );
    });

    it('should truncate long details', async () => {
      const longDetails = 'a'.repeat(600);
      const incidentWithLongDetails = {
        ...mockIncident,
        details: longDetails,
      };

      (prisma.incident.findUnique as any).mockResolvedValue(incidentWithLongDetails);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (axios.post as any).mockResolvedValue({ status: 200, data: {} });

      await sendTeamsOpened('incident-123', 'channel-123');

      const callArgs = (axios.post as any).mock.calls[0][1];
      const card = callArgs.attachments[0].content;
      const detailsTextBlock = card.body.find((item: any) => item.text === 'Details');
      const detailsContent = card.body.find((item: any) => item.text?.startsWith('a'));
      
      expect(detailsContent.text).toHaveLength(503); // 500 + '...'
      expect(detailsContent.text).toEndWith('...');
    });
  });

  describe('sendTeamsAcknowledged', () => {
    it('should send acknowledged event successfully', async () => {
      const acknowledgedIncident = {
        ...mockIncident,
        status: 'ACKED',
        acknowledgedAt: new Date('2023-01-01T01:00:00Z'),
      };

      (prisma.incident.findUnique as any).mockResolvedValue(acknowledgedIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (axios.post as any).mockResolvedValue({
        status: 200,
        data: { success: true },
      });

      await sendTeamsAcknowledged('incident-123', 'channel-123');

      const callArgs = (axios.post as any).mock.calls[0][1];
      const card = callArgs.attachments[0].content;
      const titleBlock = card.body[0].items[0];

      expect(titleBlock.text).toBe('👀 Incident Acknowledged: Test Monitor');
      expect(titleBlock.color).toBe('warning');
    });

    it('should skip if Teams disabled', async () => {
      process.env.TEAMS_ENABLED = 'false';

      await sendTeamsAcknowledged('incident-123', 'channel-123');

      expect(prisma.incident.findUnique).not.toHaveBeenCalled();
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe('sendTeamsResolved', () => {
    it('should send resolved event successfully', async () => {
      const resolvedIncident = {
        ...mockIncident,
        status: 'RESOLVED',
        resolvedAt: new Date('2023-01-01T02:00:00Z'),
      };

      (prisma.incident.findUnique as any).mockResolvedValue(resolvedIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (axios.post as any).mockResolvedValue({
        status: 200,
        data: { success: true },
      });

      await sendTeamsResolved('incident-123', 'channel-123');

      const callArgs = (axios.post as any).mock.calls[0][1];
      const card = callArgs.attachments[0].content;
      const titleBlock = card.body[0].items[0];

      expect(titleBlock.text).toBe('✅ Incident Resolved: Test Monitor');
      expect(titleBlock.color).toBe('good');
    });

    it('should skip if Teams disabled', async () => {
      process.env.TEAMS_ENABLED = 'false';

      await sendTeamsResolved('incident-123', 'channel-123');

      expect(prisma.incident.findUnique).not.toHaveBeenCalled();
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe('color and emoji mapping', () => {
    it('should map incident kinds to correct emojis', async () => {
      const testCases = [
        { kind: 'MISSED', expectedEmoji: '🚫' },
        { kind: 'FAIL', expectedEmoji: '❌' },
        { kind: 'LATE', expectedEmoji: '⏰' },
        { kind: 'ANOMALY', expectedEmoji: '⚠️' },
        { kind: 'UNKNOWN', expectedEmoji: '🔔' },
      ];

      for (const { kind, expectedEmoji } of testCases) {
        vi.clearAllMocks();
        (prisma.incident.findUnique as any).mockResolvedValue({
          ...mockIncident,
          kind,
        });
        (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
        (axios.post as any).mockResolvedValue({ status: 200, data: {} });

        await sendTeamsOpened('incident-123', 'channel-123');

        const callArgs = (axios.post as any).mock.calls[0][1];
        const card = callArgs.attachments[0].content;
        const titleBlock = card.body[0].items[0];

        expect(titleBlock.text).toContain(expectedEmoji);
      }
    });

    it('should map status to correct colors', async () => {
      const testCases = [
        { status: 'OPEN', kind: 'MISSED', expectedColor: 'attention' },
        { status: 'ACKED', kind: 'MISSED', expectedColor: 'warning' },
        { status: 'RESOLVED', kind: 'MISSED', expectedColor: 'good' },
      ];

      for (const { status, kind, expectedColor } of testCases) {
        vi.clearAllMocks();
        (prisma.incident.findUnique as any).mockResolvedValue({
          ...mockIncident,
          status,
          kind,
        });
        (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
        (axios.post as any).mockResolvedValue({ status: 200, data: {} });

        await sendTeamsOpened('incident-123', 'channel-123');

        const callArgs = (axios.post as any).mock.calls[0][1];
        const card = callArgs.attachments[0].content;
        const titleBlock = card.body[0].items[0];

        expect(titleBlock.color).toBe(expectedColor);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle missing app URL environment variable', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;

      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (axios.post as any).mockResolvedValue({ status: 200, data: {} });

      await sendTeamsOpened('incident-123', 'channel-123');

      const callArgs = (axios.post as any).mock.calls[0][1];
      const card = callArgs.attachments[0].content;
      const actions = card.actions;

      expect(actions[0].url).toBe('https://app.saturn.sh/app/incidents/incident-123');
      expect(actions[1].url).toBe('https://app.saturn.sh/app/monitors/monitor-123');
    });

    it('should handle incident without details', async () => {
      const incidentWithoutDetails = {
        ...mockIncident,
        details: null,
      };

      (prisma.incident.findUnique as any).mockResolvedValue(incidentWithoutDetails);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (axios.post as any).mockResolvedValue({ status: 200, data: {} });

      await sendTeamsOpened('incident-123', 'channel-123');

      const callArgs = (axios.post as any).mock.calls[0][1];
      const card = callArgs.attachments[0].content;
      const detailsSection = card.body.find((item: any) => item.text === 'Details');

      expect(detailsSection).toBeUndefined();
    });

    it('should include acknowledged and resolved timestamps when available', async () => {
      const incidentWithTimestamps = {
        ...mockIncident,
        status: 'RESOLVED',
        acknowledgedAt: new Date('2023-01-01T01:00:00Z'),
        resolvedAt: new Date('2023-01-01T02:00:00Z'),
      };

      (prisma.incident.findUnique as any).mockResolvedValue(incidentWithTimestamps);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (axios.post as any).mockResolvedValue({ status: 200, data: {} });

      await sendTeamsOpened('incident-123', 'channel-123');

      const callArgs = (axios.post as any).mock.calls[0][1];
      const card = callArgs.attachments[0].content;
      const facts = card.body[1].facts;

      expect(facts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Acknowledged',
            value: '1/1/2023, 1:00:00 AM',
          }),
          expect.objectContaining({
            title: 'Resolved',
            value: '1/1/2023, 2:00:00 AM',
          }),
        ])
      );
    });
  });
});
