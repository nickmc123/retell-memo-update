#!/bin/bash

# Deploy Customer Status Endpoint to Railway
# This script helps deploy the updated rims-api-caspio.js to the correct Railway project

echo "🚀 Deploying Customer Status Endpoint to Railway"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Find the correct Railway project
echo "📋 Available Railway projects:"
railway list 2>&1

echo ""
echo "🎯 Target deployment:"
echo "   Service: web-production-4080.up.railway.app"
echo "   Project: RIMS API Project"
echo ""

# Check current status
echo "📊 Current Railway link:"
railway status 2>&1
echo ""

# Option 1: Try to link and deploy
echo "🔗 Attempting to deploy..."
echo ""

# Unlink current project
railway unlink 2>&1

# Try to deploy (will prompt for project selection)
echo "⚠️  Please select 'RIMS API Project' when prompted"
echo ""
railway up

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "🧪 Test after deployment with:"
echo "   curl \"https://web-production-4080.up.railway.app/api/customer/status?phone=%2B18182121359\""
echo ""
