import { URL } from 'url';

export interface WhoisResult {
  domain: string;
  registrar: string;
  registeredAt: Date;
  expiresAt: Date;
  daysUntilExpiry: number;
  autoRenew: boolean | null;
  nameservers: string[];
  status: string[];
  whoisServer: string;
}

/**
 * Parse domain from URL
 */
export function parseDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch (error) {
    // If not a valid URL, assume it's already a domain
    return url.replace(/^www\./, '');
  }
}

/**
 * Calculate days until domain expiry
 */
export function calculateDaysUntilDomainExpiry(expiresAt: Date): number {
  const now = new Date();
  const diffTime = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Parse WHOIS response to extract key information
 */
function parseWhoisResponse(domain: string, whoisData: any): WhoisResult {
  // Try to extract common WHOIS fields
  // Different TLDs have different formats, so we try multiple field names
  
  const registrar =
    whoisData['Registrar'] ||
    whoisData['registrar'] ||
    whoisData['Sponsoring Registrar'] ||
    'Unknown';

  const createdDate =
    whoisData['Creation Date'] ||
    whoisData['Created Date'] ||
    whoisData['created'] ||
    whoisData['Domain Registration Date'] ||
    null;

  const expiryDate =
    whoisData['Registry Expiry Date'] ||
    whoisData['Registrar Registration Expiration Date'] ||
    whoisData['Expiry Date'] ||
    whoisData['Expiration Date'] ||
    whoisData['expires'] ||
    whoisData['paid-till'] ||
    null;

  const updatedDate =
    whoisData['Updated Date'] ||
    whoisData['Last Updated'] ||
    whoisData['updated'] ||
    null;

  // Parse nameservers (can be array or single value)
  let nameservers: string[] = [];
  const nsData =
    whoisData['Name Server'] ||
    whoisData['nameservers'] ||
    whoisData['nserver'] ||
    [];
  
  if (Array.isArray(nsData)) {
    nameservers = nsData.map((ns: any) =>
      typeof ns === 'string' ? ns.toLowerCase() : String(ns).toLowerCase()
    );
  } else if (nsData) {
    nameservers = [String(nsData).toLowerCase()];
  }

  // Parse status (can be array or single value)
  let status: string[] = [];
  const statusData =
    whoisData['Domain Status'] ||
    whoisData['status'] ||
    whoisData['Status'] ||
    [];
  
  if (Array.isArray(statusData)) {
    status = statusData.map((s: any) => String(s));
  } else if (statusData) {
    status = [String(statusData)];
  }

  // Parse dates
  const registeredAt = createdDate ? new Date(createdDate) : new Date();
  const expiresAt = expiryDate ? new Date(expiryDate) : new Date();
  
  // Calculate days until expiry
  const daysUntilExpiry = calculateDaysUntilDomainExpiry(expiresAt);

  // Try to determine auto-renew status from status field
  const autoRenew =
    status.some(
      (s) =>
        s.toLowerCase().includes('autorenew') ||
        s.toLowerCase().includes('auto renew')
    ) || null;

  return {
    domain,
    registrar,
    registeredAt,
    expiresAt,
    daysUntilExpiry,
    autoRenew,
    nameservers,
    status,
    whoisServer: whoisData['whoisServer'] || 'whois.iana.org',
  };
}

/**
 * Check domain expiration using WHOIS
 */
export async function checkDomainExpiration(
  domain: string
): Promise<WhoisResult> {
  try {
    // Dynamic import of whoiser to avoid build issues
    const whoiser = await import('whoiser');
    
    // Clean up domain
    const cleanDomain = parseDomainFromUrl(domain);

    // Query WHOIS
    const whoisData = await whoiser.default(cleanDomain, {
      timeout: 10000, // 10 second timeout
      follow: 2, // Follow up to 2 redirects
    });

    // whoiser returns data per WHOIS server
    // Get the first (most relevant) result
    const firstServer = Object.keys(whoisData)[0];
    const data = whoisData[firstServer];

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid WHOIS response');
    }

    return parseWhoisResponse(cleanDomain, data);
  } catch (error) {
    throw new Error(
      `WHOIS lookup failed for ${domain}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Check if domain needs alert based on thresholds
 */
export function needsDomainAlert(
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

