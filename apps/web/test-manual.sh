#!/bin/bash

# Manual smoke tests for PulseGuard web app
# Run this script to verify the fixes work

BASE_URL="${BASE_URL:-http://localhost:3000}"
PASSED=0
FAILED=0

echo "🧪 PulseGuard Manual Smoke Tests"
echo "================================="
echo "Testing against: $BASE_URL"
echo ""

# Test 1: Homepage loads
echo -n "Test 1: Homepage loads... "
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/" | grep -q "200\|301\|302"; then
    echo "✅ PASS"
    ((PASSED++))
else
    echo "❌ FAIL"
    ((FAILED++))
fi

# Test 2: Signin page loads
echo -n "Test 2: Signin page loads... "
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/signin" | grep -q "200\|301\|302"; then
    echo "✅ PASS"
    ((PASSED++))
else
    echo "❌ FAIL"
    ((FAILED++))
fi

# Test 3: Signin page contains Google button text
echo -n "Test 3: Signin page has Google button... "
if curl -s "$BASE_URL/auth/signin" | grep -q "Sign in with Google"; then
    echo "✅ PASS"
    ((PASSED++))
else
    echo "❌ FAIL (Google button text not found)"
    ((FAILED++))
fi

# Test 4: Homepage contains View Features button
echo -n "Test 4: Homepage has View Features button... "
if curl -s "$BASE_URL/" | grep -q "View Features"; then
    echo "✅ PASS"
    ((PASSED++))
else
    echo "❌ FAIL (View Features button not found)"
    ((FAILED++))
fi

# Test 5: Homepage features section has ID
echo -n "Test 5: Homepage has features section with id... "
if curl -s "$BASE_URL/" | grep -q 'id="features"'; then
    echo "✅ PASS"
    ((PASSED++))
else
    echo "❌ FAIL (features section id not found)"
    ((FAILED++))
fi

# Test 6: Verify request page loads
echo -n "Test 6: Verify request page loads... "
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/verify-request" | grep -q "200\|301\|302"; then
    echo "✅ PASS"
    ((PASSED++))
else
    echo "❌ FAIL"
    ((FAILED++))
fi

echo ""
echo "================================="
echo "Results: $PASSED passed, $FAILED failed"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ Some tests failed"
    exit 1
fi

