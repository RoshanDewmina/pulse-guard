#!/usr/bin/env node

/**
 * Monitoring Setup Script
 * 
 * Sets up Lighthouse CI, Search Console, and performance monitoring
 */

const fs = require('fs');
const path = require('path');

function createLighthouseCI() {
  console.log('🔧 Setting up Lighthouse CI...');
  
  const lighthouseConfig = {
    ci: {
      collect: {
        numberOfRuns: 3,
        url: ['http://localhost:3000', 'http://localhost:3000/company/about', 'http://localhost:3000/support']
      },
      assert: {
        assertions: {
          'categories:performance': ['error', { minScore: 0.9 }],
          'categories:accessibility': ['error', { minScore: 0.9 }],
          'categories:best-practices': ['error', { minScore: 0.9 }],
          'categories:seo': ['error', { minScore: 0.9 }],
          'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
          'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
          'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
          'total-blocking-time': ['error', { maxNumericValue: 200 }]
        }
      },
      upload: {
        target: 'temporary-public-storage'
      }
    }
  };
  
  const configPath = path.join(process.cwd(), 'lighthouserc.json');
  fs.writeFileSync(configPath, JSON.stringify(lighthouseConfig, null, 2));
  console.log('✅ Created lighthouserc.json');
}

function createGitHubActions() {
  console.log('🔧 Setting up GitHub Actions...');
  
  const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
  if (!fs.existsSync(workflowsDir)) {
    fs.mkdirSync(workflowsDir, { recursive: true });
  }
  
  const lighthouseWorkflow = `name: Lighthouse CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'apps/web/package-lock.json'
      
      - name: Install dependencies
        run: |
          cd apps/web
          npm ci
      
      - name: Build application
        run: |
          cd apps/web
          npm run build
      
      - name: Start application
        run: |
          cd apps/web
          npm start &
          sleep 10
      
      - name: Run Lighthouse CI
        run: |
          cd apps/web
          npx @lhci/cli@0.12.x autorun
        env:
          LHCI_GITHUB_APP_TOKEN: \${{ secrets.LHCI_GITHUB_APP_TOKEN }}
`;

  const workflowPath = path.join(workflowsDir, 'lighthouse.yml');
  fs.writeFileSync(workflowPath, lighthouseWorkflow);
  console.log('✅ Created .github/workflows/lighthouse.yml');
}

function createPerformanceBudget() {
  console.log('🔧 Setting up Performance Budget...');
  
  const budgetConfig = {
    budgets: [
      {
        path: '/*',
        timings: [
          {
            metric: 'first-contentful-paint',
            budget: 1800
          },
          {
            metric: 'largest-contentful-paint',
            budget: 2500
          },
          {
            metric: 'cumulative-layout-shift',
            budget: 0.1
          },
          {
            metric: 'total-blocking-time',
            budget: 200
          }
        ],
        resourceSizes: [
          {
            resourceType: 'script',
            budget: 200
          },
          {
            resourceType: 'total',
            budget: 500
          }
        ]
      }
    ]
  };
  
  const budgetPath = path.join(process.cwd(), 'apps/web', 'budget.json');
  fs.writeFileSync(budgetPath, JSON.stringify(budgetConfig, null, 2));
  console.log('✅ Created apps/web/budget.json');
}

function createSearchConsoleGuide() {
  console.log('🔧 Creating Search Console setup guide...');
  
  const guide = `# Google Search Console Setup Guide

## 1. Add Property
1. Go to https://search.google.com/search-console
2. Add property: https://saturnmonitor.com
3. Verify ownership using HTML file method

## 2. Submit Sitemap
1. Go to Sitemaps section
2. Add sitemap: https://saturnmonitor.com/sitemap.xml
3. Submit for indexing

## 3. Monitor Performance
- Check Core Web Vitals report
- Monitor search performance
- Review coverage issues
- Set up email alerts for critical issues

## 4. Key Metrics to Track
- Impressions and clicks
- Average position
- Click-through rate (CTR)
- Core Web Vitals scores
- Mobile usability issues

## 5. Regular Tasks
- Weekly performance review
- Monthly sitemap submission
- Quarterly content audit
- Monitor for crawl errors
`;

  const guidePath = path.join(process.cwd(), 'SEARCH_CONSOLE_SETUP.md');
  fs.writeFileSync(guidePath, guide);
  console.log('✅ Created SEARCH_CONSOLE_SETUP.md');
}

function createMonitoringScripts() {
  console.log('🔧 Creating monitoring scripts...');
  
  const healthCheckScript = `#!/bin/bash

# Health Check Script for Saturn
# Run this script to check if all SEO features are working

echo "🔍 Saturn SEO Health Check"
echo "=========================="

# Check if build exists
if [ ! -d "apps/web/.next" ]; then
    echo "❌ Build not found. Run 'npm run build' first."
    exit 1
fi

# Check sitemap
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/sitemap.xml | grep -q "200"; then
    echo "✅ Sitemap accessible"
else
    echo "❌ Sitemap not accessible"
fi

# Check robots.txt
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/robots.txt | grep -q "200"; then
    echo "✅ Robots.txt accessible"
else
    echo "❌ Robots.txt not accessible"
fi

# Check meta tags on homepage
if curl -s http://localhost:3000 | grep -q 'name="description"'; then
    echo "✅ Meta description present"
else
    echo "❌ Meta description missing"
fi

# Check structured data
if curl -s http://localhost:3000 | grep -q 'application/ld+json'; then
    echo "✅ Structured data present"
else
    echo "❌ Structured data missing"
fi

echo "\\n🎉 Health check complete!"
`;

  const healthCheckPath = path.join(process.cwd(), 'scripts', 'health-check.sh');
  fs.writeFileSync(healthCheckPath, healthCheckScript);
  fs.chmodSync(healthCheckPath, '755');
  console.log('✅ Created scripts/health-check.sh');
}

function generateMonitoringReport() {
  console.log('📊 Saturn Monitoring Setup Report');
  console.log('==================================\n');
  
  createLighthouseCI();
  createGitHubActions();
  createPerformanceBudget();
  createSearchConsoleGuide();
  createMonitoringScripts();
  
  console.log('\n🎯 Next Steps:');
  console.log('==============');
  console.log('1. Install Lighthouse CI: npm install -g @lhci/cli');
  console.log('2. Set up GitHub App token for Lighthouse CI');
  console.log('3. Add property to Google Search Console');
  console.log('4. Submit sitemap to Search Console');
  console.log('5. Run health check: ./scripts/health-check.sh');
  console.log('6. Set up performance monitoring alerts');
  
  console.log('\n📋 Monitoring Checklist:');
  console.log('- [ ] Lighthouse CI configured');
  console.log('- [ ] GitHub Actions workflow active');
  console.log('- [ ] Google Search Console property added');
  console.log('- [ ] Sitemap submitted to Search Console');
  console.log('- [ ] Performance budget configured');
  console.log('- [ ] Health check script tested');
  console.log('- [ ] Monitoring alerts configured');
  
  console.log('\n✅ Monitoring setup complete!');
}

// Run monitoring setup
generateMonitoringReport();
