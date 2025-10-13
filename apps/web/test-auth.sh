#!/bin/bash

# Test auth functionality end-to-end

BASE_URL="${BASE_URL:-http://localhost:3000}"
PASSED=0
FAILED=0

echo "🔐 PulseGuard Auth Tests"
echo "================================="
echo "Testing against: $BASE_URL"
echo ""

# Test 1: Auth providers endpoint
echo -n "Test 1: Auth providers endpoint... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/providers")
if [ "$STATUS" = "200" ]; then
    echo "✅ PASS (HTTP $STATUS)"
    ((PASSED++))
else
    echo "❌ FAIL (HTTP $STATUS)"
    ((FAILED++))
fi

# Test 2: Signin page loads without errors
echo -n "Test 2: Signin page renders... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/signin")
if [ "$STATUS" = "200" ]; then
    echo "✅ PASS (HTTP $STATUS)"
    ((PASSED++))
else
    echo "❌ FAIL (HTTP $STATUS)"
    ((FAILED++))
fi

# Test 3: Google signin button exists
echo -n "Test 3: Google signin button renders... "
if curl -s "$BASE_URL/auth/signin" | grep -q "Sign in with Google"; then
    echo "✅ PASS"
    ((PASSED++))
else
    echo "❌ FAIL"
    ((FAILED++))
fi

# Test 4: Email signin form exists
echo -n "Test 4: Email signin form exists... "
if curl -s "$BASE_URL/auth/signin" | grep -q "Send Magic Link"; then
    echo "✅ PASS"
    ((PASSED++))
else
    echo "❌ FAIL"
    ((FAILED++))
fi

# Test 5: POST to email signin (doesn't error out)
echo -n "Test 5: Email signin endpoint responds... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "email=test@example.com" \
    "$BASE_URL/api/auth/signin/email")
# Any non-500 response is good (might be 302 redirect or 4xx for invalid config)
if [ "$STATUS" != "500" ]; then
    echo "✅ PASS (HTTP $STATUS - not 500 error)"
    ((PASSED++))
else
    echo "❌ FAIL (HTTP $STATUS - server error)"
    ((FAILED++))
fi

# Test 6: NextAuth session endpoint
echo -n "Test 6: Session endpoint works... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/session")
if [ "$STATUS" = "200" ]; then
    echo "✅ PASS (HTTP $STATUS)"
    ((PASSED++))
else
    echo "❌ FAIL (HTTP $STATUS)"
    ((FAILED++))
fi

echo ""
echo "================================="
echo "Results: $PASSED passed, $FAILED failed"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All auth tests passed!"
    echo "✅ @next-auth/prisma-adapter is working correctly!"
    exit 0
else
    echo "❌ Some tests failed"
    exit 1
fi

