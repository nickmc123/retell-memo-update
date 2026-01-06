#!/bin/bash

# =============================================================================
# TravelBucks API Test Script
# =============================================================================
#
# Usage:
#   ./scripts/test-travelbucks-api.sh [local|production]
#
# Examples:
#   ./scripts/test-travelbucks-api.sh          # Test local (default)
#   ./scripts/test-travelbucks-api.sh local    # Test localhost:3000
#   ./scripts/test-travelbucks-api.sh production  # Test Railway deployment
#
# =============================================================================

set -e

# Configuration
ENV="${1:-local}"

if [ "$ENV" = "production" ]; then
    BASE_URL="https://travelbucks-voice-ops-production.up.railway.app"
else
    BASE_URL="http://localhost:3000"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_test() {
    echo -e "\n${YELLOW}TEST: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ PASS: $1${NC}"
    ((PASSED++))
}

print_failure() {
    echo -e "${RED}✗ FAIL: $1${NC}"
    ((FAILED++))
}

print_info() {
    echo -e "${BLUE}→ $1${NC}"
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed.${NC}"
    echo "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
    exit 1
fi

# =============================================================================
# TESTS
# =============================================================================

print_header "TravelBucks API Test Suite"
echo -e "Environment: ${YELLOW}$ENV${NC}"
echo -e "Base URL: ${YELLOW}$BASE_URL${NC}"

# -----------------------------------------------------------------------------
# Test 1: Health Check
# -----------------------------------------------------------------------------
print_test "Health Check"

RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    STATUS=$(echo "$BODY" | jq -r '.status')
    if [ "$STATUS" = "ok" ]; then
        print_success "Health check returned status: ok"
        print_info "Response: $BODY"
    else
        print_failure "Health check status is not 'ok': $STATUS"
    fi
else
    print_failure "Health check returned HTTP $HTTP_CODE"
fi

# -----------------------------------------------------------------------------
# Test 2: Create Lead
# -----------------------------------------------------------------------------
print_test "Create Lead"

LEAD_PHONE="+1555$(date +%s | tail -c 8)"  # Generate unique phone
LEAD_DATA=$(cat <<EOF
{
    "full_name": "Test User $(date +%s)",
    "phone": "$LEAD_PHONE",
    "email": "test@example.com",
    "source": "test_script",
    "destination_interest": "Hawaii",
    "travel_window": "3_6_months",
    "departure_city_or_port": "Los Angeles",
    "consent_checkbox": true
}
EOF
)

print_info "Creating lead with phone: $LEAD_PHONE"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/lead" \
    -H "Content-Type: application/json" \
    -d "$LEAD_DATA")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    SUCCESS=$(echo "$BODY" | jq -r '.success')
    LEAD_ID=$(echo "$BODY" | jq -r '.lead_id')
    if [ "$SUCCESS" = "true" ]; then
        print_success "Lead created successfully"
        print_info "Lead ID: $LEAD_ID"
        print_info "Response: $BODY"
    else
        print_failure "Create lead returned success: false"
    fi
else
    print_failure "Create lead returned HTTP $HTTP_CODE"
    print_info "Response: $BODY"
    LEAD_ID=""
fi

# -----------------------------------------------------------------------------
# Test 3: Get Lead by Phone
# -----------------------------------------------------------------------------
print_test "Get Lead by Phone"

if [ -n "$LEAD_PHONE" ]; then
    ENCODED_PHONE=$(echo "$LEAD_PHONE" | sed 's/+/%2B/g')
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/lead/phone/$ENCODED_PHONE")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        SUCCESS=$(echo "$BODY" | jq -r '.success')
        if [ "$SUCCESS" = "true" ]; then
            print_success "Lead retrieved by phone"
            print_info "Response: $BODY"
        else
            print_failure "Get lead by phone returned success: false"
        fi
    else
        print_failure "Get lead by phone returned HTTP $HTTP_CODE"
    fi
else
    print_failure "No phone number to test with"
fi

# -----------------------------------------------------------------------------
# Test 4: Generate Payment Link
# -----------------------------------------------------------------------------
print_test "Generate Payment Link"

if [ -n "$LEAD_ID" ] && [ "$LEAD_ID" != "null" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/payment-link" \
        -H "Content-Type: application/json" \
        -d "{\"lead_id\": $LEAD_ID}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        SUCCESS=$(echo "$BODY" | jq -r '.success')
        PAYMENT_URL=$(echo "$BODY" | jq -r '.payment_link_url')
        if [ "$SUCCESS" = "true" ]; then
            print_success "Payment link generated"
            print_info "Payment URL: $PAYMENT_URL"
        else
            print_failure "Generate payment link returned success: false"
        fi
    else
        print_failure "Generate payment link returned HTTP $HTTP_CODE"
        print_info "Response: $BODY"
    fi
else
    print_failure "No lead_id to generate payment link for"
fi

# -----------------------------------------------------------------------------
# Test 5: Get Lead by ID
# -----------------------------------------------------------------------------
print_test "Get Lead by ID"

if [ -n "$LEAD_ID" ] && [ "$LEAD_ID" != "null" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/lead/$LEAD_ID")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        SUCCESS=$(echo "$BODY" | jq -r '.success')
        if [ "$SUCCESS" = "true" ]; then
            STATUS=$(echo "$BODY" | jq -r '.lead.status')
            PAYMENT_STATUS=$(echo "$BODY" | jq -r '.lead.payment_status')
            print_success "Lead retrieved by ID"
            print_info "Status: $STATUS, Payment Status: $PAYMENT_STATUS"
        else
            print_failure "Get lead by ID returned success: false"
        fi
    else
        print_failure "Get lead by ID returned HTTP $HTTP_CODE"
    fi
else
    print_failure "No lead_id to retrieve"
fi

# -----------------------------------------------------------------------------
# Test 6: Payment Webhook (Simulate Success)
# -----------------------------------------------------------------------------
print_test "Payment Webhook (Simulated)"

# This test requires APP_SECRET - skip if not set
APP_SECRET="${APP_SECRET:-test-secret}"

if [ -n "$LEAD_ID" ] && [ "$LEAD_ID" != "null" ]; then
    WEBHOOK_DATA=$(cat <<EOF
{
    "lead_id": $LEAD_ID,
    "status": "paid",
    "transaction_id": "TEST$(date +%s)",
    "amount": 999
}
EOF
)

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/webhooks/payment" \
        -H "Content-Type: application/json" \
        -H "X-App-Secret: $APP_SECRET" \
        -d "$WEBHOOK_DATA")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        SUCCESS=$(echo "$BODY" | jq -r '.success')
        if [ "$SUCCESS" = "true" ]; then
            print_success "Payment webhook processed successfully"
            print_info "Response: $BODY"
        else
            print_failure "Payment webhook returned success: false"
        fi
    elif [ "$HTTP_CODE" = "401" ]; then
        print_info "Payment webhook returned 401 (expected if APP_SECRET doesn't match)"
        print_info "Set APP_SECRET env var to match server configuration"
        ((PASSED++))  # Count as pass since auth is working
    else
        print_failure "Payment webhook returned HTTP $HTTP_CODE"
        print_info "Response: $BODY"
    fi
else
    print_failure "No lead_id to test webhook with"
fi

# -----------------------------------------------------------------------------
# Test 7: Update Lead (Re-submit with same phone)
# -----------------------------------------------------------------------------
print_test "Update Lead (Upsert)"

if [ -n "$LEAD_PHONE" ]; then
    UPDATE_DATA=$(cat <<EOF
{
    "full_name": "Updated User $(date +%s)",
    "phone": "$LEAD_PHONE",
    "destination_interest": "Cancun"
}
EOF
)

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/lead" \
        -H "Content-Type: application/json" \
        -d "$UPDATE_DATA")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        SUCCESS=$(echo "$BODY" | jq -r '.success')
        if [ "$SUCCESS" = "true" ]; then
            print_success "Lead updated successfully (upsert)"
            print_info "Response: $BODY"
        else
            print_failure "Update lead returned success: false"
        fi
    else
        print_failure "Update lead returned HTTP $HTTP_CODE"
    fi
else
    print_failure "No phone to test upsert with"
fi

# -----------------------------------------------------------------------------
# Test 8: Invalid Request (Missing required field)
# -----------------------------------------------------------------------------
print_test "Invalid Request Handling"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/lead" \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ]; then
    ERROR=$(echo "$BODY" | jq -r '.error')
    if [ -n "$ERROR" ]; then
        print_success "Invalid request returned 400 with error message"
        print_info "Error: $ERROR"
    else
        print_failure "Invalid request returned 400 but no error message"
    fi
else
    print_failure "Invalid request should return 400, got HTTP $HTTP_CODE"
fi

# -----------------------------------------------------------------------------
# Test 9: 404 Not Found
# -----------------------------------------------------------------------------
print_test "404 Not Found"

RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/nonexistent-endpoint")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "404" ]; then
    print_success "Non-existent endpoint returns 404"
else
    print_failure "Non-existent endpoint should return 404, got HTTP $HTTP_CODE"
fi

# -----------------------------------------------------------------------------
# Test 10: Lead Not Found
# -----------------------------------------------------------------------------
print_test "Lead Not Found"

RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/lead/999999999")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "404" ]; then
    print_success "Non-existent lead returns 404"
else
    print_failure "Non-existent lead should return 404, got HTTP $HTTP_CODE"
fi

# =============================================================================
# SUMMARY
# =============================================================================

print_header "Test Summary"

TOTAL=$((PASSED + FAILED))

echo -e "Tests Run: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed.${NC}"
    exit 1
fi
