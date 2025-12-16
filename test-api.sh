#!/bin/bash

# API Testing Script for Casablanca Express API
# Tests all 5 main endpoints with mock data

API_URL="http://localhost:3000"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Casablanca Express API - Test Suite"
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

# Function to test endpoint
test_endpoint() {
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

# Test POST endpoint
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

# ============================================================================
# Run Tests
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Health Check" "$API_URL/health" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Customer Lookup - By Phone"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Lookup Sarah Johnson by phone" "$API_URL/api/customer/lookup?phone=%2B13105551234" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Customer Lookup - By Email"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Lookup by email" "$API_URL/api/customer/lookup?email=sarah.johnson@email.com" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Customer Lookup - By Certificate"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Lookup by certificate" "$API_URL/api/customer/lookup?certificate=ORLANDO123456" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Customer Lookup - Not Found"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Lookup nonexistent customer" "$API_URL/api/customer/lookup?phone=%2B19999999999" 404

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  Certificate Details"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Get Orlando certificate details" "$API_URL/api/certificate/ORLANDO123456" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  Certificate Details - Unpaid Deposit"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Get Vegas certificate (deposit not paid)" "$API_URL/api/certificate/VEGAS789012" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8️⃣  Refund Status - Exists"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Check refund status (exists)" "$API_URL/api/refunds/ORLANDO123456" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9️⃣  Refund Status - Not Found"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Check refund status (not found)" "$API_URL/api/refunds/VEGAS789012" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔟 Calendar Availability - Orlando"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Check Orlando availability" "$API_URL/api/calendar/availability/Orlando" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣1️⃣  Calendar Availability - With Filters"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Check April 2025 availability" "$API_URL/api/calendar/availability/Orlando?month=4&year=2025" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣2️⃣  Book Travel Dates - Success"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
booking_data='{
  "certificate_number": "ORLANDO123456",
  "destination": "Orlando",
  "start_date": "2025-05-15",
  "end_date": "2025-05-19",
  "hotel_name": "Marriott Orlando"
}'
test_post_endpoint "Book Orlando dates" "$API_URL/api/calendar/book" "$booking_data" 200

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣3️⃣  Book Travel Dates - Deposit Not Paid"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
booking_data_unpaid='{
  "certificate_number": "VEGAS789012",
  "destination": "Las Vegas",
  "start_date": "2025-06-01",
  "end_date": "2025-06-05",
  "hotel_name": "Bellagio"
}'
test_post_endpoint "Book Vegas dates (should fail - deposit not paid)" "$API_URL/api/calendar/book" "$booking_data_unpaid" 400

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
