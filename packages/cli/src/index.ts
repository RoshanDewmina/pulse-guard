#!/usr/bin/env node

import { Command } from 'commander';
import { version } from '../package.json';
import { loginCommand } from './commands/login';
import { logoutCommand } from './commands/logout';
import { monitorsCommand } from './commands/monitors';
import { monitorsFullCommand } from './commands/monitors-full';
import { runCommand } from './commands/run';

const program = new Command();

program
  .name('saturn')
  .description('Saturn CLI - Monitor your cron jobs and scheduled tasks')
  .version(version);

// Auth commands
loginCommand(program);

program
  .command('logout')
  .description('Log out from Saturn')
  .action(logoutCommand);

// Monitor commands (full CRUD)
monitorsFullCommand(program);

// Run wrapper command
program
  .command('run')
  .description('Wrap a command with monitoring')
  .option('-m, --monitor <name>', 'Monitor name or ID')
  .option('-t, --token <token>', 'Monitor token')
  .argument('[command...]', 'Command to run')
  .action(runCommand);

program.parse();

