#!/bin/bash

# Batch import Retell calls to Caspio memos
# Usage: ./batch-import-calls.sh [days_back] [limit]
#
# Examples:
#   ./batch-import-calls.sh 7 100    # Last 7 days, max 100 calls
#   ./batch-import-calls.sh 30 100   # Last 30 days, max 100 calls
#   ./batch-import-calls.sh all 100  # All available calls, max 100

API_URL="https://web-production-4080.up.railway.app"
AGENT_ID="***REMOVED***"
DAYS_BACK="${1:-7}"
LIMIT="${2:-100}"

echo "=========================================="
echo "Retell Call Batch Import"
echo "=========================================="
echo ""
echo "Agent ID: $AGENT_ID"
echo "Timeframe: Last $DAYS_BACK days"
echo "Max calls: $LIMIT"
echo ""

# Calculate timestamp
if [ "$DAYS_BACK" = "all" ]; then
    echo "Fetching all available calls..."
    PAYLOAD="{
        \"agent_id\": \"${AGENT_ID}\",
        \"limit\": ${LIMIT}
    }"
else
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        START_TIMESTAMP=$(date -u -v-${DAYS_BACK}d +%s)000
    else
        # Linux
        START_TIMESTAMP=$(date -u -d "${DAYS_BACK} days ago" +%s)000
    fi

    echo "Start timestamp: $START_TIMESTAMP"

    PAYLOAD="{
        \"agent_id\": \"${AGENT_ID}\",
        \"start_timestamp\": ${START_TIMESTAMP},
        \"limit\": ${LIMIT}
    }"
fi

echo ""
echo "Sending batch import request..."
echo ""

# Make request
RESPONSE=$(curl -s -X POST "${API_URL}/api/memos/batch-from-retell" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

# Display response
echo "Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract summary
if echo "$RESPONSE" | grep -q '"success":true'; then
    TOTAL=$(echo "$RESPONSE" | grep -o '"total_calls":[0-9]*' | cut -d':' -f2)
    CREATED=$(echo "$RESPONSE" | grep -o '"memos_created":[0-9]*' | cut -d':' -f2)
    FAILED=$(echo "$RESPONSE" | grep -o '"memos_failed":[0-9]*' | cut -d':' -f2)

    echo "=========================================="
    echo "✅ Batch Import Complete!"
    echo "=========================================="
    echo "Total calls processed: $TOTAL"
    echo "Memos created: $CREATED"
    echo "Failed: $FAILED"
    echo ""
    echo "Check Caspio RIMS_MEMOS table to view the memos."
    echo "https://***REMOVED***.caspio.com"
else
    echo "=========================================="
    echo "❌ Batch Import Failed"
    echo "=========================================="
    echo "Check error message above"
fi

echo ""
