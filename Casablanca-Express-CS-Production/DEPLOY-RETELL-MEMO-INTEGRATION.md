# Deploy Retell Memo Integration - Complete Guide

Step-by-step guide to deploy the Retell AI call history to Caspio memo integration.

---

## 📋 Deployment Checklist

- [ ] Deploy updated API to Railway
- [ ] Set RETELL_API_KEY environment variable
- [ ] Test single call import
- [ ] Test batch import
- [ ] Set up Retell webhook (optional)
- [ ] Set up daily cron job (optional)

---

## 🚀 Step 1: Deploy to Railway

### Option A: Git Push (If Railway is connected to GitHub)

```bash
cd /Users/nickmac/VSC-Claude-User-Data/Integration-Implementation/integration-implementation

# Check git status
git status

# Add changes
git add rims-api-caspio.js

# Commit
git commit -m "Add Retell AI call history to Caspio memo integration

- Add POST /api/memos/from-retell-call endpoint
- Add POST /api/memos/batch-from-retell endpoint
- Add Retell API client functions
- Auto-categorize memos by sentiment
- Include call transcript, summary, and analysis data"

# Push to trigger Railway deployment
git push
```

Railway will automatically detect the push and deploy.

### Option B: Manual Railway CLI Deploy

```bash
cd /Users/nickmac/VSC-Claude-User-Data/Integration-Implementation/integration-implementation

# Login to Railway (if needed)
railway login

# Link to project (if needed)
railway link

# Deploy
railway up
```

---

## 🔑 Step 2: Set RETELL_API_KEY

### Get Your Retell API Key

1. Go to [Retell AI Dashboard](https://app.retellai.com)
2. Navigate to **Settings** → **API Keys**
3. Copy your API key (starts with `key_`)

### Set Environment Variable in Railway

```bash
railway variables set RETELL_API_KEY="key_YOUR_RETELL_API_KEY_HERE"
```

Or via Railway Dashboard:
1. Go to your project in Railway
2. Click **Variables** tab
3. Add new variable:
   - Name: `RETELL_API_KEY`
   - Value: `key_YOUR_RETELL_API_KEY_HERE`
4. Click **Add**

Railway will automatically restart the service with the new variable.

---

## ✅ Step 3: Verify Deployment

### Check Health Endpoint

```bash
curl "https://web-production-4080.up.railway.app/health"
```

**Expected Response**:
```json
{
  "status": "healthy",
  "mode": "production",
  "database": "caspio",
  "account": "***REMOVED***",
  "timestamp": "2025-12-25T12:00:00.000Z"
}
```

### Check Server Logs

```bash
railway logs
```

Look for:
```
📚 RIMS API Endpoints:
   POST /api/memos/from-retell-call ⭐ NEW - Create memo from Retell call!
   POST /api/memos/batch-from-retell ⭐ NEW - Batch import Retell calls!
```

---

## 🧪 Step 4: Test the Endpoints

### Get a Test Call ID

1. Go to [Retell AI Dashboard](https://app.retellai.com)
2. Navigate to **Call History**
3. Click on any recent call
4. Copy the **Call ID** (e.g., `call_a1b2c3d4e5f6`)

### Test Single Call Import

```bash
curl -X POST "https://web-production-4080.up.railway.app/api/memos/from-retell-call" \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "call_YOUR_CALL_ID_HERE",
    "include_transcript": true
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Memo created successfully from Retell call",
  "memo_id": 1234567890,
  "call_id": "call_YOUR_CALL_ID_HERE",
  "customer_found": true,
  "customer_info": {
    "vac_id": "123456",
    "name": "John Doe",
    "phone": "8182121359"
  },
  "memo": {
    "memo_type": "AI Call Log",
    "vac_id": "123456",
    "created_date": "2025-12-25",
    "call_duration_seconds": 120,
    "call_sentiment": "Positive",
    "call_successful": true
  }
}
```

### Test Batch Import (Last 24 Hours)

```bash
# Get timestamp for 24 hours ago
START_TIMESTAMP=$(date -u -d '24 hours ago' +%s)000

curl -X POST "https://web-production-4080.up.railway.app/api/memos/batch-from-retell" \
  -H "Content-Type: application/json" \
  -d "{
    \"agent_id\": \"***REMOVED***\",
    \"start_timestamp\": ${START_TIMESTAMP},
    \"limit\": 50
  }"
```

### Use the Test Script

```bash
cd /Users/nickmac/VSC-Claude-User-Data/Casablanca-Express-CS-Production

./test-retell-memo.sh \
  https://web-production-4080.up.railway.app \
  call_YOUR_CALL_ID_HERE
```

---

## 🔗 Step 5: Set Up Retell Webhook (Automatic Logging)

### Create Webhook in Retell AI

1. Go to [Retell AI Dashboard](https://app.retellai.com)
2. Navigate to **Settings** → **Webhooks**
3. Click **Add Webhook**

### Webhook Configuration

**Webhook URL**:
```
https://web-production-4080.up.railway.app/api/memos/from-retell-call
```

**Event Type**: Select `call.ended`

**Request Method**: `POST`

**Headers** (optional):
```
Content-Type: application/json
```

**Payload Template**:
```json
{
  "call_id": "{{call_id}}",
  "include_transcript": true
}
```

### Test the Webhook

1. Make a test call to your Retell agent
2. Wait for the call to end
3. Check Railway logs for webhook processing
4. Verify memo created in Caspio

---

## ⏰ Step 6: Set Up Daily Batch Import (Cron Job)

### Create Cron Script

Create file: `/Users/nickmac/VSC-Claude-User-Data/Casablanca-Express-CS-Production/daily-retell-import.sh`

```bash
#!/bin/bash

# Daily Retell AI Call Import to Caspio
# Runs at 1:00 AM daily

LOG_FILE="/var/log/retell-import.log"
API_URL="https://web-production-4080.up.railway.app"
AGENT_ID="***REMOVED***"

# Get timestamp for 24 hours ago (in milliseconds)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    START_TIMESTAMP=$(date -u -v-24H +%s)000
else
    # Linux
    START_TIMESTAMP=$(date -u -d '24 hours ago' +%s)000
fi

echo "========================================" | tee -a "$LOG_FILE"
echo "Retell Import - $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# Make API request
RESPONSE=$(curl -s -X POST "${API_URL}/api/memos/batch-from-retell" \
  -H "Content-Type: application/json" \
  -d "{
    \"agent_id\": \"${AGENT_ID}\",
    \"start_timestamp\": ${START_TIMESTAMP},
    \"limit\": 100
  }")

# Log response
echo "$RESPONSE" | tee -a "$LOG_FILE"

# Extract summary
TOTAL=$(echo "$RESPONSE" | grep -o '"total_calls":[0-9]*' | cut -d':' -f2)
CREATED=$(echo "$RESPONSE" | grep -o '"memos_created":[0-9]*' | cut -d':' -f2)
FAILED=$(echo "$RESPONSE" | grep -o '"memos_failed":[0-9]*' | cut -d':' -f2)

echo "Summary: $TOTAL calls, $CREATED memos created, $FAILED failed" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
```

### Make Script Executable

```bash
chmod +x /Users/nickmac/VSC-Claude-User-Data/Casablanca-Express-CS-Production/daily-retell-import.sh
```

### Add to Crontab

```bash
# Edit crontab
crontab -e

# Add this line (runs at 1:00 AM daily)
0 1 * * * /Users/nickmac/VSC-Claude-User-Data/Casablanca-Express-CS-Production/daily-retell-import.sh
```

### Test the Cron Script

```bash
/Users/nickmac/VSC-Claude-User-Data/Casablanca-Express-CS-Production/daily-retell-import.sh
```

---

## 📊 Step 7: Monitor and Verify

### Check Caspio for New Memos

1. Log into [Caspio Bridge](https://***REMOVED***.caspio.com)
2. Navigate to **Tables** → **RIMS_MEMOS**
3. Look for memos with `created_by` = "AI Agent (Retell Call ...)"

### View Sample Memo

**Query**:
```sql
SELECT * FROM RIMS_MEMOS
WHERE created_by LIKE 'AI Agent%'
ORDER BY created_date DESC
LIMIT 10
```

### Monitor Railway Logs

```bash
railway logs --follow
```

Look for:
```
📞 Fetching call call_abc123 from Retell AI...
✅ Memo created successfully
```

---

## 🎯 Advanced Configuration

### Filter by Specific Agent Only

Update webhook or cron to only process specific agent:

```json
{
  "agent_id": "***REMOVED***",
  "call_id": "{{call_id}}",
  "include_transcript": true
}
```

### Exclude Transcripts (Smaller Memos)

```json
{
  "call_id": "{{call_id}}",
  "include_transcript": false
}
```

### Custom Memo Types

```json
{
  "call_id": "{{call_id}}",
  "memo_type": "Customer Service Call",
  "include_transcript": true
}
```

---

## 🚨 Troubleshooting

### Error: "RETELL_API_KEY not configured"

**Solution**: Set the environment variable in Railway
```bash
railway variables set RETELL_API_KEY="key_YOUR_KEY"
```

### Error: "Failed to fetch call"

**Possible Causes**:
- Invalid call_id
- Call doesn't exist in Retell
- API key doesn't have permission

**Solution**: Verify call_id in Retell dashboard

### Error: "Customer not found"

**Not Actually an Error**: Memo is still created with `vac_id: "UNKNOWN"`

**To Fix**: Update customer phone number in RIMS_DATA to match caller

### Webhook Not Triggering

**Checklist**:
- [ ] Webhook URL is correct
- [ ] Event type is `call.ended`
- [ ] Webhook is enabled in Retell
- [ ] Check Railway logs for incoming requests

---

## 📈 Usage Statistics

### Get Call Import Stats (SQL)

```sql
-- Count memos by type
SELECT
  memo_type,
  COUNT(*) as count
FROM RIMS_MEMOS
WHERE created_by LIKE 'AI Agent%'
GROUP BY memo_type;

-- Recent imports
SELECT
  created_date,
  COUNT(*) as daily_count
FROM RIMS_MEMOS
WHERE created_by LIKE 'AI Agent%'
GROUP BY created_date
ORDER BY created_date DESC
LIMIT 30;

-- Customer match rate
SELECT
  CASE
    WHEN vac_id = 'UNKNOWN' THEN 'Not Matched'
    ELSE 'Matched'
  END as match_status,
  COUNT(*) as count
FROM RIMS_MEMOS
WHERE created_by LIKE 'AI Agent%'
GROUP BY match_status;
```

---

## ✅ Deployment Complete!

You now have:
- ✅ Retell memo endpoints deployed
- ✅ RETELL_API_KEY configured
- ✅ Automatic call logging (webhook)
- ✅ Daily batch import (cron)
- ✅ Customer matching by phone
- ✅ Sentiment-based categorization

**All customer interactions are now automatically logged in Caspio!** 🎉

---

## 📚 Related Documentation

- [RETELL-MEMO-INTEGRATION.md](RETELL-MEMO-INTEGRATION.md) - API Reference
- [test-retell-memo.sh](test-retell-memo.sh) - Test Script
- [CUSTOMER-STATUS-API-GUIDE.md](../CBE-Discovery-Phase/CUSTOMER-STATUS-API-GUIDE.md) - Customer Status Endpoint
