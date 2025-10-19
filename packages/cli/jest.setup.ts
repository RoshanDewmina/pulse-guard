// Jest setup for CLI tests
Object.defineProperty(process.env, 'NODE_ENV', {
  value: 'test',
  writable: true
});
process.env.HOME = '/tmp/test-home';

