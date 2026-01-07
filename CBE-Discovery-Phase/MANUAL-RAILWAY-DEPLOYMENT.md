# Manual Railway Deployment - Customer Status Endpoint

## 🎯 Quick Deploy via Railway Dashboard

The customer status endpoint code is ready and committed. Deploy it through Railway's web dashboard:

---

## ✅ Step-by-Step Instructions

### Step 1: Open Railway Dashboard

Go to: https://railway.app/dashboard

Login as: `nick@casablancaexpress.com`

### Step 2: Find the RIMS API Project

Look for the project named: **"RIMS API Project"**

- This is the project with domain: `web-production-4080.up.railway.app`
- **NOT** "travelbucks-voice-ops"
- **NOT** "retell-human-assistance"

### Step 3: Open the Service

1. Click on **"RIMS API Project"**
2. You should see a service (web service)
3. Click on it

### Step 4: Trigger Deployment

**Option A - Redeploy Latest:**
1. Click **"Deployments"** tab
2. Find the latest deployment
3. Click the **"⋮"** (three dots) menu
4. Click **"Redeploy"**
5. Confirm

**Option B - Manual Deploy:**
1. Click **"Settings"** tab
2. Scroll to **"Source"**
3. Click **"Deploy Now"** or **"Redeploy"**

**Option C - GitHub Trigger (if connected):**
1. Go to **"Settings"** → **"Source"**
2. Check if connected to GitHub
3. If yes, just push code (already done!)
4. Railway auto-deploys

### Step 5: Wait for Deployment

- Watch the **"Deployments"** tab
- Status will show: Building → Deploying → Active
- Takes about 2-3 minutes

### Step 6: Verify Deployment

Once "Active", test the new endpoint:

```bash
curl "https://web-production-4080.up.railway.app/api/customer/status?phone=%2B18182121359"
```

**Expected**: JSON response with customer status

---

## ✅ What to Look For

### In Deployment Logs

After deployment starts, click on the deployment to see logs.

Look for this line in the startup output:
```
GET  /api/customer/status ⭐ NEW - Complete status from caller ID!
```

If you see that, the endpoint is deployed! ✅

### Test Commands

**1. Health Check:**
```bash
curl "https://web-production-4080.up.railway.app/health"
```
Should return: `{"status":"healthy","mode":"production"}`

**2. Customer Status (Known):**
```bash
curl "https://web-production-4080.up.railway.app/api/customer/status?phone=%2B18182121359"
```
Should return: Full customer status JSON

**3. Customer Status (Unknown):**
```bash
curl "https://web-production-4080.up.railway.app/api/customer/status?phone=%2B19999999999"
```
Should return: `{"found":false}`

---

## 🔧 Troubleshooting

### Issue: Can't find "RIMS API Project"

**Solution**: Look for the project with these clues:
- Domain contains: `web-production-4080`
- May be named differently (check all projects)
- Look in deployment logs for domain name

### Issue: Deployment fails

**Check**:
1. **Settings** → **Environment Variables**
2. Verify these are set:
   - `CASPIO_CLIENT_ID` (should be set)
   - `CASPIO_CLIENT_SECRET` (should be set)
   - `USE_MOCK_DATA=false` (for production Caspio data)
3. If missing, add them and redeploy

### Issue: Gets 404 on /api/customer/status

**Possible causes**:
1. Wrong Railway project deployed
2. Old code still running
3. Cache issue

**Fix**:
1. **Settings** → **Clear Cache**
2. **Redeploy**
3. Wait 3 minutes
4. Test again

### Issue: Returns "Cannot GET /api/customer/status"

**This means**: The old API version is still running

**Fix**:
1. Check **"Deployments"** tab
2. Make sure latest deployment is **Active**
3. If not, redeploy
4. Or: **Settings** → **Clear Build Cache** → **Redeploy**

---

## 📋 Deployment Checklist

After deploying, verify:

- [ ] Deployment status shows "Active" (green checkmark)
- [ ] Logs show: `GET /api/customer/status ⭐ NEW`
- [ ] Health check returns `status: healthy`
- [ ] Customer status endpoint returns JSON
- [ ] Test with known customer: +18182121359
- [ ] Test with unknown number: +19999999999

---

## 🎯 After Successful Deployment

Once the endpoint is live and tested:

1. ✅ Add tool to Retell AI
   Use: [customer-status-tool-config.json](customer-status-tool-config.json)

2. ✅ Update agent `***REMOVED***`
   Follow: [CALLER-ID-LOOKUP-SETUP.md](CALLER-ID-LOOKUP-SETUP.md)

3. ✅ Test with real calls
   Call from: +18182121359

---

## 📞 Current Status

**Code**: ✅ Ready (committed to git)
**Railway Project**: "RIMS API Project"
**Target URL**: `web-production-4080.up.railway.app`
**Deployment**: ⏳ **YOU ARE HERE** - Deploy via dashboard above

---

## 🚨 If You Get Stuck

The code is ready in:
```
/Users/nickmac/VSC-Claude-User-Data/Integration-Implementation/integration-implementation/rims-api-caspio.js
```

Lines 1105-1304 contain the customer status endpoint.

All documentation is in:
```
/Users/nickmac/VSC-Claude-User-Data/CBE-Discovery-Phase/
```

Files:
- CUSTOMER-STATUS-API-GUIDE.md
- customer-status-tool-config.json
- CALLER-ID-LOOKUP-SETUP.md

---

**Just deploy via the Railway dashboard and you're done!** 🚀
