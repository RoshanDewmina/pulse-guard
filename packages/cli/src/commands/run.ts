import chalk from 'chalk';
import { spawn } from 'child_process';
import { getApiUrl } from '../config';

interface RunOptions {
  monitor?: string;
  token?: string;
}

export async function runCommand(command: string[], options: RunOptions) {
  if (!options.token) {
    console.error(chalk.red('❌ Monitor token required. Use --token flag.'));
    process.exit(1);
  }

  if (command.length === 0) {
    console.error(chalk.red('❌ No command specified.'));
    process.exit(1);
  }

  const apiUrl = getApiUrl();
  const token = options.token;
  const pingUrl = `${apiUrl}/api/ping/${token}`;

  console.log(chalk.blue('🚀 Running command with monitoring...'));
  console.log(chalk.dim(`   Command: ${command.join(' ')}`));
  console.log(chalk.dim(`   Monitor: ${options.monitor || token}`));
  console.log();

  // Send start ping
  try {
    await fetch(`${pingUrl}?state=start`);
    console.log(chalk.green('✓ Start ping sent'));
  } catch (error) {
    console.error(chalk.yellow('⚠️  Failed to send start ping:', error));
  }

  // Execute command
  const startTime = Date.now();
  const [cmd, ...args] = command;
  
  const proc = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
  });

  return new Promise<void>((resolve) => {
    proc.on('exit', async (code) => {
      const durationMs = Date.now() - startTime;
      const exitCode = code || 0;
      const state = exitCode === 0 ? 'success' : 'fail';

      // Send finish ping
      try {
        await fetch(`${pingUrl}?state=${state}&exitCode=${exitCode}&durationMs=${durationMs}`);
        console.log(chalk.green(`✓ ${state} ping sent (exit: ${exitCode}, duration: ${durationMs}ms)`));
      } catch (error) {
        console.error(chalk.red('❌ Failed to send finish ping:', error));
      }

      process.exit(exitCode);
      resolve();
    });
  });
}

