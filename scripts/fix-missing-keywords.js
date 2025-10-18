#!/usr/bin/env node

/**
 * Fix Missing Keywords Script
 * 
 * Adds appropriate keywords to pages that are missing them
 */

const fs = require('fs');
const path = require('path');

const pagesToFix = [
  {
    file: 'apps/web/src/app/auth/error/page.tsx',
    keywords: ['error', 'authentication error', 'login error', 'access denied']
  },
  {
    file: 'apps/web/src/app/auth/verify-request/page.tsx',
    keywords: ['email verification', 'verify account', 'magic link', 'check email']
  },
  {
    file: 'apps/web/src/app/auth/device/layout.tsx',
    keywords: ['device verification', 'two factor', 'security', 'device auth']
  },
  {
    file: 'apps/web/src/app/auth/signout/layout.tsx',
    keywords: ['sign out', 'logout', 'session ended', 'account logout']
  },
  {
    file: 'apps/web/src/app/app/page.tsx',
    keywords: ['dashboard', 'monitoring dashboard', 'cron jobs', 'status overview']
  },
  {
    file: 'apps/web/src/app/app/monitors/page.tsx',
    keywords: ['monitors', 'cron monitors', 'job monitoring', 'monitor list']
  },
  {
    file: 'apps/web/src/app/app/incidents/page.tsx',
    keywords: ['incidents', 'alerts', 'failures', 'incident management']
  },
  {
    file: 'apps/web/src/app/app/analytics/page.tsx',
    keywords: ['analytics', 'metrics', 'performance data', 'monitoring stats']
  },
  {
    file: 'apps/web/src/app/app/settings/page.tsx',
    keywords: ['settings', 'configuration', 'account settings', 'preferences']
  },
  {
    file: 'apps/web/src/app/app/settings/alerts/page.tsx',
    keywords: ['alert settings', 'notifications', 'alert channels', 'notification config']
  },
  {
    file: 'apps/web/src/app/app/settings/api-keys/page.tsx',
    keywords: ['api keys', 'api access', 'authentication tokens', 'developer keys']
  },
  {
    file: 'apps/web/src/app/app/settings/team/page.tsx',
    keywords: ['team management', 'user management', 'team members', 'collaboration']
  },
  {
    file: 'apps/web/src/app/app/settings/billing/page.tsx',
    keywords: ['billing', 'subscription', 'payment', 'account billing']
  },
  {
    file: 'apps/web/src/app/app/settings/data/page.tsx',
    keywords: ['data settings', 'data retention', 'privacy', 'data management']
  },
  {
    file: 'apps/web/src/app/app/settings/maintenance/page.tsx',
    keywords: ['maintenance', 'scheduled maintenance', 'downtime', 'maintenance windows']
  },
  {
    file: 'apps/web/src/app/app/settings/audit-logs/page.tsx',
    keywords: ['audit logs', 'activity logs', 'security logs', 'user activity']
  },
  {
    file: 'apps/web/src/app/app/settings/organization/layout.tsx',
    keywords: ['organization settings', 'company settings', 'org config', 'team settings']
  },
  {
    file: 'apps/web/src/app/app/integrations/page.tsx',
    keywords: ['integrations', 'third party', 'api integrations', 'connected services']
  },
  {
    file: 'apps/web/src/app/app/status-pages/page.tsx',
    keywords: ['status pages', 'public status', 'uptime pages', 'status dashboard']
  },
  {
    file: 'apps/web/src/app/app/organizations/layout.tsx',
    keywords: ['organizations', 'multi tenant', 'org management', 'workspaces']
  },
  {
    file: 'apps/web/src/app/app/profile/layout.tsx',
    keywords: ['profile', 'user profile', 'account profile', 'personal settings']
  },
  {
    file: 'apps/web/src/app/app/reports/layout.tsx',
    keywords: ['reports', 'analytics reports', 'monitoring reports', 'performance reports']
  },
  {
    file: 'apps/web/src/app/app/postmortems/layout.tsx',
    keywords: ['postmortems', 'incident reports', 'root cause analysis', 'post incident']
  },
  {
    file: 'apps/web/src/app/app/synthetic/layout.tsx',
    keywords: ['synthetic monitoring', 'synthetic tests', 'automated testing', 'synthetic checks']
  }
];

function addKeywordsToFile(filePath, keywords) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if keywords already exist
    if (content.includes('keywords:')) {
      console.log(`✅ ${filePath}: Keywords already exist`);
      return true;
    }

    // Find the generatePageMetadata call
    const metadataMatch = content.match(/(export\s+const\s+metadata\s*=\s*generatePageMetadata\s*\(\s*\{)([^}]+)(\})/s);
    if (!metadataMatch) {
      console.log(`❌ ${filePath}: No generatePageMetadata found`);
      return false;
    }

    const beforeMetadata = metadataMatch[1];
    const metadataContent = metadataMatch[2];
    const afterMetadata = metadataMatch[3];

    // Add keywords before the closing brace
    const keywordsString = `  keywords: [${keywords.map(k => `'${k}'`).join(', ')}],\n`;
    
    // Insert keywords before the last property (usually path or noIndex)
    const lines = metadataContent.split('\n');
    const lastNonEmptyLineIndex = lines.findLastIndex(line => line.trim() !== '');
    
    if (lastNonEmptyLineIndex >= 0) {
      lines.splice(lastNonEmptyLineIndex, 0, keywordsString.trim());
    } else {
      lines.push(keywordsString.trim());
    }

    const newMetadataContent = lines.join('\n');
    const newContent = content.replace(metadataMatch[0], beforeMetadata + newMetadataContent + afterMetadata);

    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`✅ ${filePath}: Added keywords`);
    return true;
  } catch (error) {
    console.log(`❌ ${filePath}: Error - ${error.message}`);
    return false;
  }
}

console.log('🔧 Adding Missing Keywords');
console.log('==========================\n');

let successCount = 0;
let totalCount = pagesToFix.length;

pagesToFix.forEach(({ file, keywords }) => {
  if (addKeywordsToFile(file, keywords)) {
    successCount++;
  }
});

console.log(`\n📊 Summary: ${successCount}/${totalCount} files updated successfully`);
