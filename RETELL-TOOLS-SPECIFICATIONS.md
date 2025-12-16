# Retell AI Tools - RIMS API Integration

## Overview

Replace direct Caspio API calls with our Node.js RIMS API wrapper. This provides:
- ✅ OAuth authentication handled server-side
- ✅ Business logic (deposits, travel rep, booking checks)
- ✅ Memo creation system
- ✅ Better error handling and logging

---

## Tool 1: search-customer-data (Phone Lookup)

**Replaces your current Caspio GET call**

```json
{
  "name": "search-customer-data",
  "description": "Search RIMS database by phone number to get customer's vacation ID, package code, deposits, and travel info.",
  "url": "https://YOUR-DEPLOYED-API.railway.app/api/rims/phone-lookup",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "parameter_type": "json",
  "args_at_root": false,
  "timeout_ms": 120000,
  "body": {
    "phone_number": "{{phn1}}"
  },
  "response_variables": {
    "vac_id": "customer_data.vac_id",
    "pkg_code2": "customer_data.pkg_code2",
    "pkg_code": "customer_data.pkg_code",
    "val_dep": "customer_data.val_dep",
    "conf_deposit": "customer_data.conf_deposit",
    "Asgn_trv_DT": "customer_data.Asgn_trv_DT",
    "tm": "customer_data.tm",
    "date_print_enc": "customer_data.date_print_enc",
    "agency_book_via": "customer_data.agency_book_via",
    "htl_bk_via": "customer_data.htl_bk_via",
    "first_name": "customer_data.p1F",
    "last_name": "customer_data.p1L",
    "email": "customer_data.email"
  }
}
```

**Current vs. New:**
| Current (Direct Caspio) | New (RIMS API) |
|-------------------------|----------------|
| URL: `caspio.com/integrations/rest/v3/tables/rims_data/records` | URL: `YOUR-API/api/rims/phone-lookup` |
| Method: GET | Method: POST |
| Auth in header (exposed token) | No auth needed (handled server-side) |
| Query params: `q.where`, `q.select` | Body: `{phone_number}` |
| Response: `Result.vac_id` | Response: `customer_data.vac_id` |

---

## Tool 2: check-deposits

**NEW - Not available with direct Caspio**

```json
{
  "name": "check-deposits",
  "description": "Check if customer deposits are complete. Returns status (complete/partial/no_deposits) and next action (transfer_extension_1/provide_payment_info/direct_to_website). Compares val_dep + conf_deposit against expected deposit from Knowledge Base.",
  "url": "https://YOUR-DEPLOYED-API.railway.app/api/logic/deposits-check",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "parameter_type": "json",
  "args_at_root": false,
  "timeout_ms": 120000,
  "body": {
    "customer_data": {
      "pkg_code": "{{pkg_code}}",
      "pkg_code2": "{{pkg_code2}}",
      "val_dep": "{{val_dep}}",
      "conf_deposit": "{{conf_deposit}}"
    }
  },
  "response_variables": {
    "deposit_status": "status",
    "deposit_message": "message",
    "next_action": "next_action",
    "total_paid": "deposits.total_paid",
    "expected_deposit": "deposits.expected_deposit",
    "remaining": "deposits.remaining"
  }
}
```

**Example Response:**
```json
{
  "status": "partial",
  "message": "Partial payment received. Remaining: $250",
  "next_action": "provide_payment_info",
  "deposits": {
    "val_dep": 250,
    "conf_deposit": 0,
    "total_paid": 250,
    "expected_deposit": 500,
    "remaining": 250
  },
  "activation_method": "online"
}
```

**Agent Flow Logic:**
```
IF deposit_status == "complete":
  → next_action == "transfer_extension_1"
  → END CALL (deposits paid, ready to schedule)

ELSE IF deposit_status == "partial":
  → next_action == "provide_payment_info"
  → Tell customer: "You have ${{total_paid}} paid. Remaining: ${{remaining}}"
  → Provide payment instructions

ELSE IF deposit_status == "no_deposits":
  → Check activation_method:
    IF "online": next_action == "direct_to_website"
    IF "mail": next_action == "ask_if_mailed"
```

---

## Tool 3: check-travel-rep

**NEW - Travel Rep 45-75 day logic**

```json
{
  "name": "check-travel-rep",
  "description": "Check Travel Rep assignment status using 45-75 day window logic. Returns status (needs_tr_urgent/normal_window/tr_needs_to_call/tr_complete) and creates memos when needed.",
  "url": "https://YOUR-DEPLOYED-API.railway.app/api/logic/travel-rep-check",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "parameter_type": "json",
  "args_at_root": false,
  "timeout_ms": 120000,
  "body": {
    "customer_data": {
      "Asgn_trv_DT": "{{Asgn_trv_DT}}",
      "tm": "{{tm}}",
      "date_print_enc": "{{date_print_enc}}",
      "confirm_status": "confirm",
      "phn1": "{{phn1}}",
      "vac_id": "{{vac_id}}"
    }
  },
  "response_variables": {
    "tr_status": "status",
    "tr_message": "message",
    "tr_action": "action",
    "travel_rep_name": "travel_rep_name",
    "days_remaining": "days_remaining",
    "memo_type": "memo_type",
    "memo_details": "memo_details"
  }
}
```

**Example Responses:**

**Case 1: Urgent - No TR, < 45 days**
```json
{
  "status": "needs_tr_urgent",
  "message": "Travel date in 42 days - Travel Rep assignment urgent",
  "days_remaining": 42,
  "action": "create_memo",
  "memo_type": "needs tr assignment",
  "memo_details": "Travel date: 2025-06-15, Days remaining: 42"
}
```

**Case 2: TR assigned, docs not sent**
```json
{
  "status": "tr_needs_to_call",
  "message": "Travel Rep John Smith assigned but hasn't sent documents",
  "travel_rep_name": "John Smith",
  "action": "create_memo",
  "memo_type": "ask tr to call",
  "memo_details": "Travel Rep: John Smith, Customer: 8182121359"
}
```

**Case 3: Complete**
```json
{
  "status": "tr_complete",
  "message": "Travel Rep John Smith assigned and documents sent on 2025-05-01",
  "travel_rep_name": "John Smith",
  "docs_sent_date": "2025-05-01",
  "action": "contact_tr_directly"
}
```

**Agent Flow Logic:**
```
IF tr_status == "needs_tr_urgent":
  → Call create-memo tool
  → Tell customer: "I'll escalate this to our Travel Rep team"

ELSE IF tr_status == "tr_needs_to_call":
  → Call create-memo tool
  → Tell customer: "Your Travel Rep {{travel_rep_name}} will contact you soon"

ELSE IF tr_status == "tr_complete":
  → Tell customer: "Your Travel Rep is {{travel_rep_name}}. Documents sent {{docs_sent_date}}"
  → Ask: "Did you receive your travel documents?"

ELSE IF tr_status == "normal_window":
  → Tell customer: "Your trip is {{days_remaining}} days away. Travel Rep will be assigned 45-75 days before departure."
```

---

## Tool 4: check-booking-status

**NEW - Booking verification**

```json
{
  "name": "check-booking-status",
  "description": "Check if customer is booked (has agency_book_via or htl_bk_via filled). Returns status (booked/not_booked) and booking references.",
  "url": "https://YOUR-DEPLOYED-API.railway.app/api/logic/booking-check",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "parameter_type": "json",
  "args_at_root": false,
  "timeout_ms": 120000,
  "body": {
    "customer_data": {
      "agency_book_via": "{{agency_book_via}}",
      "htl_bk_via": "{{htl_bk_via}}"
    }
  },
  "response_variables": {
    "booking_status": "status",
    "booking_message": "message",
    "agency_ref": "booking_refs.agency",
    "hotel_ref": "booking_refs.hotel",
    "booking_action": "action"
  }
}
```

**Agent Flow Logic:**
```
IF booking_status == "booked":
  → Tell customer: "You're booked! Agency ref: {{agency_ref}}, Hotel ref: {{hotel_ref}}"
  → Ask: "Do you need me to resend your itinerary?"
    IF yes: call create-memo with type "resend itinerary"

ELSE IF booking_status == "not_booked":
  → Tell customer: "You haven't booked yet. Would you like to schedule your travel?"
  → Transfer to Travel Rep extension
```

---

## Tool 5: create-memo

**NEW - Memo creation**

```json
{
  "name": "create-memo",
  "description": "Create a memo in RIMS_MEMOS for staff follow-up. Types: needs tr assignment, ask tr to call, resend itinerary. Memos are timestamped and created by AI Agent.",
  "url": "https://YOUR-DEPLOYED-API.railway.app/api/memos/create",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "parameter_type": "json",
  "args_at_root": false,
  "timeout_ms": 120000,
  "body": {
    "memo_type": "{{memo_type}}",
    "details": "{{memo_details}}",
    "vac_id": "{{vac_id}}",
    "phone_number": "{{phn1}}"
  },
  "response_variables": {
    "memo_success": "success",
    "memo_id": "memo_id"
  }
}
```

**Memo Types:**
- `"needs tr assignment"` - Urgent TR needed (< 45 days)
- `"ask tr to call"` - TR assigned but docs not sent
- `"resend itinerary"` - Customer needs itinerary resent

---

## Deployment Steps

### 1. Deploy API to Railway

```bash
# Option 1: Use Railway web UI
1. Go to railway.app
2. New Project → Deploy from GitHub
3. Select your repo
4. Set environment variables:
   - CASPIO_CLIENT_ID
   - CASPIO_CLIENT_SECRET
   - USE_MOCK_DATA=false
   - NODE_ENV=production
5. Deploy

# Option 2: Use Railway CLI (if you have permissions)
cd integration-implementation
railway login
railway init
railway up
railway variables set CASPIO_CLIENT_ID="***REMOVED***"
railway variables set CASPIO_CLIENT_SECRET="***REMOVED***"
railway variables set USE_MOCK_DATA=false
railway variables set NODE_ENV=production
```

### 2. Get Your Railway URL

After deployment, Railway gives you a URL like:
```
https://conversational-flow-builder-production.up.railway.app
```

### 3. Update All Tool URLs

Replace `YOUR-DEPLOYED-API.railway.app` in all tools above with your actual Railway URL.

### 4. Create Tools in Retell AI

For each tool above:
1. Go to Retell AI Dashboard → Tools
2. Create Custom Tool
3. Copy the JSON specification
4. Save and get the tool_id

### 5. Update Your Agent

1. Open `test_caspio_rims_fieldsTest` agent
2. Replace the current `search-customer-data` tool
3. Add the 4 new tools (check-deposits, check-travel-rep, check-booking-status, create-memo)
4. Update conversation flow to use new business logic

---

## Recommended Agent Flow

```
START
  ↓
Ask for Phone Number
  ↓
search-customer-data (Tool 1)
  ↓
check-deposits (Tool 2)
  ↓
  ├─ IF complete → Transfer to Extension 1 → END
  │
  ├─ IF partial → Provide payment info
  │     ↓
  │     Ask if they'll pay now
  │       ↓
  │       END (follow up later)
  │
  └─ IF no_deposits → Direct to website OR ask if mailed
        ↓
        END
```

**After deposits check, optionally:**
```
check-travel-rep (Tool 3)
  ↓
  ├─ IF needs_tr_urgent → create-memo → Escalate
  ├─ IF tr_needs_to_call → create-memo → "TR will call you"
  ├─ IF tr_complete → "Contact {{travel_rep_name}}"
  └─ IF normal_window → "TR assigned 45-75 days before"

check-booking-status (Tool 4)
  ↓
  ├─ IF booked → Ask if need itinerary → create-memo
  └─ IF not_booked → Transfer to booking team
```

---

## Testing

### Local Testing (Before Deployment)

```bash
# Start local API
npm run start:caspio

# Test phone lookup
curl -X POST http://localhost:3000/api/rims/phone-lookup \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "8182121359"}'

# Test deposits check
curl -X POST http://localhost:3000/api/logic/deposits-check \
  -H "Content-Type: application/json" \
  -d '{"customer_data": {"pkg_code": "ECF", "val_dep": 0, "conf_deposit": 0}}'
```

### Production Testing (After Deployment)

Replace `localhost:3000` with your Railway URL in all tests above.

---

## Migration Checklist

- [ ] Deploy API to Railway/Render
- [ ] Test all 8 endpoints with production Caspio data
- [ ] Create Tool 1 (search-customer-data) in Retell
- [ ] Create Tool 2 (check-deposits) in Retell
- [ ] Create Tool 3 (check-travel-rep) in Retell
- [ ] Create Tool 4 (check-booking-status) in Retell
- [ ] Create Tool 5 (create-memo) in Retell
- [ ] Update agent conversation flow
- [ ] Test with live calls
- [ ] Monitor memo creation in Caspio RIMS_MEMOS table
- [ ] Remove old direct Caspio tool

---

## Support

**API Health Check:**
```
https://YOUR-API.railway.app/health
```

**Response:**
```json
{
  "status": "healthy",
  "mode": "production",
  "database": "caspio",
  "account": "***REMOVED***"
}
```

**Logs:**
- Railway: Dashboard → Deployments → Logs
- Render: Dashboard → Logs tab

**Need Help?**
- All endpoints return detailed error messages
- Check Railway logs for OAuth/Caspio errors
- Verify environment variables are set correctly
