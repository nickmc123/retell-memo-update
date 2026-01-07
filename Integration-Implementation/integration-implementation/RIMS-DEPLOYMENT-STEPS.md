# RIMS API - Railway Deployment Guide

**Status:** Ready to Deploy
**Time Required:** 15-20 minutes
**Cost:** ~$5-10/month

---

## Prerequisites Checklist

Before you begin, ensure you have:

- [x] Railway CLI installed (`/usr/local/bin/railway`)
- [x] RIMS API tested locally (17/17 tests passing ✅)
- [x] Railway.json configured for RIMS
- [ ] Railway account (sign up at https://railway.app if needed)
- [ ] PostgreSQL database credentials (RIMS production database)

---

## Step 1: Login to Railway

Open your terminal and run:

```bash
cd /Users/nickmac/Downloads/conversational-flow-builder/integration-implementation

railway login
```

This will open your browser for authentication. Complete the login process.

**Verify login:**
```bash
railway whoami
```

You should see your Railway username.

---

## Step 2: Create a New Railway Project

```bash
# Initialize Railway project
railway init

# When prompted:
# - Project name: "casablanca-rims-api" (or your preferred name)
# - Select: "Create a new project"
```

**Verify project creation:**
```bash
railway status
```

---

## Step 3: Add PostgreSQL Database (Optional)

If you need Railway to host your database:

```bash
# Add PostgreSQL service
railway add --database postgresql

# Get the database URL
railway variables
```

**OR** if you have an existing RIMS database, skip this step and use your existing connection URL.

---

## Step 4: Configure Environment Variables

You need to set these environment variables in Railway:

### Option A: Set Variables via CLI

```bash
# Required: Database connection
railway variables set DATABASE_URL="postgresql://user:password@host:5432/rims_db"

# Required: Mock mode (set to false for production)
railway variables set USE_MOCK_DATA=false

# Required: Server configuration
railway variables set PORT=3000
railway variables set NODE_ENV=production

# Optional: API security
railway variables set CORS_ORIGIN="https://api.retellai.com"
```

### Option B: Set Variables via Dashboard

1. Go to https://railway.app/dashboard
2. Select your project
3. Click "Variables" tab
4. Add each variable:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@host:port/db` | Your RIMS database connection URL |
| `USE_MOCK_DATA` | `false` | Set to false for production, true for testing |
| `PORT` | `3000` | Server port (Railway will override if needed) |
| `NODE_ENV` | `production` | Environment mode |
| `CORS_ORIGIN` | `https://api.retellai.com` | Allowed CORS origins |

---

## Step 5: Deploy to Railway

```bash
# Deploy the RIMS API
railway up

# Railway will:
# 1. Build your Node.js application
# 2. Install dependencies (npm install)
# 3. Start the server (npm run start:rims)
# 4. Assign a public URL
```

**Watch the deployment:**
```bash
railway logs
```

Look for these success messages:
- ✅ `RIMS API Server starting...`
- ✅ `Server running on port 3000`
- ✅ `Mock mode: false` (if using production DB)

---

## Step 6: Get Your Public URL

```bash
# Generate a public domain
railway domain

# This will return a URL like:
# https://casablanca-rims-api-production.up.railway.app
```

**Save this URL** - you'll need it for Retell AI integration.

---

## Step 7: Verify Deployment

Test your deployed API:

```bash
# Replace with your actual Railway URL
export API_URL="https://your-railway-url.up.railway.app"

# Test health check
curl "$API_URL/health"
```

**Expected response:**
```json
{
  "status": "healthy",
  "mode": "production",
  "database": "connected",
  "timestamp": "2025-12-17T..."
}
```

**Test phone lookup (with real data):**
```bash
curl -X POST "$API_URL/api/rims/phone-lookup" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "YOUR_TEST_PHONE"}'
```

---

## Step 8: Test All Endpoints

Run the automated test suite against your production API:

```bash
# Update test script to use production URL
export RIMS_API_URL="$API_URL"

# Run tests (will need to adapt for production data)
npm run test:rims
```

**Manual endpoint tests:**

### 1. Health Check
```bash
curl "$API_URL/health"
```

### 2. Phone Lookup
```bash
curl -X POST "$API_URL/api/rims/phone-lookup" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "8182121359"}'
```

### 3. Certificate Lookup
```bash
curl -X POST "$API_URL/api/rims/certificate-lookup" \
  -H "Content-Type: application/json" \
  -d '{"certificate_number": "BEACH123"}'
```

### 4. Knowledge Base
```bash
curl "$API_URL/api/kb/package/BEACH"
```

### 5. Deposits Check
```bash
curl -X POST "$API_URL/api/logic/deposits-check" \
  -H "Content-Type: application/json" \
  -d '{"customer_data": {"vac_id": "123456", "pkg_code2": "BEACH123", "val_dep": 250, "conf_deposit": 500}}'
```

---

## Step 9: Monitor Deployment

### View Logs
```bash
# Real-time logs
railway logs --tail

# Filter for errors
railway logs | grep ERROR
```

### Check Metrics
```bash
# View deployment info
railway status

# Check build logs
railway logs --deployment
```

### Railway Dashboard
Visit https://railway.app/dashboard to see:
- Deployment status
- Resource usage (CPU, Memory)
- Request metrics
- Error logs

---

## Troubleshooting

### Issue: "Database connection failed"

**Check:**
```bash
# Verify DATABASE_URL is set correctly
railway variables | grep DATABASE_URL

# Test database connection
railway run psql $DATABASE_URL -c "SELECT 1;"
```

**Fix:**
```bash
# Update DATABASE_URL
railway variables set DATABASE_URL="postgresql://correct-url"

# Redeploy
railway up
```

### Issue: "Module not found" or build errors

**Check:**
```bash
# Verify all dependencies are in package.json
cat package.json

# Redeploy with fresh build
railway up --detach
```

### Issue: Health check returns 500 error

**Check logs:**
```bash
railway logs --tail
```

**Common causes:**
- Missing environment variables
- Database connection issues
- Port binding issues

**Fix:**
```bash
# Restart the service
railway restart

# Check variables are set
railway variables
```

### Issue: API returns "CORS error"

**Fix:**
```bash
# Update CORS_ORIGIN to include Retell AI
railway variables set CORS_ORIGIN="https://api.retellai.com,https://retellai.com"

# Restart
railway restart
```

---

## Environment Variables Reference

### Required Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/rims_db` | PostgreSQL connection string for RIMS database |
| `USE_MOCK_DATA` | `false` | Use real database (false) or mock data (true) |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port (Railway auto-assigns) |
| `NODE_ENV` | `production` | Environment mode |
| `CORS_ORIGIN` | `*` | Allowed CORS origins (comma-separated) |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |

---

## Next Steps After Deployment

Once your RIMS API is deployed and verified:

1. **Create Retell AI Tools** - Use your Railway URL to create the 5 custom tools
2. **Update Agent Flow** - Configure your Retell AI agent to use the new tools
3. **Test Integration** - Make test calls to verify end-to-end functionality
4. **Monitor Performance** - Track API response times and success rates

See [RIMS-API-GUIDE.md](./RIMS-API-GUIDE.md) for Retell AI integration instructions.

---

## Production Checklist

Before going live with production traffic:

- [ ] Health check returns `"mode": "production"`
- [ ] Database connection verified
- [ ] All 8 API endpoints tested successfully
- [ ] Logs show no errors
- [ ] Railway domain is active
- [ ] Environment variables configured correctly
- [ ] CORS allows Retell AI requests
- [ ] Production database has real customer data
- [ ] Backup of database created
- [ ] Monitoring/alerts configured

---

## Deployment Commands Quick Reference

```bash
# Login
railway login

# Initialize project
railway init

# Set variables
railway variables set KEY="value"

# Deploy
railway up

# Get URL
railway domain

# View logs
railway logs --tail

# Restart service
railway restart

# Check status
railway status

# List variables
railway variables
```

---

## Cost Estimates

### Railway Pricing

**Hobby Plan:** (~$5/month)
- 512 MB RAM
- 1 GB disk
- Shared CPU
- Good for testing and low traffic

**Pro Plan:** (~$10-20/month)
- 2 GB RAM
- 5 GB disk
- Dedicated CPU
- Recommended for production

**Database Add-on:** (+$5-10/month)
- Or use your existing RIMS database (no extra cost)

**Total:** $5-20/month depending on configuration

---

## Support

### Railway Documentation
- https://docs.railway.app
- https://docs.railway.app/deploy/deployments

### Need Help?
- Railway Discord: https://discord.gg/railway
- Railway Support: https://help.railway.app

### RIMS API Issues
- Check [RIMS-API-GUIDE.md](./RIMS-API-GUIDE.md)
- Review [RIMS-IMPLEMENTATION-SUMMARY.md](./RIMS-IMPLEMENTATION-SUMMARY.md)
- Test locally first: `npm run test:rims`

---

## Success Criteria

Your deployment is successful when:

1. ✅ `railway status` shows "ACTIVE"
2. ✅ Health check returns `{"status": "healthy"}`
3. ✅ Phone lookup finds customers in production database
4. ✅ All business logic endpoints work correctly
5. ✅ No errors in `railway logs`
6. ✅ API accessible from Retell AI

**Status:** Ready to integrate with Retell AI! 🚀

---

**Congratulations! Your RIMS API is now deployed to production!**
