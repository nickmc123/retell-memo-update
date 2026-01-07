# Retell AI Call History to Caspio Memo Integration

Automatically create customer interaction memos in Caspio from Retell AI call history.

---

## 🎯 Overview

These endpoints allow you to:
1. **Single Call Import**: Create a memo from a specific Retell AI call
2. **Batch Import**: Create memos from multiple calls at once
3. **Automatic Customer Matching**: Matches calls to customers by phone number
4. **Rich Call Data**: Includes transcript, sentiment analysis, call summary, and custom analysis data

---

## 📋 Prerequisites

- RETELL_API_KEY environment variable set
- Caspio RIMS_MEMOS table configured
- API server running (Railway or local)

---

## 🚀 API Endpoints

### 1. Create Memo from Single Retell Call

**Endpoint**: `POST /api/memos/from-retell-call`

**Use Case**: Create a detailed memo for a specific call (e.g., after a customer complaint or important interaction)

**Request Body**:
```json
{
  "call_id": "call_a1b2c3d4",
  "memo_type": "Customer Issue",
  "include_transcript": true
}
```

**Parameters**:
- `call_id` (required): Retell AI call ID
- `memo_type` (optional): Custom memo type (defaults to "AI Call Log", auto-categorizes based on sentiment)
- `include_transcript` (optional): Include full transcript in memo details (default: true)

**Example Request**:
```bash
curl -X POST "https://web-production-4080.up.railway.app/api/memos/from-retell-call" \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "call_abc123",
    "memo_type": "Customer Inquiry",
    "include_transcript": true
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Memo created successfully from Retell call",
  "memo_id": 1234567890,
  "call_id": "call_abc123",
  "customer_found": true,
  "customer_info": {
    "vac_id": "123456",
    "name": "Sarah Johnson",
    "phone": "8182121359"
  },
  "memo": {
    "memo_type": "Customer Inquiry",
    "vac_id": "123456",
    "created_date": "2025-12-25",
    "call_duration_seconds": 180,
    "call_sentiment": "Positive",
    "call_successful": true
  }
}
```

---

### 2. Batch Import Retell Calls

**Endpoint**: `POST /api/memos/batch-from-retell`

**Use Case**: Import all calls from today, this week, or specific agent

**Request Body**:
```json
{
  "agent_id": "***REMOVED***",
  "start_timestamp": 1703548800000,
  "end_timestamp": 1703635200000,
  "limit": 50,
  "filter_registered": false
}
```

**Parameters**:
- `agent_id` (optional): Filter by specific Retell agent
- `start_timestamp` (optional): Filter calls after this timestamp (milliseconds since epoch)
- `end_timestamp` (optional): Filter calls before this timestamp
- `limit` (optional): Maximum number of calls to process (default: 50, max: 100)
- `filter_registered` (optional): Only include calls with status 'registered' (default: false)

**Example Request (Last 24 Hours)**:
```bash
# Get timestamp for 24 hours ago
START_TIMESTAMP=$(date -u -d '24 hours ago' +%s)000

curl -X POST "https://web-production-4080.up.railway.app/api/memos/batch-from-retell" \
  -H "Content-Type: application/json" \
  -d "{
    \"agent_id\": \"***REMOVED***\",
    \"start_timestamp\": ${START_TIMESTAMP},
    \"limit\": 100
  }"
```

**Response**:
```json
{
  "success": true,
  "message": "Processed 15 calls",
  "summary": {
    "total_calls": 15,
    "memos_created": 13,
    "memos_failed": 2
  },
  "results": [
    {
      "call_id": "call_abc123",
      "status": "success",
      "customer_found": true,
      "vac_id": "123456"
    },
    {
      "call_id": "call_def456",
      "status": "success",
      "customer_found": true,
      "vac_id": "234567"
    },
    {
      "call_id": "call_ghi789",
      "status": "failed",
      "error": "Customer not found"
    }
  ]
}
```

---

## 📝 Memo Format

Memos created from Retell calls include:

### Memo Fields:
- **memo_type**: Auto-categorized based on sentiment or custom override
  - "AI Call Log" (default)
  - "AI Call - Issue Reported" (negative sentiment)
  - "AI Call - Unsuccessful" (call_successful: false)
  - Custom (if provided)
- **vac_id**: Customer vacation ID (from RIMS lookup by phone) or "UNKNOWN"
- **phone_number**: Caller's phone number
- **created_date**: Date of the call
- **created_by**: "AI Agent (Retell Call {call_id})" or "AI Agent (Batch Import)"

### Memo Details Format:
```
--- RETELL AI CALL SUMMARY ---
Call ID: call_abc123
Date: 2025-12-25
Duration: 180 seconds
From: +18182121359
Sentiment: Positive
Call Successful: Yes

--- SUMMARY ---
Customer called to confirm travel dates. Agent provided confirmation and sent itinerary via email. Customer was satisfied.

--- CUSTOM ANALYSIS ---
appointment_booked: true
customer_email: "sarah.johnson@email.com"
outcome: "booked"

--- TRANSCRIPT ---
Agent: Thank you for calling Casablanca Express. How may I help you today?
Customer: Hi, I'd like to confirm my travel dates.
...
```

---

## 🔄 Usage Scenarios

### Scenario 1: Log Every Call Automatically (Webhook Integration)

Set up a webhook in Retell AI to call your endpoint after each call:

**Retell Webhook URL**: `https://web-production-4080.up.railway.app/api/memos/from-retell-call`

**Webhook Payload**:
```json
{
  "call_id": "{{call.call_id}}",
  "include_transcript": true
}
```

### Scenario 2: Daily Batch Import (Cron Job)

Create a daily cron job to import all calls:

```bash
#!/bin/bash
# daily-retell-import.sh

# Get timestamp for 24 hours ago
START=$(date -u -d '24 hours ago' +%s)000

curl -X POST "https://web-production-4080.up.railway.app/api/memos/batch-from-retell" \
  -H "Content-Type: application/json" \
  -d "{
    \"start_timestamp\": ${START},
    \"limit\": 100
  }"
```

Add to crontab:
```
0 1 * * * /path/to/daily-retell-import.sh
```

### Scenario 3: Manual Import for Specific Agent

Import all calls from a specific agent (e.g., Casablanca Express CS agent):

```bash
curl -X POST "https://web-production-4080.up.railway.app/api/memos/batch-from-retell" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "***REMOVED***",
    "limit": 100
  }'
```

---

## 🔍 How Customer Matching Works

1. Extract caller's phone number from `from_number` field
2. Normalize phone number (remove non-digits)
3. Query RIMS_DATA table: `phn1='XXXXXXXXXX' OR phn2='XXXXXXXXXX'`
4. If customer found: Use their `vac_id`
5. If not found: Set `vac_id` to "UNKNOWN" (memo still created)

---

## 📊 Auto-Categorization Logic

Memo type is automatically categorized based on call analysis:

| Condition | Memo Type |
|-----------|-----------|
| `call_sentiment: "Negative"` | "AI Call - Issue Reported" |
| `call_successful: false` | "AI Call - Unsuccessful" |
| Custom memo_type provided | Use custom value |
| Default | "AI Call Log" |

---

## 🧪 Testing

### Test with Mock Data (USE_MOCK_DATA=true)

```bash
curl -X POST "http://localhost:3000/api/memos/from-retell-call" \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "call_test123",
    "include_transcript": true
  }'
```

### Test Batch Import

```bash
curl -X POST "http://localhost:3000/api/memos/batch-from-retell" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 10
  }'
```

---

## 🚨 Error Handling

### Common Errors:

**1. RETELL_API_KEY not configured**
```json
{
  "error": "Retell API not configured",
  "message": "RETELL_API_KEY environment variable not set"
}
```
**Solution**: Set `RETELL_API_KEY` in Railway environment variables

**2. Call not found**
```json
{
  "error": "Failed to create memo",
  "message": "Failed to fetch call call_invalid123"
}
```
**Solution**: Verify the call_id exists in Retell AI

**3. Customer not found**
- Memo is still created with `vac_id: "UNKNOWN"`
- Phone number is stored in `phone_number` field for manual lookup

---

## 📦 Deployment

### Add RETELL_API_KEY to Railway

```bash
railway variables set RETELL_API_KEY="key_YOUR_RETELL_API_KEY_HERE"
```

### Verify Deployment

```bash
curl "https://web-production-4080.up.railway.app/health"
```

Should show RETELL_API_KEY is configured in the logs.

---

## 📚 Related Endpoints

- `POST /api/memos/create` - Create memo manually
- `GET /api/memos/:vac_id` - Get all memos for a customer
- `GET /api/customer/status` - Get complete customer status

---

## 🎯 Next Steps

1. Set `RETELL_API_KEY` in Railway
2. Test single call import
3. Set up webhook in Retell AI (optional)
4. Set up daily cron job (optional)
5. Monitor memo creation in Caspio

---

**Ready to automatically log all customer interactions!** 🚀
