# Deploy Customer Status Endpoint to Railway

## 🎯 Summary

The **comprehensive customer status endpoint** has been coded and tested locally. It needs to be deployed to the correct Railway project.

**Endpoint**: `GET /api/customer/status?phone={{call.from_number}}`
**File**: `Integration-Implementation/integration-implementation/rims-api-caspio.js`
**Lines**: 1105-1304

---

## ✅ What's Already Done

1. ✅ Customer status endpoint coded
2. ✅ Local testing completed
3. ✅ Tool configuration created ([customer-status-tool-config.json](customer-status-tool-config.json))
4. ✅ Complete documentation ([CUSTOMER-STATUS-API-GUIDE.md](CUSTOMER-STATUS-API-GUIDE.md))
5. ✅ Code committed to git

---

## 🚀 Deployment Steps

### Current Railway Services

| Service | URL | Purpose |
|---------|-----|---------|
| **RIMS API Project** | `web-production-4080.up.railway.app` | ← DEPLOY HERE |
| travelbucks-voice-ops | `travelbucks-voice-ops-production.up.railway.app` | Different project |

### Option 1: Deploy via Railway Dashboard (Easiest)

1. Go to https://railway.app
2. Find project: **RIMS API Project**
3. Find service with domain: `web-production-4080.up.railway.app`
4. Click **"Deploy"** or **"Redeploy"**
5. Wait 2-3 minutes
6. Test: `curl "https://web-production-4080.up.railway.app/api/customer/status?phone=%2B18182121359"`

### Option 2: Deploy via Railway CLI

```bash
cd /Users/nickmac/VSC-Claude-User-Data/Integration-Implementation/integration-implementation

# Link to the correct Railway project
railway link
# Select: RIMS API Project (when prompted)

# Deploy
railway up
```

### Option 3: Deploy via GitHub (If Connected)

If the Railway project is connected to a GitHub repo:

```bash
cd /Users/nickmac/VSC-Claude-User-Data

# Add remote (if not already added)
git remote add origin YOUR_GITHUB_REPO_URL

# Push
git push origin main
```

Railway will auto-deploy.

---

## 🧪 Testing After Deployment

### Test 1: Health Check
```bash
curl "https://web-production-4080.up.railway.app/health"
```

**Expected**:
```json
{
  "status": "healthy",
  "mode": "production",
  "database": "caspio"
}
```

### Test 2: Customer Status (Known Customer)
```bash
curl "https://web-production-4080.up.railway.app/api/customer/status?phone=%2B18182121359"
```

**Expected**:
```json
{
  "found": true,
  "status": {
    "overall": "deposits_complete" | "deposits_incomplete" | "ready_to_travel",
    "agent_message": "Great news! Your deposits are complete...",
    "recommended_action": "transfer_to_scheduling" | "collect_payment" | "verify_itinerary"
  },
  "customer": {
    "customer_id": 155002,
    "certificate_number": "ECFWIN",
    ...
  },
  "deposits": {
    "status": "complete" | "partial" | "none",
    "total_paid": 0,
    "expected_deposit": 500,
    "remaining": 0
  },
  ...
}
```

### Test 3: Customer Status (Unknown Number)
```bash
curl "https://web-production-4080.up.railway.app/api/customer/status?phone=%2B19999999999"
```

**Expected**:
```json
{
  "found": false,
  "message": "Customer not found in RIMS database",
  "status": {
    "overall": "unknown",
    "category": "new_caller"
  }
}
```

---

## 📋 Verification Checklist

After deploying, verify:

- [ ] `/health` endpoint returns `"status": "healthy"`
- [ ] `/api/customer/status` with known number returns customer data
- [ ] `/api/customer/status` with unknown number returns `found: false`
- [ ] Logs show: `GET /api/customer/status ⭐ NEW - Complete status from caller ID!`
- [ ] Response includes `agent_message` with pre-written greeting
- [ ] Response includes all sections: customer, deposits, travel_rep, booking

---

## 🔧 Troubleshooting

### Issue: "Cannot GET /api/customer/status"

**Cause**: Endpoint not deployed yet or wrong Railway service

**Fix**:
1. Verify you're deploying to the RIMS API Project (not travelbucks-voice-ops)
2. Check Railway logs: `railway logs --tail 50`
3. Look for: `GET /api/customer/status ⭐ NEW`
4. If not there, redeploy

### Issue: Deployment shows old endpoints only

**Cause**: Deployment cache or using wrong file

**Fix**:
1. In Railway dashboard: **Settings** → **Clear Cache** → **Redeploy**
2. OR: Update `railway.json` to ensure `startCommand: "npm run start:caspio"`
3. Check that `rims-api-caspio.js` is the file being run

### Issue: Returns mock data instead of real Caspio data

**Cause**: `USE_MOCK_DATA` environment variable is `true`

**Fix**:
1. Railway Dashboard → Service → Variables
2. Set `USE_MOCK_DATA=false`
3. Redeploy

---

## 📁 Files Ready for Deployment

All these files are committed and ready:

| File | Purpose |
|------|---------|
| `rims-api-caspio.js` | Main API server with customer status endpoint |
| `railway.json` | Railway deployment config (uses start:caspio) |
| `package.json` | Dependencies and start scripts |
| `Procfile` | Backup deployment config |

---

## 🎯 After Successful Deployment

Once deployed and tested, you can:

1. **Add tool to Retell AI** using [customer-status-tool-config.json](customer-status-tool-config.json)
2. **Update agent** `***REMOVED***` with the tool
3. **Follow setup guide** in [CALLER-ID-LOOKUP-SETUP.md](CALLER-ID-LOOKUP-SETUP.md)
4. **Test with real calls** from known customer numbers

---

## 📞 Support

**Current API URL**: https://web-production-4080.up.railway.app

**Test Command**:
```bash
curl "https://web-production-4080.up.railway.app/api/customer/status?phone=%2B18182121359"
```

**Documentation**:
- [CUSTOMER-STATUS-API-GUIDE.md](CUSTOMER-STATUS-API-GUIDE.md) - Complete API guide
- [customer-status-tool-config.json](customer-status-tool-config.json) - Retell tool config
- [CALLER-ID-LOOKUP-SETUP.md](CALLER-ID-LOOKUP-SETUP.md) - Setup instructions

---

**Ready to deploy!** Just follow Option 1, 2, or 3 above based on your Railway setup.
