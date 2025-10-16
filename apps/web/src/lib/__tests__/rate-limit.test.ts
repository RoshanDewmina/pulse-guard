import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  it('allows first request and tracks remaining', () => {
    const r1 = rateLimit('test-key', 2, 1000);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(1);
  });
});




