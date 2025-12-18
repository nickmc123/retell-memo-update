# Customer Status Endpoint

## Overview

Single endpoint that returns the current status of a customer's vacation booking journey.

**Endpoint:** `POST /api/rims/customer-status`

---

## Request

### By Phone Number:
```json
{
  "phone_number": "8182121359"
}
```

### By Vacation ID:
```json
{
  "vac_id": "155002"
}
```

---

## Response

```json
{
  "status": "Deposit Needed",
  "message": "Deposit required: $500 remaining of $500 total.",
  "next_action": "direct_to_payment",
  "customer": {
    "vac_id": 155002,
    "name": "NICHOLAS MCCLENDON",
    "pkg_code2": "ECFWIN",
    "destination": "INDIANAPOLIS",
    "phone": "8182121359"
  },
  "details": {
    "deposits": {
      "val_dep": 0,
      "conf_deposit": 0,
      "total_paid": 0,
      "expected": 500,
      "remaining": 500,
      "complete": false
    },
    "travel_info": {
      "assigned_date": null,
      "arrival_date": null,
      "days_until_travel": null,
      "days_until_arrival": null,
      "confirmed": false
    },
    "travel_rep": {
      "name": null,
      "paperwork_submitted": null
    },
    "refund": {
      "amount": 0,
      "docs_mailed": null
    }
  }
}
```

---

## Status Values (8 Total)

### 1. Deposit Needed
**Condition:** `val_dep + conf_deposit < expected_deposit`

**next_action:** `direct_to_payment`

**What to tell customer:**
- "You need to pay your deposit before we can schedule your trip."
- "Please visit activatemytrip.com or mail in your deposit form."

---

### 2. Ready to Schedule
**Condition:** Deposits complete + `asgn_trv_dt = null`

**next_action:** `offer_scheduling`

**What to tell customer:**
- "Great! Your deposit is complete. Ready to schedule your travel dates?"
- "Call 818-992-5100 to speak with scheduling department."

---

### 3. Waiting For Travel Rep
**Condition:**
- `asgn_trv_dt != null` (travel date assigned)
- `tm = ""` (no Travel Rep assigned)
- `conf_valid_code = "CONFIRM"`
- Within 45-75 day window before travel

**next_action:** `create_tr_memo_urgent`

**What to tell customer:**
- "Your travel date is coming up soon. I'm flagging your account for immediate Travel Rep assignment."
- "A Travel Rep will call you within 24 hours."

---

### 4. Travel Rep Assigned
**Condition:**
- `tm != ""` (Travel Rep assigned)
- `conf_valid_code = "CONFIRM"`
- `decReady != true` (Decision not ready yet)
- No arrival date yet

**next_action:** `provide_tr_contact`

**What to tell customer:**
- "Your Travel Rep is [NAME]. They'll be calling you to finalize your bookings."
- "You can reach them at 818-992-5100."

---

### 5. Travel Pending
**Condition:**
- `arv_date != null` (arrival date set)
- `arv_date` is in the FUTURE

**next_action:** `trip_confirmed_upcoming`

**What to tell customer:**
- "Your trip to [DESTINATION] is confirmed! Arrival date: [DATE] ([X] days away)."
- "Your Travel Rep is [NAME]. Contact them if you need to make changes."

---

### 6. Booking Pending
**Condition:**
- `decReady = true` (customer made travel decision)
- `date_htl_book = null` or blank (hotel not booked yet)
- `date_agncy_book = null` or blank (agency not booked yet)

**next_action:** `awaiting_booking`

**What to tell customer:**
- "Your travel decision has been received. Our team is working on completing your hotel and agency bookings."
- "You'll be contacted once your booking is confirmed."

---

### 7. Refund Pending
**Condition:**
- `cash_back_amt > 0`
- `Fnl_Doc_MO_Date = null` (refund docs not mailed yet)

**next_action:** `check_with_accounting`

**What to tell customer:**
- "Your refund of $[AMOUNT] is being processed."
- "Call 818-992-5100 ext. 2 for Customer Service to check status."

---

### 8. Trip Complete
**Condition:**
- `arv_date != null`
- `arv_date` is in the PAST

**next_action:** `thank_customer`

**What to tell customer:**
- "Your trip to [DESTINATION] is complete. Thank you for traveling with us!"
- "We hope you had a wonderful experience."

---

## Status Priority (Checked in Order)

1. **Refund Pending** (can happen at any stage)
2. **Trip Complete** (past travel)
3. **Travel Pending** (upcoming confirmed travel)
4. **Booking Pending** (decision made, awaiting hotel/agency booking)
5. **Travel Rep Assigned** (TR assigned, awaiting final booking)
6. **Waiting For Travel Rep** (urgent - within 45-75 days, no TR)
7. **Ready to Schedule** (deposits paid, no travel date)
8. **Deposit Needed** (default - needs payment)

---

## Integration with Retell AI

### Create Tool in Retell Dashboard

**Tool Name:** `customer_status`

**URL:** `https://web-production-4080.up.railway.app/api/rims/customer-status`

**Method:** `POST`

**JSON Schema:**
```json
{
  "type": "object",
  "properties": {
    "phone_number": {
      "type": "string",
      "description": "Customer phone number (use when available)"
    },
    "vac_id": {
      "type": "string",
      "description": "Customer vacation ID (use when phone not available)"
    }
  }
}
```

**Note:** At least one parameter is required (phone_number OR vac_id)

---

## Conversational Flow Integration

### Replace Multiple Nodes with Single Status Check

**Old Flow:**
```
Phone Lookup → Check Deposits → Check TR → Multiple Paths
```

**New Flow:**
```
Phone Lookup → Customer Status → Route Based on Status
```

### Example Node Configuration

**Node Type:** Function
**Tool:** `customer_status`
**Instruction:** "Check the customer's current status in their vacation journey"

**Edges:**
- Status = "Deposit Needed" → Direct to payment info node
- Status = "Ready to Schedule" → Offer scheduling node
- Status = "Waiting For Travel Rep" → Create urgent memo node
- Status = "Travel Rep Assigned" → Provide TR contact node
- Status = "Booking Pending" → Awaiting booking node
- Status = "Travel Pending" → Provide trip details node
- Status = "Refund Pending" → Direct to accounting node
- Status = "Trip Complete" → Thank customer node

---

## Test Examples

### Test 1: Deposit Needed
```bash
curl -X POST https://web-production-4080.up.railway.app/api/rims/customer-status \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "8182121359"}'
```

**Expected Response:**
```json
{
  "status": "Deposit Needed",
  "next_action": "direct_to_payment"
}
```

### Test 2: Ready to Schedule (Mock)
```bash
# Modify test customer to have deposits complete
# val_dep = 500, conf_deposit = 0, asgn_trv_dt = null
```

### Test 3: Travel Pending (Mock)
```bash
# Modify test customer to have:
# arv_date = "2025-06-15", conf_valid_code = "CONFIRM"
```

---

## Deployment Steps

1. **Add endpoint to Railway API:**
   - Copy `customer-status-endpoint.js` to your API codebase
   - Add route to your Express app: `app.use(require('./routes/customer-status'))`
   - Deploy to Railway

2. **Create tool in Retell Dashboard:**
   - Go to Tools → + New Custom Tool
   - Configure as shown above
   - Copy tool ID

3. **Update conversational flow:**
   - Replace deposit_check and travel_rep_check nodes
   - Use single customer_status node
   - Route based on status field

4. **Test:**
   - Call with test phone number: 8182121359
   - Verify status response
   - Test flow routing

---

## Benefits Over Multiple Tools

✅ **Single API call** instead of 3-4 separate calls
✅ **Consistent logic** - status determined server-side
✅ **Easier to maintain** - all business rules in one place
✅ **Faster response** - one round-trip instead of multiple
✅ **Cleaner flow** - simpler routing logic in Retell
✅ **Better error handling** - unified error responses

---

## Next Steps

1. Add this endpoint to your Railway API
2. Test with real customer data
3. Create the Retell tool
4. Update the conversational flow to use single status check
5. Remove old deposit_check and travel_rep_check tools
