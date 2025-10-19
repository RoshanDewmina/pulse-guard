import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendSMSOpened, sendSMSAcknowledged, sendSMSResolved } from '../alerts/sms';
import twilio from 'twilio';

// Mock dependencies
vi.mock('twilio', () => ({
  default: vi.fn(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));

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
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { prisma } from '@tokiflow/db';

describe('SMS integration', () => {
  const mockIncident = {
    id: 'incident-123',
    status: 'OPEN',
    kind: 'MISSED',
    summary: 'Monitor failed',
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
    type: 'SMS',
    configJson: {
      recipients: ['+1234567890', '+0987654321'],
    },
  };

  const mockTwilioClient = {
    messages: {
      create: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TWILIO_ENABLED = 'true';
    process.env.TWILIO_ACCOUNT_SID = 'test-account-sid';
    process.env.TWILIO_AUTH_TOKEN = 'test-auth-token';
    process.env.TWILIO_FROM_NUMBER = '+15551234567';
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.saturn.sh';
    
    (twilio as any).mockReturnValue(mockTwilioClient);
  });

  describe('sendSMSOpened', () => {
    it('should send SMS for opened incident successfully', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (mockTwilioClient.messages.create as any).mockResolvedValue({
        sid: 'SM1234567890',
        status: 'queued',
      });

      await sendSMSOpened('incident-123', 'channel-123');

      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(2);
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: expect.stringContaining('🚨 INCIDENT OPENED'),
        from: '+15551234567',
        to: '+1234567890',
      });
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: expect.stringContaining('🚨 INCIDENT OPENED'),
        from: '+15551234567',
        to: '+0987654321',
      });
    });

    it('should format SMS message correctly', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (mockTwilioClient.messages.create as any).mockResolvedValue({
        sid: 'SM1234567890',
        status: 'queued',
      });

      await sendSMSOpened('incident-123', 'channel-123');

      const expectedMessage = `🚨 INCIDENT OPENED
Monitor: Test Monitor
Type: MISSED
Monitor failed

View: https://app.saturn.sh/app/incidents/incident-123`;

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: expectedMessage,
        from: '+15551234567',
        to: '+1234567890',
      });
    });

    it('should skip if SMS disabled', async () => {
      process.env.TWILIO_ENABLED = 'false';

      await sendSMSOpened('incident-123', 'channel-123');

      expect(prisma.incident.findUnique).not.toHaveBeenCalled();
      expect(mockTwilioClient.messages.create).not.toHaveBeenCalled();
    });

    it('should throw error if incident not found', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(null);

      await expect(sendSMSOpened('incident-123', 'channel-123'))
        .rejects.toThrow('Incident incident-123 not found');
    });

    it('should throw error if channel not found', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(null);

      await expect(sendSMSOpened('incident-123', 'channel-123'))
        .rejects.toThrow('Invalid SMS channel channel-123');
    });

    it('should throw error if channel is not SMS type', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue({
        ...mockChannel,
        type: 'SLACK',
      });

      await expect(sendSMSOpened('incident-123', 'channel-123'))
        .rejects.toThrow('Invalid SMS channel channel-123');
    });

    it('should throw error if Twilio credentials not configured', async () => {
      delete process.env.TWILIO_ACCOUNT_SID;

      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);

      await expect(sendSMSOpened('incident-123', 'channel-123'))
        .rejects.toThrow('Twilio credentials not configured');
    });

    it('should throw error if from number not configured', async () => {
      delete process.env.TWILIO_FROM_NUMBER;

      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);

      await expect(sendSMSOpened('incident-123', 'channel-123'))
        .rejects.toThrow('TWILIO_FROM_NUMBER not configured');
    });

    it('should handle partial SMS failures', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      
      (mockTwilioClient.messages.create as any)
        .mockResolvedValueOnce({ sid: 'SM1234567890', status: 'queued' })
        .mockRejectedValueOnce(new Error('Invalid phone number'));

      // Should not throw error if at least one SMS succeeds
      await expect(sendSMSOpened('incident-123', 'channel-123'))
        .resolves.not.toThrow();

      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(2);
    });

    it('should throw error if all SMS messages fail', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      
      (mockTwilioClient.messages.create as any)
        .mockRejectedValue(new Error('Invalid phone number'));

      await expect(sendSMSOpened('incident-123', 'channel-123'))
        .rejects.toThrow('All SMS messages failed');
    });
  });

  describe('sendSMSAcknowledged', () => {
    it('should send acknowledged SMS successfully', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (mockTwilioClient.messages.create as any).mockResolvedValue({
        sid: 'SM1234567890',
        status: 'queued',
      });

      await sendSMSAcknowledged('incident-123', 'channel-123');

      const expectedMessage = `👀 INCIDENT ACKNOWLEDGED
Monitor: Test Monitor

View: https://app.saturn.sh/app/incidents/incident-123`;

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: expectedMessage,
        from: '+15551234567',
        to: '+1234567890',
      });
    });

    it('should skip if SMS disabled', async () => {
      process.env.TWILIO_ENABLED = 'false';

      await sendSMSAcknowledged('incident-123', 'channel-123');

      expect(prisma.incident.findUnique).not.toHaveBeenCalled();
      expect(mockTwilioClient.messages.create).not.toHaveBeenCalled();
    });
  });

  describe('sendSMSResolved', () => {
    it('should send resolved SMS successfully', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (mockTwilioClient.messages.create as any).mockResolvedValue({
        sid: 'SM1234567890',
        status: 'queued',
      });

      await sendSMSResolved('incident-123', 'channel-123');

      const expectedMessage = `✅ INCIDENT RESOLVED
Monitor: Test Monitor

View: https://app.saturn.sh/app/incidents/incident-123`;

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: expectedMessage,
        from: '+15551234567',
        to: '+1234567890',
      });
    });

    it('should skip if SMS disabled', async () => {
      process.env.TWILIO_ENABLED = 'false';

      await sendSMSResolved('incident-123', 'channel-123');

      expect(prisma.incident.findUnique).not.toHaveBeenCalled();
      expect(mockTwilioClient.messages.create).not.toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    it('should respect rate limit per organization', async () => {
      // Mock the rate limit cache to simulate exceeded limit
      const originalCheckRateLimit = require('../alerts/sms').checkRateLimit;
      vi.spyOn(require('../alerts/sms'), 'checkRateLimit').mockReturnValue(false);

      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);

      await sendSMSOpened('incident-123', 'channel-123');

      // Should not send SMS due to rate limit
      expect(mockTwilioClient.messages.create).not.toHaveBeenCalled();
    });
  });

  describe('message truncation', () => {
    it('should truncate long messages', async () => {
      const longSummary = 'a'.repeat(1000);
      const incidentWithLongSummary = {
        ...mockIncident,
        summary: longSummary,
      };

      (prisma.incident.findUnique as any).mockResolvedValue(incidentWithLongSummary);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (mockTwilioClient.messages.create as any).mockResolvedValue({
        sid: 'SM1234567890',
        status: 'queued',
      });

      await sendSMSOpened('incident-123', 'channel-123');

      const callArgs = (mockTwilioClient.messages.create as any).mock.calls[0][0];
      expect(callArgs.body.length).toBeLessThanOrEqual(900);
      expect(callArgs.body).toEndWith('...');
    });

    it('should not truncate short messages', async () => {
      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (mockTwilioClient.messages.create as any).mockResolvedValue({
        sid: 'SM1234567890',
        status: 'queued',
      });

      await sendSMSOpened('incident-123', 'channel-123');

      const callArgs = (mockTwilioClient.messages.create as any).mock.calls[0][0];
      expect(callArgs.body).not.toEndWith('...');
    });
  });

  describe('edge cases', () => {
    it('should handle missing app URL environment variable', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;

      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
      (mockTwilioClient.messages.create as any).mockResolvedValue({
        sid: 'SM1234567890',
        status: 'queued',
      });

      await sendSMSOpened('incident-123', 'channel-123');

      const callArgs = (mockTwilioClient.messages.create as any).mock.calls[0][0];
      expect(callArgs.body).toContain('https://app.saturn.sh/app/incidents/incident-123');
    });

    it('should handle empty recipients array', async () => {
      const channelWithNoRecipients = {
        ...mockChannel,
        configJson: {
          recipients: [],
        },
      };

      (prisma.incident.findUnique as any).mockResolvedValue(mockIncident);
      (prisma.alertChannel.findUnique as any).mockResolvedValue(channelWithNoRecipients);

      await sendSMSOpened('incident-123', 'channel-123');

      expect(mockTwilioClient.messages.create).not.toHaveBeenCalled();
    });

    it('should handle different incident kinds', async () => {
      const testCases = [
        { kind: 'MISSED', expectedEmoji: '🚨' },
        { kind: 'FAIL', expectedEmoji: '🚨' },
        { kind: 'LATE', expectedEmoji: '🚨' },
        { kind: 'ANOMALY', expectedEmoji: '🚨' },
      ];

      for (const { kind, expectedEmoji } of testCases) {
        vi.clearAllMocks();
        (prisma.incident.findUnique as any).mockResolvedValue({
          ...mockIncident,
          kind,
        });
        (prisma.alertChannel.findUnique as any).mockResolvedValue(mockChannel);
        (mockTwilioClient.messages.create as any).mockResolvedValue({
          sid: 'SM1234567890',
          status: 'queued',
        });

        await sendSMSOpened('incident-123', 'channel-123');

        const callArgs = (mockTwilioClient.messages.create as any).mock.calls[0][0];
        expect(callArgs.body).toContain(expectedEmoji);
        expect(callArgs.body).toContain(`Type: ${kind}`);
      }
    });
  });
});
