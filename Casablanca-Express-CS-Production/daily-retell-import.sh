#!/bin/bash

# Daily Retell AI Call Import to Caspio
# Runs at 1:00 AM daily
# Imports all calls from the last 24 hours

LOG_FILE="/var/log/retell-import.log"
API_URL="https://web-production-4080.up.railway.app"
AGENT_ID="***REMOVED***"

# Get timestamp for 24 hours ago (in milliseconds)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    START_TIMESTAMP=$(date -u -v-24H +%s)000
else
    # Linux
    START_TIMESTAMP=$(date -u -d '24 hours ago' +%s)000
fi

echo "========================================" | tee -a "$LOG_FILE"
echo "Retell Import - $(date)" | tee -a "$LOG_FILE"
echo "Start Timestamp: $START_TIMESTAMP" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# Make API request
RESPONSE=$(curl -s -X POST "${API_URL}/api/memos/batch-from-retell" \
  -H "Content-Type: application/json" \
  -d "{
    \"agent_id\": \"${AGENT_ID}\",
    \"start_timestamp\": ${START_TIMESTAMP},
    \"limit\": 100
  }")

# Log response
echo "$RESPONSE" | tee -a "$LOG_FILE"

# Extract summary
TOTAL=$(echo "$RESPONSE" | grep -o '"total_calls":[0-9]*' | cut -d':' -f2)
CREATED=$(echo "$RESPONSE" | grep -o '"memos_created":[0-9]*' | cut -d':' -f2)
FAILED=$(echo "$RESPONSE" | grep -o '"memos_failed":[0-9]*' | cut -d':' -f2)

echo "" | tee -a "$LOG_FILE"
echo "Summary: $TOTAL calls processed, $CREATED memos created, $FAILED failed" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
