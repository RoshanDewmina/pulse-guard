# Saturn CLI

Command-line interface for [Saturn](https://saturnmonitor.com) - Monitor your cron jobs and scheduled tasks.

## Installation

```bash
# Install globally
npm install -g saturn-monitor

# Or use with npx (no install required)
npx saturn-monitor --help
```

## Quick Start

### 1. Authenticate

```bash
saturn login
```

This will open your browser to authenticate with your Saturn account.

### 2. Wrap Your Commands

The easiest way to monitor a job is using `saturn run`:

```bash
saturn run --token YOUR_TOKEN -- ./your-script.sh
```

This automatically:
- Sends a start ping when the job begins
- Captures exit code and duration
- Sends success/fail ping when complete

## Commands

### `saturn login`

Authenticate the CLI with your Saturn account.

```bash
saturn login
```

Options:
- `--api <url>` - Override the API URL (default: https://saturnmonitor.com)

### `saturn logout`

Log out and remove stored credentials.

```bash
saturn logout
```

### `saturn run`

Wrap a command with automatic monitoring.

```bash
saturn run --token YOUR_TOKEN -- your-command [args...]
```

Options:
- `--token <token>` - Monitor token (required)
- `--monitor <name>` - Monitor name or ID

Example:

```bash
saturn run --token pg_abc123 -- npm run build
```

### `saturn monitors list`

List all monitors in your account.

```bash
saturn monitors list
```

### `saturn monitors create`

Create a new monitor.

```bash
saturn monitors create --name "Daily Backup" --interval 3600
```

Options:
- `--name <name>` - Monitor name (required)
- `--interval <seconds>` - Check interval in seconds
- `--cron <expression>` - Cron expression (alternative to interval)
- `--timezone <tz>` - Timezone for cron expression

## Configuration

Configuration is stored in `~/.saturn/config.json`:

```json
{
  "apiKey": "your-api-key",
  "apiUrl": "https://saturnmonitor.com"
}
```

## Integration Examples

### Bash Script

```bash
#!/bin/bash
TOKEN="YOUR_TOKEN"

# Option 1: Simple (one-time ping)
./your-script.sh && curl "https://saturnmonitor.com/api/ping/${TOKEN}?state=success"

# Option 2: With start/finish tracking
curl "https://saturnmonitor.com/api/ping/${TOKEN}?state=start"
./your-script.sh
EXIT_CODE=$?
curl "https://saturnmonitor.com/api/ping/${TOKEN}?state=success&exitCode=${EXIT_CODE}"

# Option 3: Using the CLI (recommended)
saturn run --token ${TOKEN} -- ./your-script.sh
```

### Crontab

```cron
# Run daily at 3 AM
0 3 * * * saturn run --token YOUR_TOKEN -- /path/to/backup.sh
```

### Docker

```dockerfile
FROM node:20-alpine
RUN npm install -g saturn-monitor
CMD ["saturn", "run", "--token", "YOUR_TOKEN", "--", "node", "app.js"]
```

## Development

```bash
# Install dependencies
bun install

# Run in development
bun run dev

# Build for production
bun run build

# Run tests
bun test
```

## License

MIT

## Links

- [Saturn Website](https://saturnmonitor.com)
- [Documentation](https://saturnmonitor.com/docs)
- [GitHub](https://github.com/saturnmonitor/saturn)
- [Support](https://saturnmonitor.com/support)


