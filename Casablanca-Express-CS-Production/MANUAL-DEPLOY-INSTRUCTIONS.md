# Manual Deployment Instructions

Since git remote is not configured, follow these manual steps:

## 🔑 Step 1: Set RETELL_API_KEY in Railway

### Option A: Railway Dashboard (Easiest)

1. Go to **https://railway.app/dashboard**
2. Select your project (the one running the RIMS API)
3. Click on the **Service** (should be the API service)
4. Go to the **Variables** tab
5. Click **+ New Variable**
6. Add:
   - **Variable**: `RETELL_API_KEY`
   - **Value**: `***REMOVED***`
7. Click **Add**

Railway will automatically redeploy with the new variable.

### Option B: Railway CLI (If you have it linked)

```bash
cd /Users/nickmac/VSC-Claude-User-Data/Integration-Implementation/integration-implementation

# Link to your Railway project first
railway link

# Then set the variable
railway variables --set "RETELL_API_KEY=***REMOVED***"
```

---

## 📤 Step 2: Deploy Updated Code

### Option A: Upload File Directly to Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Settings** → **Builds**
4. Click **Manual Deploy**
5. Upload the updated `rims-api-caspio.js` file from:
   `/Users/nickmac/VSC-Claude-User-Data/Integration-Implementation/integration-implementation/rims-api-caspio.js`

### Option B: Connect GitHub Repository

If this project has a GitHub repo:

1. Go to Railway project → **Settings** → **Service**
2. Connect your GitHub repository
3. Push your local changes:
   ```bash
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

Railway will auto-deploy on push.

### Option C: Use Railway CLI

```bash
cd /Users/nickmac/VSC-Claude-User-Data/Integration-Implementation/integration-implementation

# Login and link (if not already)
railway login
railway link

# Deploy
railway up
```

---

## ✅ Step 3: Verify Deployment

Wait 30-60 seconds for Railway to redeploy, then test:

```bash
# Test health endpoint
curl "https://web-production-4080.up.railway.app/health"

# Should show:
# {
#   "status": "healthy",
#   "mode": "production",
#   "database": "caspio",
#   ...
# }
```

---

## 🧪 Step 4: Test Retell Integration

### Get a Test Call ID

1. Go to https://app.retellai.com
2. Navigate to **Call History**
3. Click on any recent call
4. Copy the **Call ID** (e.g., `call_abc123...`)

### Test Single Call Import

```bash
curl -X POST "https://web-production-4080.up.railway.app/api/memos/from-retell-call" \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "YOUR_CALL_ID_HERE",
    "include_transcript": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Memo created successfully from Retell call",
  "memo_id": 1234567890,
  "customer_found": true,
  ...
}
```

### Test Batch Import (Last 24 Hours)

```bash
START=$(date -u -d '24 hours ago' +%s)000

curl -X POST "https://web-production-4080.up.railway.app/api/memos/batch-from-retell" \
  -H "Content-Type: application/json" \
  -d "{
    \"agent_id\": \"***REMOVED***\",
    \"start_timestamp\": ${START},
    \"limit\": 50
  }"
```

---

## 🔗 Step 5: Set Up Webhook in Retell AI

1. Go to **https://app.retellai.com**
2. Navigate to **Settings** → **Webhooks**
3. Click **Add Webhook**
4. Configure:
   - **Name**: Caspio Memo Logger
   - **URL**: `https://web-production-4080.up.railway.app/api/memos/from-retell-call`
   - **Event**: `call.ended`
   - **Method**: `POST`

5. **Payload Template**:
   ```json
   {
     "call_id": "{{call_id}}",
     "include_transcript": true
   }
   ```

6. Click **Save**

---

## 📊 Step 6: Verify Memos in Caspio

1. Login to **https://***REMOVED***.caspio.com**
2. Go to **Tables** → **RIMS_MEMOS**
3. Look for memos with:
   - `created_by` = "AI Agent (Retell Call ...)"
   - Recent `created_date`

---

## ⏰ Optional: Set Up Daily Batch Import

Add to crontab:
```bash
crontab -e

# Add this line (runs at 1 AM daily):
0 1 * * * /Users/nickmac/VSC-Claude-User-Data/Casablanca-Express-CS-Production/daily-retell-import.sh
```

---

## 🚨 Troubleshooting

### Railway Logs
```bash
# View deployment logs
railway logs --follow
```

Or view in Railway Dashboard: Project → Service → **Deployments**

### API Not Responding

1. Check Railway service is running (Dashboard)
2. Verify RETELL_API_KEY is set (Variables tab)
3. Check deployment logs for errors

### Memo Not Creating

1. Verify RETELL_API_KEY is correct
2. Check call_id exists in Retell
3. View Railway logs for error details

---

## 📚 Documentation

- [RETELL-MEMO-QUICK-START.md](RETELL-MEMO-QUICK-START.md) - Quick reference
- [RETELL-MEMO-INTEGRATION.md](RETELL-MEMO-INTEGRATION.md) - Complete API docs
- [DEPLOY-RETELL-MEMO-INTEGRATION.md](DEPLOY-RETELL-MEMO-INTEGRATION.md) - Full deployment guide

---

**Your API Key**: `***REMOVED***`

**Next Step**: Go to Railway Dashboard and set the RETELL_API_KEY variable!
