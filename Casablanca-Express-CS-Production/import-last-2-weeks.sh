#!/bin/bash

# Import last 2 weeks of Retell calls
API_URL="https://resilient-essence-production.up.railway.app"
AGENT_ID="***REMOVED***"

# Calculate timestamp for 14 days ago
if [[ "$OSTYPE" == "darwin"* ]]; then
    START_TIMESTAMP=$(date -u -v-14d +%s)000
else
    START_TIMESTAMP=$(date -u -d '14 days ago' +%s)000
fi

echo "=========================================="
echo "Importing Last 2 Weeks of Retell Calls"
echo "=========================================="
echo ""
echo "API URL: $API_URL"
echo "Agent ID: $AGENT_ID"
echo "Start timestamp: $START_TIMESTAMP (14 days ago)"
echo ""
echo "Sending request..."
echo ""

curl -s -X POST "${API_URL}/api/memos/batch-from-retell" \
  -H "Content-Type: application/json" \
  -d "{
    \"agent_id\": \"${AGENT_ID}\",
    \"start_timestamp\": ${START_TIMESTAMP},
    \"limit\": 100
  }" | python3 -m json.tool

echo ""
echo "=========================================="
echo "Import Complete!"
echo "=========================================="
echo ""
echo "Check Caspio RIMS_MEMOS table to view the memos:"
echo "https://***REMOVED***.caspio.com"
echo ""
