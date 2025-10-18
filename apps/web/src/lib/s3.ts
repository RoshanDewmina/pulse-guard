import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
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

const BUCKET_NAME = process.env.S3_BUCKET || 'saturn-outputs';

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

  // JWT tokens (do this first before generic key pattern)
  redacted = redacted.replace(/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, 'eyJ***.eyJ***.***');
  
  // URLs with credentials (including postgres://)
  redacted = redacted.replace(/((?:https?|postgres|postgresql|mysql):\/\/)[^:]+:[^@]+@/gi, '$1***:***@');
  
  // AWS Access Keys
  redacted = redacted.replace(/AKIA[0-9A-Z]{16}/g, 'AKIA****************');
  
  // Password-like environment variables
  redacted = redacted.replace(/(password|pwd|secret|token|key)\s*[=:]\s*[^\s]+/gi, '$1=***');
  
  // Generic API keys (longer patterns)
  redacted = redacted.replace(/\b[a-zA-Z0-9_-]{40,}\b/g, (match) => {
    return match.substring(0, 8) + '***' + match.substring(match.length - 4);
  });
  
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

/**
 * Delete a single object from S3
 */
export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Delete multiple objects from S3 by prefix
 * Used for cleaning up all outputs for a monitor or user
 */
export async function deleteObjectsByPrefix(prefix: string): Promise<number> {
  let deletedCount = 0;
  let continuationToken: string | undefined;

  do {
    // List objects with the given prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });

    const listResponse = await s3Client.send(listCommand);

    if (listResponse.Contents && listResponse.Contents.length > 0) {
      // Delete objects in batches of 1000 (S3 limit)
      const objects = listResponse.Contents.map((obj) => ({ Key: obj.Key! }));

      const deleteCommand = new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: objects,
          Quiet: true,
        },
      });

      const deleteResponse = await s3Client.send(deleteCommand);
      deletedCount += objects.length;

      if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
        console.error('S3 deletion errors:', deleteResponse.Errors);
      }
    }

    continuationToken = listResponse.NextContinuationToken;
  } while (continuationToken);

  return deletedCount;
}

/**
 * Delete data export file from S3
 */
export async function deleteDataExport(exportId: string): Promise<void> {
  const key = `exports/${exportId}.json`;
  await deleteObject(key);
}

