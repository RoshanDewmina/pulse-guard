#!/usr/bin/env node

/**
 * Content Optimization Script
 * 
 * Enhances content for keyword optimization and SEO depth
 */

const fs = require('fs');
const path = require('path');

// Target keywords by priority
const KEYWORDS = {
  primary: ['cron monitoring', 'cron job monitoring'],
  secondary: ['scheduled job monitoring', 'kubernetes cronjob monitoring', 'anomaly detection'],
  longtail: ['wordpress wp-cron monitoring', 'cron anomaly detection', 'job monitoring', 'heartbeat monitoring'],
  branded: ['saturn monitoring', 'saturn cron', 'saturn cron monitoring']
};

function analyzeContent(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      return { error: `File not found: ${filePath}` };
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Extract text content (remove JSX and HTML tags)
    const textContent = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/[{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const wordCount = textContent.split(' ').length;
    
    // Check for keyword density
    const keywordAnalysis = {};
    Object.entries(KEYWORDS).forEach(([category, keywords]) => {
      keywordAnalysis[category] = {};
      keywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        const matches = textContent.match(regex);
        keywordAnalysis[category][keyword] = matches ? matches.length : 0;
      });
    });
    
    // Check for heading structure
    const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
    const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;
    const h3Count = (content.match(/<h3[^>]*>/gi) || []).length;
    
    // Check for internal links
    const internalLinks = (content.match(/href="\/[^"]*"/g) || []).length;
    
    // Check for external links
    const externalLinks = (content.match(/href="https?:\/\/[^"]*"/g) || []).length;
    
    return {
      wordCount,
      keywordAnalysis,
      headings: { h1: h1Count, h2: h2Count, h3: h3Count },
      links: { internal: internalLinks, external: externalLinks },
      content: textContent
    };
  } catch (error) {
    return { error: `Error analyzing ${filePath}: ${error.message}` };
  }
}

function generateContentSuggestions(analysis, filePath) {
  const suggestions = [];
  
  if (analysis.error) {
    return [analysis.error];
  }
  
  // Word count suggestions
  if (analysis.wordCount < 300) {
    suggestions.push(`⚠️  Content too short (${analysis.wordCount} words). Aim for 300+ words for better SEO.`);
  } else if (analysis.wordCount < 500) {
    suggestions.push(`💡 Consider adding more content (${analysis.wordCount} words). 500+ words is ideal for SEO.`);
  } else {
    suggestions.push(`✅ Good content length (${analysis.wordCount} words)`);
  }
  
  // Keyword suggestions
  const totalKeywords = Object.values(analysis.keywordAnalysis).reduce((total, category) => {
    return total + Object.values(category).reduce((sum, count) => sum + count, 0);
  }, 0);
  
  if (totalKeywords === 0) {
    suggestions.push('❌ No target keywords found. Add primary keywords naturally throughout content.');
  } else if (totalKeywords < 3) {
    suggestions.push('💡 Low keyword density. Consider adding more target keywords naturally.');
  } else {
    suggestions.push(`✅ Good keyword usage (${totalKeywords} instances found)`);
  }
  
  // Heading structure suggestions
  if (analysis.headings.h1 === 0) {
    suggestions.push('❌ Missing H1 tag. Add a clear H1 with primary keyword.');
  } else if (analysis.headings.h1 > 1) {
    suggestions.push('⚠️  Multiple H1 tags found. Use only one H1 per page.');
  } else {
    suggestions.push('✅ Good H1 structure');
  }
  
  if (analysis.headings.h2 === 0) {
    suggestions.push('💡 Consider adding H2 tags to structure content better.');
  } else {
    suggestions.push(`✅ Good H2 structure (${analysis.headings.h2} H2 tags)`);
  }
  
  // Internal linking suggestions
  if (analysis.links.internal === 0) {
    suggestions.push('💡 Add internal links to other relevant pages for better SEO.');
  } else {
    suggestions.push(`✅ Good internal linking (${analysis.links.internal} internal links)`);
  }
  
  return suggestions;
}

function createContentOptimizationGuide() {
  console.log('📝 Creating Content Optimization Guide...');
  
  const guide = `# Content Optimization Guide

## Keyword Strategy

### Primary Keywords (Use in H1, first paragraph, meta title)
- cron monitoring
- cron job monitoring

### Secondary Keywords (Use in H2s, throughout content)
- scheduled job monitoring
- kubernetes cronjob monitoring
- anomaly detection
- health scores
- MTBF/MTTR

### Long-tail Keywords (Use naturally in content)
- wordpress wp-cron monitoring
- cron anomaly detection
- job monitoring
- heartbeat monitoring
- uptime monitoring
- devops monitoring

### Branded Keywords
- saturn monitoring
- saturn cron
- saturn cron monitoring

## Content Structure Best Practices

### Headings
- Use only ONE H1 per page with primary keyword
- Use H2s for main sections with secondary keywords
- Use H3s for subsections
- Keep headings descriptive and keyword-rich

### Content Length
- Homepage: 1000+ words
- Product pages: 500+ words
- Blog posts: 800+ words
- Legal pages: 300+ words

### Internal Linking
- Link to relevant pages naturally
- Use descriptive anchor text
- Include 3-5 internal links per page
- Link from high-authority pages to important pages

### External Linking
- Link to authoritative sources
- Use nofollow for non-essential external links
- Include 1-3 external links per page

## Content Enhancement Ideas

### Landing Page
- Add "How It Works" section
- Include customer testimonials
- Add FAQ section
- Include use cases and benefits
- Add comparison with competitors

### Product Pages
- Detailed feature descriptions
- Use cases and examples
- Integration guides
- Pricing comparison
- Customer success stories

### Blog Content
- Tutorial posts
- Industry insights
- Product updates
- Best practices guides
- Case studies

## SEO Content Checklist

- [ ] Primary keyword in H1
- [ ] Secondary keywords in H2s
- [ ] Keywords in first paragraph
- [ ] Keywords in meta description
- [ ] Internal links to relevant pages
- [ ] External links to authoritative sources
- [ ] Alt text for all images
- [ ] Proper heading hierarchy
- [ ] Content length appropriate for page type
- [ ] Natural keyword density (1-2%)
- [ ] Call-to-action buttons
- [ ] Contact information visible
`;

  const guidePath = path.join(process.cwd(), 'CONTENT_OPTIMIZATION_GUIDE.md');
  fs.writeFileSync(guidePath, guide);
  console.log('✅ Created CONTENT_OPTIMIZATION_GUIDE.md');
}

function generateContentReport() {
  console.log('📝 Saturn Content Optimization Report');
  console.log('=====================================\n');
  
  const pagesToAnalyze = [
    { path: 'apps/web/src/app/page.tsx', name: 'Homepage' },
    { path: 'apps/web/src/app/company/about/page.tsx', name: 'About Page' },
    { path: 'apps/web/src/app/support/page.tsx', name: 'Support Page' },
  ];
  
  let totalPages = 0;
  let optimizedPages = 0;
  
  pagesToAnalyze.forEach(({ path: filePath, name }) => {
    totalPages++;
    console.log(`\n🔍 Analyzing ${name}`);
    console.log('='.repeat(40));
    
    const analysis = analyzeContent(filePath);
    const suggestions = generateContentSuggestions(analysis, filePath);
    
    suggestions.forEach(suggestion => {
      console.log(suggestion);
    });
    
    // Count as optimized if no critical issues
    const hasCriticalIssues = suggestions.some(s => s.includes('❌'));
    if (!hasCriticalIssues) {
      optimizedPages++;
    }
  });
  
  console.log('\n📊 Content Analysis Summary');
  console.log('============================');
  console.log(`Pages analyzed: ${totalPages}`);
  console.log(`Pages optimized: ${optimizedPages}`);
  console.log(`Optimization rate: ${Math.round((optimizedPages / totalPages) * 100)}%`);
  
  if (optimizedPages === totalPages) {
    console.log('\n🎉 All pages are well optimized!');
  } else {
    console.log(`\n💡 ${totalPages - optimizedPages} pages need content optimization.`);
  }
  
  // Create optimization guide
  createContentOptimizationGuide();
  
  console.log('\n📋 Content Optimization Checklist:');
  console.log('- [ ] Primary keywords in H1s');
  console.log('- [ ] Secondary keywords in H2s');
  console.log('- [ ] Keywords in meta descriptions');
  console.log('- [ ] Internal linking strategy');
  console.log('- [ ] Content length optimization');
  console.log('- [ ] Heading structure improvement');
  console.log('- [ ] Call-to-action optimization');
  console.log('- [ ] Image alt text optimization');
  
  return optimizedPages === totalPages;
}

// Run content optimization
const success = generateContentReport();
process.exit(success ? 0 : 1);
