# Quick Deploy Guide - Copy & Paste Commands

## Step 1: Deploy to Railway (5 minutes)

### Prerequisites
- Create free Railway account: https://railway.app
- Install Railway CLI: `npm install -g @railway/cli`

### Deploy Commands (Copy & Paste)

```bash
# Navigate to deployment folder
cd travelbucks-webhook-deployment

# Login to Railway (opens browser)
railway login

# Create new project
railway init

# Deploy the app
railway up

# The app will deploy and you'll get a URL like:
# https://travelbucks-webhook-production.up.railway.app
```

### Set Environment Variables

After deployment, set these variables in Railway dashboard:

```bash
# Go to: railway.app → Your Project → Variables

# Copy these exactly:
RETELL_API_KEY=key_beadaa40bfd093b4f06eb4e2ac0a
RETELL_AGENT_ID=agent_f3133d562a14ddeddc46be10e9
PORT=3000
```

### Get Phone Numbers (Stop here if you don't have these yet)

**Retell Phone Number** ($2/month):
1. Go to: https://retellai.com/dashboard
2. Click: Phone Numbers → Buy Number
3. Select US number
4. Copy number (format: +1234567890)
5. Add to Railway: `RETELL_PHONE_NUMBER=+1234567890`

**Twilio SMS Number** ($1/month):
1. Go to: https://twilio.com
2. Sign up / Login
3. Get a phone number (SMS-enabled)
4. Get Account SID and Auth Token from dashboard
5. Add to Railway:
   ```
   TWILIO_ACCOUNT_SID=ACxxxx...
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

### Get Railway URL

```bash
# In your terminal:
railway status

# Or check Railway dashboard for your app URL
# Example: https://travelbucks-webhook-production.up.railway.app
```

**SAVE YOUR RAILWAY URL** - you'll need it for the next step!

---

## Step 2: Register SMS Tool with Retell (30 seconds)

**Replace YOUR_RAILWAY_URL with your actual URL from Step 1**

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

If successful, you'll see:
```json
{
  "tool_id": "tool_xxxxx",
  "name": "send_payment_sms",
  "status": "active"
}
```

---

## Step 3: Update Flow with Tool ID (30 seconds)

After registering the tool, update the flow to use the tool ID:

```bash
# Replace TOOL_ID with the ID you got from Step 2

curl -X PATCH "https://api.retellai.com/update-conversation-flow/conversation_flow_c58b131ffc40" \
  -H "Authorization: Bearer key_beadaa40bfd093b4f06eb4e2ac0a" \
  -H "Content-Type: application/json" \
  -d '{
    "nodes": [
      {
        "id": "node-send-payment-link",
        "type": "function",
        "tool_id": "TOOL_ID_HERE",
        "tool_type": "custom"
      }
    ]
  }'
```

---

## Step 4: Test the System (15 minutes)

### Test Webhook Health

```bash
curl https://YOUR_RAILWAY_URL/health
```

Should return:
```json
{
  "status": "ok",
  "service": "TravelBucks Unified Lead Webhook",
  "timestamp": "2024-12-26T..."
}
```

### Test Manual Call (Without Full Lead Flow)

```bash
curl -X POST "https://api.retellai.com/create-phone-call" \
  -H "Authorization: Bearer key_beadaa40bfd093b4f06eb4e2ac0a" \
  -H "Content-Type: application/json" \
  -d '{
    "from_number": "YOUR_RETELL_PHONE",
    "to_number": "YOUR_PERSONAL_PHONE",
    "agent_id": "agent_f3133d562a14ddeddc46be10e9",
    "dynamic_variables": {
      "lead_id": "tb999999",
      "customer_name": "Test User",
      "customer_email": "test@example.com"
    }
  }'
```

**Expected result**: You should receive a call within 10 seconds with AI disclosure!

---

## 🎉 You're Done!

**What's Working Now**:
- ✅ AI agent calling system
- ✅ Qualification questions
- ✅ Planning fee offer
- ✅ SMS webhook (ready when Caspio is set up)

**What's Still Needed** (Optional):
- [ ] Caspio database + payment page
- [ ] Facebook Lead Ads
- [ ] Google Ads campaigns

**Minimum System is LIVE** - You can now make test calls!

---

## Troubleshooting

**Railway deploy fails**:
- Make sure you ran `railway login` first
- Check that you're in `travelbucks-webhook-deployment` folder

**Tool registration fails**:
- Verify your Railway URL is correct and live
- Make sure URL doesn't have trailing slash
- Check Railway logs: `railway logs`

**Test call doesn't work**:
- Verify phone numbers are in E.164 format (+1234567890)
- Check Retell dashboard for call logs
- Verify agent is not paused

**Need Help?**
- Railway logs: `railway logs`
- Retell dashboard: https://retellai.com/dashboard
- Check DEPLOYMENT-STATUS.md for detailed troubleshooting

---

## Cost Summary

**What You'll Pay**:
- Railway: $0 (free tier) or $5/month
- Retell phone: $2/month
- Twilio phone: $1/month
- Per call: ~$0.75 (5 min average)

**Total to test**: ~$3/month + call costs

---

**Start with Step 1 above and work your way down. Each step takes just a few minutes!**
