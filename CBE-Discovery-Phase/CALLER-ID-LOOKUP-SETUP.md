# Add Caller ID Lookup to Casablanca Express Agent

**Agent ID**: `***REMOVED***`
**API Endpoint**: `https://web-production-4080.up.railway.app`

---

## ✅ Step 1: Create the Customer Lookup Tool in Retell AI

Go to: https://beta.retellai.com → **Tools** → **Create Custom Tool**

### Tool Configuration

```json
{
  "tool_name": "lookup_customer_by_caller_id",
  "description": "Automatically look up customer in RIMS database using their phone number from caller ID. Returns customer details, certificate info, and deposit status.",
  "url": "https://web-production-4080.up.railway.app/api/customer/lookup",
  "method": "GET",
  "speak_during_execution": false,
  "parameters": [
    {
      "name": "phone",
      "type": "string",
      "description": "Customer phone number from caller ID",
      "required": true
    }
  ]
}
```

**After creating this tool, copy the `tool_id` that Retell assigns** (it will look like `tool-abc123xyz`).

---

## ✅ Step 2: Update Agent General Prompt

Go to: **Agents** → `***REMOVED***` → **General Prompt**

Add this to the **beginning** of your agent's general prompt:

```
CRITICAL INSTRUCTION - FIRST ACTION ON EVERY CALL:
As soon as the call starts, IMMEDIATELY call the lookup_customer_by_caller_id tool using {{call.from_number}} as the phone parameter. Do this BEFORE greeting the customer. This lookup happens silently in the background.

- If customer is found (found: true):
  * Greet them warmly and acknowledge their existing relationship
  * Reference their certificate number: "I see you have certificate {{certificate_number}}"
  * Check their deposit status to determine next steps
  * If deposits are complete, offer to transfer them to schedule travel dates
  * If deposits are incomplete, inform them of the remaining balance

- If customer is not found (found: false):
  * Greet them professionally
  * Ask how you can help them today
  * If they mention they have a certificate, ask for the certificate number and look them up again

CUSTOMER DATA VARIABLES (available after lookup):
- {{customer_id}} - Customer's vac_id from RIMS
- {{certificate_number}} - Their certificate (pkg_code2)
- {{package_type}} - Package code (pkg_code)
- {{deposit_paid}} - Boolean: true if deposits complete
- {{deposit_amount}} - Amount paid so far
- {{email}} - Customer email
- {{full_name}} - Customer name (may be "Unknown Customer" if blank in database)
```

---

## ✅ Step 3: Add Tool to Agent

Go to: **Agents** → `***REMOVED***` → **Tools**

1. Click **Add Tool**
2. Select `lookup_customer_by_caller_id` from the dropdown
3. Save

---

## ✅ Step 4: Create Conversational Flow Nodes (Recommended)

For the best experience, update your agent's conversational flow to include:

### Node 1: Auto Lookup (Function Node)
```json
{
  "id": "node-auto-lookup",
  "type": "function",
  "name": "Auto Lookup Customer",
  "tool_id": "{{YOUR_TOOL_ID_FROM_STEP_1}}",
  "tool_type": "local",
  "instruction": {
    "type": "prompt",
    "text": "Silently look up the customer using {{call.from_number}}. Do not speak during this lookup."
  },
  "wait_for_result": true,
  "speak_during_execution": false,
  "edges": [
    {
      "id": "edge-lookup-complete",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Lookup completed (customer found or not found)"
      },
      "destination_node_id": "node-customer-found-check"
    }
  ]
}
```

### Node 2: Customer Found Check (Logic Split Node)
```json
{
  "id": "node-customer-found-check",
  "type": "logic_split",
  "name": "Check if Customer Found",
  "edges": [
    {
      "id": "edge-customer-found",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Customer was found in database (found: true in response)"
      },
      "destination_node_id": "node-existing-customer-greeting"
    },
    {
      "id": "edge-customer-not-found",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Customer not found in database (found: false in response)"
      },
      "destination_node_id": "node-new-caller-greeting"
    }
  ]
}
```

### Node 3A: Existing Customer Greeting (Conversation Node)
```json
{
  "id": "node-existing-customer-greeting",
  "type": "conversation",
  "name": "Greet Existing Customer",
  "instruction": {
    "type": "prompt",
    "text": "Warmly greet the customer and acknowledge you found their account. Say something like: 'Hi! I see you're calling from the number associated with certificate {{certificate_number}}. How can I help you today?' Use their name if available: {{full_name}}."
  },
  "edges": [
    {
      "id": "edge-existing-to-intent",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Customer responds with their question or need"
      },
      "destination_node_id": "node-check-deposit-status"
    }
  ]
}
```

### Node 3B: New Caller Greeting (Conversation Node)
```json
{
  "id": "node-new-caller-greeting",
  "type": "conversation",
  "name": "Greet New Caller",
  "instruction": {
    "type": "static_text",
    "text": "Thank you for calling Casablanca Express. How may I help you today?"
  },
  "edges": [
    {
      "id": "edge-new-to-intent",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Customer explains their reason for calling"
      },
      "destination_node_id": "node-handle-general-inquiry"
    }
  ]
}
```

### Node 4: Check Deposit Status (Logic Split Node)
```json
{
  "id": "node-check-deposit-status",
  "type": "logic_split",
  "name": "Check Deposit Status",
  "edges": [
    {
      "id": "edge-deposits-complete",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Deposit is paid (deposit_paid: true)"
      },
      "destination_node_id": "node-deposits-complete"
    },
    {
      "id": "edge-deposits-incomplete",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Deposit not paid or incomplete (deposit_paid: false)"
      },
      "destination_node_id": "node-deposits-incomplete"
    }
  ]
}
```

### Node 5A: Deposits Complete (Conversation Node)
```json
{
  "id": "node-deposits-complete",
  "type": "conversation",
  "name": "Handle Complete Deposits",
  "instruction": {
    "type": "prompt",
    "text": "Great news - your deposits are complete! You're all set to schedule your travel dates. Would you like me to transfer you to our scheduling team, or is there something else I can help you with?"
  },
  "edges": [
    {
      "id": "edge-wants-transfer",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Customer wants to schedule travel or be transferred"
      },
      "destination_node_id": "node-transfer-to-scheduling"
    },
    {
      "id": "edge-other-question",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Customer has other questions"
      },
      "destination_node_id": "node-handle-general-inquiry"
    }
  ]
}
```

### Node 5B: Deposits Incomplete (Conversation Node)
```json
{
  "id": "node-deposits-incomplete",
  "type": "conversation",
  "name": "Handle Incomplete Deposits",
  "instruction": {
    "type": "prompt",
    "text": "I see you have a partial payment of ${{deposit_amount}} on file. You'll need to complete your deposits before we can schedule your travel dates. Would you like information on how to make the remaining payment?"
  },
  "edges": [
    {
      "id": "edge-payment-info",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Customer wants payment information"
      },
      "destination_node_id": "node-provide-payment-info"
    }
  ]
}
```

---

## ✅ Step 5: Test the Integration

### Test with Real Data

Call your agent from the phone number: **+18182121359**

**Expected behavior:**
1. Agent answers
2. Silently looks up customer in database
3. Finds customer with certificate `ECFWIN`
4. Greets you acknowledging your certificate
5. Offers relevant help based on deposit status

### Test with Unknown Number

Call from a number NOT in the database.

**Expected behavior:**
1. Agent answers
2. Silently looks up customer in database
3. Customer not found
4. Gives general greeting: "Thank you for calling Casablanca Express. How may I help you today?"

---

## 🎯 Quick Start (Minimal Setup)

If you don't want to build the full flow yet, just do Steps 1-3 above. The agent's general prompt will handle the lookup automatically on every call.

**Pros**: Fast, works immediately
**Cons**: Less structured than a proper flow

---

## 📊 What Customer Data is Available

After the lookup completes, the agent has access to:

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `{{customer_id}}` | `155002` | Customer's unique ID (vac_id) |
| `{{phone}}` | `+18182121359` | Customer phone number |
| `{{email}}` | `NICKMC123@GMAIL.COM` | Customer email |
| `{{full_name}}` | `"Unknown Customer"` | Name (may be blank in DB) |
| `{{certificate_number}}` | `ECFWIN` | Certificate code (pkg_code2) |
| `{{package_type}}` | `ECF` | Package type (pkg_code) |
| `{{deposit_paid}}` | `true` | Whether deposits are complete |
| `{{deposit_amount}}` | `0` | Amount paid so far |
| `{{travel_dates_scheduled}}` | `false` | Whether travel dates are booked |
| `{{travel_start_date}}` | `null` | Start date if booked |

---

## 🐛 Troubleshooting

### Issue: "Tool not found"
**Solution**: Make sure you added the tool to the agent in Step 3

### Issue: "Customer not found" for known numbers
**Check**:
1. Is the phone number in E.164 format? (+1XXXXXXXXXX)
2. Test the API directly: `curl "https://web-production-4080.up.railway.app/api/customer/lookup?phone=%2B18182121359"`
3. Check if the number exists in Caspio database

### Issue: Lookup is taking too long
**Solution**: The API should respond in < 2 seconds. If slower:
1. Check Railway deployment status
2. Test health endpoint: `curl https://web-production-4080.up.railway.app/health`

### Issue: Agent doesn't use the customer data
**Check**: Make sure you updated the general prompt (Step 2) with the customer recognition logic

---

## 📁 Files You May Need

- **API Documentation**: [API-READY-FOR-RETELL.md](../Integration-Implementation/integration-implementation/API-READY-FOR-RETELL.md)
- **Tool Configurations**: [retell-tools-config.json](integration-implementation/retell-tools-config.json)
- **Full Integration Guide**: [DEPLOYMENT-GUIDE.md](integration-implementation/DEPLOYMENT-GUIDE.md)

---

## ✅ Success Checklist

- [ ] Tool created in Retell AI dashboard
- [ ] Tool added to agent `***REMOVED***`
- [ ] General prompt updated with caller ID lookup instructions
- [ ] Test call made from known number (+18182121359)
- [ ] Agent recognizes customer and references certificate
- [ ] Test call made from unknown number
- [ ] Agent gives general greeting for unknown caller

---

## 🚀 Next Steps

Once caller ID lookup is working, consider adding these tools:
1. `get_certificate_details` - Get detailed cert info
2. `check_refund_status` - Check refund status
3. `check_calendar_availability` - View available dates
4. `book_travel_dates` - Book travel dates

See [RETELL-TOOLS-SPECIFICATIONS.md](../Integration-Implementation/integration-implementation/RETELL-TOOLS-SPECIFICATIONS.md) for configurations.

---

**Questions?** The API is live and ready at: `https://web-production-4080.up.railway.app`

Test it anytime: `curl "https://web-production-4080.up.railway.app/health"`
