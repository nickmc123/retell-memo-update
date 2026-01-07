#!/bin/bash

# Quick test script for deployed Retell memo integration

API_URL="https://web-production-4080.up.railway.app"

echo "=========================================="
echo "Testing Retell Memo Integration"
echo "=========================================="
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
echo "--------------------"
curl -s "${API_URL}/health" | python3 -m json.tool
echo ""
echo ""

# Test 2: Check if new endpoints are available
echo "Test 2: Verify New Endpoints Available"
echo "---------------------------------------"
echo "Looking for: POST /api/memos/from-retell-call"
echo "Looking for: POST /api/memos/batch-from-retell"
echo ""
echo "Check Railway deployment logs to confirm endpoints are registered."
echo ""

# Test 3: Ready to test with real call
echo "Test 3: Test with Real Call (Manual)"
echo "------------------------------------"
echo "Get a call_id from: https://app.retellai.com (Call History)"
echo ""
echo "Then run:"
echo 'curl -X POST "'${API_URL}'/api/memos/from-retell-call" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"call_id": "YOUR_CALL_ID", "include_transcript": true}'"'"
echo ""

echo "=========================================="
echo "Deployment Tests Complete"
echo "=========================================="
