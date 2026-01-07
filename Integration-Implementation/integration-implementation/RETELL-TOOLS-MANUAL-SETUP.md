# Retell AI Tools - Manual Creation Guide

**Railway API URL:** `https://web-production-4080.up.railway.app`

Create these 5 custom tools in your Retell AI dashboard.

---

## How to Create Tools in Retell Dashboard

1. Go to https://dashboard.retellai.com
2. Navigate to **Tools** section
3. Click **"Create Custom Tool"** or **"Add Tool"**
4. For each tool below, fill in the fields and click **Save**

---

## Tool 1: RIMS Phone Lookup

**Tool Name:**
```
rims_phone_lookup
```

**Description:**
```
Look up customer in RIMS database by phone number. Searches both primary (phn1) and secondary (phn2) phone fields. Returns all customer data including vac_id, certificate info, deposits, travel dates, and Travel Rep assignment.
```

**URL:**
```
https://web-production-4080.up.railway.app/api/rims/phone-lookup
```

**Method:**
```
POST
```

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body Schema (if required):**
```json
{
  "phone_number": "string"
}
```

**Parameters:**
- **Name:** `phone_number`
- **Type:** `string`
- **Description:** Customer phone number (10 digits, any format accepted)
- **Required:** Yes

**Speak During Execution:** Yes

---

## Tool 2: RIMS Certificate Lookup

**Tool Name:**
```
rims_certificate_lookup
```

**Description:**
```
Look up customer in RIMS database by certificate number (pkg_code2 field). Returns all customer data including contact info, deposits, travel dates, and booking status.
```

**URL:**
```
https://web-production-4080.up.railway.app/api/rims/certificate-lookup
```

**Method:**
```
POST
```

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body Schema:**
```json
{
  "certificate_number": "string"
}
```

**Parameters:**
- **Name:** `certificate_number`
- **Type:** `string`
- **Description:** Certificate number from customer (e.g., ECFWIN, BEACH123)
- **Required:** Yes

**Speak During Execution:** Yes

---

## Tool 3: Deposits Check

**Tool Name:**
```
deposits_check
```

**Description:**
```
Check if customer deposits are complete by comparing paid amount (val_dep + conf_deposit) against expected deposit from Knowledge Base. Returns status (complete/partial/no_deposits) and next action (transfer_extension_1/provide_payment_info/direct_to_website).
```

**URL:**
```
https://web-production-4080.up.railway.app/api/logic/deposits-check
```

**Method:**
```
POST
```

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body Schema:**
```json
{
  "customer_data": {}
}
```

**Parameters:**
- **Name:** `customer_data`
- **Type:** `object`
- **Description:** Customer data object from phone_lookup or certificate_lookup (must include pkg_code, val_dep, conf_deposit)
- **Required:** Yes

**Speak During Execution:** No

---

## Tool 4: Travel Rep Check

**Tool Name:**
```
travel_rep_check
```

**Description:**
```
Check Travel Rep assignment status. Implements 45-75 day window logic: if travel date is within 45 days and no TR assigned, status=needs_tr_urgent. If TR assigned but docs not sent (date_print_enc blank), status=tr_needs_to_call. Returns appropriate memo creation instructions.
```

**URL:**
```
https://web-production-4080.up.railway.app/api/logic/travel-rep-check
```

**Method:**
```
POST
```

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body Schema:**
```json
{
  "customer_data": {}
}
```

**Parameters:**
- **Name:** `customer_data`
- **Type:** `object`
- **Description:** Customer data object from lookup (must include Asgn_trv_DT, tm, date_print_enc, confirm_status)
- **Required:** Yes

**Speak During Execution:** No

---

## Tool 5: Create RIMS Memo

**Tool Name:**
```
create_rims_memo
```

**Description:**
```
Create a memo in RIMS_MEMOS table for staff follow-up. Memo types: needs tr assignment (urgent TR needed), ask tr to call (TR assigned but docs not sent), resend itinerary (customer needs itinerary resent). Memos are created by AI Agent and timestamped.
```

**URL:**
```
https://web-production-4080.up.railway.app/api/memos/create
```

**Method:**
```
POST
```

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body Schema:**
```json
{
  "memo_type": "string",
  "details": "string",
  "vac_id": "string",
  "phone_number": "string"
}
```

**Parameters:**
- **Name:** `memo_type`
  - **Type:** `string`
  - **Description:** Type of memo: needs tr assignment, ask tr to call, or resend itinerary
  - **Required:** Yes

- **Name:** `details`
  - **Type:** `string`
  - **Description:** Memo details (e.g., Travel date: 2025-06-15, Days remaining: 42)
  - **Required:** No

- **Name:** `vac_id`
  - **Type:** `string`
  - **Description:** Customer vac_id from RIMS database
  - **Required:** Yes

- **Name:** `phone_number`
  - **Type:** `string`
  - **Description:** Customer phone number
  - **Required:** No

**Speak During Execution:** No

---

## Testing the Tools

After creating each tool, test it in the Retell dashboard:

### Test Tool 1: Phone Lookup
```json
{
  "phone_number": "8182121359"
}
```

**Expected:** Should return Sarah Johnson's data

### Test Tool 2: Certificate Lookup
```json
{
  "certificate_number": "BEACH123"
}
```

**Expected:** Should return Sarah Johnson's data

### Test Tool 3: Deposits Check
Use the customer_data from Tool 1 or 2 response

### Test Tool 4: Travel Rep Check
Use the customer_data from Tool 1 or 2 response

### Test Tool 5: Create Memo
```json
{
  "memo_type": "needs tr assignment",
  "vac_id": "123456",
  "details": "Test memo",
  "phone_number": "8182121359"
}
```

---

## Assign Tools to Your Agent

After creating all 5 tools:

1. Go to your **Agent** configuration
2. Find the **Tools** section
3. Add all 5 tools:
   - rims_phone_lookup
   - rims_certificate_lookup
   - deposits_check
   - travel_rep_check
   - create_rims_memo

4. **Save** your agent configuration

---

## Verify Production API is Working

Before testing in Retell, verify your Railway deployment:

```bash
# Health check
curl https://web-production-4080.up.railway.app/health

# Phone lookup test
curl -X POST https://web-production-4080.up.railway.app/api/rims/phone-lookup \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "8182121359"}'
```

**Expected:** Both should return JSON responses without errors

---

## Troubleshooting

### Tool Creation Fails
- Check that URL is correct (https://web-production-4080.up.railway.app)
- Verify API is running: Visit the health endpoint in browser
- Check Headers are set to `{"Content-Type": "application/json"}`

### Tool Test Returns Error
- Check Railway logs for errors
- Verify USE_MOCK_DATA is set correctly in Railway environment variables
- Test the endpoint directly with curl first

### Agent Doesn't Use Tools
- Verify tools are assigned to your agent
- Check agent prompt includes instructions to use tools
- Review call logs to see if tools are being called

---

## Next Steps

1. ✅ Create all 5 tools in Retell dashboard (copy-paste from above)
2. ✅ Test each tool individually
3. ✅ Assign tools to your agent
4. ✅ Update agent prompt with tool usage instructions
5. ✅ Make a test call to verify end-to-end flow

See [RIMS-API-GUIDE.md](./RIMS-API-GUIDE.md) for recommended agent flow and prompt updates.

---

**Production API:** https://web-production-4080.up.railway.app
**Last Updated:** December 17, 2025
