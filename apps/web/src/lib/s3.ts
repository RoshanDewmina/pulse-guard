import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
});

const BUCKET_NAME = process.env.S3_BUCKET || 'pulseguard-outputs';

export async function uploadOutput(key: string, content: string): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: content,
    ContentType: 'text/plain',
  });

  await s3Client.send(command);
}

export async function getOutputUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

export async function getOutput(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);
  const body = await response.Body?.transformToString();
  return body || '';
}

// Redact sensitive patterns from output
export function redactOutput(output: string): string {
  let redacted = output;

  // AWS Access Keys
  redacted = redacted.replace(/AKIA[0-9A-Z]{16}/g, 'AKIA****************');
  
  // Generic API keys (common patterns)
  redacted = redacted.replace(/[a-zA-Z0-9_-]{32,}/g, (match) => {
    if (match.length > 32) {
      return match.substring(0, 8) + '***' + match.substring(match.length - 4);
    }
    return match;
  });
  
  // JWT tokens
  redacted = redacted.replace(/eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, 'eyJ***.eyJ***.***');
  
  // URLs with credentials
  redacted = redacted.replace(/(https?:\/\/)[^:]+:[^@]+@/g, '$1***:***@');
  
  return redacted;
}

export function truncateOutput(output: string, maxKb: number): string {
  const maxBytes = maxKb * 1024;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(output);
  
  if (bytes.length <= maxBytes) {
    return output;
  }
  
  const decoder = new TextDecoder();
  const truncated = decoder.decode(bytes.slice(0, maxBytes));
  return truncated + '\n\n[... output truncated ...]';
}

