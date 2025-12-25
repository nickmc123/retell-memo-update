# Railway Deployment Guide

Deploy the TravelBucks API server with Google Chat integration to Railway.

## Quick Deploy

```bash
cd Integration-Implementation/integration-implementation

# Login to Railway (opens browser)
railway login

# Create new project or link existing
railway link

# Set environment variables
railway variables set GOOGLE_CHAT_WEBHOOK_URL="your-webhook-url-here"
railway variables set USE_MOCK_DATA="true"
railway variables set PORT="3000"

# Deploy
railway up

# Get deployment URL
railway status
```

## Detailed Steps

### 1. Login to Railway

```bash
railway login
```

This will open a browser for authentication.

### 2. Link or Create Project

#### Option A: Create New Project

```bash
railway init
# Follow prompts to create new project
```

#### Option B: Link Existing Project

```bash
railway link
# Select your project from the list
```

### 3. Configure Environment Variables

#### Required Variables

```bash
# Google Chat webhook (get from Google Chat space)
railway variables set GOOGLE_CHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/YOUR_SPACE/messages?key=...&token=..."

# Use mock data (no database required)
railway variables set USE_MOCK_DATA="true"

# Port (Railway will override, but good to set)
railway variables set PORT="3000"

# Retell API key (optional)
railway variables set RETELL_API_KEY="key_f4754e90caf598958c041674fb2a"
```

#### Optional Variables (if using database)

```bash
railway variables set USE_MOCK_DATA="false"
railway variables set DB_HOST="your-db-host"
railway variables set DB_PORT="5432"
railway variables set DB_NAME="casablanca_db"
railway variables set DB_USER="postgres"
railway variables set DB_PASSWORD="your-password"
```

### 4. Deploy

```bash
railway up
```

This will:
- Build the application using Nixpacks
- Install dependencies
- Start the server with `npm run start:postgres`
- Provide a public URL

### 5. Get Your Deployment URL

```bash
railway status
```

Look for the URL like: `https://your-app.up.railway.app`

### 6. Configure Custom Domain (Optional)

```bash
railway domain
```

Or in the Railway dashboard:
1. Go to your project
2. Click "Settings"
3. Add custom domain

## Post-Deployment

### 1. Test the Deployment

```bash
# Get your Railway URL
RAILWAY_URL=$(railway status --json | jq -r .deploymentUrl)

# Test health endpoint
curl https://your-app.up.railway.app/health

# Test Google Chat active calls
curl https://your-app.up.railway.app/google-chat/active-calls

# Send test Google Chat alert
curl -X POST https://your-app.up.railway.app/google-chat/test
```

### 2. Configure Retell AI Webhooks

Now that your server is deployed, configure Retell to send webhooks:

```bash
curl -X PATCH "https://api.retellai.com/update-agent/agent_5e8563364be42a9dd3a8a26936" \
  -H "Authorization: Bearer key_f4754e90caf598958c041674fb2a" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_url": "https://your-app.up.railway.app/webhook/retell",
    "webhook_events": ["call_started", "transcript", "call_ended"]
  }'
```

Or configure in Retell dashboard:
1. Go to https://app.retellai.com/dashboard
2. Open agent: `agent_5e8563364be42a9dd3a8a26936`
3. Settings → Webhooks
4. Add URLs:
   - Call Started: `https://your-app.up.railway.app/webhook/retell/call-started`
   - Transcript: `https://your-app.up.railway.app/webhook/retell/transcript-update`
   - Call Ended: `https://your-app.up.railway.app/webhook/retell/call-ended`

### 3. Monitor Logs

```bash
railway logs
```

Or view in Railway dashboard:
1. Go to your project
2. Click "Deployments"
3. View logs in real-time

## Troubleshooting

### Check Deployment Status

```bash
railway status
```

### View Logs

```bash
railway logs --tail 100
```

### Restart Service

```bash
railway restart
```

### Update Environment Variables

```bash
railway variables set VARIABLE_NAME="new-value"
railway restart
```

### Redeploy

```bash
railway up --detach
```

## Managing Secrets

Never commit `.env` files. Use Railway's variables:

```bash
# List all variables
railway variables

# Set variable
railway variables set KEY="value"

# Delete variable
railway variables delete KEY
```

## Scaling

Railway auto-scales, but you can configure:

```bash
# View current resources
railway status

# Configure in dashboard:
# Settings → Resources → Memory/CPU
```

## Cost Management

Railway charges based on usage:
- Free tier: $5/month credit
- Pro tier: $20/month + usage

Monitor usage:
```bash
railway status
```

Or in dashboard: Billing → Usage

## Rollback

```bash
# List deployments
railway deployments

# Rollback to previous
railway rollback [deployment-id]
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: your-service-name
```

## Custom Configuration

Edit `railway.json` for custom deployment settings:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:postgres",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Health Checks

Railway automatically monitors:
- HTTP endpoint responses
- Memory usage
- CPU usage
- Crash detection

Configure custom health check:
```bash
# In Railway dashboard:
# Settings → Health Check → Set path to /health
```

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- This project: See GOOGLE_CHAT_SETUP.md

---

**Your TravelBucks API server with Google Chat integration is ready to deploy!** 🚀
