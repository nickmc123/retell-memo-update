# Deploy TravelBucks - Quick Start

## You Already Have Railway Experience!

I see you've deployed Casablanca Express agents before. This follows the same pattern.

## 🚀 Deploy Right Now (2 minutes)

### Option 1: Automated Script

```bash
cd /Users/nickmac/VSC-Claude-User-Data
./TRAVELBUCKS-RAILWAY-DEPLOY.sh
```

### Option 2: Manual Commands

```bash
cd travelbucks-webhook-deployment

# Login (if not already)
railway login

# Create project
railway init --name travelbucks-webhook-production

# Deploy
railway up

# Set core variables (matching your Casablanca pattern)
railway variables set RETELL_API_KEY="key_beadaa40bfd093b4f06eb4e2ac0a"
railway variables set RETELL_AGENT_ID="agent_f3133d562a14ddeddc46be10e9"
railway variables set PORT="3000"

# Get your URL
railway status
```

**Your URL will be**: `https://travelbucks-webhook-production.up.railway.app`

---

## 📞 Phase 2: Add Phone Numbers (Stop here if you don't have these yet)

### Retell Phone Number

```bash
# Go to: https://retellai.com/dashboard
# Buy a US phone number ($2/month)
# Then:
railway variables set RETELL_PHONE_NUMBER="+1234567890"
```

### Twilio SMS Number

```bash
# Go to: https://twilio.com
# Get SMS-enabled number + credentials ($1/month)
# Then:
railway variables set TWILIO_ACCOUNT_SID="ACxxxx..."
railway variables set TWILIO_AUTH_TOKEN="your_token"
railway variables set TWILIO_PHONE_NUMBER="+1234567890"
```

---

## 🔧 Phase 3: Register Tool with Retell (Once Railway URL is live)

Replace `YOUR_RAILWAY_URL` with your actual URL from `railway status`:

```bash
curl -X POST "https://api.retellai.com/v1/tool" \
  -H "Authorization: Bearer key_beadaa40bfd093b4f06eb4e2ac0a" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "send_payment_sms",
    "description": "Send Caspio payment link via SMS",
    "url": "https://YOUR_RAILWAY_URL/webhooks/send-payment-sms",
    "method": "POST",
    "parameters": {
      "type": "object",
      "properties": {
        "lead_id": {"type": "string"},
        "phone": {"type": "string"},
        "customer_name": {"type": "string"},
        "email": {"type": "string"},
        "amount": {"type": "number"}
      },
      "required": ["lead_id", "phone", "customer_name", "email", "amount"]
    }
  }'
```

Save the `tool_id` from the response!

---

## 🧪 Phase 4: Test It

```bash
# Test webhook health
curl https://YOUR_RAILWAY_URL/health

# Should return:
# {"status":"ok","service":"TravelBucks Unified Lead Webhook",...}
```

---

## 📊 What's Already Live

From your Retell workspace `key_beadaa40bfd093b4f06eb4e2ac0a`:

✅ **TravelBucks AI Agent**: `agent_f3133d562a14ddeddc46be10e9`
✅ **Conversation Flow**: `conversation_flow_c58b131ffc40`
✅ **Voice**: 11labs-Cimo (matching your Casablanca agents)
✅ **Model**: GPT-4.1 Cascading

---

## 🎯 What You're Deploying

**New Railway App**: TravelBucks webhook server

**Endpoints**:
- `/webhooks/facebook-leads` - Facebook Lead Ads
- `/webhooks/google-leads` - Google Ads
- `/webhooks/landing-page` - Landing page forms
- `/webhooks/send-payment-sms` - SMS payment links
- `/health` - Health check

**Matches Your Pattern**:
- Same as: `web-production-4080.up.railway.app` (RIMS API)
- Same workspace: `key_beadaa40bfd093b4f06eb4e2ac0a`
- Same deployment style as Casablanca Express

---

## ⏱️ Time Estimate

- **Phase 1** (Deploy to Railway): 2 minutes
- **Phase 2** (Phone numbers): 10 minutes if you need to sign up
- **Phase 3** (Register tool): 30 seconds
- **Phase 4** (Test): 1 minute

**Total**: ~15 minutes to fully working system

---

## 🚨 Just Want to Test Without Phone Numbers?

You can deploy the webhook and test `/health` endpoint without Twilio/Retell phones:

```bash
# Deploy
./TRAVELBUCKS-RAILWAY-DEPLOY.sh

# Test health
curl https://YOUR_URL.up.railway.app/health
```

This proves Railway deployment works. Add phones later when ready.

---

## 📞 Need Help?

Your webhook logs: `railway logs`
Your Retell dashboard: https://retellai.com/dashboard
Your Railway dashboard: https://railway.app

---

**Start with Phase 1 right now! The script is ready to run.**
