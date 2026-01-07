# Railway Environment Variables Setup

Copy these exact values into your Railway dashboard.

**Go to:** https://railway.app/dashboard → Your Project → Variables tab

---

## Required Variables

Add each of these by clicking "New Variable":

### 1. USE_MOCK_DATA
```
false
```

### 2. NODE_ENV
```
production
```

### 3. PORT
```
3000
```

### 4. CASPIO_ACCOUNT_ID
```
***REMOVED***
```

### 5. CASPIO_BASE_URL
```
https://***REMOVED***.caspio.com
```

### 6. CASPIO_TOKEN_URL
```
https://***REMOVED***.caspio.com/oauth/token
```

### 7. CASPIO_CLIENT_ID
```
***REMOVED***
```

### 8. CASPIO_CLIENT_SECRET
```
***REMOVED***
```

### 9. CASPIO_TABLE_RIMS
```
RIMS_DATA
```

### 10. CASPIO_TABLE_KB
```
Knowledge_Base
```

### 11. CASPIO_TABLE_MEMOS
```
RIMS_MEMOS
```

---

## How to Add Variables in Railway Dashboard

1. Go to https://railway.app/dashboard
2. Click on your project (web-production-4080)
3. Click the **"Variables"** tab
4. For each variable above:
   - Click **"New Variable"** button
   - Enter the **Name** (e.g., `USE_MOCK_DATA`)
   - Enter the **Value** (e.g., `false`)
   - Press Enter or click outside to save
5. After adding all variables, Railway will automatically redeploy

---

## Verify Deployment

After Railway finishes redeploying (about 1-2 minutes), test:

```bash
curl https://web-production-4080.up.railway.app/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "mode": "production",
  "database": "caspio_connected",
  "timestamp": "2025-12-17T..."
}
```

---

## Summary

✅ **Total Variables:** 11
✅ **Database:** Caspio (RIMS_DATA)
✅ **Mode:** Production (USE_MOCK_DATA=false)
✅ **Tables:** RIMS_DATA, Knowledge_Base, RIMS_MEMOS

After adding these, your RIMS API will connect to your real Caspio database!
