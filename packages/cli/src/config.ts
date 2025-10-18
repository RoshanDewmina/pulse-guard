import Conf from 'conf';
import { homedir } from 'os';
import { join } from 'path';

export interface Config {
  apiKey?: string;
  apiUrl?: string;
}

// Use ~/.saturn/config.json for config storage
export const config = new Conf<Config>({
  projectName: 'saturn',
  cwd: join(homedir(), '.saturn'),
  configName: 'config',
});

export function getApiKey(): string | undefined {
  return config.get('apiKey');
}

export function setApiKey(apiKey: string): void {
  config.set('apiKey', apiKey);
}

export function clearApiKey(): void {
  config.delete('apiKey');
}

export function getApiUrl(): string {
  return config.get('apiUrl') || 'https://saturnmonitor.com';
}

export function setApiUrl(url: string): void {
  config.set('apiUrl', url);
}

export function getConfig(): Config {
  return {
    apiKey: config.get('apiKey'),
    apiUrl: config.get('apiUrl'),
  };
}

export async function saveConfig(newConfig: Config): Promise<void> {
  if (newConfig.apiKey !== undefined) {
    config.set('apiKey', newConfig.apiKey);
  }
  if (newConfig.apiUrl !== undefined) {
    config.set('apiUrl', newConfig.apiUrl);
  }
}
