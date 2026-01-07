#!/bin/bash

# Create Retell webhook via API
# Use this if webhook UI is not available in dashboard

RETELL_API_KEY="***REMOVED***"
WEBHOOK_URL="https://web-production-4080.up.railway.app/api/memos/from-retell-call"

echo "=========================================="
echo "Creating Retell Webhook via API"
echo "=========================================="
echo ""

# Create webhook
RESPONSE=$(curl -s -X POST "https://api.retellai.com/v2/create-webhook" \
  -H "Authorization: Bearer ${RETELL_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "'${WEBHOOK_URL}'",
    "events": ["call.ended"],
    "secret": ""
  }')

echo "Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q "webhook_id"; then
    echo "✅ Webhook created successfully!"
    WEBHOOK_ID=$(echo "$RESPONSE" | grep -o '"webhook_id":"[^"]*"' | cut -d'"' -f4)
    echo "Webhook ID: $WEBHOOK_ID"
else
    echo "❌ Failed to create webhook"
    echo "Check error message above"
fi

echo ""
echo "=========================================="
