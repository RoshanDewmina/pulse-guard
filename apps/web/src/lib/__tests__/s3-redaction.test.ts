import { redactOutput, truncateOutput } from '@/lib/s3';

describe('S3 Output Utilities', () => {
  describe('redactOutput', () => {
    it('should redact AWS access keys', () => {
      const input = 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE';
      const output = redactOutput(input);

      expect(output).not.toContain('AKIAIOSFODNN7EXAMPLE');
      expect(output).toContain('AKIA****************');
    });

    it('should redact JWT tokens', () => {
      const input = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123def456';
      const output = redactOutput(input);

      expect(output).toContain('eyJ***.eyJ***.***');
      expect(output).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('should redact passwords in URLs', () => {
      const input = 'DATABASE_URL=postgres://user:password123@localhost:5432/db';
      const output = redactOutput(input);

      expect(output).not.toContain('user:password123@');
      expect(output).toContain('***:***@');
    });

    it('should preserve normal text', () => {
      const input = 'Starting backup process\nFiles backed up: 42\nStatus: success';
      const output = redactOutput(input);

      expect(output).toContain('Starting backup process');
      expect(output).toContain('Files backed up: 42');
    });

    it('should handle empty input', () => {
      expect(redactOutput('')).toBe('');
    });
  });

  describe('truncateOutput', () => {
    it('should not truncate output below limit', () => {
      const input = 'Short output';
      const output = truncateOutput(input, 1); // 1KB limit

      expect(output).toBe(input);
    });

    it('should truncate output above limit', () => {
      const input = 'x'.repeat(2000); // 2KB
      const output = truncateOutput(input, 1); // 1KB limit

      expect(output.length).toBeLessThan(input.length);
      expect(output).toContain('[... output truncated ...]');
    });

    it('should handle exact limit', () => {
      const input = 'x'.repeat(1024); // Exactly 1KB
      const output = truncateOutput(input, 1);

      expect(output).toBe(input); // Should not be truncated
    });
  });
});
