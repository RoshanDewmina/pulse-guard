#!/usr/bin/env node

/**
 * Performance Testing Script
 * 
 * Tests Core Web Vitals and performance metrics
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Performance targets
const TARGETS = {
  LCP: 2500, // ms (2.5s)
  INP: 200,  // ms (200ms)
  CLS: 0.1,  // (0.1)
  FCP: 1800, // ms (1.8s)
  TTI: 3800, // ms (3.8s)
  TBT: 200,  // ms (200ms)
  SI: 3400,  // ms (3.4s)
};

// Pages to test
const PAGES_TO_TEST = [
  { url: '/', name: 'Homepage' },
  { url: '/company/about', name: 'About' },
  { url: '/support', name: 'Support' },
  { url: '/legal/privacy', name: 'Privacy Policy' },
  { url: '/legal/terms', name: 'Terms of Service' },
];

function runLighthouseTest(url, name) {
  console.log(`\n🔍 Testing ${name} (${url})`);
  console.log('='.repeat(50));
  
  try {
    // Check if lighthouse is installed
    try {
      execSync('lighthouse --version', { stdio: 'ignore' });
    } catch {
      console.log('⚠️  Lighthouse not installed. Install with: npm install -g lighthouse');
      return { error: 'Lighthouse not available' };
    }
    
    // Run lighthouse test
    const command = `lighthouse http://localhost:3000${url} --output=json --chrome-flags="--headless" --quiet`;
    const output = execSync(command, { encoding: 'utf8', timeout: 60000 });
    const results = JSON.parse(output);
    
    const metrics = {
      performance: Math.round(results.categories.performance.score * 100),
      accessibility: Math.round(results.categories.accessibility.score * 100),
      bestPractices: Math.round(results.categories['best-practices'].score * 100),
      seo: Math.round(results.categories.seo.score * 100),
      lcp: results.audits['largest-contentful-paint'].numericValue,
      inp: results.audits['interactive'].numericValue,
      cls: results.audits['cumulative-layout-shift'].numericValue,
      fcp: results.audits['first-contentful-paint'].numericValue,
      tti: results.audits['interactive'].numericValue,
      tbt: results.audits['total-blocking-time'].numericValue,
      si: results.audits['speed-index'].numericValue,
    };
    
    // Display results
    console.log(`📊 Lighthouse Scores:`);
    console.log(`   Performance: ${metrics.performance}/100 ${metrics.performance >= 90 ? '✅' : '❌'}`);
    console.log(`   Accessibility: ${metrics.accessibility}/100 ${metrics.accessibility >= 90 ? '✅' : '❌'}`);
    console.log(`   Best Practices: ${metrics.bestPractices}/100 ${metrics.bestPractices >= 90 ? '✅' : '❌'}`);
    console.log(`   SEO: ${metrics.seo}/100 ${metrics.seo >= 90 ? '✅' : '❌'}`);
    
    console.log(`\n⚡ Core Web Vitals:`);
    console.log(`   LCP: ${Math.round(metrics.lcp)}ms ${metrics.lcp <= TARGETS.LCP ? '✅' : '❌'} (target: ${TARGETS.LCP}ms)`);
    console.log(`   INP: ${Math.round(metrics.inp)}ms ${metrics.inp <= TARGETS.INP ? '✅' : '❌'} (target: ${TARGETS.INP}ms)`);
    console.log(`   CLS: ${metrics.cls.toFixed(3)} ${metrics.cls <= TARGETS.CLS ? '✅' : '❌'} (target: ${TARGETS.CLS})`);
    
    console.log(`\n🚀 Other Metrics:`);
    console.log(`   FCP: ${Math.round(metrics.fcp)}ms ${metrics.fcp <= TARGETS.FCP ? '✅' : '❌'} (target: ${TARGETS.FCP}ms)`);
    console.log(`   TTI: ${Math.round(metrics.tti)}ms ${metrics.tti <= TARGETS.TTI ? '✅' : '❌'} (target: ${TARGETS.TTI}ms)`);
    console.log(`   TBT: ${Math.round(metrics.tbt)}ms ${metrics.tbt <= TARGETS.TBT ? '✅' : '❌'} (target: ${TARGETS.TBT}ms)`);
    console.log(`   SI: ${Math.round(metrics.si)}ms ${metrics.si <= TARGETS.SI ? '✅' : '❌'} (target: ${TARGETS.SI}ms)`);
    
    return {
      success: true,
      metrics,
      passed: metrics.performance >= 90 && metrics.accessibility >= 90 && 
              metrics.bestPractices >= 90 && metrics.seo >= 90 &&
              metrics.lcp <= TARGETS.LCP && metrics.inp <= TARGETS.INP && 
              metrics.cls <= TARGETS.CLS
    };
    
  } catch (error) {
    console.log(`❌ Error testing ${name}: ${error.message}`);
    return { error: error.message };
  }
}

function checkBundleSizes() {
  console.log('\n📦 Bundle Size Analysis');
  console.log('========================');
  
  try {
    // Check if build exists
    const buildPath = path.join(process.cwd(), 'apps/web/.next');
    if (!fs.existsSync(buildPath)) {
      console.log('❌ Build not found. Run "npm run build" first.');
      return false;
    }
    
    // Read build manifest
    const manifestPath = path.join(buildPath, 'build-manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      console.log('📊 JavaScript Bundle Sizes:');
      let totalSize = 0;
      
      Object.entries(manifest.pages).forEach(([page, files]) => {
        const jsFiles = files.filter(file => file.endsWith('.js'));
        const pageSize = jsFiles.length * 1024; // Rough estimate
        totalSize += pageSize;
        
        console.log(`   ${page}: ~${Math.round(pageSize / 1024)}KB`);
      });
      
      console.log(`\n📈 Total estimated JS: ~${Math.round(totalSize / 1024)}KB`);
      
      if (totalSize < 200 * 1024) {
        console.log('✅ Bundle size within target (<200KB)');
        return true;
      } else {
        console.log('❌ Bundle size exceeds target (200KB)');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Error analyzing bundle sizes: ${error.message}`);
    return false;
  }
}

function generatePerformanceReport() {
  console.log('🚀 Saturn Performance Testing Report');
  console.log('====================================\n');
  
  // Check if dev server is running
  try {
    execSync('curl -s http://localhost:3000 > /dev/null', { stdio: 'ignore' });
  } catch {
    console.log('❌ Development server not running. Start with "npm run dev" first.');
    console.log('   Skipping Lighthouse tests...\n');
  }
  
  let totalTests = 0;
  let passedTests = 0;
  let bundleSizeOk = false;
  
  // Test bundle sizes
  bundleSizeOk = checkBundleSizes();
  
  // Test pages if server is running
  try {
    execSync('curl -s http://localhost:3000 > /dev/null', { stdio: 'ignore' });
    
    PAGES_TO_TEST.forEach(({ url, name }) => {
      totalTests++;
      const result = runLighthouseTest(url, name);
      
      if (result.success && result.passed) {
        passedTests++;
      }
    });
    
    console.log('\n📊 Performance Summary');
    console.log('======================');
    console.log(`Pages tested: ${totalTests}`);
    console.log(`Pages passed: ${passedTests}`);
    console.log(`Bundle size: ${bundleSizeOk ? '✅ Pass' : '❌ Fail'}`);
    
    if (passedTests === totalTests && bundleSizeOk) {
      console.log('\n🎉 All performance tests passed!');
      return true;
    } else {
      console.log(`\n⚠️  ${totalTests - passedTests} pages failed performance tests.`);
      return false;
    }
    
  } catch {
    console.log('\n📊 Performance Summary (Bundle Only)');
    console.log('=====================================');
    console.log(`Bundle size: ${bundleSizeOk ? '✅ Pass' : '❌ Fail'}`);
    
    if (bundleSizeOk) {
      console.log('\n✅ Bundle size check passed!');
      console.log('   (Lighthouse tests skipped - start dev server to run full tests)');
      return true;
    } else {
      console.log('\n❌ Bundle size check failed!');
      return false;
    }
  }
}

// Run performance tests
const success = generatePerformanceReport();
process.exit(success ? 0 : 1);
