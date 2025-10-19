#!/bin/bash

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

echo "\n🎉 Health check complete!"
