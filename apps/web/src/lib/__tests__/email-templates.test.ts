import { generateIncidentEmail } from '@/lib/email';

describe('Email Template Utilities', () => {
  describe('generateIncidentEmail', () => {
    it('should generate HTML email for FAIL incident', () => {
      const html = generateIncidentEmail({
        incident: {
          id: 'inc-123',
          kind: 'FAIL',
          status: 'OPEN',
          summary: 'Job failed with exit code 1',
          openedAt: new Date('2025-01-01T12:00:00Z'),
          resolvedAt: null,
        },
        monitor: {
          id: 'mon-123',
          name: 'Daily Backup',
          status: 'FAILING',
        },
        dashboardUrl: 'https://tokiflow.co/app/incidents/inc-123',
      });

      expect(html).toContain('Daily Backup');
      expect(html).toContain('FAIL');
      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(0);
    });

    it('should generate HTML email for RESOLVED incident', () => {
      const html = generateIncidentEmail({
        incident: {
          id: 'inc-123',
          kind: 'FAIL',
          status: 'RESOLVED',
          summary: 'Job recovered',
          openedAt: new Date('2025-01-01T12:00:00Z'),
          resolvedAt: new Date('2025-01-01T13:00:00Z'),
        },
        monitor: {
          id: 'mon-123',
          name: 'Daily Backup',
          status: 'UP',
        },
        dashboardUrl: 'https://tokiflow.co/app/incidents/inc-123',
      });

      expect(html).toContain('Daily Backup');
      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(0);
    });

    it('should generate email for MISSED incident', () => {
      const html = generateIncidentEmail({
        incident: {
          id: 'inc-456',
          kind: 'MISSED',
          status: 'OPEN',
          summary: 'Monitor missed expected check-in',
          openedAt: new Date('2025-01-01T14:00:00Z'),
          resolvedAt: null,
        },
        monitor: {
          id: 'mon-456',
          name: 'Hourly Task',
          status: 'MISSING',
        },
        dashboardUrl: 'https://tokiflow.co/app/incidents/inc-456',
      });

      expect(html).toContain('Hourly Task');
      expect(html).toContain('MISSED');
    });
  });
});
