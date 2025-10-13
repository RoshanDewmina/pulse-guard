import chalk from 'chalk';
import { getApiKey, getApiUrl } from '../config';

export async function monitorsCommand() {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.error(chalk.red('❌ Not authenticated. Run `pulse login` first.'));
    process.exit(1);
  }

  const apiUrl = getApiUrl();
  
  console.log(chalk.blue('📊 Fetching monitors...'));
  console.log();
  console.log(chalk.yellow('⚠️  Monitor listing not yet implemented.'));
  console.log(chalk.dim(`   API URL: ${apiUrl}`));
  console.log();
  console.log(chalk.cyan('💡 Full monitor management coming soon!'));
}

