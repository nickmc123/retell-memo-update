# Retell Memo Integration - Quick Start 🚀

**One-command deployment + automatic call logging**

---

## ⚡ Super Quick Deploy (2 Minutes)

```bash
cd /Users/nickmac/VSC-Claude-User-Data/Casablanca-Express-CS-Production

# Run automated deployment
./deploy-retell-memo.sh
```

This script will:
1. Deploy code to Railway
2. Set RETELL_API_KEY (you'll be prompted)
3. Test the deployment
4. Show you next steps

---

## 📝 Manual Deploy (If Script Fails)

### Step 1: Deploy
```bash
cd /Users/nickmac/VSC-Claude-User-Data/Integration-Implementation/integration-implementation
git add rims-api-caspio.js
git commit -m "Add Retell memo integration"
git push
```

### Step 2: Set API Key
```bash
railway variables set RETELL_API_KEY="key_YOUR_KEY"
```

### Step 3: Test
```bash
curl "https://web-production-4080.up.railway.app/health"
```

---

## 🎯 Quick Test

### Get a Call ID
1. Go to https://app.retellai.com
2. Click **Call History**
3. Copy any **call_id**

### Create Memo from Call
```bash
curl -X POST "https://web-production-4080.up.railway.app/api/memos/from-retell-call" \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "call_YOUR_CALL_ID",
    "include_transcript": true
  }'
```

### Batch Import Last 24 Hours
```bash
START=$(date -u -d '24 hours ago' +%s)000

curl -X POST "https://web-production-4080.up.railway.app/api/memos/batch-from-retell" \
  -H "Content-Type: application/json" \
  -d "{
    \"start_timestamp\": ${START},
    \"limit\": 100
  }"
```

---

## 🔗 Set Up Webhook (Automatic Logging)

### Option 1: Retell Dashboard (Recommended)
1. Go to https://app.retellai.com → **Settings** → **Webhooks**
2. Click **Add Webhook**
3. Fill in:
   - **URL**: `https://web-production-4080.up.railway.app/api/memos/from-retell-call`
   - **Event**: `call.ended`
   - **Method**: `POST`
4. **Payload Template**:
   ```json
   {
     "call_id": "{{call_id}}",
     "include_transcript": true
   }
   ```
5. Click **Save**

### Option 2: Use Config File
Import [retell-webhook-config.json](retell-webhook-config.json) in Retell dashboard

---

## ⏰ Set Up Daily Import (Cron)

```bash
# Make script executable (already done)
chmod +x /Users/nickmac/VSC-Claude-User-Data/Casablanca-Express-CS-Production/daily-retell-import.sh

# Add to crontab
crontab -e

# Add this line (runs at 1 AM daily):
0 1 * * * /Users/nickmac/VSC-Claude-User-Data/Casablanca-Express-CS-Production/daily-retell-import.sh
```

---

## 📊 What Gets Logged

Every memo includes:

```
--- RETELL AI CALL SUMMARY ---
Call ID: call_abc123
Date: 2025-12-25
Duration: 180 seconds
From: +18182121359
Sentiment: Positive
Call Successful: Yes

--- SUMMARY ---
[AI-generated call summary]

--- CUSTOM ANALYSIS ---
[Post-call analysis fields]

--- TRANSCRIPT ---
[Full conversation]
```

**Stored in Caspio**: `RIMS_MEMOS` table

**Fields**:
- `vac_id`: Customer ID (auto-matched by phone) or "UNKNOWN"
- `memo_type`: Auto-categorized by sentiment
- `phone_number`: Caller's phone
- `created_by`: "AI Agent (Retell Call ...)"
- `details`: Full memo text (above)

---

## 🔍 Check Results

### View in Caspio
1. Login: https://***REMOVED***.caspio.com
2. Go to **Tables** → **RIMS_MEMOS**
3. Filter: `created_by` LIKE "AI Agent%"

### Check Logs
```bash
railway logs --follow
```

### Query Stats (SQL)
```sql
-- Count by memo type
SELECT memo_type, COUNT(*)
FROM RIMS_MEMOS
WHERE created_by LIKE 'AI Agent%'
GROUP BY memo_type;

-- Customer match rate
SELECT
  CASE WHEN vac_id = 'UNKNOWN' THEN 'Not Matched' ELSE 'Matched' END,
  COUNT(*)
FROM RIMS_MEMOS
WHERE created_by LIKE 'AI Agent%'
GROUP BY 1;
```

---

## 🎛️ Configuration Options

### Exclude Transcript (Smaller Memos)
```json
{
  "call_id": "{{call_id}}",
  "include_transcript": false
}
```

### Custom Memo Type
```json
{
  "call_id": "{{call_id}}",
  "memo_type": "Customer Complaint",
  "include_transcript": true
}
```

### Filter by Agent (Batch Import)
```json
{
  "agent_id": "***REMOVED***",
  "start_timestamp": 1703548800000,
  "limit": 100
}
```

---

## 🚨 Troubleshooting

### "RETELL_API_KEY not configured"
```bash
railway variables set RETELL_API_KEY="key_YOUR_KEY"
```

### "Customer not found"
- Not an error! Memo created with `vac_id = "UNKNOWN"`
- Update phone in RIMS_DATA to match caller

### Webhook not firing
- Check webhook enabled in Retell
- Verify URL correct
- Check Railway logs: `railway logs`

### Test the integration
```bash
./test-retell-memo.sh \
  https://web-production-4080.up.railway.app \
  call_YOUR_CALL_ID
```

---

## 📚 Full Documentation

- **[RETELL-MEMO-INTEGRATION.md](RETELL-MEMO-INTEGRATION.md)** - Complete API reference
- **[DEPLOY-RETELL-MEMO-INTEGRATION.md](DEPLOY-RETELL-MEMO-INTEGRATION.md)** - Detailed deployment guide
- **[retell-webhook-config.json](retell-webhook-config.json)** - Webhook configuration template

---

## ✅ Quick Checklist

- [ ] Deploy code: `./deploy-retell-memo.sh`
- [ ] Set API key: `railway variables set RETELL_API_KEY="..."`
- [ ] Test single call import
- [ ] Test batch import
- [ ] Set up webhook in Retell (optional)
- [ ] Set up daily cron (optional)
- [ ] Verify memos in Caspio

---

## 🎯 Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/memos/from-retell-call` | POST | Import single call |
| `/api/memos/batch-from-retell` | POST | Import multiple calls |
| `/api/memos/:vac_id` | GET | Get customer memos |
| `/health` | GET | Check API status |

---

**That's it! All customer interactions automatically logged in Caspio.** 🎉
