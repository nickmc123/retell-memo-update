# Casablanca Express - Agent Export Summary

**Export Date:** December 25, 2025
**Source Workspace:** ***REMOVED***
**Destination Workspace:** ***REMOVED***
**Filter Criteria:** Agents modified in the last 7 days

---

## Exported Agents (4 Total)

### 1. BEST CS Agent with new app
- **Agent ID:** agent_3750372148b97cdca1630fbcf2
- **Flow ID:** conversation_flow_442577ac64f9
- **Last Modified:** December 22, 2025
- **Status:** Published
- **Description:** Current customer service agent with full RIMS integration
- **Files:**
  - `BEST_CS_Agent_with_new_app_agent.json` - Agent configuration
  - `BEST_CS_Agent_with_new_app_flow.json` - Conversation flow

### 2. Intro Transfer with hawaii with api
- **Agent ID:** ***REMOVED***
- **Flow ID:** conversation_flow_e5029e536034
- **Last Modified:** December 24, 2025
- **Status:** Published (Version 25)
- **Description:** Intro greeting agent with Hawaii offer and API integration
- **Files:**
  - `Intro_Transfer_with_hawaii_with_api_agent.json` - Agent configuration
  - `Intro_Transfer_with_hawaii_with_api_flow.json` - Conversation flow

### 3. AFTER HOURS - Casablanca Express
- **Agent ID:** agent_75a9334ddd2e31b4402b6d8bcf
- **Flow ID:** conversation_flow_bd1c16a70fa0
- **Last Modified:** December 24, 2025
- **Status:** Published (Version 5)
- **Description:** After-hours service agent for off-hours customer support
- **Files:**
  - `AFTER_HOURS_Casablanca_Express_agent.json` - Agent configuration
  - `AFTER_HOURS_Casablanca_Express_flow.json` - Conversation flow

### 4. BEST CS Agent with status check, Hawaii offer and chat
- **Agent ID:** agent_8050585db4eb1760523620c570
- **Flow ID:** conversation_flow_68cad101acb2
- **Last Modified:** December 22, 2025
- **Status:** Published
- **Description:** CS agent with enhanced status checking and Hawaii offer
- **Files:**
  - `BEST_CS_Agent_with_status_check_agent.json` - Agent configuration
  - `BEST_CS_Agent_with_status_check_flow.json` - Conversation flow

---

## Common Features Across Agents

### Voice Settings
- **Voice ID:** 11labs-James (Intro Transfer), 11labs-Nico (After Hours), 11labs-Cimo (CS Agents)
- **Voice Model:** eleven_flash_v2_5 / eleven_turbo_v2
- **Backchannel:** Enabled (frequency 0.6-0.8)
- **Ambient Sound:** call-center (volume 0.8)
- **Denoising:** noise-and-background-speech-cancellation

### Integrations
All agents use custom RIMS API hosted at:
- **Base URL:** https://web-production-4080.up.railway.app
- **Google Chat Integration:** https://retell-human-assistance-production.up.railway.app

### Post-Call Analysis
All agents include comprehensive post-call analysis fields to track:
- Issue categories
- Resolution status
- Customer sentiment
- Hawaii offer interactions
- Callback requests

---

## API Tools Used

### RIMS Customer Database Tools
1. **rims_phone_lookup** - Look up customer by phone number
2. **certificate_lookup** - Look up customer by certificate number
3. **customer_status** - Check current status in vacation journey (8 possible states)
4. **check_deposits** - Verify deposit eligibility and requirements
5. **check_travel_rep** - Check if travel rep is assigned
6. **check_booking_status** - Real-time booking confirmation status
7. **create_memo** - Create internal notes in customer account

### Human Assistance
8. **ask_team_for_help** - Google Chat integration for escalation to human team

---

## Key Conversation Flow Patterns

### Customer Journey States
1. Deposit Needed
2. Ready to Schedule
3. Waiting For Travel Rep
4. Travel Rep Assigned
5. Booking Pending
6. Travel Pending
7. Refund Pending
8. Trip Complete

### Standard Flow Architecture
1. **Greeting** → Phone number collection
2. **Phone Lookup** → Customer identification
3. **Status Check** → Determine journey stage
4. **Status-Specific Guidance** → Tailored assistance
5. **Hawaii Offer** → Upsell opportunity
6. **Anything Else** → Additional support
7. **End Call** → Professional closing

### Transfer Numbers
- **Scheduling Department:** +18189925100 (Ext 1)
- **Hawaii Offer Team:** +18055567546
- **Main Customer Service:** +18189925100

---

## Next Steps

To deploy these agents to the destination workspace (***REMOVED***):

1. Obtain API key for destination workspace
2. Create new agents using the exported agent configurations
3. Upload conversation flows for each agent
4. Verify tool endpoints are accessible from new workspace
5. Test each agent thoroughly before going live
6. Update phone numbers if needed for production environment

---

## Files in This Export

```
Casablanca-Express-CS-Production/
├── EXPORT_SUMMARY.md (this file)
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

**Export completed successfully on December 25, 2025**
