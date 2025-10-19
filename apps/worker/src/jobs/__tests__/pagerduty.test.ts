import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendPagerDutyTrigger, sendPagerDutyAcknowledge, sendPagerDutyResolve } from '../alerts/pagerduty';
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

describe('PagerDuty integration', () => {
  const mockIncident = {
    id: 'incident-123',
    status: 'OPEN',
    kind: 'MISSED',
    summary: 'Monitor failed',
    details: 'Job did not run on time',
    dedupeHash: 'dedupe-123',
    openedAt: new Date('2023-01-01T00:00:00Z'),
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
    type: 'PAGERDUTY',
    configJson: {
      routingKey: 'test-routing-key',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PAGERDUTY_ENABLED = 'true';
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.saturn.sh';
  });

  describe('sendPagerDutyTrigger', () => {
    it('should send trigger event successfully', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (axios.post as any).mockResolvedValue({
        status: 202,
        data: { status: 'success' },
      });

      await sendPagerDutyTrigger('incident-123', 'channel-123');

      expect(axios.post).toHaveBeenCalledWith(
        'https://events.pagerduty.com/v2/enqueue',
        expect.objectContaining({
          routing_key: 'test-routing-key',
          event_action: 'trigger',
          dedup_key: 'dedupe-123',
          payload: expect.objectContaining({
            summary: 'Monitor failed',
            source: 'Test Org',
            severity: 'critical',
            component: 'Test Monitor',
            group: 'Saturn Monitoring',
            class: 'MISSED',
          }),
          links: expect.arrayContaining([
            expect.objectContaining({
              href: 'https://app.saturn.sh/app/incidents/incident-123',
              text: 'View Incident in Saturn',
            }),
            expect.objectContaining({
              href: 'https://app.saturn.sh/app/monitors/monitor-123',
              text: 'View Monitor',
            }),
          ]),
        }),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        })
      );
    });

    it('should skip if PagerDuty disabled', async () => {
      process.env.PAGERDUTY_ENABLED = 'false';

      await sendPagerDutyTrigger('incident-123', 'channel-123');

      expect(prisma.incident.findUnique).not.toHaveBeenCalled();
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should throw error if incident not found', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(null);

      await expect(sendPagerDutyTrigger('incident-123', 'channel-123'))
        .rejects.toThrow('Incident incident-123 not found');
    });

    it('should throw error if channel not found', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(null);

      await expect(sendPagerDutyTrigger('incident-123', 'channel-123'))
        .rejects.toThrow('Invalid PagerDuty channel channel-123');
    });

    it('should throw error if channel is not PagerDuty type', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue({
        ...mockChannel,
        type: 'SLACK',
      });

      await expect(sendPagerDutyTrigger('incident-123', 'channel-123'))
        .rejects.toThrow('Invalid PagerDuty channel channel-123');
    });

    it('should handle API errors', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (axios.post as any).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 400,
          data: { error: 'Invalid routing key' },
        },
      });

      await expect(sendPagerDutyTrigger('incident-123', 'channel-123'))
        .rejects.toThrow('PagerDuty API error: 400 - {"error":"Invalid routing key"}');
    });

    it('should map incident kinds to correct severities', async () => {
      const testCases = [
        { kind: 'MISSED', expectedSeverity: 'critical' },
        { kind: 'LATE', expectedSeverity: 'warning' },
        { kind: 'FAIL', expectedSeverity: 'error' },
        { kind: 'ANOMALY', expectedSeverity: 'warning' },
        { kind: 'UNKNOWN', expectedSeverity: 'error' },
      ];

      for (const { kind, expectedSeverity } of testCases) {
        vi.clearAllMocks();
        (prisma.incident.findUnique as any).mockResolvedValue({
          ...mockIncident,
          kind,
        });
        (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
        (axios.post as any).mockResolvedValue({ status: 202, data: {} });

        await sendPagerDutyTrigger('incident-123', 'channel-123');

        expect(axios.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            payload: expect.objectContaining({
              severity: expectedSeverity,
              class: kind,
            }),
          }),
          expect.any(Object)
        );
      }
    });
  });

  describe('sendPagerDutyAcknowledge', () => {
    it('should send acknowledge event successfully', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (axios.post as any).mockResolvedValue({
        status: 202,
        data: { status: 'success' },
      });

      await sendPagerDutyAcknowledge('incident-123', 'channel-123');

      expect(axios.post).toHaveBeenCalledWith(
        'https://events.pagerduty.com/v2/enqueue',
        expect.objectContaining({
          routing_key: 'test-routing-key',
          event_action: 'acknowledge',
          dedup_key: 'dedupe-123',
        }),
        expect.any(Object)
      );
    });

    it('should skip if PagerDuty disabled', async () => {
      process.env.PAGERDUTY_ENABLED = 'false';

      await sendPagerDutyAcknowledge('incident-123', 'channel-123');

      expect(prisma.incident.findUnique).not.toHaveBeenCalled();
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe('sendPagerDutyResolve', () => {
    it('should send resolve event successfully', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (axios.post as any).mockResolvedValue({
        status: 202,
        data: { status: 'success' },
      });

      await sendPagerDutyResolve('incident-123', 'channel-123');

      expect(axios.post).toHaveBeenCalledWith(
        'https://events.pagerduty.com/v2/enqueue',
        expect.objectContaining({
          routing_key: 'test-routing-key',
          event_action: 'resolve',
          dedup_key: 'dedupe-123',
        }),
        expect.any(Object)
      );
    });

    it('should skip if PagerDuty disabled', async () => {
      process.env.PAGERDUTY_ENABLED = 'false';

      await sendPagerDutyResolve('incident-123', 'channel-123');

      expect(prisma.incident.findUnique).not.toHaveBeenCalled();
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle incident without dedupe hash', async () => {
      const incidentWithoutDedupe = {
        ...mockIncident,
        dedupeHash: null,
      };

      (prisma.incident.findUnique as any).mockResolvedValue(incidentWithoutDedupe);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (axios.post as any).mockResolvedValue({ status: 202, data: {} });

      await sendPagerDutyTrigger('incident-123', 'channel-123');

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          dedup_key: 'incident-123', // Should use incident ID as fallback
        }),
        expect.any(Object)
      );
    });

    it('should handle incident without details', async () => {
      const incidentWithoutDetails = {
        ...mockIncident,
        details: null,
      };

      (prisma.incident.findUnique as any).mockResolvedValue(incidentWithoutDetails);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (axios.post as any).mockResolvedValue({ status: 202, data: {} });

      await sendPagerDutyTrigger('incident-123', 'channel-123');

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          payload: expect.objectContaining({
            custom_details: expect.objectContaining({
              details: null,
            }),
          }),
        }),
        expect.any(Object)
      );
    });

    it('should handle missing app URL environment variable', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;

      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (axios.post as any).mockResolvedValue({ status: 202, data: {} });

      await sendPagerDutyTrigger('incident-123', 'channel-123');

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          links: expect.arrayContaining([
            expect.objectContaining({
              href: 'https://app.saturn.sh/app/incidents/incident-123',
            }),
          ]),
        }),
        expect.any(Object)
      );
    });
  });
});
