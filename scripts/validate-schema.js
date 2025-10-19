#!/usr/bin/env node

/**
 * Schema Validation Script
 * 
 * Validates all JSON-LD structured data across the application
 */

const fs = require('fs');
const path = require('path');

// Pages to validate for schema
const pagesToValidate = [
  { path: '/', file: 'apps/web/src/app/page.tsx', schemas: ['Organization', 'WebSite', 'SoftwareApplication', 'FAQPage'] },
  { path: '/company/about', file: 'apps/web/src/app/company/about/page.tsx', schemas: ['AboutPage', 'BreadcrumbList'] },
  { path: '/support', file: 'apps/web/src/app/support/layout.tsx', schemas: ['ContactPage', 'BreadcrumbList'] },
  { path: '/legal/privacy', file: 'apps/web/src/app/legal/privacy/page.tsx', schemas: ['WebPage', 'BreadcrumbList'] },
  { path: '/legal/terms', file: 'apps/web/src/app/legal/terms/page.tsx', schemas: ['WebPage', 'BreadcrumbList'] },
  { path: '/legal/cookies', file: 'apps/web/src/app/legal/cookies/page.tsx', schemas: ['WebPage', 'BreadcrumbList'] },
  { path: '/legal/security', file: 'apps/web/src/app/legal/security/page.tsx', schemas: ['WebPage', 'BreadcrumbList'] },
  { path: '/legal/dpa', file: 'apps/web/src/app/legal/dpa/page.tsx', schemas: ['WebPage', 'BreadcrumbList'] },
];

function extractSchemasFromFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      return { error: `File not found: ${filePath}` };
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Extract JsonLd components
    const jsonLdMatches = content.match(/<JsonLd\s+data=\{([^}]+)\}/g);
    const schemas = [];
    
    if (jsonLdMatches) {
      jsonLdMatches.forEach(match => {
        // Extract schema type from the data prop
        const schemaMatch = match.match(/get(\w+)Schema/);
        if (schemaMatch) {
          schemas.push(schemaMatch[1]);
        }
      });
    }
    
    return { schemas };
  } catch (error) {
    return { error: `Error reading ${filePath}: ${error.message}` };
  }
}

function validateSchema(pageInfo) {
  const result = extractSchemasFromFile(pageInfo.file);
  
  if (result.error) {
    return { error: result.error };
  }
  
  const foundSchemas = result.schemas;
  const expectedSchemas = pageInfo.schemas;
  const missingSchemas = expectedSchemas.filter(schema => !foundSchemas.includes(schema));
  const extraSchemas = foundSchemas.filter(schema => !expectedSchemas.includes(schema));
  
  return {
    found: foundSchemas,
    expected: expectedSchemas,
    missing: missingSchemas,
    extra: extraSchemas,
    valid: missingSchemas.length === 0
  };
}

function generateSchemaReport() {
  console.log('🔍 Saturn Schema Validation Report');
  console.log('==================================\n');
  
  let totalPages = 0;
  let validPages = 0;
  let totalIssues = 0;
  
  pagesToValidate.forEach(pageInfo => {
    totalPages++;
    const validation = validateSchema(pageInfo);
    
    if (validation.error) {
      console.log(`❌ ${pageInfo.path}: ${validation.error}`);
      totalIssues++;
      return;
    }
    
    if (validation.valid) {
      console.log(`✅ ${pageInfo.path}: All expected schemas present`);
      if (validation.extra.length > 0) {
        console.log(`   Bonus schemas: ${validation.extra.join(', ')}`);
      }
      validPages++;
    } else {
      console.log(`⚠️  ${pageInfo.path}:`);
      if (validation.missing.length > 0) {
        console.log(`   Missing: ${validation.missing.join(', ')}`);
        totalIssues += validation.missing.length;
      }
      if (validation.extra.length > 0) {
        console.log(`   Extra: ${validation.extra.join(', ')}`);
      }
    }
  });
  
  console.log('\n📊 Schema Summary');
  console.log('==================');
  console.log(`Total pages checked: ${totalPages}`);
  console.log(`Pages with valid schemas: ${validPages}`);
  console.log(`Total schema issues: ${totalIssues}`);
  
  if (totalIssues === 0) {
    console.log('\n🎉 All schema validation passed!');
  } else {
    console.log(`\n⚠️  Found ${totalIssues} schema issues that need attention.`);
  }
  
  // Check for Product schema in pricing
  console.log('\n💰 Product Schema Check');
  console.log('========================');
  const pricingFile = 'apps/web/src/components/pricing-section.tsx';
  const pricingPath = path.join(process.cwd(), pricingFile);
  
  if (fs.existsSync(pricingPath)) {
    const pricingContent = fs.readFileSync(pricingPath, 'utf8');
    const hasProductSchema = pricingContent.includes('getProductSchema');
    const hasJsonLd = pricingContent.includes('<JsonLd');
    
    if (hasProductSchema && hasJsonLd) {
      console.log('✅ Pricing section: Product schema implemented');
    } else {
      console.log('❌ Pricing section: Missing Product schema');
    }
  } else {
    console.log('❌ Pricing section: File not found');
  }
  
  return totalIssues === 0;
}

// Run validation
const success = generateSchemaReport();
process.exit(success ? 0 : 1);
