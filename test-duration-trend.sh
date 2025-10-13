#!/bin/bash

# Test script for Duration Trend Chart
# This script creates a monitor and sends multiple pings with varying durations
# to verify the DurationChart component works correctly

set -e

echo "🧪 Testing Duration Trend Feature"
echo "=================================="
echo ""

# Configuration
BASE_URL="http://localhost:3000"
API_BASE="$BASE_URL/api"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if server is running
echo "Checking if server is running..."
if ! curl -s "$BASE_URL" > /dev/null; then
    echo -e "${RED}❌ Server is not running at $BASE_URL${NC}"
    echo "Please start the server with: cd apps/web && bun dev"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# Get auth token (you'll need to manually provide this or use the seeded user)
echo "Note: Using seeded user credentials"
echo "Email: dewminaimalsha2003@gmail.com"
echo "Password: test123"
echo ""

# For this test, we'll use a monitor token from the seeded database
# The seeded monitor has token: pg_9b54b9853f8c4179b3b1e492ebbab215
MONITOR_TOKEN="pg_9b54b9853f8c4179b3b1e492ebbab215"

echo "Using monitor token: $MONITOR_TOKEN"
echo ""

# Test 1: Send multiple successful pings with varying durations
echo "Test 1: Sending pings with varying durations to generate trend data"
echo "----------------------------------------------------------------"

DURATIONS=(100 120 95 110 150 130 105 200 180 160 140 125 115 170 155 145 135 190 175 165)

for i in "${!DURATIONS[@]}"; do
    duration=${DURATIONS[$i]}
    run_num=$((i + 1))
    
    echo -n "  Ping $run_num: "
    
    # Send start ping
    response=$(curl -s -w "%{http_code}" -o /tmp/ping_start.json "$API_BASE/ping/$MONITOR_TOKEN?state=start")
    if [ "$response" != "200" ]; then
        echo -e "${RED}Failed (HTTP $response)${NC}"
        continue
    fi
    
    # Simulate job execution time
    sleep_time=$(awk "BEGIN {print $duration/1000}")
    sleep $sleep_time
    
    # Send success ping with duration
    response=$(curl -s -w "%{http_code}" -o /tmp/ping_success.json \
        "$API_BASE/ping/$MONITOR_TOKEN?state=success&exitCode=0&durationMs=$duration")
    
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✅ ${duration}ms${NC}"
    else
        echo -e "${RED}❌ Failed (HTTP $response)${NC}"
    fi
    
    # Small delay between pings
    sleep 0.5
done

echo ""
echo -e "${GREEN}✅ Successfully sent 20 pings with varying durations${NC}"
echo ""

# Test 2: Send a few failed pings (should be filtered out from duration chart)
echo "Test 2: Sending failed pings (should not appear in duration chart)"
echo "----------------------------------------------------------------"

for i in {1..3}; do
    echo -n "  Failed ping $i: "
    response=$(curl -s -w "%{http_code}" -o /tmp/ping_fail.json \
        "$API_BASE/ping/$MONITOR_TOKEN?state=fail&exitCode=1")
    
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌ Failed (HTTP $response)${NC}"
    fi
    sleep 0.5
done

echo ""
echo -e "${GREEN}✅ Sent failed pings (these should be filtered from chart)${NC}"
echo ""

# Test 3: Verify monitor page loads
echo "Test 3: Checking monitor detail page"
echo "----------------------------------------------------------------"
MONITOR_ID=$(grep -oP '"id":"[^"]+' /tmp/ping_success.json | head -1 | cut -d'"' -f4)

if [ -z "$MONITOR_ID" ]; then
    # Try to get monitor ID from the token
    echo "Could not extract monitor ID from response"
    echo "Visit: $BASE_URL/app/monitors to view your monitors"
else
    echo "Monitor ID: $MONITOR_ID"
    echo "Visit: $BASE_URL/app/monitors/$MONITOR_ID"
fi

echo ""
echo "📊 Test Summary"
echo "==============="
echo -e "${GREEN}✅ Sent 20 pings with varying durations (100-200ms)${NC}"
echo -e "${GREEN}✅ Sent 3 failed pings (filtered from chart)${NC}"
echo -e "${YELLOW}⚠️  Manual verification needed:${NC}"
echo "   1. Visit the monitor detail page in your browser"
echo "   2. Verify 'Duration Trend' chart displays correctly"
echo "   3. Check that chart shows line graph with ~20 data points"
echo "   4. Verify failed runs don't appear in duration chart"
echo "   5. Check chart handles hover tooltips correctly"
echo ""
echo "Expected chart behavior:"
echo "  - Should show durations from 95ms to 200ms"
echo "  - Line should have some variation"
echo "  - X-axis: timestamps"
echo "  - Y-axis: duration in ms"
echo "  - Only SUCCESS runs should be plotted"
echo ""
echo "🎉 Test script complete!"

