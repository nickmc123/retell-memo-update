# Customer Status API - Complete Guide

**NEW ENDPOINT**: `GET /api/customer/status` - Get ALL customer status in ONE call from caller ID

---

## 🎯 What This Does

Instead of making 4-5 separate API calls to get:
- Customer basic info ✅
- Deposit status ✅
- Travel rep status ✅
- Booking status ✅
- Recommended action ✅

**You now get EVERYTHING in ONE call** with a pre-written agent message!

---

## 🚀 Quick Start

### API Endpoint
```
GET https://web-production-4080.up.railway.app/api/customer/status?phone={{call.from_number}}
```

### Example Request
```bash
curl "https://web-production-4080.up.railway.app/api/customer/status?phone=%2B18182121359"
```

### Example Response (Active Customer, Ready to Travel)
```json
{
  "found": true,
  "status": {
    "overall": "ready_to_travel",
    "category": "active_customer",
    "recommended_action": "verify_itinerary",
    "agent_message": "Great news! Your deposits are complete and you're booked. Your travel rep is John Smith. Do you need your itinerary resent?"
  },
  "customer": {
    "customer_id": "123456",
    "phone": "+18182121359",
    "email": "sarah.johnson@email.com",
    "first_name": "Sarah",
    "last_name": "Johnson",
    "full_name": "Sarah Johnson"
  },
  "certificate": {
    "certificate_number": "BEACH123",
    "package_type": "BEACH",
    "confirmation_status": "confirm"
  },
  "deposits": {
    "status": "complete",
    "val_dep": 250,
    "conf_deposit": 500,
    "total_paid": 750,
    "expected_deposit": 750,
    "remaining": 0,
    "activation_method": "online"
  },
  "travel_rep": {
    "status": "complete",
    "name": "John Smith",
    "documents_sent": true,
    "docs_date": "2025-05-01"
  },
  "travel_dates": {
    "scheduled": true,
    "start_date": "2025-06-15",
    "days_until_travel": 45
  },
  "booking": {
    "is_booked": true,
    "flight_booking": "FLIGHT123",
    "hotel_booking": "HOTEL456"
  }
}
```

---

## 📊 Status Values Reference

### Overall Status (`status.overall`)

| Value | Meaning | Recommended Action |
|-------|---------|-------------------|
| `ready_to_travel` | Deposits complete + Booked | Ask if they need itinerary |
| `ready_to_schedule` | Deposits complete + Travel date set | Transfer to scheduling team |
| `deposits_complete` | Deposits complete + No travel date | Offer to schedule travel |
| `deposits_incomplete` | Partial payment received | Collect remaining payment |
| `deposits_pending` | No payment received | Direct to online activation or ask if mailed |
| `unknown` | Customer not found | Standard greeting |

### Customer Category (`status.category`)

| Value | Meaning |
|-------|---------|
| `active_customer` | Deposits complete (val_dep + conf_deposit >= expected) |
| `pending_customer` | Deposits incomplete or not received |
| `new_caller` | Not found in RIMS database |

### Deposit Status (`deposits.status`)

| Value | Meaning |
|-------|---------|
| `complete` | Total paid >= Expected deposit |
| `partial` | Total paid > 0 but < Expected deposit |
| `none` | No deposits received (total paid = 0) |

### Travel Rep Status (`travel_rep.status`)

| Value | Meaning | Action |
|-------|---------|--------|
| `complete` | TR assigned + Documents sent | Customer can contact TR directly |
| `assigned_no_docs` | TR assigned but no docs sent yet | Create memo: "Ask TR to call" |
| `needs_urgent` | Travel < 45 days, no TR | Create memo: "Needs TR assignment URGENT" |
| `normal_window` | Travel 45-75 days, no TR | Normal - TR will be assigned soon |
| `too_early` | Travel > 75 days | Too early for TR assignment |
| `not_needed` | No travel date set | Not applicable |

### Recommended Action (`status.recommended_action`)

| Value | What To Do |
|-------|-----------|
| `verify_itinerary` | Ask: "Do you need your itinerary resent?" |
| `transfer_to_scheduling` | Say: "Let me transfer you to schedule your travel" |
| `offer_scheduling` | Ask: "When would you like to travel?" |
| `collect_payment` | Inform remaining balance, offer payment options |
| `none` | Just answer their question |

---

## 🤖 How to Use in Retell AI Agent

### Step 1: Create the Tool

Go to Retell AI → Tools → Create Custom Tool

Use the configuration from: [customer-status-tool-config.json](customer-status-tool-config.json)

Or manually configure:
- **Name**: `get_customer_status`
- **URL**: `https://web-production-4080.up.railway.app/api/customer/status`
- **Method**: `GET`
- **Parameters**:
  - `phone` (string, required) = `{{call.from_number}}`

### Step 2: Add to Agent

Add the tool to your agent (`***REMOVED***`)

### Step 3: Update General Prompt

Add this to your agent's general prompt:

```
CRITICAL - FIRST ACTION ON EVERY CALL:
Immediately call get_customer_status tool using {{call.from_number}}.
This happens SILENTLY before you greet the customer.

After the status lookup:
- Use {{agent_message}} to greet the customer with the recommended message
- The agent_message is pre-written and contextual to their exact situation
- DO NOT make up your own greeting - USE the agent_message provided

Example flow:
1. Call starts
2. [SILENT] Call get_customer_status(phone: {{call.from_number}})
3. Receive response with agent_message
4. Greet customer by saying: {{agent_message}}
5. Customer responds
6. Continue based on their response and {{recommended_action}}

Key variables available after lookup:
- {{agent_message}} - Pre-written greeting for this customer's status
- {{overall_status}} - ready_to_travel, deposits_complete, deposits_incomplete, etc.
- {{deposit_status}} - complete, partial, none
- {{deposit_remaining}} - Amount still owed
- {{certificate_number}} - Their certificate
- {{travel_rep_name}} - Their assigned travel rep (if any)
- {{recommended_action}} - What to do next

IMPORTANT:
- If customer_found is FALSE: Use standard greeting "Thank you for calling Casablanca Express"
- If customer_found is TRUE: Use {{agent_message}} as your greeting
```

### Step 4: Create Conversational Flow (Optional but Recommended)

#### Node 1: Auto Status Lookup (Function Node)
```json
{
  "id": "node-auto-status",
  "type": "function",
  "name": "Get Customer Status",
  "tool_id": "{{YOUR_get_customer_status_TOOL_ID}}",
  "tool_type": "local",
  "instruction": {
    "type": "prompt",
    "text": "Silently look up comprehensive customer status using caller ID"
  },
  "wait_for_result": true,
  "speak_during_execution": false,
  "edges": [
    {
      "id": "edge-status-complete",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Status lookup completed"
      },
      "destination_node_id": "node-customer-found-check"
    }
  ]
}
```

#### Node 2: Customer Found Check (Logic Split)
```json
{
  "id": "node-customer-found-check",
  "type": "logic_split",
  "name": "Check if Customer Found",
  "edges": [
    {
      "id": "edge-found",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Customer found (found: true)"
      },
      "destination_node_id": "node-personalized-greeting"
    },
    {
      "id": "edge-not-found",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Customer not found (found: false)"
      },
      "destination_node_id": "node-standard-greeting"
    }
  ]
}
```

#### Node 3: Personalized Greeting (Conversation)
```json
{
  "id": "node-personalized-greeting",
  "type": "conversation",
  "name": "Greet with Status Message",
  "instruction": {
    "type": "prompt",
    "text": "Greet the customer using the pre-written agent_message: '{{agent_message}}'. Then ask how you can help or proceed based on their response."
  },
  "edges": [
    {
      "id": "edge-to-action-router",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Customer responds"
      },
      "destination_node_id": "node-action-router"
    }
  ]
}
```

#### Node 4: Action Router (Logic Split)
```json
{
  "id": "node-action-router",
  "type": "logic_split",
  "name": "Route Based on Recommended Action",
  "edges": [
    {
      "id": "edge-verify-itinerary",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Recommended action is verify_itinerary"
      },
      "destination_node_id": "node-itinerary-question"
    },
    {
      "id": "edge-transfer-scheduling",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Recommended action is transfer_to_scheduling"
      },
      "destination_node_id": "node-transfer-to-scheduling"
    },
    {
      "id": "edge-collect-payment",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Recommended action is collect_payment"
      },
      "destination_node_id": "node-payment-info"
    }
  ]
}
```

---

## 💡 Example Scenarios

### Scenario 1: Active Customer, Deposits Complete, Booked
**Caller ID**: +18182121359

**API Response**:
```json
{
  "status": {
    "overall": "ready_to_travel",
    "agent_message": "Great news! Your deposits are complete and you're booked. Your travel rep is John Smith. Do you need your itinerary resent?"
  }
}
```

**Agent Says**: "Great news! Your deposits are complete and you're booked. Your travel rep is John Smith. Do you need your itinerary resent?"

**If Yes**: Offer to create memo to resend itinerary
**If No**: Ask if they have other questions

---

### Scenario 2: Partial Deposits
**Caller ID**: Unknown number

**API Response**:
```json
{
  "status": {
    "overall": "deposits_incomplete",
    "agent_message": "I see you've paid $250 toward your $750 deposit. You have $500 remaining. Would you like to complete your payment today?"
  },
  "deposits": {
    "total_paid": 250,
    "remaining": 500
  }
}
```

**Agent Says**: "I see you've paid $250 toward your $750 deposit. You have $500 remaining. Would you like to complete your payment today?"

**Next**: Provide payment instructions or transfer to payment team

---

### Scenario 3: Customer Not Found
**Caller ID**: +19999999999

**API Response**:
```json
{
  "found": false,
  "status": {
    "overall": "unknown",
    "category": "new_caller"
  }
}
```

**Agent Says**: "Thank you for calling Casablanca Express. How may I help you today?"

**Next**: Ask if they have a certificate number, or general inquiry

---

## 🧪 Testing

### Test with Known Customer
```bash
curl "https://web-production-4080.up.railway.app/api/customer/status?phone=%2B18182121359"
```

**Expected**: Returns full status with certificate ECFWIN

### Test with Unknown Number
```bash
curl "https://web-production-4080.up.railway.app/api/customer/status?phone=%2B19999999999"
```

**Expected**: Returns `found: false`

---

## 🔄 Deployment Instructions

The endpoint has been added to `rims-api-caspio.js`. To deploy:

### Option 1: Railway Auto-Deploy (If Connected to GitHub)
```bash
cd /Users/nickmac/VSC-Claude-User-Data/Integration-Implementation/integration-implementation
git add rims-api-caspio.js
git commit -m "Add comprehensive customer status endpoint"
git push
```
Railway will auto-deploy.

### Option 2: Manual Railway Deploy
```bash
cd /Users/nickmac/VSC-Claude-User-Data/Integration-Implementation/integration-implementation
railway up
```

### Verify Deployment
```bash
curl "https://web-production-4080.up.railway.app/health"
```

Should show:
```json
{
  "status": "healthy",
  "mode": "production",
  "database": "caspio"
}
```

---

## ✅ Setup Checklist

- [ ] Endpoint code added to `rims-api-caspio.js` ✅
- [ ] Deploy to Railway
- [ ] Test with: `curl "https://web-production-4080.up.railway.app/api/customer/status?phone=%2B18182121359"`
- [ ] Create tool in Retell AI using [customer-status-tool-config.json](customer-status-tool-config.json)
- [ ] Add tool to agent `***REMOVED***`
- [ ] Update agent general prompt with status lookup instructions
- [ ] Test call from +18182121359
- [ ] Verify agent uses {{agent_message}} in greeting

---

## 🎯 Benefits

**Before** (Multiple API calls):
```
1. Call /api/customer/lookup
2. Call /api/logic/deposits-check
3. Call /api/logic/travel-rep-check
4. Call /api/logic/booking-check
5. Agent interprets all 4 responses
6. Agent constructs appropriate message
```

**After** (One API call):
```
1. Call /api/customer/status
2. Agent uses pre-written {{agent_message}}
✅ Faster, simpler, more consistent!
```

---

## 📁 Related Files

- **Tool Config**: [customer-status-tool-config.json](customer-status-tool-config.json)
- **API Source Code**: [rims-api-caspio.js](../Integration-Implementation/integration-implementation/rims-api-caspio.js) (lines 1109-1304)
- **Setup Guide**: [CALLER-ID-LOOKUP-SETUP.md](CALLER-ID-LOOKUP-SETUP.md)

---

**Ready to use! Just deploy and test.** 🚀
