# API Keys & Credentials Setup Guide

**Complete guide to obtaining and configuring all API keys needed for Casablanca Express RIMS integration**

---

## Required API Keys & Credentials

### 1. Retell AI API Key
**What:** Authentication for creating tools and managing agents
**Cost:** Included with your Retell AI account
**Required For:** Creating the 5 RIMS API tools

### 2. Database Connection String
**What:** PostgreSQL connection to your RIMS database
**Cost:** Varies by hosting provider ($0-$50/month)
**Required For:** Production mode API

### 3. API Hosting Platform
**What:** Platform to host the Node.js API server
**Cost:** $5-10/month (Railway/Render)
**Required For:** Public API endpoint for Retell AI

---

## Step-by-Step Setup

### Step 1: Get Your Retell AI API Key

**Option A: From Retell Dashboard (Easiest)**

1. Go to [https://retellai.com/dashboard](https://retellai.com/dashboard)
2. Click on your profile/settings (top right)
3. Navigate to **API Keys** section
4. Click **Create New API Key**
5. Copy the key (starts with `key_...`)

**Option B: From Account Settings**

1. Log into Retell AI
2. Settings → Developer → API Keys
3. Generate new key
4. Copy and save securely

**What it looks like:**
```
***REMOVED***
```

**Save it as:**
```bash
export RETELL_API_KEY="***REMOVED***"
```

---

### Step 2: Database Connection String

You need a PostgreSQL database to store RIMS data. Choose one option:

#### Option A: Railway (Recommended - Easiest)

**Why:** Simple setup, includes database + hosting in one platform

1. **Sign up:** [https://railway.app](https://railway.app)
2. **Create new project**
3. **Add PostgreSQL database:**
   - Click "+ New"
   - Select "Database"
   - Choose "PostgreSQL"
4. **Get connection string:**
   - Click on PostgreSQL service
   - Go to "Variables" tab
   - Copy `DATABASE_URL`

**What it looks like:**
```
postgresql://postgres:password@containers-us-west-xyz.railway.app:1234/railway
```

**Cost:** $5/month (Hobby plan)

---

#### Option B: Render

1. **Sign up:** [https://render.com](https://render.com)
2. **Create PostgreSQL database:**
   - Dashboard → New +
   - PostgreSQL
   - Name: `casablanca-rims`
   - Select free tier
3. **Get connection string:**
   - Database → Connections
   - Copy "Internal Database URL"

**What it looks like:**
```
postgresql://user:pass@dpg-xxxxx.render.com/dbname
```

**Cost:** Free tier available, $7/month for production

---

#### Option C: Supabase

1. **Sign up:** [https://supabase.com](https://supabase.com)
2. **Create new project**
3. **Get connection string:**
   - Settings → Database
   - Connection String → URI
   - Copy the connection string

**Cost:** Free tier available

---

#### Option D: Your Existing Database

If you already have a RIMS database:

**Get connection details:**
```
Host: your-database-host.com
Port: 5432
Database: rims_db
User: your_username
Password: your_password
```

**Create connection string:**
```
postgresql://your_username:your_password@your-database-host.com:5432/rims_db
```

---

### Step 3: API Hosting Platform Credentials

You need to host the Node.js API server. Choose one:

#### Option A: Railway (Recommended)

**Benefits:** Database + API hosting in one place

1. **Already signed up** (from Step 2)
2. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```
3. **Login:**
   ```bash
   railway login
   ```
   - Opens browser for authentication
   - Authorize the CLI

**No API key needed** - uses OAuth login

---

#### Option B: Render

1. **Already signed up** (if you chose Render for database)
2. **No API key needed** - deploy via GitHub integration
3. **Need:** GitHub account (free)

---

#### Option C: Heroku

1. **Sign up:** [https://heroku.com](https://heroku.com)
2. **Install Heroku CLI:**
   ```bash
   npm install -g heroku
   ```
3. **Login:**
   ```bash
   heroku login
   ```

**Cost:** $5-7/month

---

## Environment Variables Configuration

### Local Development (.env file)

Create `/integration-implementation/.env`:

```bash
# ============================================
# RIMS API - Environment Configuration
# ============================================

# MODE: Set to false for production, true for testing
USE_MOCK_DATA=true

# ============================================
# DATABASE (Required for Production)
# ============================================
# Option 1: Full connection string (Railway, Render, Supabase)
DATABASE_URL=postgresql://user:password@host:port/database

# Option 2: Individual credentials (if DATABASE_URL not available)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=rims_db
# DB_USER=postgres
# DB_PASSWORD=your_password_here

# ============================================
# SERVER
# ============================================
PORT=3000
NODE_ENV=development

# ============================================
# RETELL AI (For testing tools locally - optional)
# ============================================
RETELL_API_KEY=***REMOVED***
```

---

### Production Deployment (Railway)

**Set via Railway CLI:**

```bash
# Navigate to your project
cd /Users/nickmac/Downloads/conversational-flow-builder/integration-implementation

# Initialize Railway
railway init

# Set environment variables
railway variables set USE_MOCK_DATA=false
railway variables set DATABASE_URL="postgresql://user:pass@host:port/db"
railway variables set NODE_ENV=production
railway variables set PORT=3000
```

**Or via Railway Dashboard:**
1. Project → Variables
2. Add each variable
3. Click "Deploy"

---

### Production Deployment (Render)

**Set via Render Dashboard:**

1. Your Web Service → Environment
2. Add Environment Variables:
   ```
   Key: USE_MOCK_DATA     Value: false
   Key: DATABASE_URL      Value: postgresql://...
   Key: NODE_ENV          Value: production
   ```
3. Save Changes

---

## Testing Your Credentials

### Test 1: Database Connection

```bash
# Using psql command
psql "postgresql://user:password@host:port/database"

# Expected: PostgreSQL prompt
# rims_db=#

# Test query
SELECT 1;

# Expected: Returns 1
```

**If fails:**
- Check host is accessible
- Verify username/password
- Confirm database exists
- Check firewall/security groups

---

### Test 2: Retell AI API Key

```bash
# Test API key
curl -X GET "https://api.retellai.com/list-agents" \
  -H "Authorization: Bearer $RETELL_API_KEY"

# Expected: JSON list of agents
# {"agents": [...]}
```

**If fails:**
- Check API key is correct
- Verify no extra spaces
- Try regenerating key in dashboard

---

### Test 3: API Server Locally

```bash
cd integration-implementation

# Start server
npm run start:rims

# In another terminal
curl http://localhost:3000/health

# Expected:
# {
#   "status": "healthy",
#   "mode": "mock",
#   "database": "mock_rims_data",
#   "mock_customers": 3,
#   "mock_packages": 12
# }
```

---

## Complete .env Template

Copy this to `/integration-implementation/.env` and fill in your values:

```bash
# ============================================
# CASABLANCA EXPRESS - RIMS API
# Environment Configuration
# ============================================

# ─────────────────────────────────────────────
# MODE
# ─────────────────────────────────────────────
# true  = Use mock data (testing, no database needed)
# false = Use real RIMS database (production)
USE_MOCK_DATA=true

# ─────────────────────────────────────────────
# DATABASE CONNECTION
# ─────────────────────────────────────────────
# Get this from Railway, Render, or Supabase
# Format: postgresql://user:password@host:port/database
DATABASE_URL=postgresql://replace_with_your_connection_string

# Alternative: Individual credentials (if not using DATABASE_URL)
# DB_HOST=your-database-host.com
# DB_PORT=5432
# DB_NAME=rims_db
# DB_USER=your_username
# DB_PASSWORD=your_password

# ─────────────────────────────────────────────
# SERVER CONFIGURATION
# ─────────────────────────────────────────────
PORT=3000
NODE_ENV=development

# ─────────────────────────────────────────────
# RETELL AI
# ─────────────────────────────────────────────
# Get from: https://retellai.com/dashboard → API Keys
# Starts with: key_
RETELL_API_KEY=key_your_api_key_here

# ─────────────────────────────────────────────
# OPTIONAL: Logging & Monitoring
# ─────────────────────────────────────────────
LOG_LEVEL=info
```

---

## Security Best Practices

### ✅ DO:
- Store `.env` file locally only
- Add `.env` to `.gitignore`
- Use environment variables in production
- Rotate API keys periodically
- Use different keys for dev/staging/prod

### ❌ DON'T:
- Commit `.env` to git
- Share API keys in plain text
- Use production keys in development
- Store keys in code files
- Email API keys

---

## Quick Reference: What Goes Where

| Credential | Used By | Where to Set | Required When |
|------------|---------|--------------|---------------|
| `DATABASE_URL` | API Server | .env or Railway | Production mode |
| `RETELL_API_KEY` | You (for creating tools) | Terminal/scripts | Creating Retell tools |
| `USE_MOCK_DATA` | API Server | .env or Railway | Always (true/false) |
| `PORT` | API Server | .env or Railway | Always (default: 3000) |
| `NODE_ENV` | API Server | .env or Railway | Production deployment |

---

## Troubleshooting

### Issue: "Cannot connect to database"

**Check:**
```bash
# 1. Test connection string
psql "$DATABASE_URL"

# 2. Check if database exists
psql "$DATABASE_URL" -c "SELECT current_database();"

# 3. Verify credentials
echo $DATABASE_URL
```

**Fix:**
- Verify host is accessible (not localhost in production)
- Check username/password are correct
- Confirm database name exists
- Check firewall allows connections

---

### Issue: "Retell API key invalid"

**Check:**
```bash
# Test API key
curl -X GET "https://api.retellai.com/v2/list-agents" \
  -H "Authorization: Bearer $RETELL_API_KEY"
```

**Fix:**
- Regenerate API key in Retell dashboard
- Check for extra spaces/newlines
- Verify key starts with `key_`
- Try in incognito/different browser

---

### Issue: "Module not found" or "Cannot find package"

**Fix:**
```bash
# Reinstall dependencies
cd integration-implementation
rm -rf node_modules
npm install
```

---

## Next Steps

Once you have all credentials:

1. **Test Locally:**
   ```bash
   cd integration-implementation
   npm run start:rims
   npm run test:rims
   ```

2. **Deploy to Production:**
   - Follow [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)
   - Use credentials above

3. **Create Retell AI Tools:**
   - Follow [RIMS-API-GUIDE.md](./RIMS-API-GUIDE.md)
   - Use `RETELL_API_KEY` for API calls

---

## Summary Checklist

**Before deploying, you need:**

- [ ] Retell AI API key (`key_...`)
- [ ] PostgreSQL database connection string
- [ ] Hosting platform account (Railway/Render)
- [ ] `.env` file created and configured
- [ ] Dependencies installed (`npm install`)
- [ ] Tests passing (`npm run test:rims`)

**Total setup time:** 15-30 minutes

**Total monthly cost:** $5-15

**Expected annual return:** $1.66M - $2.80M

---

## Support Resources

**Retell AI:**
- Dashboard: https://retellai.com/dashboard
- Docs: https://docs.retellai.com
- Support: support@retellai.com

**Railway:**
- Dashboard: https://railway.app/dashboard
- Docs: https://docs.railway.app
- Community: https://discord.gg/railway

**Render:**
- Dashboard: https://dashboard.render.com
- Docs: https://render.com/docs
- Support: https://render.com/support

**Supabase:**
- Dashboard: https://app.supabase.com
- Docs: https://supabase.com/docs
- Community: https://supabase.com/discord

---

**Ready to deploy? Follow [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) with your credentials!**
