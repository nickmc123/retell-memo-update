# Deployment Results
**Deployment Date:** December 25, 2025
**Source Workspace:** ***REMOVED***
**Destination Workspace:** ***REMOVED***

---

## ✅ Deployment Status: SUCCESS

All 4 Casablanca Express agents have been successfully deployed to the production workspace.

---

## Deployed Agents

### 1. BEST CS Agent with new app
- **Agent ID:** `agent_5abd51916ec3f4494f9d25bf96`
- **Flow ID:** `conversation_flow_d7b79588dcc0`
- **Status:** ✅ Deployed
- **Description:** Full-featured customer service agent with RIMS integration
- **Features:**
  - Phone number lookup
  - Customer status tracking (8 journey states)
  - Hawaii upsell offer
  - Google Chat team assistance
  - Transfer to scheduling department

### 2. Intro Transfer with hawaii with api
- **Agent ID:** `agent_4b26ab9290ebbec473c19cb48a`
- **Flow ID:** `conversation_flow_c70e387d7853`
- **Status:** ✅ Deployed
- **Description:** Greeting agent with Hawaii offer and API integration
- **Features:**
  - Professional intro greeting
  - Hawaii package offer ($699)
  - Transfer capabilities
  - API-enabled customer lookup

### 3. AFTER HOURS - Casablanca Express
- **Agent ID:** `agent_4ee91bca8830e45ccf4b8bec9a`
- **Flow ID:** `conversation_flow_259efed141dc`
- **Status:** ✅ Deployed
- **Description:** After-hours customer support agent
- **Voice:** 11labs-Nico
- **Features:**
  - Account lookup by phone
  - Status information delivery
  - Callback scheduling
  - Business hours information

### 4. BEST CS Agent with status check
- **Agent ID:** `agent_3f2d2c8815d485e88893e3ef4e`
- **Flow ID:** `conversation_flow_caf12884a166`
- **Status:** ✅ Deployed
- **Description:** Enhanced CS agent with comprehensive status checking
- **Features:**
  - Real-time customer status API
  - Hawaii offer integration
  - Google Chat team help
  - Full RIMS database integration

---

## API Integrations

All agents include these RIMS API tools:

| Tool Name | Endpoint | Purpose |
|-----------|----------|---------|
| rims_phone_lookup | `/api/rims/phone-lookup` | Customer lookup by phone |
| certificate_lookup | `/api/rims/certificate-lookup` | Lookup by certificate number |
| customer_status | `/api/rims/customer-status` | Check journey status |
| check_deposits | `/api/logic/deposits-check` | Verify deposit requirements |
| check_travel_rep | `/api/rims/check-rep` | Check rep assignment |
| check_booking_status | `/api/rims/check-booking-status` | Real-time booking status |
| create_memo | `/api/rims/create-memo` | Internal account notes |
| ask_team_for_help | `/api/human-assistance/ask` | Google Chat escalation |

**Base API URL:** https://web-production-4080.up.railway.app
**Human Assistance URL:** https://retell-human-assistance-production.up.railway.app

---

## Transfer Numbers

All agents configured with:
- **Scheduling Department:** +18189925100 (Ext 1)
- **Hawaii Offer Team:** +18055567546
- **Main Customer Service:** +18189925100

---

## Voice Settings

### CS Agents (1, 4)
- Voice: 11labs-Cimo
- Model: eleven_flash_v2_5
- Backchannel: Enabled (0.8)
- Ambient: call-center (0.8)

### Intro Transfer Agent (2)
- Voice: 11labs-James
- Model: eleven_turbo_v2
- Voice Speed: 1.04
- Volume: 1.16

### After Hours Agent (3)
- Voice: 11labs-Nico
- Model: eleven_flash_v2_5
- Backchannel: Enabled (0.6)
- Interruption Sensitivity: 0.66

---

## Post-Deployment Checklist

- ✅ All 4 agents created
- ✅ All 4 conversation flows deployed
- ✅ API tools configured
- ✅ Transfer numbers validated
- ✅ Voice settings applied
- ⚠️ **TODO:** Test each agent with live calls
- ⚠️ **TODO:** Verify RIMS API endpoints are accessible from new workspace
- ⚠️ **TODO:** Create knowledge bases (if needed)
- ⚠️ **TODO:** Publish agents to production

---

## Next Steps

1. **Test Each Agent:**
   - Make test calls to verify flows
   - Test RIMS API integrations
   - Verify transfer numbers work
   - Check Hawaii offer presentation

2. **Knowledge Base Setup (Optional):**
   - The agents reference 5 knowledge bases from the source workspace
   - These were removed during migration
   - If needed, recreate KBs in destination workspace:
     - Office hours and holidays
     - Mailing address for payments
     - Activation instructions
     - AI transparency information
     - General FAQs

3. **Publish Agents:**
   - Once testing is complete
   - Update version numbers as needed
   - Set `is_published: true`

4. **Monitor Performance:**
   - Track post-call analysis data
   - Review call transcripts
   - Optimize based on customer feedback

---

## Files in This Export

```
Casablanca-Express-CS-Production/
├── EXPORT_SUMMARY.md
├── DEPLOYMENT_RESULTS.md (this file)
├── AFTER_HOURS_Casablanca_Express_agent.json
├── AFTER_HOURS_Casablanca_Express_flow.json
├── BEST_CS_Agent_with_new_app_agent.json
├── BEST_CS_Agent_with_new_app_flow.json
├── BEST_CS_Agent_with_status_check_agent.json
├── BEST_CS_Agent_with_status_check_flow.json
├── Intro_Transfer_with_hawaii_with_api_agent.json
└── Intro_Transfer_with_hawaii_with_api_flow.json
```

---

**✅ Deployment completed successfully on December 25, 2025 at 7:15 AM PST**
