#!/bin/bash

# ============================================================================
# TravelBucks Railway Deployment Script
# ============================================================================

echo "=========================================="
echo "TravelBucks Railway Deployment"
echo "=========================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found"
    echo ""
    echo "Install it with:"
    echo "  npm install -g @railway/cli"
    echo ""
    echo "Or use the Railway web interface:"
    echo "  https://railway.app"
    exit 1
fi

echo "✓ Railway CLI found"
echo ""

# Create deployment directory
DEPLOY_DIR="travelbucks-webhook-deployment"

echo "Creating deployment directory: $DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# Copy webhook file
echo "Copying unified webhook..."
cp ../unified_lead_webhook.js index.js

# Create package.json
echo "Creating package.json..."
cat > package.json <<'EOF'
{
  "name": "travelbucks-webhook",
  "version": "1.0.0",
  "description": "TravelBucks Multi-Platform Lead Webhook",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.2",
    "twilio": "^4.19.0"
  },
  "engines": {
    "node": "18.x"
  }
}
EOF

# Create Procfile
echo "Creating Procfile..."
cat > Procfile <<'EOF'
web: node index.js
EOF

# Create .env.example
echo "Creating .env.example..."
cat > .env.example <<'EOF'
# Retell AI Configuration
RETELL_API_KEY=key_beadaa40bfd093b4f06eb4e2ac0a
RETELL_AGENT_ID=agent_f3133d562a14ddeddc46be10e9
RETELL_PHONE_NUMBER=+1234567890

# Twilio Configuration (SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Caspio Configuration
CASPIO_ACCOUNT_ID=c0abc123
CASPIO_CLIENT_ID=your_client_id
CASPIO_CLIENT_SECRET=your_client_secret
CASPIO_PAYMENT_URL=https://c0abc123.caspio.com/dp/abc12345000/payment

# Facebook Configuration (Optional)
FB_ACCESS_TOKEN=your_facebook_access_token
FB_VERIFY_TOKEN=travelbucks_verify_token_2024

# Server Configuration
PORT=3000
EOF

# Create README
echo "Creating README..."
cat > README.md <<'EOF'
# TravelBucks Webhook

Multi-platform lead webhook for TravelBucks AI Voice Concierge.

## Deployment to Railway

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Initialize project:
   ```bash
   railway init
   ```

4. Set environment variables:
   ```bash
   railway variables set RETELL_API_KEY=your_key
   railway variables set TWILIO_ACCOUNT_SID=your_sid
   # ... set all variables from .env.example
   ```

5. Deploy:
   ```bash
   railway up
   ```

6. Get your Railway URL:
   ```bash
   railway status
   ```

## Endpoints

- `POST /webhooks/facebook-leads` - Facebook Lead Ads
- `POST /webhooks/google-leads` - Google Ads
- `POST /webhooks/landing-page` - Landing page form
- `POST /webhooks/send-payment-sms` - SMS payment links
- `GET /health` - Health check

## Environment Variables

See `.env.example` for required environment variables.
EOF

echo ""
echo "=========================================="
echo "✅ Deployment files created!"
echo "=========================================="
echo ""
echo "Directory: $DEPLOY_DIR"
echo ""
echo "Files created:"
echo "  ✓ index.js (webhook code)"
echo "  ✓ package.json"
echo "  ✓ Procfile"
echo "  ✓ .env.example"
echo "  ✓ README.md"
echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "Option A: Deploy via Railway CLI"
echo "  1. cd $DEPLOY_DIR"
echo "  2. railway login"
echo "  3. railway init"
echo "  4. Set environment variables (see .env.example)"
echo "  5. railway up"
echo ""
echo "Option B: Deploy via Railway Web UI"
echo "  1. Go to https://railway.app"
echo "  2. Create New Project"
echo "  3. Deploy from Local Directory"
echo "  4. Select: $DEPLOY_DIR"
echo "  5. Add environment variables"
echo "  6. Deploy"
echo ""
echo "After deployment:"
echo "  - Copy your Railway URL"
echo "  - Update tool registration in Retell AI"
echo "  - Test webhook endpoints"
echo ""
echo "=========================================="
