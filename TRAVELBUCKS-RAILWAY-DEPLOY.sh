#!/bin/bash

# ============================================================================
# TravelBucks Railway Deployment
# Matches your existing Casablanca production infrastructure pattern
# ============================================================================

echo "================================================"
echo "🚀 TravelBucks Multi-Platform Webhook Deploy"
echo "================================================"
echo ""
echo "Your Production Workspace: key_beadaa40bfd093b4f06eb4e2ac0a"
echo "Existing Apps:"
echo "  - web-production-4080.up.railway.app (RIMS API)"
echo "  - retell-human-assistance-production.up.railway.app"
echo ""
echo "New App: travelbucks-webhook-production.up.railway.app"
echo "================================================"
echo ""

# Navigate to deployment folder
cd travelbucks-webhook-deployment

# Deploy to Railway
echo "Step 1: Initializing Railway project..."
railway init --name travelbucks-webhook-production

echo ""
echo "Step 2: Deploying application..."
railway up

echo ""
echo "Step 3: Setting core environment variables..."

# Retell AI (your production workspace)
railway variables set RETELL_API_KEY="key_beadaa40bfd093b4f06eb4e2ac0a"
railway variables set RETELL_AGENT_ID="agent_f3133d562a14ddeddc46be10e9"
railway variables set PORT="3000"

# Facebook
railway variables set FB_VERIFY_TOKEN="travelbucks_verify_token_2024"

echo ""
echo "================================================"
echo "✅ Core deployment complete!"
echo "================================================"
echo ""
echo "Getting your Railway URL..."
railway status

echo ""
echo "================================================"
echo "⚠️ Additional Setup Required:"
echo "================================================"
echo ""
echo "1. Get Retell Phone Number ($2/month):"
echo "   https://retellai.com/dashboard → Phone Numbers"
echo "   Then: railway variables set RETELL_PHONE_NUMBER=\"+1234567890\""
echo ""
echo "2. Get Twilio Credentials ($1/month):"
echo "   https://twilio.com → Console"
echo "   Then:"
echo "     railway variables set TWILIO_ACCOUNT_SID=\"ACxxxx\""
echo "     railway variables set TWILIO_AUTH_TOKEN=\"your_token\""
echo "     railway variables set TWILIO_PHONE_NUMBER=\"+1234567890\""
echo ""
echo "3. Add Caspio Credentials:"
echo "   railway variables set CASPIO_ACCOUNT_ID=\"c0abc123\""
echo "   railway variables set CASPIO_CLIENT_ID=\"your_id\""
echo "   railway variables set CASPIO_CLIENT_SECRET=\"your_secret\""
echo "   railway variables set CASPIO_PAYMENT_URL=\"https://c0abc123.caspio.com/dp/...\""
echo ""
echo "4. (Optional) Add Facebook:"
echo "   railway variables set FB_ACCESS_TOKEN=\"your_token\""
echo ""
echo "================================================"
echo "📋 Next Steps:"
echo "================================================"
echo ""
echo "After setting phone numbers and Caspio:"
echo ""
echo "1. Copy your Railway URL from above"
echo ""
echo "2. Register SMS tool with Retell:"
echo "   curl -X POST \"https://api.retellai.com/v1/tool\" \\"
echo "     -H \"Authorization: Bearer key_beadaa40bfd093b4f06eb4e2ac0a\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{...see QUICK-DEPLOY.md...}'"
echo ""
echo "3. Test endpoints:"
echo "   curl https://YOUR-URL.up.railway.app/health"
echo ""
echo "================================================"
echo "✅ Ready to test once variables are set!"
echo "================================================"
