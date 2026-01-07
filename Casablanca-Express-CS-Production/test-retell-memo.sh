#!/bin/bash

# Test script for Retell AI to Caspio Memo integration
# Usage: ./test-retell-memo.sh [API_URL] [CALL_ID]

API_URL="${1:-http://localhost:3000}"
CALL_ID="${2}"

echo "=================================="
echo "Retell Memo Integration Test"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
HEALTH_RESPONSE=$(curl -s "${API_URL}/health")
echo "Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    exit 1
fi
echo ""

# Test 2: Single Call Import (if CALL_ID provided)
if [ -n "$CALL_ID" ]; then
    echo -e "${YELLOW}Test 2: Single Call Import${NC}"
    echo "Call ID: $CALL_ID"

    SINGLE_RESPONSE=$(curl -s -X POST "${API_URL}/api/memos/from-retell-call" \
        -H "Content-Type: application/json" \
        -d "{
            \"call_id\": \"${CALL_ID}\",
            \"include_transcript\": true
        }")

    echo "Response: $SINGLE_RESPONSE"

    if echo "$SINGLE_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Single call import passed${NC}"

        # Extract memo details
        MEMO_ID=$(echo "$SINGLE_RESPONSE" | grep -o '"memo_id":[0-9]*' | cut -d':' -f2)
        VAC_ID=$(echo "$SINGLE_RESPONSE" | grep -o '"vac_id":"[^"]*"' | cut -d'"' -f4)
        CUSTOMER_FOUND=$(echo "$SINGLE_RESPONSE" | grep -o '"customer_found":[^,}]*' | cut -d':' -f2)

        echo "  Memo ID: $MEMO_ID"
        echo "  Vac ID: $VAC_ID"
        echo "  Customer Found: $CUSTOMER_FOUND"
    else
        echo -e "${RED}✗ Single call import failed${NC}"
        ERROR=$(echo "$SINGLE_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        echo "  Error: $ERROR"
    fi
    echo ""
else
    echo -e "${YELLOW}Test 2: Skipped (no CALL_ID provided)${NC}"
    echo "Usage: ./test-retell-memo.sh [API_URL] [CALL_ID]"
    echo ""
fi

# Test 3: Batch Import (last 10 calls)
echo -e "${YELLOW}Test 3: Batch Import (limit: 10)${NC}"

# Calculate timestamp for 7 days ago (in milliseconds)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    START_TIMESTAMP=$(date -u -v-7d +%s)000
else
    # Linux
    START_TIMESTAMP=$(date -u -d '7 days ago' +%s)000
fi

echo "Start timestamp: $START_TIMESTAMP (7 days ago)"

BATCH_RESPONSE=$(curl -s -X POST "${API_URL}/api/memos/batch-from-retell" \
    -H "Content-Type: application/json" \
    -d "{
        \"start_timestamp\": ${START_TIMESTAMP},
        \"limit\": 10
    }")

echo "Response: $BATCH_RESPONSE"

if echo "$BATCH_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Batch import passed${NC}"

    # Extract summary
    TOTAL_CALLS=$(echo "$BATCH_RESPONSE" | grep -o '"total_calls":[0-9]*' | cut -d':' -f2)
    MEMOS_CREATED=$(echo "$BATCH_RESPONSE" | grep -o '"memos_created":[0-9]*' | cut -d':' -f2)
    MEMOS_FAILED=$(echo "$BATCH_RESPONSE" | grep -o '"memos_failed":[0-9]*' | cut -d':' -f2)

    echo "  Total Calls: $TOTAL_CALLS"
    echo "  Memos Created: $MEMOS_CREATED"
    echo "  Memos Failed: $MEMOS_FAILED"
else
    echo -e "${RED}✗ Batch import failed${NC}"
    ERROR=$(echo "$BATCH_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
    echo "  Error: $ERROR"
fi
echo ""

# Test 4: Check if RETELL_API_KEY is configured
echo -e "${YELLOW}Test 4: RETELL_API_KEY Configuration${NC}"

if echo "$HEALTH_RESPONSE" | grep -q "retell"; then
    echo -e "${GREEN}✓ RETELL_API_KEY appears to be configured${NC}"
else
    echo -e "${YELLOW}⚠ Cannot verify RETELL_API_KEY status from health endpoint${NC}"
fi
echo ""

echo "=================================="
echo "Test Summary"
echo "=================================="
echo -e "${GREEN}✓ = Passed${NC}"
echo -e "${RED}✗ = Failed${NC}"
echo -e "${YELLOW}⚠ = Warning${NC}"
echo ""
echo "For production testing, use:"
echo "  ./test-retell-memo.sh https://web-production-4080.up.railway.app call_YOUR_CALL_ID"
