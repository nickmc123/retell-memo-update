# Railway Deployment Guide - RIMS API

## 🚀 Quick Deploy (5 minutes)

### Step 1: Sign Up for Railway

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign in with GitHub (recommended) or email

---

### Step 2: Deploy from Local Files

#### Option A: GitHub (Recommended - Easier Updates)

1. **Create a GitHub repository:**
   ```bash
   cd /Users/nickmac/Downloads/conversational-flow-builder/integration-implementation
   git init
   git add .
   git commit -m "Initial commit - RIMS API"
   ```

2. **Push to GitHub:**
   - Go to github.com
   - Create new repository: `casablanca-rims-api`
   - Follow instructions to push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/casablanca-rims-api.git
   git branch -M main
   git push -u origin main
   ```

3. **Deploy on Railway:**
   - Railway Dashboard → "New Project"
   - "Deploy from GitHub repo"
   - Select `casablanca-rims-api`
   - Railway auto-detects Node.js and deploys

#### Option B: Railway CLI (Faster, No GitHub Needed)

1. **Install Railway CLI:**
   ```bash
   brew install railway
   ```

2. **Login:**
   ```bash
   railway login
   ```
   (Opens browser for authentication)

3. **Deploy:**
   ```bash
   cd /Users/nickmac/Downloads/conversational-flow-builder/integration-implementation
   railway init
   railway up
   ```

---

### Step 3: Set Environment Variables

In Railway Dashboard → Your Project → Variables tab:

```bash
CASPIO_CLIENT_ID=***REMOVED***
CASPIO_CLIENT_SECRET=***REMOVED***
CASPIO_ACCOUNT_ID=***REMOVED***
CASPIO_BASE_URL=https://***REMOVED***.caspio.com
CASPIO_TOKEN_URL=https://***REMOVED***.caspio.com/oauth/token
USE_MOCK_DATA=false
NODE_ENV=production
PORT=3000
CASPIO_TABLE_RIMS=RIMS_DATA
CASPIO_TABLE_KB=Knowledge_Base
CASPIO_TABLE_MEMOS=RIMS_MEMOS
```

Click "Add Variable" for each one, or use bulk import.

---

### Step 4: Get Your Railway URL

After deployment completes:

1. Railway Dashboard → Settings → Domains
2. Click "Generate Domain"
3. You'll get a URL like:
   ```
   https://casablanca-rims-api-production.up.railway.app
   ```

---

### Step 5: Test Your Deployment

```bash
# Test health endpoint
curl https://YOUR-RAILWAY-URL.railway.app/health

# Expected response:
# {
#   "status": "healthy",
#   "mode": "production",
#   "database": "caspio",
#   "account": "***REMOVED***"
# }

# Test phone lookup
curl -X POST https://YOUR-RAILWAY-URL.railway.app/api/rims/phone-lookup \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "8182121359"}'
```

---

### Step 6: Create Retell AI Tools

I'll help you create the tools automatically. Just provide your Railway URL.

---

## 💰 Cost

**Railway Hobby Plan:**
- $5/month flat rate
- Includes 500 execution hours (more than enough)
- Unlimited bandwidth (fair use)

**Usage with 250 calls/day:**
- API requests: ~30,000/month
- Execution time: ~50 hours/month
- Cost: **$5/month fixed**

---

## 🔧 Troubleshooting

### Deployment Fails

**Check logs:**
```bash
railway logs
```

**Common issues:**
- Missing `package.json` dependencies → Run `npm install` locally first
- Port binding error → Railway sets PORT automatically (already configured)
- Environment variables not set → Double-check Variables tab

### Health Check Returns 500

**Possible causes:**
1. Caspio credentials incorrect → Verify in Variables tab
2. OAuth token expired → Should auto-refresh (check logs)
3. Caspio API down → Check Caspio status

**Fix:**
```bash
railway logs --tail
```
Look for "Caspio OAuth error" or "Authentication failed"

### API Returns Wrong Data

**Check environment:**
```bash
curl https://YOUR-URL.railway.app/health
```

If shows `"mode": "mock"`, your `USE_MOCK_DATA` is still true. Fix in Variables tab.

---

## 🚀 Next Steps After Deployment

1. ✅ Get Railway URL
2. ✅ Test all endpoints
3. ✅ Create 5 Retell AI tools (I'll help)
4. ✅ Update your test_caspio_rims_fieldsTest agent
5. ✅ Test with live calls
6. ✅ Monitor Railway logs

---

## 📊 Monitoring

**Railway Dashboard → Metrics:**
- CPU usage
- Memory usage
- Request count
- Response times

**Set up alerts:**
- Dashboard → Settings → Notifications
- Get notified if app crashes

---

## 🔄 Updates

**After deployment, to update code:**

**If using GitHub:**
```bash
git add .
git commit -m "Update: added new feature"
git push
```
Railway auto-deploys on push.

**If using Railway CLI:**
```bash
railway up
```

---

## ✅ Deployment Checklist

Before going live:

- [ ] Railway account created
- [ ] Project deployed
- [ ] All environment variables set
- [ ] Health check returns `"status": "healthy"`
- [ ] Phone lookup returns real Caspio data
- [ ] Railway URL noted
- [ ] Retell AI tools created (next step)
- [ ] Agent updated with new tools
- [ ] Test call made successfully

---

**Ready? Let's deploy!**

**Choose your method:**
- **Option A (GitHub)**: Better for team collaboration
- **Option B (CLI)**: Faster, no GitHub needed

Which would you like to use?
