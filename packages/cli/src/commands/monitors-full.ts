import { Command } from 'commander';
import fetch from 'node-fetch';
import { getConfig } from '../config';

interface Monitor {
  id: string;
  name: string;
  status: string;
  scheduleType: string;
  intervalSec?: number;
  cronExpr?: string;
  lastRunAt?: string;
  nextDueAt?: string;
}

/**
 * Full monitor CRUD commands
 */
export function monitorsFullCommand(program: Command) {
  const monitors = program
    .command('monitors')
    .description('Manage monitors');

  // List monitors
  monitors
    .command('list')
    .alias('ls')
    .description('List all monitors')
    .action(async () => {
      try {
        const config = await getConfig();
        if (!config.apiKey) {
          console.error('❌ Not authenticated. Run `pulse login` first.');
          process.exit(1);
        }

        const response = await fetch(`${config.apiUrl}/api/monitors`, {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
          },
        });

        if (!response.ok) {
          console.error('❌ Failed to fetch monitors');
          process.exit(1);
        }

        const monitors = (await response.json()) as Monitor[];

        if (monitors.length === 0) {
          console.log('No monitors found. Create one with:');
          console.log('  pulse monitors create --name my-job --interval 3600');
          return;
        }

        console.log(`\n📊 Monitors (${monitors.length}):\n`);
        
        const statusEmoji: Record<string, string> = {
          OK: '✅',
          LATE: '🟡',
          MISSED: '🟠',
          FAILING: '🔴',
          DISABLED: '⚫',
        };

        for (const monitor of monitors) {
          const emoji = statusEmoji[monitor.status] || '⚪';
          console.log(`${emoji} ${monitor.name} (${monitor.status})`);
          console.log(`   ID: ${monitor.id}`);
          
          if (monitor.scheduleType === 'INTERVAL' && monitor.intervalSec) {
            console.log(`   Schedule: Every ${monitor.intervalSec}s`);
          } else if (monitor.scheduleType === 'CRON' && monitor.cronExpr) {
            console.log(`   Schedule: ${monitor.cronExpr}`);
          }
          
          if (monitor.lastRunAt) {
            const lastRun = new Date(monitor.lastRunAt);
            console.log(`   Last Run: ${lastRun.toLocaleString()}`);
          }
          
          if (monitor.nextDueAt) {
            const nextDue = new Date(monitor.nextDueAt);
            console.log(`   Next Due: ${nextDue.toLocaleString()}`);
          }
          
          console.log('');
        }
      } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
      }
    });

  // Create monitor
  monitors
    .command('create')
    .description('Create a new monitor')
    .requiredOption('--name <name>', 'Monitor name')
    .option('--interval <seconds>', 'Interval in seconds')
    .option('--cron <expression>', 'Cron expression')
    .option('--timezone <tz>', 'Timezone', 'UTC')
    .option('--grace <seconds>', 'Grace period in seconds', '300')
    .action(async (options) => {
      try {
        const config = await getConfig();
        if (!config.apiKey) {
          console.error('❌ Not authenticated. Run `pulse login` first.');
          process.exit(1);
        }

        if (!options.interval && !options.cron) {
          console.error('❌ Either --interval or --cron is required');
          process.exit(1);
        }

        const body: any = {
          name: options.name,
          timezone: options.timezone,
          graceSec: parseInt(options.grace, 10),
        };

        if (options.interval) {
          body.scheduleType = 'INTERVAL';
          body.intervalSec = parseInt(options.interval, 10);
        } else {
          body.scheduleType = 'CRON';
          body.cronExpr = options.cron;
        }

        const response = await fetch(`${config.apiUrl}/api/monitors`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('❌ Failed to create monitor:', error);
          process.exit(1);
        }

        const monitor = (await response.json()) as Monitor;

        console.log('✅ Monitor created successfully!');
        console.log(`   Name: ${monitor.name}`);
        console.log(`   ID: ${monitor.id}`);
        console.log(`   Status: ${monitor.status}`);
        console.log('');
        console.log('Use this monitor with:');
        console.log(`   pulse run --monitor ${monitor.id} -- your-command`);
      } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
      }
    });

  // Get monitor details
  monitors
    .command('get <id>')
    .description('Get monitor details')
    .action(async (id: string) => {
      try {
        const config = await getConfig();
        if (!config.apiKey) {
          console.error('❌ Not authenticated. Run `pulse login` first.');
          process.exit(1);
        }

        const response = await fetch(`${config.apiUrl}/api/monitors/${id}`, {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
          },
        });

        if (!response.ok) {
          console.error('❌ Monitor not found');
          process.exit(1);
        }

        const monitor = (await response.json()) as Monitor & { token: string };

        console.log(`\n📊 ${monitor.name}\n`);
        console.log(`   ID: ${monitor.id}`);
        console.log(`   Status: ${monitor.status}`);
        console.log(`   Token: ${monitor.token}`);
        
        if (monitor.scheduleType === 'INTERVAL' && monitor.intervalSec) {
          console.log(`   Schedule: Every ${monitor.intervalSec}s`);
        } else if (monitor.scheduleType === 'CRON' && monitor.cronExpr) {
          console.log(`   Schedule: ${monitor.cronExpr}`);
        }
        
        if (monitor.lastRunAt) {
          console.log(`   Last Run: ${new Date(monitor.lastRunAt).toLocaleString()}`);
        }
        
        if (monitor.nextDueAt) {
          console.log(`   Next Due: ${new Date(monitor.nextDueAt).toLocaleString()}`);
        }
        
        console.log('');
      } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
      }
    });

  // Delete monitor
  monitors
    .command('delete <id>')
    .description('Delete a monitor')
    .option('-y, --yes', 'Skip confirmation')
    .action(async (id: string, options) => {
      try {
        const config = await getConfig();
        if (!config.apiKey) {
          console.error('❌ Not authenticated. Run `pulse login` first.');
          process.exit(1);
        }

        if (!options.yes) {
          console.log('⚠️  This will permanently delete the monitor and all its data.');
          console.log('   Run with --yes to confirm: pulse monitors delete <id> --yes');
          return;
        }

        const response = await fetch(`${config.apiUrl}/api/monitors/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
          },
        });

        if (!response.ok) {
          console.error('❌ Failed to delete monitor');
          process.exit(1);
        }

        console.log('✅ Monitor deleted successfully');
      } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
      }
    });

  // Pause monitor
  monitors
    .command('pause <id>')
    .description('Pause a monitor (disable temporarily)')
    .action(async (id: string) => {
      try {
        const config = await getConfig();
        if (!config.apiKey) {
          console.error('❌ Not authenticated. Run `pulse login` first.');
          process.exit(1);
        }

        const response = await fetch(`${config.apiUrl}/api/monitors/${id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'DISABLED' }),
        });

        if (!response.ok) {
          console.error('❌ Failed to pause monitor');
          process.exit(1);
        }

        console.log('✅ Monitor paused');
      } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
      }
    });

  // Resume monitor
  monitors
    .command('resume <id>')
    .description('Resume a paused monitor')
    .action(async (id: string) => {
      try {
        const config = await getConfig();
        if (!config.apiKey) {
          console.error('❌ Not authenticated. Run `pulse login` first.');
          process.exit(1);
        }

        const response = await fetch(`${config.apiUrl}/api/monitors/${id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'OK' }),
        });

        if (!response.ok) {
          console.error('❌ Failed to resume monitor');
          process.exit(1);
        }

        console.log('✅ Monitor resumed');
      } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
      }
    });
}



