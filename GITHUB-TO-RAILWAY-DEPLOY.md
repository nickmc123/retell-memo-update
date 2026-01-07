# ✅ TravelBucks Pushed to GitHub!

**Repository**: https://github.com/nickmc123/retell-memo-update
**Branch**: main
**Folder**: `travelbucks-webhook-deployment/`

---

## 🚀 Deploy to Railway (3 clicks)

### Step 1: Go to Railway

Visit: https://railway.app/new

### Step 2: Deploy from GitHub Repo

1. Click **"Deploy from GitHub repo"**
2. Select: **nickmc123/retell-memo-update**
3. Railway will ask which folder to deploy
4. **IMPORTANT**: Set root directory to `travelbucks-webhook-deployment`

### Step 3: Configure Environment Variables

Click on your new service → **Variables** tab

Add these variables:

```bash
# Core Configuration (Required)
RETELL_API_KEY=***REMOVED***
RETELL_AGENT_ID=agent_f3133d562a14ddeddc46be10e9
PORT=3000

# Facebook (Optional - add when ready)
FB_VERIFY_TOKEN=***REMOVED***
```

### Step 4: Add Phone Numbers (When Ready)

```bash
# Retell Phone (get from https://retellai.com/dashboard)
RETELL_PHONE_NUMBER=+1234567890

# Twilio SMS (get from https://twilio.com)
TWILIO_ACCOUNT_SID=ACxxxx...
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Caspio (when ready)
CASPIO_ACCOUNT_ID=c0abc123
CASPIO_CLIENT_ID=your_id
CASPIO_CLIENT_SECRET=your_secret
CASPIO_PAYMENT_URL=https://c0abc123.caspio.com/dp/...
```

---

## ✅ That's It!

Railway will:
- ✅ Auto-detect Node.js
- ✅ Run `npm install`
- ✅ Start the server
- ✅ Give you a public URL

Your URL will be something like:
```
https://travelbucks-webhook-deployment-production.up.railway.app
```

---

## 📋 After Deployment

### 1. Test the Health Endpoint

```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/health
```

Should return:
```json
{
  "status": "ok",
  "service": "TravelBucks Unified Lead Webhook",
  "timestamp": "2024-12-26T..."
}
```

### 2. Copy Your Railway URL

You'll need this URL for the next step!

---

## 🔧 Next: Register SMS Tool with Retell

**Once you have your Railway URL**, run this command (replace YOUR_RAILWAY_URL):

```bash
curl -X POST "https://api.retellai.com/v1/tool" \
  -H "Authorization: Bearer ***REMOVED***" \
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

**Save the `tool_id` from the response!**

---

## 🎯 Auto-Deploy from GitHub

**Bonus**: Every time you push to GitHub, Railway automatically redeploys!

```bash
# Make changes to code
git add .
git commit -m "Update webhook"
git push origin main

# Railway automatically deploys the changes!
```

---

## 📊 Your Complete TravelBucks System

**What's Already Live**:
- ✅ Retell AI Agent: `agent_f3133d562a14ddeddc46be10e9`
- ✅ Conversation Flow: `conversation_flow_c58b131ffc40`
- ✅ Code on GitHub: ✅ Pushed
- ⏳ Railway Webhook: **Deploy now via link above**

**What's in the GitHub Repo**:
- Multi-platform webhook (Facebook, Google, Landing Page)
- SMS payment link system
- Complete documentation
- Auto-deployment configuration

---

## 🚨 Quick Start Checklist

- [ ] Go to https://railway.app/new
- [ ] Click "Deploy from GitHub repo"
- [ ] Select: nickmc123/retell-memo-update
- [ ] Set root directory: `travelbucks-webhook-deployment`
- [ ] Add environment variables (at minimum: RETELL_API_KEY, RETELL_AGENT_ID, PORT)
- [ ] Wait for deployment (~2 minutes)
- [ ] Copy your Railway URL
- [ ] Test: `curl https://YOUR-URL/health`
- [ ] Register SMS tool with Retell (command above)
- [ ] ✅ System is live!

---

## 📞 Support

- **GitHub Repo**: https://github.com/nickmc123/retell-memo-update
- **Railway Dashboard**: https://railway.app
- **Retell Dashboard**: https://retellai.com/dashboard

---

**Your TravelBucks system is ready to deploy from GitHub!** 🎉

Just click the Railway link above and follow the 3-step process.
