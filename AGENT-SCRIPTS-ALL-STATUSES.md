# Agent Scripts for All 8 Customer Statuses

## Complete Conversation Scripts - Ready for Retell AI Implementation

---

## 1. Deposit Needed

**Status:** `Deposit Needed`
**Condition:** Customer has activated but deposit not fully paid

**Agent Script (Static Text):**
```
Ok so it looks like you have activated but you still need to pay the deposit.
```

**Next Action:** Direct to payment information

---

## 2. Ready to Schedule

**Status:** `Ready to Schedule`
**Condition:** Deposits complete, no travel date assigned yet

**Agent Script (Static Text):**
```
Looks like your deposit is all paid so you are ready to select dates.
```

**Next Action:** Offer scheduling assistance

---

## 3. Waiting For Travel Rep

**Status:** `Waiting For Travel Rep`
**Condition:** Travel date assigned, within 45-75 day window, no TR assigned yet

**Agent Script (Static Text):**
```
Looks like your dates are all set up and you're just waiting for a travel rep to be assigned. Normally that's 45-75 days before the trip.
```

**Next Action:** Create urgent TR memo (internal), reassure customer

---

## 4. Travel Rep Assigned

**Status:** `Travel Rep Assigned`
**Condition:** TR assigned, awaiting final booking confirmation

**Agent Script (Static Text):**
```
Looks like your travel rep has been assigned so be sure to answer any phone calls from the 805 area code.
```

**Next Action:** Provide TR contact info if customer asks

---

## 5. Booking Pending

**Status:** `Booking Pending`
**Condition:** Customer made travel decision, bookings not finalized yet

**Agent Script (Static Text):**
```
Looks like you've already spoken to the travel rep but we haven't finalized the booking, expect a call from a booking agent 7-14 days before the trip.
```

**Next Action:** Set expectation for booking agent contact

---

## 6. Travel Pending

**Status:** `Travel Pending`
**Condition:** Trip confirmed, arrival date in the future

**Agent Script (Static Text):**
```
Looks like everything has been booked and email and your trip is coming soon, ah
```

**Next Action:** Confirm trip details, answer questions about upcoming travel

---

## 7. Refund Pending ⚠️

**Status:** `Refund Pending`
**Condition:** Refund amount > 0, refund docs not yet mailed

**Agent Script (Static Text):**
```
So it looks like you guys already traveled, how can I help you?
```

**⚠️ CRITICAL RULE:**
**NEVER MENTION THE REFUND UNLESS THE CUSTOMER BRINGS IT UP FIRST**

**Next Action:** Listen to customer's reason for calling, only discuss refund if they mention it

---

## 8. Trip Complete

**Status:** `Trip Complete`
**Condition:** Arrival date is in the past

**Agent Script (Static Text):**
```
So it looks like you guys already traveled, how can I help you?
```

**Next Action:** Ask how their trip was, assist with post-trip questions

---

## Implementation Notes for Retell AI

### Node Configuration

Each status should have a **conversation node** with:
- **Type:** `conversation`
- **Instruction Type:** `static_text` (verbatim - must say exactly as written)
- **Text:** The exact script above

### Example Node Structure:

```json
{
  "id": "node-status-deposit-needed",
  "type": "conversation",
  "name": "Status: Deposit Needed",
  "instruction": {
    "type": "static_text",
    "text": "Ok so it looks like you have activated but you still need to pay the deposit."
  },
  "display_position": {"x": 500, "y": 300},
  "edges": [
    {
      "id": "edge-continue-conversation",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Customer responds or asks a follow-up question"
      },
      "destination_node_id": "node-handle-inquiry"
    }
  ]
}
```

---

## Status Flow Routing

After calling the `customer_status` tool, the agent should route based on the `status` field:

```
customer_status API call
        ↓
   Returns status
        ↓
┌───────────────────────────────────┐
│ Route based on status value:      │
├───────────────────────────────────┤
│ "Deposit Needed" → Node 1         │
│ "Ready to Schedule" → Node 2      │
│ "Waiting For Travel Rep" → Node 3 │
│ "Travel Rep Assigned" → Node 4    │
│ "Booking Pending" → Node 5        │
│ "Travel Pending" → Node 6         │
│ "Refund Pending" → Node 7 ⚠️      │
│ "Trip Complete" → Node 8          │
└───────────────────────────────────┘
```

---

## Priority Order (How Status is Determined)

The customer-status endpoint checks conditions in this order:

1. **Refund Pending** (highest priority - can happen at any stage)
2. **Trip Complete** (arrival date in past)
3. **Travel Pending** (arrival date in future)
4. **Booking Pending** (decision made, bookings not complete)
5. **Travel Rep Assigned** (TR assigned, awaiting booking)
6. **Waiting For Travel Rep** (urgent - within 75 days, no TR)
7. **Ready to Schedule** (deposits paid, no travel date)
8. **Deposit Needed** (default - incomplete deposits)

---

## Special Handling Rules

### Refund Pending ⚠️
- Use the same script as "Trip Complete"
- **NEVER** proactively mention the refund
- Only discuss refund if customer asks about it
- Backend knows there's a refund pending, but agent stays neutral

### Trip Complete vs Refund Pending
- Both use identical agent script
- Backend differentiates them, but customer experience is the same
- Agent asks "how can I help you?" and lets customer lead the conversation

---

## Testing Checklist

- [ ] All 8 status nodes created in Retell flow
- [ ] Each node uses `static_text` instruction type
- [ ] Scripts are verbatim (no variations)
- [ ] Refund Pending node does NOT mention refund
- [ ] customer_status tool is configured and working
- [ ] Routing edges connect status results to correct nodes
- [ ] Test each status with real customer data

---

## Files Reference

| File | Purpose |
|------|---------|
| [customer-status-endpoint-standalone.js](customer-status-endpoint-standalone.js) | API logic for determining status |
| [CUSTOMER-STATUS-ENDPOINT.md](CUSTOMER-STATUS-ENDPOINT.md) | Full API documentation |
| [BOOKING-PENDING-STATUS.md](BOOKING-PENDING-STATUS.md) | Details on the new Booking Pending status |
| **This file** | Agent scripts for Retell AI implementation |

---

## Deployment Workflow

1. ✅ All 8 agent scripts collected (this document)
2. ⬜ Create customer_status tool in Retell Dashboard
3. ⬜ Create 8 conversation nodes in Retell flow
4. ⬜ Configure routing from customer_status function node to each status node
5. ⬜ Test flow with real customer phone numbers
6. ⬜ Deploy to production

---

**All scripts are final and ready for implementation!**
