import { describe, it, expect, beforeEach, mock } from 'bun:test';

// Mock Playwright
const mockGoto = mock(() => Promise.resolve());
const mockClick = mock(() => Promise.resolve());
const mockFill = mock(() => Promise.resolve());
const mockSelectOption = mock(() => Promise.resolve());
const mockWaitForSelector = mock(() => Promise.resolve());
const mockWaitForTimeout = mock(() => Promise.resolve());
const mockScreenshot = mock(() => Promise.resolve(Buffer.from('fake-screenshot')));
const mockTextContent = mock(() => Promise.resolve('Test Content'));
const mockElement = mock(() => Promise.resolve({
  textContent: mockTextContent,
}));
const mockEvaluate = mock(() => Promise.resolve());
const mockClose = mock(() => Promise.resolve());

const mockPage = {
  goto: mockGoto,
  click: mockClick,
  fill: mockFill,
  selectOption: mockSelectOption,
  waitForSelector: mockWaitForSelector,
  waitForTimeout: mockWaitForTimeout,
  screenshot: mockScreenshot,
  $: mockElement,
  evaluate: mockEvaluate,
  setDefaultTimeout: mock(() => {}),
  close: mockClose,
};

const mockContext = {
  newPage: mock(() => Promise.resolve(mockPage)),
  addCookies: mock(() => Promise.resolve()),
  close: mockClose,
};

const mockBrowser = {
  newContext: mock(() => Promise.resolve(mockContext)),
  close: mockClose,
};

mock.module('playwright', () => ({
  chromium: {
    launch: mock(() => Promise.resolve(mockBrowser)),
  },
}));

// Mock Prisma
const mockPrismaFindUnique = mock(() => Promise.resolve({
  id: 'test-monitor-id',
  name: 'Test Monitor',
  url: 'https://example.com',
  timeout: 30000,
  isEnabled: true,
  viewport: { width: 1920, height: 1080 },
  SyntheticStep: [
    {
      id: 'step-1',
      order: 0,
      type: 'NAVIGATE',
      label: 'Navigate to homepage',
      url: 'https://example.com',
      timeout: 5000,
      screenshot: false,
      optional: false,
    },
    {
      id: 'step-2',
      order: 1,
      type: 'CLICK',
      label: 'Click button',
      selector: '#button',
      timeout: 5000,
      screenshot: true,
      optional: false,
    },
  ],
}));

mock.module('@tokiflow/db', () => ({
  prisma: {
    syntheticMonitor: {
      findUnique: mockPrismaFindUnique,
    },
  },
}));

// Mock S3
const mockUploadToS3 = mock(() => Promise.resolve());
mock.module('../../../web/src/lib/s3', () => ({
  uploadToS3: mockUploadToS3,
}));

// Mock logger
mock.module('../lib/logger', () => ({
  logger: {
    info: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
  },
}));

// Import after mocking
const { runSyntheticMonitor } = await import('../lib/synthetic-runner');

describe('Synthetic Runner', () => {
  beforeEach(() => {
    mockGoto.mockClear();
    mockClick.mockClear();
    mockFill.mockClear();
    mockSelectOption.mockClear();
    mockWaitForSelector.mockClear();
    mockWaitForTimeout.mockClear();
    mockScreenshot.mockClear();
    mockUploadToS3.mockClear();
  });

  it('should successfully run a synthetic test with all steps', async () => {
    const result = await runSyntheticMonitor('test-monitor-id');

    expect(result.status).toBe('SUCCESS');
    expect(result.durationMs).toBeGreaterThan(0);
    expect(result.stepResults).toHaveLength(2);
    expect(result.stepResults[0].status).toBe('SUCCESS');
    expect(result.stepResults[1].status).toBe('SUCCESS');
  });

  it('should capture screenshots when requested', async () => {
    const result = await runSyntheticMonitor('test-monitor-id');

    expect(mockScreenshot).toHaveBeenCalled();
    expect(mockUploadToS3).toHaveBeenCalled();
    expect(result.screenshots['step-2']).toBeDefined();
  });

  it('should handle step failures', async () => {
    mockClick.mockRejectedValueOnce(new Error('Element not found'));

    const result = await runSyntheticMonitor('test-monitor-id');

    expect(result.status).toBe('FAILED');
    expect(result.errorMessage).toContain('Element not found');
    expect(result.stepResults[1].status).toBe('FAILED');
  });

  it('should skip optional steps on failure', async () => {
    mockPrismaFindUnique.mockResolvedValueOnce({
      id: 'test-monitor-id',
      name: 'Test Monitor',
      url: 'https://example.com',
      timeout: 30000,
      isEnabled: true,
      SyntheticStep: [
        {
          id: 'step-1',
          order: 0,
          type: 'CLICK',
          label: 'Optional click',
          selector: '#optional',
          timeout: 5000,
          screenshot: false,
          optional: true,
        },
      ],
    });

    mockClick.mockRejectedValueOnce(new Error('Element not found'));

    const result = await runSyntheticMonitor('test-monitor-id');

    expect(result.status).toBe('SUCCESS');
    expect(result.stepResults[0].status).toBe('SKIPPED');
  });

  it('should handle FILL step type', async () => {
    mockPrismaFindUnique.mockResolvedValueOnce({
      id: 'test-monitor-id',
      name: 'Test Monitor',
      url: 'https://example.com',
      timeout: 30000,
      isEnabled: true,
      SyntheticStep: [
        {
          id: 'step-1',
          order: 0,
          type: 'FILL',
          label: 'Fill input',
          selector: '#input',
          value: 'test value',
          timeout: 5000,
          screenshot: false,
          optional: false,
        },
      ],
    });

    await runSyntheticMonitor('test-monitor-id');

    expect(mockFill).toHaveBeenCalledWith('#input', 'test value', { timeout: 5000 });
  });

  it('should handle WAIT step with selector', async () => {
    mockPrismaFindUnique.mockResolvedValueOnce({
      id: 'test-monitor-id',
      name: 'Test Monitor',
      url: 'https://example.com',
      timeout: 30000,
      isEnabled: true,
      SyntheticStep: [
        {
          id: 'step-1',
          order: 0,
          type: 'WAIT',
          label: 'Wait for element',
          selector: '#element',
          timeout: 5000,
          screenshot: false,
          optional: false,
        },
      ],
    });

    await runSyntheticMonitor('test-monitor-id');

    expect(mockWaitForSelector).toHaveBeenCalledWith('#element', {
      state: 'visible',
      timeout: 5000,
    });
  });

  it('should handle WAIT step with time value', async () => {
    mockPrismaFindUnique.mockResolvedValueOnce({
      id: 'test-monitor-id',
      name: 'Test Monitor',
      url: 'https://example.com',
      timeout: 30000,
      isEnabled: true,
      SyntheticStep: [
        {
          id: 'step-1',
          order: 0,
          type: 'WAIT',
          label: 'Wait 1 second',
          value: '1000',
          timeout: 5000,
          screenshot: false,
          optional: false,
        },
      ],
    });

    await runSyntheticMonitor('test-monitor-id');

    expect(mockWaitForTimeout).toHaveBeenCalledWith(1000);
  });

  it('should handle ASSERTION step', async () => {
    mockPrismaFindUnique.mockResolvedValueOnce({
      id: 'test-monitor-id',
      name: 'Test Monitor',
      url: 'https://example.com',
      timeout: 30000,
      isEnabled: true,
      SyntheticStep: [
        {
          id: 'step-1',
          order: 0,
          type: 'ASSERTION',
          label: 'Assert text',
          selector: '#element',
          value: 'Test Content',
          timeout: 5000,
          screenshot: false,
          optional: false,
        },
      ],
    });

    const result = await runSyntheticMonitor('test-monitor-id');

    expect(result.status).toBe('SUCCESS');
    expect(mockElement).toHaveBeenCalledWith('#element');
  });

  it('should handle CUSTOM_SCRIPT step', async () => {
    mockPrismaFindUnique.mockResolvedValueOnce({
      id: 'test-monitor-id',
      name: 'Test Monitor',
      url: 'https://example.com',
      timeout: 30000,
      isEnabled: true,
      SyntheticStep: [
        {
          id: 'step-1',
          order: 0,
          type: 'CUSTOM_SCRIPT',
          label: 'Run custom script',
          value: 'console.log("test")',
          timeout: 5000,
          screenshot: false,
          optional: false,
        },
      ],
    });

    await runSyntheticMonitor('test-monitor-id');

    expect(mockEvaluate).toHaveBeenCalledWith('console.log("test")');
  });

  it('should clean up browser resources', async () => {
    await runSyntheticMonitor('test-monitor-id');

    expect(mockPage.close).toHaveBeenCalled();
    expect(mockContext.close).toHaveBeenCalled();
    expect(mockBrowser.close).toHaveBeenCalled();
  });
});

