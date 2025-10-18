import { Command } from 'commander';
import fetch from 'node-fetch';
import { getConfig, saveConfig } from '../config';

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ErrorResponse {
  error: string;
  error_description?: string;
}

export function loginCommand(program: Command) {
  program
    .command('login')
    .description('Authenticate CLI with Saturn')
    .option('--api <url>', 'API URL', 'https://saturnmonitor.com')
    .action(async (options) => {
      const apiUrl = options.api || 'https://saturnmonitor.com';

      try {
        console.log('🔐 Starting device authorization...\n');

        // Step 1: Initiate device flow
        const initiateResponse = await fetch(`${apiUrl}/api/auth/device/initiate`, {
          method: 'POST',
        });

        if (!initiateResponse.ok) {
          console.error('❌ Failed to initiate device flow');
          process.exit(1);
        }

        const deviceData = (await initiateResponse.json()) as DeviceCodeResponse;

        // Step 2: Display code to user
        console.log('📱 To authorize this device:');
        console.log('');
        console.log(`   1. Visit: ${deviceData.verification_uri}`);
        console.log(`   2. Enter code: ${deviceData.user_code}`);
        console.log('');
        console.log(`   Or visit: ${deviceData.verification_uri_complete}`);
        console.log('');
        console.log('⏳ Waiting for authorization...');

        // Step 3: Poll for authorization
        const startTime = Date.now();
        const timeout = deviceData.expires_in * 1000;
        const pollInterval = deviceData.interval * 1000;

        while (Date.now() - startTime < timeout) {
          await sleep(pollInterval);

          const pollResponse = await fetch(`${apiUrl}/api/auth/device/poll`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              device_code: deviceData.device_code,
            }),
          });

          if (pollResponse.ok) {
            // Authorization complete!
            const tokenData = (await pollResponse.json()) as TokenResponse;

            // Save API key
            const config = await getConfig();
            config.apiKey = tokenData.access_token;
            config.apiUrl = apiUrl;
            await saveConfig(config);

            console.log('');
            console.log('✅ Successfully authenticated!');
            console.log(`   API Key stored in ${process.env.HOME}/.saturn/config.json`);
            console.log('');
            console.log('You can now use saturn commands:');
            console.log('   saturn monitors list');
            console.log('   saturn monitors create --name my-job --interval 3600');
            console.log('');
            return;
          }

          const errorData = (await pollResponse.json()) as ErrorResponse;

          if (errorData.error === 'authorization_pending') {
            // Still waiting, continue polling
            process.stdout.write('.');
            continue;
          }

          if (errorData.error === 'expired_token') {
            console.log('');
            console.log('❌ Code expired. Please run `saturn login` again.');
            process.exit(1);
          }

          if (errorData.error === 'access_denied') {
            console.log('');
            console.log('❌ Authorization denied.');
            process.exit(1);
          }

          // Other errors
          console.log('');
          console.error(`❌ Error: ${errorData.error_description || errorData.error}`);
          process.exit(1);
        }

        // Timeout
        console.log('');
        console.log('❌ Authorization timed out. Please run `saturn login` again.');
        process.exit(1);
      } catch (error) {
        console.error('❌ Login failed:', error);
        process.exit(1);
      }
    });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
