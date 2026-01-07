#!/bin/bash

echo "================================================"
echo "TravelBucks Railway Deployment"
echo "================================================"
echo ""
echo "Step 1: Navigate to deployment folder..."
cd travelbucks-webhook-deployment

echo "Step 2: Initialize Railway project..."
railway init --name travelbucks-webhook

echo "Step 3: Deploy to Railway..."
railway up

echo ""
echo "================================================"
echo "✅ Deployed!"
echo "================================================"
echo ""
echo "Getting your Railway URL..."
railway domain

echo ""
echo "Setting critical environment variables..."
railway variables set RETELL_API_KEY=***REMOVED***
railway variables set RETELL_AGENT_ID=agent_f3133d562a14ddeddc46be10e9
railway variables set PORT=3000

echo ""
echo "================================================"
echo "✅ DONE! Copy your Railway URL above"
echo "================================================"
