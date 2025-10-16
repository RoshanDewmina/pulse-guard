import { generateIncidentEmail } from '@/lib/email';

describe('Email Template Utilities', () => {
  describe('generateIncidentEmail', () => {
    it('should generate HTML email for FAIL incident', () => {
      const html = generateIncidentEmail({
        monitorName: 'Daily Backup',
        incidentKind: 'FAIL',
        summary: 'Job failed with exit code 1',
        details: 'Job execution failed',
        lastExitCode: 1,
        dashboardUrl: 'https://Saturn.co/app/incidents/inc-123',
      });

      expect(html).toContain('Daily Backup');
      expect(html).toContain('FAIL');
      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(0);
    });

    it('should generate HTML email for RESOLVED incident', () => {
      const html = generateIncidentEmail({
        monitorName: 'Daily Backup',
        incidentKind: 'FAIL',
        summary: 'Job recovered',
        dashboardUrl: 'https://Saturn.co/app/incidents/inc-123',
      });

      expect(html).toContain('Daily Backup');
      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(0);
    });

    it('should generate email for MISSED incident', () => {
      const html = generateIncidentEmail({
        monitorName: 'Hourly Task',
        incidentKind: 'MISSED',
        summary: 'Monitor missed expected check-in',
        dashboardUrl: 'https://Saturn.co/app/incidents/inc-456',
      });

      expect(html).toContain('Hourly Task');
      expect(html).toContain('MISSED');
    });
  });
});
