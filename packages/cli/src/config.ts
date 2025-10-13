import Conf from 'conf';
import { homedir } from 'os';
import { join } from 'path';

export interface Config {
  apiKey?: string;
  apiUrl?: string;
}

// Use ~/.pulse/config.json for config storage
export const config = new Conf<Config>({
  projectName: 'pulse',
  cwd: join(homedir(), '.pulse'),
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
  return config.get('apiUrl') || 'http://localhost:3000';
}

export function setApiUrl(url: string): void {
  config.set('apiUrl', url);
}

