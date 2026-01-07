# 🚀 TravelBucks Complete Setup Guide
## Instant Callback System with Facebook Lead Ads

---

## 📦 What You're Building

A complete lead generation and instant callback system:

1. **Facebook Lead Ads** capture leads
2. **Webhook instantly calls** the lead (within seconds)
3. **Brianna (AI agent)** qualifies and sells $199 membership
4. **Caspio tracks** everything with auto-generated client_id
5. **Payment processed** via Authorize.Net

**User Experience:**
1. User fills out 4-question Facebook form (30 seconds)
2. Phone rings instantly (within 60 seconds)
3. Brianna calls and pitches membership
4. User pays $199 over the phone
5. Done!

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `travelbucks_landing_page.html` | Optional landing page for web traffic |
| `lead_webhook_instant_call.js` | Railway webhook that triggers instant calls |
| `deploy_travelbucks.py` | Batch calling script for Caspio leads |
| `brianna_outbound_callback_flow.json` | Retell AI conversation flow |
| `brianna_agent_config.json` | Retell AI agent configuration |
| `FACEBOOK-AD-CREATIVE.md` | Complete ad copy, images, targeting |
| `TRAVELBUCKS-DEPLOYMENT.md` | Deployment instructions |

---

## 🏗️ Architecture

```
┌─────────────────┐
│  Facebook Lead  │
│      Ad         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐       ┌──────────────┐
│   Webhook on    │──────▶│   Caspio     │
│     Railway     │       │  (client_id) │
└────────┬────────┘       └──────────────┘
         │
         ▼
┌─────────────────┐
│  Retell AI      │
│  Makes Call     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Brianna      │
│   (AI Agent)    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
 [Sells]  [Declines]
    │         │
    ▼         ▼
┌─────────┐ ┌──────┐
│ Payment │ │ End  │
└─────────┘ └──────┘
```

---

## ⚙️ Step-by-Step Setup

### Step 1: Deploy Webhook to Railway

**1.1 Create Railway Project**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create new project
railway init
```

**1.2 Deploy Webhook**
```bash
# Copy webhook handler
cp lead_webhook_instant_call.js server.js

# Create package.json
cat > package.json << 'EOL'
{
  "name": "travelbucks-webhook",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "body-parser": "^1.20.2",
    "axios": "^1.6.0"
  }
}
EOL

# Deploy
railway up
```

**1.3 Set Environment Variables in Railway**
```bash
railway variables set RETELL_API_KEY=***REMOVED***
railway variables set RETELL_AGENT_ID=agent_0562fddc61ca674411c34cd69a
railway variables set RETELL_PHONE_NUMBER=+14155551234

railway variables set CASPIO_ACCOUNT_ID=your_account_id
railway variables set CASPIO_CLIENT_ID=your_client_id
railway variables set CASPIO_CLIENT_SECRET=your_client_secret

railway variables set FACEBOOK_VERIFY_TOKEN=***REMOVED***
railway variables set FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token
```

**1.4 Get Webhook URL**
```bash
railway domain
# Example: https://travelbucks-webhook-production.up.railway.app
```

---

### Step 2: Set Up Caspio Database

**2.1 Create Table: `TravelBucks_Leads`**

| Field Name | Data Type | Notes |
|-----------|-----------|-------|
| `ClientID` | Text (50) | Primary Key, e.g., "tb263421" |
| `CustomerName` | Text (100) | Full name |
| `Phone` | Text (20) | E.164 format: +14155551234 |
| `Email` | Text (100) | Email address |
| `TravelFrequency` | Text (50) | How often they travel |
| `PreferredCallTime` | Text (50) | Best time to call |
| `Source` | Text (50) | landing_page, facebook_lead_ad |
| `Status` | Text (50) | callback_requested, calling_now, etc. |
| `CreatedDate` | Date/Time | When lead was created |
| `LastCallDate` | Date/Time | Last call timestamp |
| `LastCallID` | Text (100) | Retell AI call ID |
| `FacebookLeadID` | Text (100) | FB lead ID (optional) |

**2.2 Enable API Access**
- Go to Caspio → Tables → Your Table → API
- Generate OAuth 2.0 credentials
- Save Account ID, Client ID, Client Secret

---

### Step 3: Configure Retell AI

**Agent is already deployed!**
- **Agent ID**: `agent_0562fddc61ca674411c34cd69a`
- **Flow ID**: `conversation_flow_c157876f8d0f`

**Just need to add a phone number:**

1. Go to https://dashboard.retellai.com/phone-numbers
2. Purchase a phone number (or use existing)
3. Copy the number (e.g., `+14155551234`)
4. Set as `RETELL_PHONE_NUMBER` in Railway

---

### Step 4: Set Up Facebook Lead Ads

**4.1 Create Facebook Page** (if you don't have one)
- Go to facebook.com/pages/create
- Choose "Business or Brand"
- Name: "TravelBucks" (or your brand)

**4.2 Create Lead Form**

Go to Meta Business Suite → Ad Center → Lead Forms → Create Form

**Form Configuration:**
- Name: "TravelBucks Instant Callback"
- Type: More Volume
- Questions:
  1. Full Name (pre-fill)
  2. Phone Number (pre-fill)
  3. Email (pre-fill)
  4. Travel Frequency (custom: "1-2 times/year", "3-4 times/year", "5+", "Rarely")

**Intro Screen:**
- Headline: "Get a Call in 60 Seconds!"
- Description: (see FACEBOOK-AD-CREATIVE.md)

**Completion Screen:**
- Headline: "Your Phone Is About to Ring!"
- Description: "We're calling you RIGHT NOW..."

**4.3 Configure Webhook**

Go to facebook.com/YOUR_PAGE/settings → Webhooks

1. Click "Add Webhook"
2. Callback URL: `https://your-railway-url.up.railway.app/webhooks/facebook-leads`
3. Verify Token: `***REMOVED***`
4. Subscribe to: `leadgen`
5. Click "Verify and Save"

**4.4 Get Page Access Token**

1. Go to developers.facebook.com
2. Create App → Business
3. Add "Facebook Login" product
4. Go to Tools → Graph API Explorer
5. Generate User Access Token with permissions:
   - `pages_manage_ads`
   - `pages_read_engagement`
   - `leads_retrieval`
6. Get Long-Lived Token:
   ```bash
   curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_LIVED_TOKEN"
   ```
7. Set as `FACEBOOK_PAGE_ACCESS_TOKEN` in Railway

---

### Step 5: Create Facebook Ads

**5.1 Campaign Setup**
- Objective: Leads
- Campaign Name: "TravelBucks - Instant Callback"
- Budget: $50-100/day

**5.2 Ad Set**
- Conversion Location: Instant Forms
- Targeting: (see FACEBOOK-AD-CREATIVE.md)
  - Age: 30-65
  - Interests: Travel, Cruises, Resorts
- Placements: Automatic

**5.3 Ad Creative**
- Use copy from FACEBOOK-AD-CREATIVE.md
- Choose Option 1 (Discount Focus) to start
- Select your Lead Form
- Preview and publish!

---

### Step 6: Test Everything

**6.1 Test Landing Page**
```bash
# Open in browser
open travelbucks_landing_page.html

# Fill out form
# Check: Did you receive a call within 60 seconds?
```

**6.2 Test Facebook Lead**
- Create a test lead ad
- Use "Test with existing leads" feature
- Submit your own info
- Check: Did you get called instantly?

**6.3 Check Caspio**
- Verify lead was created
- Check `client_id` format (tb######)
- Verify `Status` = "call_in_progress"

**6.4 Check Retell AI**
- Go to dashboard.retellai.com/calls
- Verify call was logged
- Listen to recording
- Check post-call analysis has `client_id`

---

## 🔧 Troubleshooting

### "No call received after form submission"

**Check:**
1. Railway logs: `railway logs`
2. RETELL_PHONE_NUMBER is set correctly
3. Phone number is in E.164 format (+1XXXXXXXXXX)
4. Retell API key is valid

### "Facebook webhook not receiving leads"

**Check:**
1. Webhook subscribed to `leadgen`
2. Verify token matches
3. Page Access Token has `leads_retrieval` permission
4. Check Railway logs for incoming requests

### "Lead saved but client_id not showing up"

**Check:**
1. Caspio field is named exactly `ClientID`
2. Railway has Caspio credentials set
3. Check Railway logs for Caspio errors

---

## 📊 Monitoring & Analytics

### Daily Checks

**Railway Logs:**
```bash
railway logs --tail
```

Look for:
- `[Landing Page] Received lead`
- `[Retell] Call initiated`
- `[Success] Lead saved with client_id: tb######`

**Retell AI Dashboard:**
- dashboard.retellai.com/calls
- Track: call duration, outcome, analysis

**Caspio Database:**
- Count leads by status
- Track conversion rates
- Monitor call outcomes

**Facebook Ads Manager:**
- Cost per lead
- Form completion rate
- Ad performance by creative

---

## 🚀 Launch Checklist

### Pre-Launch
- [ ] Railway webhook deployed
- [ ] Environment variables configured
- [ ] Caspio database created and API enabled
- [ ] Retell phone number purchased
- [ ] Test landing page works
- [ ] Test instant calling works
- [ ] Facebook Page created
- [ ] Lead Form created
- [ ] Webhook configured and verified

### Launch Day
- [ ] Create 3 ad variations
- [ ] Set daily budget to $50
- [ ] Monitor first 10 leads closely
- [ ] Adjust based on performance

### Week 1
- [ ] Review call recordings
- [ ] Optimize Brianna's script if needed
- [ ] Pause underperforming ads
- [ ] Scale winning ads

---

## 💰 Expected ROI

**Assumptions:**
- Cost per lead: $20
- Call answer rate: 70%
- Conversion rate: 15%
- Revenue per sale: $199

**Math:**
- 100 leads = $2,000 ad spend
- 70 calls answered
- 10 sales (15% conversion)
- Revenue: $1,990
- Break-even at 11 sales

**To be profitable:**
- Need >10% conversion rate
- OR get cost per lead below $18
- OR increase answer rate above 70%

---

## 🎯 Success Metrics

**Track These:**
1. **Cost Per Lead** (target: <$20)
2. **Answer Rate** (target: >70%)
3. **Conversion Rate** (target: >15%)
4. **Average Call Duration** (target: 3-7 min)
5. **Client Satisfaction** (listen to recordings)

---

**You're all set! Time to start converting leads into TravelBucks members!** 🚀
