#!/bin/bash
#
# Comprehensive Test Runner for Saturn
# Runs all available tests and generates a summary report
#

set -e

echo "🧪 Saturn - Comprehensive Test Suite"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track results
TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=0

# Helper function
run_test_suite() {
    local name=$1
    local command=$2
    TOTAL_SUITES=$((TOTAL_SUITES + 1))
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📝 $name${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    if eval "$command"; then
        echo ""
        echo -e "${GREEN}✅ $name PASSED${NC}"
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        echo ""
        echo -e "${RED}❌ $name FAILED${NC}"
        FAILED_SUITES=$((FAILED_SUITES + 1))
    fi
    echo ""
}

cd "$(dirname "$0")/.."

# 1. Build Test
run_test_suite "Next.js Production Build" "bun run build > /dev/null 2>&1"

# 2. Unit Tests
run_test_suite "Jest Unit Tests" "npx jest --passWithNoTests"

# 3. Ping API E2E Tests (no browser required)
run_test_suite "Playwright Ping API Tests" "SKIP_SERVER=1 BASE_URL=http://localhost:3001 npx playwright test e2e/ping-api.spec.ts --project=chromium --reporter=line"

# 4. Homepage E2E Tests
run_test_suite "Playwright Homepage Tests" "SKIP_SERVER=1 BASE_URL=http://localhost:3001 npx playwright test e2e/homepage.spec.ts --project=chromium --reporter=line"

# 5. Selenium Smoke Test
run_test_suite "Selenium WebDriver Smoke Test" "BASE_URL=http://localhost:3001 bun --bun run scripts/selenium-smoke.ts"

# Summary
echo ""
echo "========================================"
echo "📊 Test Summary"
echo "========================================"
echo -e "Total Suites: ${BLUE}$TOTAL_SUITES${NC}"
echo -e "Passed: ${GREEN}$PASSED_SUITES${NC}"
echo -e "Failed: ${RED}$FAILED_SUITES${NC}"
echo ""

if [ $FAILED_SUITES -eq 0 ]; then
    echo -e "${GREEN}🎉 All test suites passed!${NC}"
    echo ""
    echo "Your application is ready for deployment."
    exit 0
else
    echo -e "${YELLOW}⚠️  Some test suites failed${NC}"
    echo ""
    echo "Note: Browser-based UI tests require Playwright dependencies."
    echo "Run: sudo npx playwright install-deps"
    exit 1
fi



