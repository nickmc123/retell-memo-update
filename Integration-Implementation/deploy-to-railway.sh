#!/bin/bash

# TravelBucks API + Google Chat Integration - Railway Deployment Script

echo "🚀 Deploying TravelBucks API Server with Google Chat Integration to Railway"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Change to integration directory
cd "$(dirname "$0")/integration-implementation"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo "Install with: npm install -g @railway/cli"
    echo "Or via Homebrew: brew install railway"
    exit 1
fi

echo "✅ Railway CLI found"
echo ""

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Not logged in to Railway. Opening browser for login..."
    railway login
    if [ $? -ne 0 ]; then
        echo "❌ Railway login failed"
        exit 1
    fi
fi

echo "✅ Logged in to Railway"
echo ""

# Link or init project
echo "📦 Linking to Railway project..."
echo "   If you don't have a project, select 'Create new project'"
echo ""

railway link

if [ $? -ne 0 ]; then
    echo "❌ Failed to link Railway project"
    exit 1
fi

echo ""
echo "✅ Project linked"
echo ""

# Set environment variables
echo "⚙️  Setting environment variables..."
echo ""

# Check if Google Chat webhook is set
if [ -z "$GOOGLE_CHAT_WEBHOOK_URL" ]; then
    echo "⚠️  GOOGLE_CHAT_WEBHOOK_URL not set in environment"
    echo "Please set it manually after deployment:"
    echo "railway variables set GOOGLE_CHAT_WEBHOOK_URL='your-webhook-url'"
else
    railway variables set GOOGLE_CHAT_WEBHOOK_URL="$GOOGLE_CHAT_WEBHOOK_URL"
    echo "✅ Set GOOGLE_CHAT_WEBHOOK_URL"
fi

# Set other required variables
railway variables set USE_MOCK_DATA="true"
railway variables set PORT="3000"

echo "✅ Environment variables configured"
echo ""

# Deploy
echo "🚀 Deploying to Railway..."
echo ""

railway up --detach

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo ""
echo "✅ Deployment started!"
echo ""

# Wait a moment for deployment to process
sleep 3

# Get status
echo "📊 Deployment Status:"
railway status

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Get your deployment URL:"
echo "   railway status"
echo ""
echo "2. Test the deployment:"
echo "   curl https://your-app.up.railway.app/health"
echo "   curl https://your-app.up.railway.app/google-chat/active-calls"
echo ""
echo "3. Configure Retell AI webhooks:"
echo "   Update agent with webhook URL: https://your-app.up.railway.app/webhook/retell"
echo ""
echo "4. Monitor logs:"
echo "   railway logs"
echo ""
echo "5. Set Google Chat webhook if not done:"
echo "   railway variables set GOOGLE_CHAT_WEBHOOK_URL='your-url-here'"
echo ""
echo "📖 Full documentation: ../RAILWAY_DEPLOYMENT.md"
echo ""
