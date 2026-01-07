# TravelBucks Outbound Callback System

Complete deployment guide for Brianna - Outbound Callback agent.

---

## 🎯 What This Does

1. **Fetches leads** from Caspio with `callback_requested` status
2. **Makes outbound calls** via Retell AI with Brianna agent
3. **Tracks client_id** throughout the call
4. **Updates Caspio** after each call with call status and timestamp

---

## 📋 Prerequisites

### 1. Retell AI Phone Number

You need to purchase a phone number in your Retell AI dashboard:
- Go to https://dashboard.retellai.com/phone-numbers
- Purchase a phone number (or use existing one)
- Copy the number in E.164 format (e.g., `+14155551234`)

### 2. Caspio Database Setup

Your Caspio table should have these fields:

| Field Name | Type | Description |
|------------|------|-------------|
| `ClientID` | Text | Unique client identifier (e.g., "tb263421") |
| `CustomerName` | Text | Lead's full name |
| `Phone` | Text | Phone number |
| `Email` | Text | Email address |
| `Status` | Text | Lead status ("callback_requested", "callback_in_progress", etc.) |
| `LastCallDate` | Date/Time | When they were last called |
| `LastCallID` | Text | Retell AI call ID |

### 3. Caspio API Credentials

Enable API access in Caspio:
- Go to your Caspio account → Tables → API
- Generate OAuth 2.0 credentials
- Save your Account ID, Client ID, and Client Secret

---

## 🚀 Installation

### Step 1: Install Dependencies

```bash
pip install requests
```

### Step 2: Set Environment Variables

Create a `.env` file or export these variables:

```bash
# Required
export RETELL_API_KEY="***REMOVED***"
export RETELL_PHONE_NUMBER="+14155551234"  # Your Retell phone number

# Optional - for Caspio integration
export CASPIO_ACCOUNT_ID="c1abc123"
export CASPIO_CLIENT_ID="your_client_id"
export CASPIO_CLIENT_SECRET="your_client_secret"
export CASPIO_TABLE_NAME="TravelBucks_Leads"

# Optional - call limits
export MAX_CALLS_PER_BATCH="10"
export DELAY_BETWEEN_CALLS="5"
```

---

## 🧪 Testing (Dry Run)

Test without making actual calls:

```bash
python3 deploy_travelbucks.py --dry-run
```

This will:
- Show which leads would be called
- Display the dynamic variables that would be passed
- NOT make actual calls or charge your account

---

## 📞 Making Calls

### Run with Caspio Integration

```bash
python3 deploy_travelbucks.py
```

### Run without Caspio (Mock Data)

If you don't set Caspio credentials, it uses mock data:

```bash
python3 deploy_travelbucks.py
```

### Limit Number of Calls

```bash
python3 deploy_travelbucks.py --max-calls 5
```

---

## 📊 What Happens During Each Call

### 1. Call Initiation

```json
{
  "from_number": "+14155551234",
  "to_number": "+15551234567",
  "agent_id": "agent_0562fddc61ca674411c34cd69a",
  "dynamic_variables": {
    "client_id": "tb263421",
    "customer_name": "John Smith",
    "customer_email": "john@example.com"
  }
}
```

### 2. Brianna Greets the Lead

"Hi! This is Brianna from TravelBucks - do I have a minute of your time?"

### 3. Call Flow

- **Interested** → Lead Qualification → Offer → Payment
- **Not interested** → Polite decline → End

### 4. Post-Call Analytics

Retell AI captures:
- `client_id` (tb263421)
- `payment_collected` (true/false)
- `payment_amount` (199)
- `lead_qualified` (true/false)
- `call_outcome` (payment_success, declined_offer, etc.)
- `customer_email`
- `travel_frequency`

### 5. Caspio Update

After call:
```json
{
  "LastCallDate": "2025-12-26T10:30:00",
  "LastCallID": "call_abc123",
  "Status": "callback_in_progress"
}
```

---

## 🔧 Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RETELL_API_KEY` | (required) | Your Retell AI API key |
| `RETELL_PHONE_NUMBER` | (required) | Your Retell phone number |
| `CASPIO_ACCOUNT_ID` | "" | Caspio account ID |
| `CASPIO_CLIENT_ID` | "" | Caspio OAuth client ID |
| `CASPIO_CLIENT_SECRET` | "" | Caspio OAuth client secret |
| `CASPIO_TABLE_NAME` | "TravelBucks_Leads" | Caspio table name |
| `MAX_CALLS_PER_BATCH` | 10 | Max calls per execution |
| `DELAY_BETWEEN_CALLS` | 5 | Seconds between calls |

---

## 📱 Manual Call via API

To make a single call manually:

```bash
curl -X POST "https://api.retellai.com/create-phone-call" \
  -H "Authorization: Bearer ***REMOVED***" \
  -H "Content-Type: application/json" \
  -d '{
    "from_number": "+14155551234",
    "to_number": "+15551234567",
    "agent_id": "agent_0562fddc61ca674411c34cd69a",
    "dynamic_variables": {
      "client_id": "tb263421",
      "customer_name": "John Smith",
      "customer_email": "john@example.com"
    }
  }'
```

---

## 🔍 Monitoring Calls

### View Call Logs

https://dashboard.retellai.com/calls

### Get Call Details via API

```bash
curl -X GET "https://api.retellai.com/get-call/{call_id}" \
  -H "Authorization: Bearer ***REMOVED***"
```

---

## 🎛️ Agent Configuration

- **Flow ID**: `conversation_flow_c157876f8d0f`
- **Agent ID**: `agent_0562fddc61ca674411c34cd69a`
- **Voice**: 11labs-Cimo (female, warm, energetic)
- **Model**: GPT-4.1 (cascading mode)
- **Ambient Sound**: Call center (0.8 volume)

---

## 🐛 Troubleshooting

### "RETELL_PHONE_NUMBER not set"

```bash
export RETELL_PHONE_NUMBER="+14155551234"
```

### "Invalid phone number"

Phone numbers must be in E.164 format: `+1XXXXXXXXXX`

### "Tool id does not exist: tool-authorize-payment"

The payment webhook is configured but not yet created. You'll need to set up:
- `https://travelbucks-voice-ops-production.up.railway.app/webhooks/authorize-payment`
- `https://travelbucks-voice-ops-production.up.railway.app/webhooks/caspio-lead-update`

### "Caspio authentication failed"

Check your:
- `CASPIO_ACCOUNT_ID`
- `CASPIO_CLIENT_ID`
- `CASPIO_CLIENT_SECRET`

---

## 🔄 Automation (Optional)

### Run Every Hour with Cron

```bash
# Edit crontab
crontab -e

# Add this line (runs every hour)
0 * * * * cd /path/to/project && python3 deploy_travelbucks.py >> logs/calls.log 2>&1
```

### Run on Railway/Heroku

Deploy as a scheduled worker:

**Procfile**:
```
worker: python3 deploy_travelbucks.py
```

**railway.json**:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python3 deploy_travelbucks.py",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

## 📞 Support

- Retell AI Docs: https://docs.retellai.com
- Caspio API Docs: https://howto.caspio.com/web-services-api/
- TravelBucks Agent Dashboard: https://dashboard.retellai.com/agents

---

**Ready to start converting leads!** 🚀
