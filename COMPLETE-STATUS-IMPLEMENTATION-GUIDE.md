# Complete Customer Status Implementation Guide

## Overview

This guide provides everything needed to implement the 8-status customer journey system in Retell AI.

**Status:** Ready for deployment
**Components:** API endpoints ✅ | Agent scripts ✅ | Documentation ✅

---

## System Architecture

```
Customer calls → Phone lookup → Customer Status API → Route to 1 of 8 nodes
```

### The 8 Statuses (Priority Order)

1. **Refund Pending** - Customer has refund being processed
2. **Trip Complete** - Customer already traveled
3. **Travel Pending** - Trip confirmed, coming up soon
4. **Booking Pending** - Decision made, bookings in progress
5. **Travel Rep Assigned** - TR assigned, awaiting booking
6. **Waiting For Travel Rep** - Dates set, waiting for TR (45-75 days out)
7. **Ready to Schedule** - Deposits paid, ready to pick dates
8. **Deposit Needed** - Needs to pay deposit

---

## File Reference

### Core Implementation Files

| File | Status | Purpose |
|------|--------|---------|
| [customer-status-endpoint-standalone.js](customer-status-endpoint-standalone.js) | ✅ Ready | API endpoint with status logic |
| [AGENT-SCRIPTS-ALL-STATUSES.md](AGENT-SCRIPTS-ALL-STATUSES.md) | ✅ Ready | All 8 agent conversation scripts |
| [CUSTOMER-STATUS-ENDPOINT.md](CUSTOMER-STATUS-ENDPOINT.md) | ✅ Ready | API documentation |
| [BOOKING-PENDING-STATUS.md](BOOKING-PENDING-STATUS.md) | ✅ Ready | New status documentation |

### Deployment Documentation

| File | Purpose |
|------|---------|
| [DEPLOYMENT-INSTRUCTIONS.md](DEPLOYMENT-INSTRUCTIONS.md) | Multi-certificate deployment guide |
| [API-ENDPOINTS-SUMMARY.md](API-ENDPOINTS-SUMMARY.md) | All 5 lookup endpoints |
| [CREATE-RETELL-TOOLS.md](CREATE-RETELL-TOOLS.md) | Manual tool creation instructions |

---

## Quick Start: 3-Step Deployment

### Step 1: Deploy API Endpoint (Optional - if not already deployed)

The customer-status endpoint is in `customer-status-endpoint-standalone.js`.

**If not yet deployed to Railway:**

1. Add file to your Railway API project
2. Import in main server file:
   ```javascript
   app.use(require('./routes/customer-status'));
   ```
3. Deploy to Railway
4. Test endpoint:
   ```bash
   curl -X POST https://web-production-4080.up.railway.app/api/rims/customer-status \
     -H "Content-Type: application/json" \
     -d '{"phone_number": "6193188486"}'
   ```

**If already deployed:** Skip to Step 2

---

### Step 2: Create customer_status Tool in Retell Dashboard

1. Login to https://dashboard.retellai.com
2. Go to **Tools** → **+ New Custom Tool**
3. Configure:

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
      "description": "Customer phone number"
    },
    "pkg_code2": {
      "type": "string",
      "description": "Certificate code (optional - for customers with multiple records)"
    }
  },
  "required": ["phone_number"]
}
```

4. Save and copy the **tool ID** (format: `tool-XXXXXXXXXX`)

---

### Step 3: Create Conversational Flow Nodes

Create **9 nodes total:**

#### Node 1: Check Customer Status (Function Node)

```json
{
  "id": "node-check-status",
  "type": "function",
  "name": "Check Customer Status",
  "tool_id": "tool-XXXXXXXXXX",
  "tool_type": "local",
  "instruction": {
    "type": "prompt",
    "text": "Check the customer's current status using the phone number they provided"
  },
  "wait_for_result": true,
  "speak_during_execution": false,
  "display_position": {"x": 300, "y": 200},
  "edges": [
    {
      "id": "edge-status-deposit-needed",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Status equals 'Deposit Needed'"
      },
      "destination_node_id": "node-status-deposit-needed"
    },
    {
      "id": "edge-status-ready-to-schedule",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Status equals 'Ready to Schedule'"
      },
      "destination_node_id": "node-status-ready-to-schedule"
    },
    {
      "id": "edge-status-waiting-for-tr",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Status equals 'Waiting For Travel Rep'"
      },
      "destination_node_id": "node-status-waiting-for-tr"
    },
    {
      "id": "edge-status-tr-assigned",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Status equals 'Travel Rep Assigned'"
      },
      "destination_node_id": "node-status-tr-assigned"
    },
    {
      "id": "edge-status-booking-pending",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Status equals 'Booking Pending'"
      },
      "destination_node_id": "node-status-booking-pending"
    },
    {
      "id": "edge-status-travel-pending",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Status equals 'Travel Pending'"
      },
      "destination_node_id": "node-status-travel-pending"
    },
    {
      "id": "edge-status-refund-pending",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Status equals 'Refund Pending'"
      },
      "destination_node_id": "node-status-refund-pending"
    },
    {
      "id": "edge-status-trip-complete",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Status equals 'Trip Complete'"
      },
      "destination_node_id": "node-status-trip-complete"
    }
  ]
}
```

#### Nodes 2-9: Status Response Nodes (Conversation Nodes)

**Node 2: Deposit Needed**
```json
{
  "id": "node-status-deposit-needed",
  "type": "conversation",
  "name": "Status: Deposit Needed",
  "instruction": {
    "type": "static_text",
    "text": "Ok so it looks like you have activated but you still need to pay the deposit."
  },
  "display_position": {"x": 600, "y": 50},
  "edges": [...]
}
```

**Node 3: Ready to Schedule**
```json
{
  "id": "node-status-ready-to-schedule",
  "type": "conversation",
  "name": "Status: Ready to Schedule",
  "instruction": {
    "type": "static_text",
    "text": "Looks like your deposit is all paid so you are ready to select dates."
  },
  "display_position": {"x": 600, "y": 150},
  "edges": [...]
}
```

**Node 4: Waiting For Travel Rep**
```json
{
  "id": "node-status-waiting-for-tr",
  "type": "conversation",
  "name": "Status: Waiting For Travel Rep",
  "instruction": {
    "type": "static_text",
    "text": "Looks like your dates are all set up and you're just waiting for a travel rep to be assigned. Normally that's 45-75 days before the trip."
  },
  "display_position": {"x": 600, "y": 250},
  "edges": [...]
}
```

**Node 5: Travel Rep Assigned**
```json
{
  "id": "node-status-tr-assigned",
  "type": "conversation",
  "name": "Status: Travel Rep Assigned",
  "instruction": {
    "type": "static_text",
    "text": "Looks like your travel rep has been assigned so be sure to answer any phone calls from the 805 area code."
  },
  "display_position": {"x": 600, "y": 350},
  "edges": [...]
}
```

**Node 6: Booking Pending**
```json
{
  "id": "node-status-booking-pending",
  "type": "conversation",
  "name": "Status: Booking Pending",
  "instruction": {
    "type": "static_text",
    "text": "Looks like you've already spoken to the travel rep but we haven't finalized the booking, expect a call from a booking agent 7-14 days before the trip."
  },
  "display_position": {"x": 600, "y": 450},
  "edges": [...]
}
```

**Node 7: Travel Pending**
```json
{
  "id": "node-status-travel-pending",
  "type": "conversation",
  "name": "Status: Travel Pending",
  "instruction": {
    "type": "static_text",
    "text": "Looks like everything has been booked and email and your trip is coming soon, ah"
  },
  "display_position": {"x": 600, "y": 550},
  "edges": [...]
}
```

**Node 8: Refund Pending ⚠️**
```json
{
  "id": "node-status-refund-pending",
  "type": "conversation",
  "name": "Status: Refund Pending",
  "instruction": {
    "type": "static_text",
    "text": "So it looks like you guys already traveled, how can I help you?"
  },
  "display_position": {"x": 600, "y": 650},
  "edges": [...]
}
```

**CRITICAL:** Never mention the refund unless customer brings it up

**Node 9: Trip Complete**
```json
{
  "id": "node-status-trip-complete",
  "type": "conversation",
  "name": "Status: Trip Complete",
  "instruction": {
    "type": "static_text",
    "text": "So it looks like you guys already traveled, how can I help you?"
  },
  "display_position": {"x": 600, "y": 750},
  "edges": [...]
}
```

---

## Testing Scenarios

### Test 1: Deposit Needed
**Phone:** 8182121359
**Expected Status:** Deposit Needed
**Expected Response:** "Ok so it looks like you have activated but you still need to pay the deposit."

### Test 2: Multi-Certificate Customer
**Phone:** 6193188486
**Expected:** Phone lookup returns 3 certificates
**Flow:** Agent asks which destination → Uses phone-pkg-lookup → Gets status

### Test 3: Travel Pending
**Phone:** [Customer with upcoming trip]
**Expected Status:** Travel Pending
**Expected Response:** "Looks like everything has been booked and email and your trip is coming soon, ah"

### Test 4: Refund Pending
**Phone:** [Customer with active refund]
**Expected Status:** Refund Pending
**Expected Response:** "So it looks like you guys already traveled, how can I help you?"
**Critical:** Agent does NOT mention refund proactively

---

## API Endpoints Summary

All deployed at: `https://web-production-4080.up.railway.app/api/rims/`

1. **phone-lookup** - Returns ALL records for a phone
2. **phone-pkg-lookup** - Phone + certificate lookup
3. **vac-id-lookup** - Direct vacation ID query
4. **pkg-vac-lookup** - Package code + vacation ID
5. **customer-status** - Unified status endpoint (uses above endpoints)

---

## Deployment Checklist

- [ ] customer-status endpoint deployed to Railway (or verify it's already there)
- [ ] customer_status tool created in Retell Dashboard
- [ ] Tool ID copied and saved
- [ ] 9 nodes created in Retell flow (1 function + 8 conversation)
- [ ] All 8 edges configured from function node to status nodes
- [ ] Each conversation node uses `static_text` instruction type
- [ ] Scripts are verbatim from [AGENT-SCRIPTS-ALL-STATUSES.md](AGENT-SCRIPTS-ALL-STATUSES.md)
- [ ] Flow tested with real phone numbers
- [ ] Multi-certificate handling tested (phone 6193188486)
- [ ] Refund Pending tested (confirms no proactive mention of refund)
- [ ] Flow deployed to production

---

## Troubleshooting

### Issue: customer_status tool returns "not found"
**Solution:** Check Railway logs, verify endpoint is deployed and accessible

### Issue: Status routing not working
**Solution:** Verify edge transition conditions match exact status strings (case-sensitive)

### Issue: Agent not saying exact scripts
**Solution:** Ensure instruction type is `static_text`, not `prompt`

### Issue: Multi-certificate customer routing fails
**Solution:** Check that phone-pkg-lookup tool is created and flow handles multiple records

---

## Next Steps After Deployment

1. Monitor first 20-50 calls for accuracy
2. Check analytics for status distribution
3. Verify all 8 statuses are being reached
4. Confirm refund pending customers don't get refund mentioned
5. Gather feedback from customer service team
6. Iterate on edge cases

---

**Implementation Status:**
✅ API Ready
✅ Scripts Ready
✅ Documentation Complete
⬜ Retell Flow Deployment Pending

**Estimated Deployment Time:** 30-45 minutes
