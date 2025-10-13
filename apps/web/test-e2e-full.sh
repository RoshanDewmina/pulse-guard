#!/bin/bash

# Comprehensive E2E Test Runner for PulseGuard
# This script runs all E2E tests and generates a report

set -e

echo "🧪 PulseGuard - Comprehensive E2E Test Suite"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if services are running
echo "📋 Pre-flight checks..."

# Check if web server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}❌ Web server not running on port 3000${NC}"
    echo "Please run: make dev"
    exit 1
fi

# Check if PostgreSQL is accessible
if ! docker exec pulseguard-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${RED}❌ PostgreSQL not accessible${NC}"
    echo "Please run: make docker-up"
    exit 1
fi

# Check if Redis is accessible
if ! docker exec pulseguard-redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${RED}❌ Redis not accessible${NC}"
    echo "Please run: make docker-up"
    exit 1
fi

# Check if MinIO is accessible
if ! curl -s http://localhost:9000/minio/health/live > /dev/null; then
    echo -e "${YELLOW}⚠️  MinIO not accessible (output capture tests may fail)${NC}"
fi

echo -e "${GREEN}✅ All services are running${NC}"
echo ""

# Reseed database with test data
echo "🌱 Reseeding database with test data..."
cd /home/roshan/development/personal/pulse-guard/packages/db
bun run seed > /dev/null 2>&1
echo -e "${GREEN}✅ Database seeded${NC}"
echo ""

# Return to web directory
cd /home/roshan/development/personal/pulse-guard/apps/web

# Run tests by category
echo "🎯 Running Test Suites..."
echo ""

FAILED_TESTS=0
TOTAL_SUITES=0

# Helper function to run a test suite
run_suite() {
    local name=$1
    local file=$2
    TOTAL_SUITES=$((TOTAL_SUITES + 1))
    
    echo "📝 $name"
    if npx playwright test $file --reporter=list; then
        echo -e "${GREEN}✅ $name passed${NC}"
    else
        echo -e "${RED}❌ $name failed${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

# Run each test suite
run_suite "Authentication Tests" "e2e/auth-password.spec.ts"
run_suite "Dashboard Tests" "e2e/dashboard.spec.ts"
run_suite "Monitors Tests" "e2e/monitors-full.spec.ts"
run_suite "Ping API Tests" "e2e/ping-api.spec.ts"
run_suite "Incidents Tests" "e2e/incidents.spec.ts"
run_suite "Settings Tests" "e2e/settings.spec.ts"
run_suite "Integration Tests" "e2e/integrations.spec.ts"

# Summary
echo "=============================================="
echo "📊 Test Summary"
echo "=============================================="
echo "Total Suites: $TOTAL_SUITES"
echo "Passed: $((TOTAL_SUITES - FAILED_TESTS))"
echo "Failed: $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo "View detailed report: playwright-report/index.html"
    exit 1
fi






