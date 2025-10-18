#!/usr/bin/env node

/**
 * Metadata Validation Script
 * 
 * Validates all metadata across the application to ensure:
 * - Unique titles and descriptions
 * - Proper length limits
 * - Consistent formatting
 * - Complete OG image coverage
 */

const fs = require('fs');
const path = require('path');

// Configuration
const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 160;
const SITE_URL = process.env.SITE_URL || 'https://saturnmonitor.com';

// Track metadata across all pages
const metadataRegistry = {
  titles: new Set(),
  descriptions: new Set(),
  pages: [],
  issues: []
};

// Pages to validate
const pagesToValidate = [
  // Public marketing pages
  { path: '/', file: 'apps/web/src/app/page.tsx', shouldIndex: true },
  { path: '/company/about', file: 'apps/web/src/app/company/about/page.tsx', shouldIndex: true },
  { path: '/support', file: 'apps/web/src/app/support/layout.tsx', shouldIndex: true },
  { path: '/legal/privacy', file: 'apps/web/src/app/legal/privacy/page.tsx', shouldIndex: true },
  { path: '/legal/terms', file: 'apps/web/src/app/legal/terms/page.tsx', shouldIndex: true },
  { path: '/legal/cookies', file: 'apps/web/src/app/legal/cookies/page.tsx', shouldIndex: true },
  { path: '/legal/security', file: 'apps/web/src/app/legal/security/page.tsx', shouldIndex: true },
  { path: '/legal/dpa', file: 'apps/web/src/app/legal/dpa/page.tsx', shouldIndex: true },
  
  // Auth pages (should not be indexed)
  { path: '/auth/signin', file: 'apps/web/src/app/auth/signin/layout.tsx', shouldIndex: false },
  { path: '/auth/signup', file: 'apps/web/src/app/auth/signup/layout.tsx', shouldIndex: false },
  { path: '/auth/error', file: 'apps/web/src/app/auth/error/page.tsx', shouldIndex: false },
  { path: '/auth/verify-request', file: 'apps/web/src/app/auth/verify-request/page.tsx', shouldIndex: false },
  { path: '/auth/device', file: 'apps/web/src/app/auth/device/layout.tsx', shouldIndex: false },
  { path: '/auth/signout', file: 'apps/web/src/app/auth/signout/layout.tsx', shouldIndex: false },
  
  // App pages (should not be indexed)
  { path: '/app', file: 'apps/web/src/app/app/page.tsx', shouldIndex: false },
  { path: '/app/monitors', file: 'apps/web/src/app/app/monitors/page.tsx', shouldIndex: false },
  { path: '/app/incidents', file: 'apps/web/src/app/app/incidents/page.tsx', shouldIndex: false },
  { path: '/app/analytics', file: 'apps/web/src/app/app/analytics/page.tsx', shouldIndex: false },
  { path: '/app/settings', file: 'apps/web/src/app/app/settings/page.tsx', shouldIndex: false },
  { path: '/app/settings/alerts', file: 'apps/web/src/app/app/settings/alerts/page.tsx', shouldIndex: false },
  { path: '/app/settings/api-keys', file: 'apps/web/src/app/app/settings/api-keys/page.tsx', shouldIndex: false },
  { path: '/app/settings/team', file: 'apps/web/src/app/app/settings/team/page.tsx', shouldIndex: false },
  { path: '/app/settings/billing', file: 'apps/web/src/app/app/settings/billing/page.tsx', shouldIndex: false },
  { path: '/app/settings/data', file: 'apps/web/src/app/app/settings/data/page.tsx', shouldIndex: false },
  { path: '/app/settings/maintenance', file: 'apps/web/src/app/app/settings/maintenance/page.tsx', shouldIndex: false },
  { path: '/app/settings/audit-logs', file: 'apps/web/src/app/app/settings/audit-logs/page.tsx', shouldIndex: false },
  { path: '/app/settings/organization', file: 'apps/web/src/app/app/settings/organization/layout.tsx', shouldIndex: false },
  { path: '/app/integrations', file: 'apps/web/src/app/app/integrations/page.tsx', shouldIndex: false },
  { path: '/app/status-pages', file: 'apps/web/src/app/app/status-pages/page.tsx', shouldIndex: false },
  { path: '/app/organizations', file: 'apps/web/src/app/app/organizations/layout.tsx', shouldIndex: false },
  { path: '/app/profile', file: 'apps/web/src/app/app/profile/layout.tsx', shouldIndex: false },
  { path: '/app/reports', file: 'apps/web/src/app/app/reports/layout.tsx', shouldIndex: false },
  { path: '/app/postmortems', file: 'apps/web/src/app/app/postmortems/layout.tsx', shouldIndex: false },
  { path: '/app/synthetic', file: 'apps/web/src/app/app/synthetic/layout.tsx', shouldIndex: false },
];

function extractMetadataFromFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      return { error: `File not found: ${filePath}` };
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Extract metadata export - handle multiple patterns
    let metadataMatch = content.match(/export\s+const\s+metadata\s*=\s*generatePageMetadata\s*\(\s*\{([^}]+)\}/s);
    if (!metadataMatch) {
      // Try pattern with type annotation
      metadataMatch = content.match(/export\s+const\s+metadata\s*:\s*Metadata\s*=\s*generatePageMetadata\s*\(\s*\{([^}]+)\}/s);
    }
    if (!metadataMatch) {
      // Try static metadata pattern
      metadataMatch = content.match(/export\s+const\s+metadata\s*:\s*Metadata\s*=\s*\{([^}]+)\}/s);
    }
    if (!metadataMatch) {
      return { error: `No metadata export found in ${filePath}` };
    }

    const metadataContent = metadataMatch[1];
    
    // Extract title
    const titleMatch = metadataContent.match(/title:\s*["'`]([^"'`]+)["'`]/);
    const title = titleMatch ? titleMatch[1] : null;
    
    // Extract description
    const descMatch = metadataContent.match(/description:\s*["'`]([^"'`]+)["'`]/);
    const description = descMatch ? descMatch[1] : null;
    
    // Extract keywords
    const keywordsMatch = metadataContent.match(/keywords:\s*\[([^\]]+)\]/);
    const keywords = keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim().replace(/['"]/g, '')) : [];
    
    // Extract path
    const pathMatch = metadataContent.match(/path:\s*["'`]([^"'`]+)["'`]/);
    const pagePath = pathMatch ? pathMatch[1] : null;
    
    // Extract noIndex
    const noIndexMatch = metadataContent.match(/noIndex:\s*(true|false)/);
    const noIndex = noIndexMatch ? noIndexMatch[1] === 'true' : false;

    return {
      title,
      description,
      keywords,
      path: pagePath,
      noIndex,
      file: filePath
    };
  } catch (error) {
    return { error: `Error reading ${filePath}: ${error.message}` };
  }
}

function validateMetadata(metadata, pageInfo) {
  const issues = [];
  
  // Check title
  if (!metadata.title) {
    issues.push('Missing title');
  } else {
    if (metadata.title.length > TITLE_MAX_LENGTH) {
      issues.push(`Title too long: ${metadata.title.length} chars (max ${TITLE_MAX_LENGTH})`);
    }
    if (metadataRegistry.titles.has(metadata.title)) {
      issues.push(`Duplicate title: "${metadata.title}"`);
    } else {
      metadataRegistry.titles.add(metadata.title);
    }
  }
  
  // Check description
  if (!metadata.description) {
    issues.push('Missing description');
  } else {
    if (metadata.description.length > DESCRIPTION_MAX_LENGTH) {
      issues.push(`Description too long: ${metadata.description.length} chars (max ${DESCRIPTION_MAX_LENGTH})`);
    }
    if (metadataRegistry.descriptions.has(metadata.description)) {
      issues.push(`Duplicate description: "${metadata.description}"`);
    } else {
      metadataRegistry.descriptions.add(metadata.description);
    }
  }
  
  // Check indexing rules
  if (pageInfo.shouldIndex && metadata.noIndex) {
    issues.push('Page should be indexed but has noIndex: true');
  }
  if (!pageInfo.shouldIndex && !metadata.noIndex) {
    issues.push('Page should not be indexed but missing noIndex: true');
  }
  
  // Check keywords
  if (metadata.keywords && metadata.keywords.length === 0) {
    issues.push('Keywords array is empty');
  }
  
  return issues;
}

function generateReport() {
  console.log('🔍 Saturn SEO Metadata Validation Report');
  console.log('==========================================\n');
  
  let totalPages = 0;
  let pagesWithIssues = 0;
  let totalIssues = 0;
  
  pagesToValidate.forEach(pageInfo => {
    totalPages++;
    const metadata = extractMetadataFromFile(pageInfo.file);
    
    if (metadata.error) {
      console.log(`❌ ${pageInfo.path}: ${metadata.error}`);
      pagesWithIssues++;
      totalIssues++;
      return;
    }
    
    const issues = validateMetadata(metadata, pageInfo);
    
    if (issues.length > 0) {
      console.log(`⚠️  ${pageInfo.path}:`);
      issues.forEach(issue => {
        console.log(`   - ${issue}`);
        totalIssues++;
      });
      pagesWithIssues++;
    } else {
      console.log(`✅ ${pageInfo.path}: All metadata valid`);
    }
    
    metadataRegistry.pages.push({
      path: pageInfo.path,
      metadata,
      issues
    });
  });
  
  console.log('\n📊 Summary');
  console.log('===========');
  console.log(`Total pages checked: ${totalPages}`);
  console.log(`Pages with issues: ${pagesWithIssues}`);
  console.log(`Total issues found: ${totalIssues}`);
  console.log(`Unique titles: ${metadataRegistry.titles.size}`);
  console.log(`Unique descriptions: ${metadataRegistry.descriptions.size}`);
  
  if (totalIssues === 0) {
    console.log('\n🎉 All metadata validation passed!');
  } else {
    console.log(`\n⚠️  Found ${totalIssues} issues that need attention.`);
  }
  
  // Check for OG images
  console.log('\n🖼️  Open Graph Images');
  console.log('====================');
  const ogImagePages = [
    '/company/about',
    '/legal/privacy',
    '/legal/terms', 
    '/legal/cookies',
    '/legal/security',
    '/legal/dpa',
    '/support'
  ];
  
  ogImagePages.forEach(page => {
    const ogImagePath = `apps/web/src/app${page}/opengraph-image.tsx`;
    const fullPath = path.join(process.cwd(), ogImagePath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${page}: Custom OG image exists`);
    } else {
      console.log(`❌ ${page}: Missing custom OG image`);
    }
  });
  
  return totalIssues === 0;
}

// Run validation
const success = generateReport();
process.exit(success ? 0 : 1);
