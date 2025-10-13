import chalk from 'chalk';
import { clearApiKey } from '../config';

export async function logoutCommand() {
  clearApiKey();
  console.log(chalk.green('✅ Logged out successfully'));
}

