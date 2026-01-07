#!/bin/bash

# Quick deployment script for Retell Memo Integration
# Usage: ./deploy-retell-memo.sh

set -e

echo "========================================="
echo "Retell Memo Integration Deployment"
echo "========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if we're in the right directory
if [ ! -f "../../Integration-Implementation/integration-implementation/rims-api-caspio.js" ]; then
    echo -e "${RED}Error: rims-api-caspio.js not found${NC}"
    echo "Please run this script from the Casablanca-Express-CS-Production directory"
    exit 1
fi

echo -e "${YELLOW}Step 1: Deploying to Railway${NC}"
cd ../../Integration-Implementation/integration-implementation

# Check git status
echo "Checking git status..."
git status

# Add changes
echo "Adding changes..."
git add rims-api-caspio.js

# Commit
echo "Creating commit..."
git commit -m "Add Retell AI call history to Caspio memo integration

- Add POST /api/memos/from-retell-call endpoint
- Add POST /api/memos/batch-from-retell endpoint
- Add Retell API client functions
- Auto-categorize memos by sentiment
- Include call transcript, summary, and analysis data" || echo "No changes to commit"

# Push
echo "Pushing to Railway..."
git push

echo -e "${GREEN}✓ Code deployed to Railway${NC}"
echo ""

# Step 2: Set RETELL_API_KEY
echo -e "${YELLOW}Step 2: Set RETELL_API_KEY${NC}"
echo "Get your API key from: https://app.retellai.com (Settings → API Keys)"
echo ""
read -p "Enter your Retell API key (or press Enter to skip): " RETELL_KEY

if [ -n "$RETELL_KEY" ]; then
    echo "Setting RETELL_API_KEY in Railway..."
    railway variables set RETELL_API_KEY="$RETELL_KEY"
    echo -e "${GREEN}✓ RETELL_API_KEY set${NC}"
else
    echo -e "${YELLOW}⚠ Skipped - Set manually with: railway variables set RETELL_API_KEY=\"key_...\"${NC}"
fi
echo ""

# Step 3: Wait for deployment
echo -e "${YELLOW}Step 3: Waiting for Railway deployment (30 seconds)${NC}"
sleep 30

# Step 4: Test health endpoint
echo -e "${YELLOW}Step 4: Testing health endpoint${NC}"
HEALTH_RESPONSE=$(curl -s "https://web-production-4080.up.railway.app/health")
echo "$HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo -e "${GREEN}✓ API is healthy${NC}"
else
    echo -e "${RED}✗ API health check failed${NC}"
fi
echo ""

# Step 5: Test with sample call (optional)
echo -e "${YELLOW}Step 5: Test with a sample call${NC}"
echo "Get a call ID from: https://app.retellai.com (Call History)"
echo ""
read -p "Enter a call ID to test (or press Enter to skip): " CALL_ID

if [ -n "$CALL_ID" ]; then
    echo "Testing single call import..."
    curl -X POST "https://web-production-4080.up.railway.app/api/memos/from-retell-call" \
      -H "Content-Type: application/json" \
      -d "{
        \"call_id\": \"${CALL_ID}\",
        \"include_transcript\": true
      }"
    echo ""
    echo -e "${GREEN}✓ Test completed${NC}"
else
    echo -e "${YELLOW}⚠ Skipped - Test manually later${NC}"
fi
echo ""

# Summary
echo "========================================="
echo "Deployment Summary"
echo "========================================="
echo -e "${GREEN}✓ Code deployed to Railway${NC}"
if [ -n "$RETELL_KEY" ]; then
    echo -e "${GREEN}✓ RETELL_API_KEY configured${NC}"
else
    echo -e "${YELLOW}⚠ RETELL_API_KEY not set${NC}"
fi
echo ""
echo "Next Steps:"
echo "1. Set up webhook in Retell AI (optional)"
echo "   URL: https://web-production-4080.up.railway.app/api/memos/from-retell-call"
echo "   Event: call.ended"
echo ""
echo "2. Set up daily cron job (optional)"
echo "   crontab -e"
echo "   Add: 0 1 * * * $(pwd)/../../Casablanca-Express-CS-Production/daily-retell-import.sh"
echo ""
echo "3. View logs: railway logs --follow"
echo ""
echo "Documentation:"
echo "- RETELL-MEMO-INTEGRATION.md - API Reference"
echo "- DEPLOY-RETELL-MEMO-INTEGRATION.md - Deployment Guide"
echo ""
echo "========================================="
