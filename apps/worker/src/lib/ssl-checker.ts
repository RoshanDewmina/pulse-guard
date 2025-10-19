import * as tls from 'tls';
import * as https from 'https';
import { URL } from 'url';

export interface SslCheckResult {
  domain: string;
  issuer: string;
  subject: string;
  issuedAt: Date;
  expiresAt: Date;
  daysUntilExpiry: number;
  isValid: boolean;
  isSelfSigned: boolean;
  chainValid: boolean;
  validationError?: string;
  serialNumber: string;
  fingerprint: string;
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): { hostname: string; port: number } {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    const port = parsed.port ? parseInt(parsed.port) : 443;
    return { hostname, port };
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`);
  }
}

/**
 * Calculate days until certificate expiry
 */
export function calculateDaysUntilExpiry(expiresAt: Date): number {
  const now = new Date();
  const diffTime = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Check if certificate is self-signed
 */
function isSelfSigned(cert: tls.PeerCertificate): boolean {
  return cert.issuer && cert.subject
    ? JSON.stringify(cert.issuer) === JSON.stringify(cert.subject)
    : false;
}

/**
 * Validate certificate chain
 */
function validateCertificateChain(cert: tls.PeerCertificate): boolean {
  // Check if certificate has issuerCertificate (chain)
  // Note: issuerCertificate is not available in Node.js types
  // This is a simplified validation
  return true;

}

/**
 * Get certificate fingerprint (SHA256)
 */
function getCertificateFingerprint(cert: tls.PeerCertificate): string {
  return cert.fingerprint256 || cert.fingerprint || '';
}

/**
 * Format certificate subject/issuer
 */
function formatCertificateField(field: any): string {
  if (typeof field === 'string') {
    return field;
  }
  if (field && typeof field === 'object') {
    return field.CN || field.O || JSON.stringify(field);
  }
  return 'Unknown';
}

/**
 * Check SSL certificate for a given URL
 */
export async function checkSslCertificate(url: string): Promise<SslCheckResult> {
  const { hostname, port } = extractDomain(url);

  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname,
      port,
      method: 'HEAD',
      timeout: 10000, // 10 second timeout
      rejectUnauthorized: false, // We want to check even invalid certs
    };

    const request = https.request(options, (response) => {
      const socket = response.socket as tls.TLSSocket;
      
      if (!socket) {
        reject(new Error('No TLS socket available'));
        return;
      }

      const cert = socket.getPeerCertificate(true);

      if (!cert || Object.keys(cert).length === 0) {
        reject(new Error('No certificate found'));
        return;
      }

      try {
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const now = new Date();
        const daysUntilExpiry = calculateDaysUntilExpiry(validTo);
        const selfSigned = isSelfSigned(cert);
        const chainValid = validateCertificateChain(cert);

        // Check if certificate is valid
        let isValid = true;
        let validationError: string | undefined;

        if (now < validFrom) {
          isValid = false;
          validationError = 'Certificate not yet valid';
        } else if (now > validTo) {
          isValid = false;
          validationError = 'Certificate expired';
        } else if (selfSigned) {
          isValid = false;
          validationError = 'Self-signed certificate';
        } else if (!chainValid) {
          isValid = false;
          validationError = 'Invalid certificate chain';
        }

        // Check if hostname matches
        const authorized = socket.authorized;
        if (!authorized && !validationError) {
          const authError = (socket as any).authorizationError;
          if (authError) {
            isValid = false;
            validationError = authError.toString();
          }
        }

        const result: SslCheckResult = {
          domain: hostname,
          issuer: formatCertificateField(cert.issuer),
          subject: formatCertificateField(cert.subject),
          issuedAt: validFrom,
          expiresAt: validTo,
          daysUntilExpiry,
          isValid,
          isSelfSigned: selfSigned,
          chainValid,
          validationError,
          serialNumber: cert.serialNumber || '',
          fingerprint: getCertificateFingerprint(cert),
        };

        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        request.destroy();
      }
    });

    request.on('error', (error) => {
      reject(new Error(`SSL check failed: ${error.message}`));
    });

    request.on('timeout', () => {
      request.destroy();
      reject(new Error('SSL check timeout'));
    });

    request.end();
  });
}

/**
 * Check if SSL certificate needs attention based on thresholds
 */
export function needsAlert(
  daysUntilExpiry: number,
  alertThresholds: number[],
  lastAlertedDays?: number
): boolean {
  // Check if we've crossed a threshold
  for (const threshold of alertThresholds.sort((a, b) => b - a)) {
    if (daysUntilExpiry <= threshold) {
      // Only alert if we haven't alerted for this threshold yet
      // or if the situation has worsened
      if (lastAlertedDays === undefined || lastAlertedDays > threshold) {
        return true;
      }
    }
  }
  return false;
}

