import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Command } from 'commander';
import fetch from 'node-fetch';
import { loginCommand } from '../commands/login';
import * as config from '../config';

// Mock dependencies
jest.mock('node-fetch');
jest.mock('../config');

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
const mockGetConfig = config.getConfig as jest.MockedFunction<typeof config.getConfig>;
const mockSaveConfig = config.saveConfig as jest.MockedFunction<typeof config.saveConfig>;

describe('CLI Login Command (Production Critical)', () => {
  let program: Command;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;

  beforeEach(() => {
    program = new Command();
    loginCommand(program);
    
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
      throw new Error(`Process exit: ${code}`);
    });

    mockGetConfig.mockResolvedValue({
      apiKey: '',
      apiUrl: 'https://saturnmonitor.com',
    });

    mockSaveConfig.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('Device Authorization Flow', () => {
    it('should initiate device flow successfully', async () => {
      const mockDeviceCode = {
        device_code: 'device_123',
        user_code: 'ABCD-1234',
        verification_uri: 'https://app.test.com/device',
        verification_uri_complete: 'https://app.test.com/device?code=ABCD-1234',
        expires_in: 600,
        interval: 5,
      };

      const mockToken = {
        access_token: 'pk_test_123',
        token_type: 'Bearer',
        expires_in: 86400,
      };

      // Mock fetch responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDeviceCode,
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockToken,
        } as any);

      try {
        await program.parseAsync(['node', 'test', 'login', '--api', 'https://api.test.com']);
      } catch (error: any) {
        // Ignore process.exit errors in tests
        if (!error.message.includes('Process exit')) throw error;
      }

      // Verify device flow initiated
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/auth/device/initiate',
        expect.objectContaining({ method: 'POST' })
      );

      // Verify config saved
      expect(mockSaveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'pk_test_123',
          apiUrl: 'https://api.test.com',
        })
      );

      // Verify success message
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Successfully authenticated')
      );
    });

    it('should display verification code to user', async () => {
      const mockDeviceCode = {
        device_code: 'device_123',
        user_code: 'WXYZ-5678',
        verification_uri: 'https://app.test.com/device',
        verification_uri_complete: 'https://app.test.com/device?code=WXYZ-5678',
        expires_in: 600,
        interval: 5,
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDeviceCode,
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'pk_test', token_type: 'Bearer', expires_in: 86400 }),
        } as any);

      try {
        await program.parseAsync(['node', 'test', 'login']);
      } catch (error: any) {
        if (!error.message.includes('Process exit')) throw error;
      }

      // Verify verification instructions displayed
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(mockDeviceCode.verification_uri)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(mockDeviceCode.user_code)
      );
    });

    it('should handle authorization pending', async () => {
      const mockDeviceCode = {
        device_code: 'device_123',
        user_code: 'TEST-1234',
        verification_uri: 'https://app.test.com/device',
        verification_uri_complete: 'https://app.test.com/device?code=TEST-1234',
        expires_in: 600,
        interval: 1,
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDeviceCode,
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'authorization_pending' }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'pk_test', token_type: 'Bearer', expires_in: 86400 }),
        } as any);

      try {
        await program.parseAsync(['node', 'test', 'login']);
      } catch (error: any) {
        if (!error.message.includes('Process exit')) throw error;
      }

      // Should continue polling
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle expired token', async () => {
      const mockDeviceCode = {
        device_code: 'device_123',
        user_code: 'TEST-1234',
        verification_uri: 'https://app.test.com/device',
        verification_uri_complete: 'https://app.test.com/device?code=TEST-1234',
        expires_in: 600,
        interval: 1,
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDeviceCode,
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'expired_token' }),
        } as any);

      try {
        await program.parseAsync(['node', 'test', 'login']);
      } catch (error: any) {
        expect(error.message).toContain('Process exit: 1');
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Code expired')
      );
    });

    it('should handle access denied', async () => {
      const mockDeviceCode = {
        device_code: 'device_123',
        user_code: 'TEST-1234',
        verification_uri: 'https://app.test.com/device',
        verification_uri_complete: 'https://app.test.com/device?code=TEST-1234',
        expires_in: 600,
        interval: 1,
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDeviceCode,
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'access_denied' }),
        } as any);

      try {
        await program.parseAsync(['node', 'test', 'login']);
      } catch (error: any) {
        expect(error.message).toContain('Process exit: 1');
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Authorization denied')
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await program.parseAsync(['node', 'test', 'login']);
      } catch (error: any) {
        expect(error.message).toContain('Process exit: 1');
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Login failed'),
        expect.any(Error)
      );
    });

    it('should handle failed device flow initiation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as any);

      try {
        await program.parseAsync(['node', 'test', 'login']);
      } catch (error: any) {
        expect(error.message).toContain('Process exit: 1');
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initiate device flow')
      );
    });
  });

  describe('Configuration Management', () => {
    it('should use default API URL if not specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          device_code: 'device_123',
          user_code: 'TEST-1234',
          verification_uri: 'https://app.test.com/device',
          verification_uri_complete: 'https://app.test.com/device?code=TEST-1234',
          expires_in: 600,
          interval: 1,
        }),
      } as any);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'pk_test',
          token_type: 'Bearer',
          expires_in: 86400,
        }),
      } as any);

      try {
        await program.parseAsync(['node', 'test', 'login']);
      } catch (error: any) {
        if (!error.message.includes('Process exit')) throw error;
      }

      // Should use default API URL
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://saturnmonitor.com'),
        expect.any(Object)
      );
    });

    it('should save API key and URL to config', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            device_code: 'device_123',
            user_code: 'TEST-1234',
            verification_uri: 'https://app.test.com/device',
            verification_uri_complete: 'https://app.test.com/device?code=TEST-1234',
            expires_in: 600,
            interval: 1,
          }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'pk_new_token_xyz',
            token_type: 'Bearer',
            expires_in: 86400,
          }),
        } as any);

      try {
        await program.parseAsync(['node', 'test', 'login', '--api', 'https://custom.api.com']);
      } catch (error: any) {
        if (!error.message.includes('Process exit')) throw error;
      }

      expect(mockSaveConfig).toHaveBeenCalledWith({
        apiKey: 'pk_new_token_xyz',
        apiUrl: 'https://custom.api.com',
      });
    });
  });

  describe('Production Security', () => {
    it('should not log sensitive tokens', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            device_code: 'secret_device_code',
            user_code: 'TEST-1234',
            verification_uri: 'https://app.test.com/device',
            verification_uri_complete: 'https://app.test.com/device?code=TEST-1234',
            expires_in: 600,
            interval: 1,
          }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'pk_secret_api_key',
            token_type: 'Bearer',
            expires_in: 86400,
          }),
        } as any);

      try {
        await program.parseAsync(['node', 'test', 'login']);
      } catch (error: any) {
        if (!error.message.includes('Process exit')) throw error;
      }

      // Verify API key is not logged
      const allLogs = consoleLogSpy.mock.calls.flat().join(' ');
      expect(allLogs).not.toContain('pk_secret_api_key');
      expect(allLogs).not.toContain('secret_device_code');
    });
  });
});

