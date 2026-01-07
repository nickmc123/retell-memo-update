#!/bin/bash

# RIMS API Testing Script for Casablanca Express
# Tests all RIMS-specific endpoints with field structure

API_URL="http://localhost:3000"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Casablanca Express RIMS API - Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test POST endpoint
test_post_endpoint() {
    local name=$1
    local url=$2
    local data=$3
    local expected_status=${4:-200}

    echo -e "${BLUE}Testing: $name${NC}"
    echo "URL: $url"
    echo "Data: $data"

    response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
        -H "Content-Type: application/json" \
        -d "$data")
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
        echo "Response:"
        echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected_status, got $http_code)"
        echo "Response: $body"
        FAILED=$((FAILED + 1))
    fi
    echo ""
}

# Function to test GET endpoint
test_get_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}

    echo -e "${BLUE}Testing: $name${NC}"
    echo "URL: $url"

    response=$(curl -s -w "\n%{http_code}" "$url")
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
        echo "Response:"
        echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected_status, got $http_code)"
        echo "Response: $body"
        FAILED=$((FAILED + 1))
    fi
    echo ""
}

# ============================================================================
# Run Tests
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_get_endpoint "RIMS API Health Check" "$API_URL/health" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  RIMS Phone Lookup - Found (phn1)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
phone_lookup_data='{
  "phone_number": "8182121359"
}'
test_post_endpoint "Lookup Sarah Johnson by phn1" "$API_URL/api/rims/phone-lookup" "$phone_lookup_data" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  RIMS Phone Lookup - Found (phn2)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
phone_lookup_data2='{
  "phone_number": "3105551234"
}'
test_post_endpoint "Lookup Sarah Johnson by phn2" "$API_URL/api/rims/phone-lookup" "$phone_lookup_data2" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  RIMS Phone Lookup - Not Found"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
phone_not_found='{
  "phone_number": "9999999999"
}'
test_post_endpoint "Lookup non-existent phone" "$API_URL/api/rims/phone-lookup" "$phone_not_found" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Certificate Lookup - Found"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cert_lookup='{
  "certificate_number": "BEACH123"
}'
test_post_endpoint "Lookup certificate BEACH123" "$API_URL/api/rims/certificate-lookup" "$cert_lookup" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  Knowledge Base - Package Info (exact match)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_get_endpoint "Get BEACH package info" "$API_URL/api/kb/package/BEACH" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  Knowledge Base - Strip Numbers (BEACH123 → BEACH)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_get_endpoint "Get BEACH123 (strips to BEACH)" "$API_URL/api/kb/package/BEACH123" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8️⃣  Deposits Check - Complete Deposits"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
deposits_complete='{
  "customer_data": {
    "phn1": "8182121359",
    "pkg_code": "BEACH",
    "pkg_code2": "BEACH123",
    "vac_id": "123456",
    "val_dep": 250,
    "conf_deposit": 500
  }
}'
test_post_endpoint "Check complete deposits (750)" "$API_URL/api/logic/deposits-check" "$deposits_complete" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9️⃣  Deposits Check - Partial Payment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
deposits_partial='{
  "customer_data": {
    "phn1": "3105559876",
    "pkg_code": "E",
    "pkg_code2": "E789",
    "vac_id": "234567",
    "val_dep": 100,
    "conf_deposit": 100
  }
}'
test_post_endpoint "Check partial deposits (200/500)" "$API_URL/api/logic/deposits-check" "$deposits_partial" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔟 Deposits Check - No Deposits"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
deposits_none='{
  "customer_data": {
    "phn1": "4155551212",
    "pkg_code": "SKI",
    "pkg_code2": "SKI555",
    "vac_id": "345678",
    "val_dep": 0,
    "conf_deposit": 0
  }
}'
test_post_endpoint "Check no deposits (0/800)" "$API_URL/api/logic/deposits-check" "$deposits_none" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣1️⃣  Travel Rep Check - Needs TR Assignment (< 45 days)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tr_urgent='{
  "customer_data": {
    "Asgn_trv_DT": "2025-01-26",
    "confirm_status": "confirm",
    "tm": "",
    "date_print_enc": ""
  }
}'
test_post_endpoint "TR needed urgently" "$API_URL/api/logic/travel-rep-check" "$tr_urgent" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣2️⃣  Travel Rep Check - TR Assigned, No Docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tr_needs_call='{
  "customer_data": {
    "Asgn_trv_DT": "2025-06-15",
    "confirm_status": "confirm",
    "tm": "John Smith",
    "date_print_enc": "",
    "phn1": "8182121359"
  }
}'
test_post_endpoint "TR needs to call customer" "$API_URL/api/logic/travel-rep-check" "$tr_needs_call" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣3️⃣  Travel Rep Check - Complete (Docs Sent)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tr_complete='{
  "customer_data": {
    "Asgn_trv_DT": "2025-06-15",
    "confirm_status": "confirm",
    "tm": "John Smith",
    "date_print_enc": "2025-05-01"
  }
}'
test_post_endpoint "TR complete (docs sent)" "$API_URL/api/logic/travel-rep-check" "$tr_complete" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣4️⃣  Booking Check - Customer Booked"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
booking_yes='{
  "customer_data": {
    "agency_book_via": "FLIGHT123",
    "htl_bk_via": "HOTEL456"
  }
}'
test_post_endpoint "Customer is booked" "$API_URL/api/logic/booking-check" "$booking_yes" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣5️⃣  Booking Check - Not Booked"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
booking_no='{
  "customer_data": {
    "agency_book_via": "",
    "htl_bk_via": ""
  }
}'
test_post_endpoint "Customer not booked" "$API_URL/api/logic/booking-check" "$booking_no" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣6️⃣  Create Memo - Needs TR Assignment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
memo_create='{
  "memo_type": "needs tr assignment",
  "details": "Travel date: 2025-01-26, Days remaining: 41",
  "vac_id": "234567",
  "phone_number": "3105559876"
}'
test_post_endpoint "Create TR assignment memo" "$API_URL/api/memos/create" "$memo_create" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣7️⃣  Get Memos for Customer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_get_endpoint "Get memos for vac_id 234567" "$API_URL/api/memos/234567" 200

# ============================================================================
# Summary
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Results Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""
TOTAL=$((PASSED + FAILED))
echo "Total Tests: $TOTAL"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ Some tests failed!${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi
