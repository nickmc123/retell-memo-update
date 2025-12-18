# Conversational Flow Updates - Retry Logic for Lookup Failures

## Changes Made

### 1. Phone Lookup Retry Node
**Node ID:** `node-phone-retry`
**Name:** "Phone Not Found - Retry"

**Behavior:**
When phone lookup returns "not found", instead of immediately asking for certificate, the agent now says:

> "Hmm that didn't come up, can you tell me the phone number once more or do you have another phone number you would like me to check?"

**Flow:**
```
Phone Lookup (not found)
  → Phone Not Found - Retry
    → Customer provides another phone → Phone Lookup (retry)
    → Customer doesn't have phone → Ask for Certificate
```

**Edges:**
- `edge-retry-provides-phone` → Goes back to phone-lookup
- `edge-retry-no-phone` → Goes to certificate request

---

### 2. Certificate Lookup Retry Node
**Node ID:** `node-cert-retry`
**Name:** "Certificate Not Found - Retry"

**Behavior:**
When certificate lookup returns "not found", the agent now says:

> "Hmm that certificate number didn't come up, can you tell me the certificate number once more? It should be a combination of letters and numbers."

**Flow:**
```
Certificate Lookup (not found)
  → Certificate Not Found - Retry
    → Customer provides another certificate → Certificate Lookup (retry)
    → Customer cannot find certificate → Escalate to live agent
```

**Edges:**
- `edge-cert-retry-provides-cert` → Goes back to certificate-lookup
- `edge-cert-retry-no-cert` → Goes to escalation node

---

## Benefits

### 1. Better Customer Experience
- Gives customers a second chance before escalation
- Acknowledges the lookup failure politely ("Hmm that didn't come up")
- Offers alternative options (another phone number)

### 2. Reduces Escalations
- Many customers may have multiple phone numbers
- Typos or misheard numbers can be corrected
- Avoids frustration of immediate "not found" dead-ends

### 3. Natural Conversation Flow
- Uses casual, friendly language ("Hmm")
- Mirrors how a human agent would handle the situation
- Maintains Kassie's professional but approachable tone

---

## Updated Flow Diagram

```
Start: Ask Phone
  │
  ▼
Phone Lookup
  ├─ Found → Greet by Name → Continue
  │
  └─ Not Found → Phone Retry Node
      ├─ Provides Another Phone → Phone Lookup (retry)
      └─ No Phone → Ask Certificate
          │
          ▼
      Certificate Lookup
          ├─ Found → Continue
          └─ Not Found → Certificate Retry Node
              ├─ Provides Certificate → Certificate Lookup (retry)
              └─ Cannot Find → Escalate to Live Agent
```

---

## Integration with Multi-Certificate Customers

These retry mechanisms work seamlessly with the new phone-lookup endpoint that returns all records:

**Scenario:**
- Customer calls with phone 6193188486
- Phone lookup returns **3 certificates** (count: 3)
- Agent can ask: "I see you have 3 vacation packages with us. Which one are you calling about?"
- Customer specifies certificate (e.g., "ECRCNV")
- Agent uses phone-pkg-lookup to get exact record

**Retry Logic Still Applies:**
- If initial phone lookup fails completely → Retry node
- If customer has multiple certificates → Agent clarifies which one
- If certificate lookup fails → Certificate retry node

---

## Deployment

### File Modified:
`updated-flow.json`

### Changes:
1. Added `node-phone-retry` between phone-lookup failure and certificate request
2. Added `node-cert-retry` between certificate-lookup failure and escalation
3. Updated edge destinations for both lookup "not found" conditions

### Testing Scenarios:

**Test 1: Phone Number Typo**
- User: "6193188486"
- Lookup: Not found
- Agent: "Hmm that didn't come up, can you tell me the phone number once more?"
- User: "Oh sorry, 6193188487"
- Lookup: Retry successful

**Test 2: Wrong Phone Then Certificate**
- User: "5551234567"
- Lookup: Not found
- Agent: "Hmm that didn't come up... do you have another phone number?"
- User: "No, but I have my certificate"
- Agent: "Great! What's your certificate number?"

**Test 3: Certificate Correction**
- User provides certificate: "ECRAS"
- Lookup: Not found
- Agent: "Hmm that certificate number didn't come up, can you tell me the certificate number once more?"
- User: "Sorry, it's ECRCNV"
- Lookup: Found

---

## Next Steps

1. ✅ Updated flow JSON with retry nodes
2. ⬜ Deploy updated flow to Retell AI
3. ⬜ Test both retry scenarios with real calls
4. ⬜ Monitor analytics for retry success rates

---

## Retell API Update Command

To deploy the updated flow:

```bash
curl -X PATCH "https://api.retellai.com/update-conversation-flow/conversation_flow_e00fdf7bc95d" \
  -H "Authorization: Bearer YOUR_RETELL_API_KEY" \
  -H "Content-Type: application/json" \
  -d @updated-flow.json
```

Or use the Retell Dashboard → Conversation Flows → Edit → Import JSON
