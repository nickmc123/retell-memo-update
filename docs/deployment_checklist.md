# TravelBucks Deployment Checklist

Complete guide for deploying the TravelBucks "Choose Your Dream Getaway — from $999" lead-to-payment system.

---

## Overview

| Component | Status | Owner |
|-----------|--------|-------|
| Caspio Table | ⬜ | Database |
| Caspio Payment DataPage | ⬜ | Database |
| Railway API | ⬜ | Engineering |
| Retell Agent | ⬜ | Voice |
| Facebook Lead Ads | ⬜ | Marketing |
| End-to-End Test | ⬜ | QA |

---

## 1. Caspio Setup

### 1.1 Create TravelBucks_Leads Table

- [ ] Log in to Caspio
- [ ] Navigate to **Tables** > **New Table**
- [ ] Create table with name: `TravelBucks_Leads`
- [ ] Add all fields per [caspio_data_model.md](./caspio_data_model.md)
- [ ] Verify primary key: `lead_id` (Autonumber)
- [ ] Verify unique constraint on `phone` field
- [ ] Create indexes on `phone`, `status`, `payment_status`

**Verification:**
```bash
# Test table exists via REST API
curl -X POST "https://***REMOVED***.caspio.com/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "$CASPIO_CLIENT_ID:$CASPIO_CLIENT_SECRET" \
  -d "grant_type=client_credentials"

# Query table (use token from above)
curl -X GET "https://***REMOVED***.caspio.com/rest/v2/tables/TravelBucks_Leads/records" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

### 1.2 Create Payment DataPage

- [ ] Navigate to **DataPages** > **New DataPage**
- [ ] Follow steps in [caspio_payment_datapage.md](./caspio_payment_datapage.md)
- [ ] Configure Authorize.Net credentials
- [ ] Set up success/failure actions
- [ ] Configure webhook trigger (if available)
- [ ] Deploy DataPage
- [ ] Copy DataPage URL

**DataPage URL Format:**
```
https://***REMOVED***.caspio.com/dp/[YOUR_DATAPAGE_ID]
```

### 1.3 Create Confirmation DataPage

- [ ] Create simple report/details DataPage
- [ ] Show confirmation message and transaction details
- [ ] Link from payment success redirect

---

## 2. Railway Deployment

### 2.1 Environment Variables

Set these in Railway dashboard or via CLI:

```bash
# Caspio
CASPIO_BASE_URL=https://***REMOVED***.caspio.com
CASPIO_TOKEN_URL=https://***REMOVED***.caspio.com/oauth/token
CASPIO_CLIENT_ID=your_client_id
CASPIO_CLIENT_SECRET=your_client_secret
CASPIO_TABLE_LEADS=TravelBucks_Leads

# Retell
RETELL_API_KEY=your_retell_api_key

# Payment
PAYMENT_PAGE_BASE_URL=https://***REMOVED***.caspio.com/dp/your_datapage_id

# Security
APP_SECRET=generate_secure_random_string

# Server
PORT=3000
NODE_ENV=production
```

**Generate APP_SECRET:**
```bash
openssl rand -hex 32
```

### 2.2 Deploy to Railway

**Option A: Via GitHub**
```bash
# Commit changes
git add .
git commit -m "Add TravelBucks lead-to-payment system"
git push origin main

# Railway auto-deploys from connected repo
```

**Option B: Via Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

### 2.3 Update package.json

- [ ] Verify start script points to correct file:
```json
{
  "scripts": {
    "start": "node src/travelbucks-api.js",
    "start:travelbucks": "node src/travelbucks-api.js"
  }
}
```

Or update `railway.json`:
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "node src/travelbucks-api.js"
  }
}
```

### 2.4 Verify Deployment

```bash
# Health check
curl https://travelbucks-voice-ops-production.up.railway.app/health

# Expected response:
{
  "status": "ok",
  "service": "TravelBucks Voice Ops",
  "caspio": "connected",
  "timestamp": "2025-01-06T12:00:00.000Z"
}
```

---

## 3. Retell Agent Setup

### 3.1 Create Agent

- [ ] Log in to Retell dashboard
- [ ] Create new agent: "TravelBucks Concierge"
- [ ] Apply settings from [retell_agent_prompt.md](./retell_agent_prompt.md)

### 3.2 Configure Voice

```json
{
  "voice_id": "11labs-Cimo",
  "voice_model": "eleven_flash_v2_5",
  "enable_backchannel": true,
  "backchannel_frequency": 0.8
}
```

### 3.3 Configure Tools

Add these tools to the agent:

**Tool 1: send_payment_sms**
```json
{
  "name": "send_payment_sms",
  "url": "https://travelbucks-voice-ops-production.up.railway.app/send-payment-sms",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "parameters": {
    "lead_id": "string (required)",
    "phone": "string (optional)"
  }
}
```

**Tool 2: create_lead**
```json
{
  "name": "create_lead",
  "url": "https://travelbucks-voice-ops-production.up.railway.app/lead",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "parameters": {
    "full_name": "string",
    "phone": "string (required)",
    "destination_interest": "string",
    "travel_window": "string"
  }
}
```

### 3.4 Configure Webhook

- [ ] Set webhook URL: `https://travelbucks-voice-ops-production.up.railway.app/retell/webhook`
- [ ] Enable events: `call_started`, `call_ended`, `tool_call`

### 3.5 Test Agent

- [ ] Make test call to agent
- [ ] Verify AI disclosure plays within 10 seconds
- [ ] Test send_payment_sms tool
- [ ] Verify SMS received
- [ ] Verify lead created in Caspio

---

## 4. Facebook Lead Ads

### 4.1 Campaign Setup

- [ ] Create campaign per [facebook_lead_ads.md](./facebook_lead_ads.md)
- [ ] Configure lead form with TCPA consent checkbox
- [ ] Verify consent language is EXACT

### 4.2 Lead Sync

**Option A: Zapier**
- [ ] Create Zap: FB Lead Ads → Webhook
- [ ] Configure POST to Railway `/lead` endpoint
- [ ] Test with sample lead

**Option B: Make.com**
- [ ] Create scenario: FB Lead Ads → HTTP
- [ ] Configure same POST request
- [ ] Test with sample lead

### 4.3 Verification

```bash
# Create test lead manually
curl -X POST "https://travelbucks-voice-ops-production.up.railway.app/lead" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "FB Test User",
    "phone": "+15551234567",
    "email": "test@example.com",
    "source": "facebook",
    "destination_interest": "Hawaii",
    "consent_checkbox": true
  }'
```

---

## 5. End-to-End Testing

### 5.1 Lead Creation Flow

```bash
# 1. Create lead
curl -X POST "https://travelbucks-voice-ops-production.up.railway.app/lead" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "phone": "+15551234567",
    "source": "test",
    "destination_interest": "Hawaii",
    "travel_window": "3_6_months",
    "consent_checkbox": true
  }'

# Response should include lead_id
```

### 5.2 Payment Link Generation

```bash
# 2. Generate payment link
curl -X POST "https://travelbucks-voice-ops-production.up.railway.app/payment-link" \
  -H "Content-Type: application/json" \
  -d '{"lead_id": 1}'

# Response should include payment_link_url
```

### 5.3 Payment Flow

- [ ] Open payment link in browser
- [ ] Verify lead information displayed
- [ ] Verify disclosure text present
- [ ] Enter test card: `4111111111111111`
- [ ] Complete payment
- [ ] Verify redirect to confirmation page
- [ ] Verify transaction_id saved

### 5.4 Webhook Verification

```bash
# Check lead status after payment
curl -X GET "https://travelbucks-voice-ops-production.up.railway.app/lead/1" \
  -H "Content-Type: application/json"

# Should show:
# - status: "paid"
# - payment_status: "paid"
# - transaction_id: "AUTH..."
```

### 5.5 SMS Flow

```bash
# Send payment SMS
curl -X POST "https://travelbucks-voice-ops-production.up.railway.app/send-payment-sms" \
  -H "Content-Type: application/json" \
  -d '{"lead_id": 1}'

# Verify SMS received on phone
```

---

## 6. Monitoring & Logging

### 6.1 Railway Logs

```bash
# View logs via CLI
railway logs

# Or via dashboard:
# https://railway.app/project/[project-id]/logs
```

### 6.2 Key Metrics to Monitor

- [ ] API response times
- [ ] Error rates
- [ ] Successful payments
- [ ] Failed payments
- [ ] Webhook delivery success

### 6.3 Alerts (Recommended)

Set up alerts for:
- API health check failures
- Payment webhook failures
- High error rates
- Caspio token refresh failures

---

## 7. Security Checklist

- [ ] APP_SECRET is strong (32+ random characters)
- [ ] APP_SECRET is NOT in source code
- [ ] HTTPS enforced on all endpoints
- [ ] No card data stored in our systems
- [ ] Webhook authentication enabled
- [ ] CORS configured appropriately
- [ ] Rate limiting considered

---

## 8. Go-Live Checklist

### Pre-Launch
- [ ] All environment variables set in production
- [ ] Authorize.Net switched to PRODUCTION mode
- [ ] Test payment with real card (small amount, refund after)
- [ ] Retell agent tested with real calls
- [ ] Facebook Lead Ads tested with real submission
- [ ] Support contact information updated in all docs
- [ ] PDF explainer generated with correct info

### Launch Day
- [ ] Monitor Railway logs for errors
- [ ] Monitor payment success rate
- [ ] Verify first few leads come through correctly
- [ ] Verify first payment completes successfully
- [ ] Check SMS delivery

### Post-Launch
- [ ] Review first 24 hours of data
- [ ] Check for any failed webhooks
- [ ] Verify lead-to-payment conversion tracking
- [ ] Document any issues for iteration

---

## Quick Reference Commands

```bash
# Health check
curl https://travelbucks-voice-ops-production.up.railway.app/health

# Create lead
curl -X POST "https://travelbucks-voice-ops-production.up.railway.app/lead" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Test", "phone": "+15551234567", "consent_checkbox": true}'

# Generate payment link
curl -X POST "https://travelbucks-voice-ops-production.up.railway.app/payment-link" \
  -H "Content-Type: application/json" \
  -d '{"lead_id": 1}'

# Get lead by ID
curl "https://travelbucks-voice-ops-production.up.railway.app/lead/1"

# Get lead by phone
curl "https://travelbucks-voice-ops-production.up.railway.app/lead/phone/+15551234567"

# Send payment SMS
curl -X POST "https://travelbucks-voice-ops-production.up.railway.app/send-payment-sms" \
  -H "Content-Type: application/json" \
  -d '{"lead_id": 1}'

# Simulate payment webhook (for testing)
curl -X POST "https://travelbucks-voice-ops-production.up.railway.app/webhooks/payment" \
  -H "Content-Type: application/json" \
  -H "X-App-Secret: YOUR_APP_SECRET" \
  -d '{"lead_id": 1, "status": "paid", "transaction_id": "TEST123", "amount": 999}'
```

---

## Related Documentation

- [Caspio Data Model](./caspio_data_model.md)
- [Caspio Payment DataPage](./caspio_payment_datapage.md)
- [Retell Agent Prompt](./retell_agent_prompt.md)
- [Facebook Lead Ads](./facebook_lead_ads.md)
