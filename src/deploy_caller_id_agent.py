#!/usr/bin/env python3
"""
Deploy Caller ID Status Agent to Retell AI
With Hawaii Upsell offered early and often
"""

import json
import requests

API_KEY = "***REMOVED***"
BASE_URL = "https://api.retellai.com"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Define the conversational flow
flow_data = {
    "name": "Caller ID Status Agent - Hawaii Upsell",
    "start_node_id": "node-caller-id-lookup",
    "start_speaker": "agent",
    "global_prompt": """## Agent Identity
You are Kassie, a professional customer service representative for Casablanca Express.

## Caller ID Auto-Lookup
This agent automatically looks up customer status using caller ID BEFORE greeting. Pass {{call.from_number}} to the status lookup tool.

## HAWAII UPGRADE - OFFER EARLY AND OFTEN
The Hawaii package is a huge value: round trip airfare for 2 people + 4 night hotel stay for only $699 TOTAL (not per person). Mention this special:
- During deposit conversations (they're already in payment mode)
- Before scheduling transfers (while we have their attention)
- After explaining status (natural transition)
- When customer seems engaged and happy

## CRITICAL: Deposit Amounts
NEVER specify deposit amounts unless returned by the API for that specific customer.

## Status-Based Behavior
- Deposit Needed: Help with payment, then offer Hawaii
- Ready to Schedule: Offer Hawaii BEFORE transfer
- Waiting for TR: Explain 45-75 day window, offer Hawaii
- TR Assigned: Remind about 805 calls, offer Hawaii
- Booking Pending: Explain 7-14 day window
- Travel Pending: Confirm itinerary
- Trip Complete: Ask about experience, offer Hawaii for next trip""",

    "model_choice": {"type": "cascading", "model": "gpt-4.1"},
    "model_temperature": 0.4,
    "tool_call_strict_mode": True,

    "nodes": [
        # Start node - Caller ID lookup
        {
            "id": "node-caller-id-lookup",
            "type": "function",
            "name": "Caller ID Status Lookup",
            "tool_id": "tool-caller-id-status",
            "tool_type": "local",
            "speak_during_execution": False,
            "wait_for_result": True,
            "instruction": {"type": "prompt", "text": "Silently look up customer status using the caller's phone number. Do not speak during this lookup."},
            "edges": [
                {"id": "edge-deposit", "destination_node_id": "node-greeting-deposit", "transition_condition": {"type": "prompt", "prompt": "Customer found AND status equals 'Deposit Needed'"}},
                {"id": "edge-ready", "destination_node_id": "node-greeting-ready", "transition_condition": {"type": "prompt", "prompt": "Customer found AND status equals 'Ready to Schedule'"}},
                {"id": "edge-waiting", "destination_node_id": "node-greeting-waiting", "transition_condition": {"type": "prompt", "prompt": "Customer found AND status equals 'Waiting For Travel Rep'"}},
                {"id": "edge-tr", "destination_node_id": "node-greeting-tr", "transition_condition": {"type": "prompt", "prompt": "Customer found AND status equals 'Travel Rep Assigned'"}},
                {"id": "edge-booking", "destination_node_id": "node-greeting-booking", "transition_condition": {"type": "prompt", "prompt": "Customer found AND status equals 'Booking Pending'"}},
                {"id": "edge-travel", "destination_node_id": "node-greeting-travel", "transition_condition": {"type": "prompt", "prompt": "Customer found AND status equals 'Travel Pending'"}},
                {"id": "edge-complete", "destination_node_id": "node-greeting-complete", "transition_condition": {"type": "prompt", "prompt": "Customer found AND status equals 'Trip Complete'"}},
                {"id": "edge-refund", "destination_node_id": "node-greeting-refund", "transition_condition": {"type": "prompt", "prompt": "Customer found AND status equals 'Refund Pending'"}},
                {"id": "edge-unknown", "destination_node_id": "node-greeting-unknown", "transition_condition": {"type": "prompt", "prompt": "Customer not found OR lookup failed"}}
            ],
            "display_position": {"x": 500, "y": 500}
        },

        # Greeting nodes with early Hawaii offers
        {
            "id": "node-greeting-deposit",
            "type": "conversation",
            "name": "Greeting - Deposit Needed",
            "instruction": {"type": "prompt", "text": "Greet the customer by name. Say: 'Thank you for calling Casablanca Express. This call may be recorded. Hi [customer_name], this is Kassie. I see you've activated your [destination] vacation package. It looks like we're just waiting on your deposit to get you scheduled. Would you like instructions on how to complete that?'"},
            "edges": [
                {"id": "edge-d1", "destination_node_id": "node-deposit-help", "transition_condition": {"type": "prompt", "prompt": "Customer wants deposit instructions"}},
                {"id": "edge-d2", "destination_node_id": "node-anything-else", "transition_condition": {"type": "prompt", "prompt": "Customer has another question"}}
            ],
            "display_position": {"x": 1100, "y": 100}
        },
        {
            "id": "node-greeting-ready",
            "type": "conversation",
            "name": "Greeting - Ready to Schedule",
            "instruction": {"type": "static_text", "text": "Thank you for calling Casablanca Express. This call may be recorded. This is Kassie. Great news - I can see your deposit is all paid up and you're ready to select your travel dates! Before I transfer you to scheduling, I wanted to mention we have an incredible Hawaii special right now - round trip airfare for two plus a four night hotel stay for only $699 total. Would you like to add that on, or should I just go ahead and transfer you to scheduling?"},
            "edges": [
                {"id": "edge-r1", "destination_node_id": "node-transfer-hawaii", "transition_condition": {"type": "prompt", "prompt": "Customer interested in Hawaii"}},
                {"id": "edge-r2", "destination_node_id": "node-transfer-scheduling", "transition_condition": {"type": "prompt", "prompt": "Customer wants scheduling transfer"}},
                {"id": "edge-r3", "destination_node_id": "node-anything-else", "transition_condition": {"type": "prompt", "prompt": "Customer has questions"}}
            ],
            "display_position": {"x": 1100, "y": 300}
        },
        {
            "id": "node-greeting-waiting",
            "type": "conversation",
            "name": "Greeting - Waiting for TR",
            "instruction": {"type": "prompt", "text": "Greet the customer by name. Say: 'Thank you for calling Casablanca Express. This call may be recorded. Hi [customer_name], this is Kassie. I can see your travel dates are set for [travel_date] and you're just waiting for a travel rep to be assigned. That typically happens 45-75 days before your trip. While I have you, have you heard about our Hawaii add-on special? Round trip airfare for two plus a four night hotel stay for only $699 total. Perfect for after your trip! Would you like more details?'"},
            "edges": [
                {"id": "edge-w1", "destination_node_id": "node-transfer-hawaii", "transition_condition": {"type": "prompt", "prompt": "Customer interested in Hawaii"}},
                {"id": "edge-w2", "destination_node_id": "node-anything-else", "transition_condition": {"type": "prompt", "prompt": "Customer declines or has questions"}}
            ],
            "display_position": {"x": 1100, "y": 500}
        },
        {
            "id": "node-greeting-tr",
            "type": "conversation",
            "name": "Greeting - TR Assigned",
            "instruction": {"type": "prompt", "text": "Greet the customer by name. Say: 'Thank you for calling Casablanca Express. This call may be recorded. Hi [customer_name], this is Kassie. I can see your travel rep [travel_rep_name] has been assigned. Be sure to answer calls from the 805 area code - that's your travel rep. By the way, have you thought about adding Hawaii? Round trip airfare for two plus four nights hotel for only $699 total. Would you like more info?'"},
            "edges": [
                {"id": "edge-t1", "destination_node_id": "node-transfer-hawaii", "transition_condition": {"type": "prompt", "prompt": "Customer interested in Hawaii"}},
                {"id": "edge-t2", "destination_node_id": "node-anything-else", "transition_condition": {"type": "prompt", "prompt": "Customer declines or has questions"}}
            ],
            "display_position": {"x": 1100, "y": 700}
        },
        {
            "id": "node-greeting-booking",
            "type": "conversation",
            "name": "Greeting - Booking Pending",
            "instruction": {"type": "prompt", "text": "Greet the customer. Say: 'Thank you for calling Casablanca Express. This call may be recorded. Hi [customer_name], this is Kassie. I can see you've already spoken with your travel rep and we're finalizing your booking. You should expect a call 7-14 days before your trip. Is there anything else I can help you with?'"},
            "edges": [{"id": "edge-b1", "destination_node_id": "node-anything-else", "transition_condition": {"type": "prompt", "prompt": "Customer responds"}}],
            "display_position": {"x": 1100, "y": 900}
        },
        {
            "id": "node-greeting-travel",
            "type": "conversation",
            "name": "Greeting - Travel Pending",
            "instruction": {"type": "prompt", "text": "Greet the customer. Say: 'Thank you for calling Casablanca Express. This call may be recorded. Hi [customer_name], this is Kassie. Exciting news - your trip to [destination] is booked! Your trip is on [travel_date]. Do you have your itinerary or would you like me to have it resent?'"},
            "edges": [
                {"id": "edge-tp1", "destination_node_id": "node-resend", "transition_condition": {"type": "prompt", "prompt": "Customer wants itinerary resent"}},
                {"id": "edge-tp2", "destination_node_id": "node-anything-else", "transition_condition": {"type": "prompt", "prompt": "Customer has itinerary or other question"}}
            ],
            "display_position": {"x": 1100, "y": 1100}
        },
        {
            "id": "node-greeting-complete",
            "type": "conversation",
            "name": "Greeting - Trip Complete",
            "instruction": {"type": "prompt", "text": "Say: 'Thank you for calling Casablanca Express. This call may be recorded. Hi [customer_name], this is Kassie. I can see you've already traveled with us - welcome back! How was your trip to [destination]?' After they respond: 'So glad to hear that! Since you enjoyed traveling with us, I wanted to mention our Hawaii special - round trip airfare for two plus four nights hotel for only $699 total. A great way to plan your next getaway! Would you like to hear more?'"},
            "edges": [
                {"id": "edge-c1", "destination_node_id": "node-transfer-hawaii", "transition_condition": {"type": "prompt", "prompt": "Customer interested in Hawaii"}},
                {"id": "edge-c2", "destination_node_id": "node-anything-else", "transition_condition": {"type": "prompt", "prompt": "Customer declines or has questions"}}
            ],
            "display_position": {"x": 1100, "y": 1300}
        },
        {
            "id": "node-greeting-refund",
            "type": "conversation",
            "name": "Greeting - Refund Pending",
            "instruction": {"type": "prompt", "text": "Say: 'Thank you for calling Casablanca Express. This call may be recorded. Hi [customer_name], this is Kassie. I see there's a pending matter on your account. How can I help you today?'"},
            "edges": [{"id": "edge-ref1", "destination_node_id": "node-anything-else", "transition_condition": {"type": "prompt", "prompt": "Customer explains question"}}],
            "display_position": {"x": 1100, "y": 1500}
        },
        {
            "id": "node-greeting-unknown",
            "type": "conversation",
            "name": "Greeting - Unknown Caller",
            "instruction": {"type": "static_text", "text": "Thank you for calling Casablanca Express. This call may be recorded. This is Kassie. To pull up your account, can you please provide the phone number associated with your vacation package?"},
            "edges": [{"id": "edge-u1", "destination_node_id": "node-phone-lookup", "transition_condition": {"type": "prompt", "prompt": "Customer provides phone number"}}],
            "display_position": {"x": 1100, "y": 1700}
        },

        # Phone lookup for unknown callers
        {
            "id": "node-phone-lookup",
            "type": "function",
            "name": "Phone Lookup",
            "tool_id": "tool-phone-lookup",
            "tool_type": "local",
            "speak_during_execution": False,
            "wait_for_result": True,
            "instruction": {"type": "prompt", "text": "Look up the customer's phone number."},
            "edges": [
                {"id": "edge-pl1", "destination_node_id": "node-status-check", "transition_condition": {"type": "prompt", "prompt": "Customer found"}},
                {"id": "edge-pl2", "destination_node_id": "node-not-found", "transition_condition": {"type": "prompt", "prompt": "Customer not found"}}
            ],
            "display_position": {"x": 1700, "y": 1700}
        },
        {
            "id": "node-status-check",
            "type": "function",
            "name": "Status Check",
            "tool_id": "tool-customer-status",
            "tool_type": "local",
            "speak_during_execution": True,
            "wait_for_result": True,
            "instruction": {"type": "prompt", "text": "Let me check your account status."},
            "edges": [{"id": "edge-sc1", "destination_node_id": "node-status-response", "transition_condition": {"type": "prompt", "prompt": "Status retrieved"}}],
            "display_position": {"x": 2300, "y": 1700}
        },
        {
            "id": "node-status-response",
            "type": "conversation",
            "name": "Status Response",
            "instruction": {"type": "prompt", "text": "Share their status info. Then say: 'By the way, we have an amazing Hawaii deal - round trip airfare for two plus four nights hotel for only $699 total. Would you like more info?'"},
            "edges": [
                {"id": "edge-sr1", "destination_node_id": "node-transfer-hawaii", "transition_condition": {"type": "prompt", "prompt": "Customer interested in Hawaii"}},
                {"id": "edge-sr2", "destination_node_id": "node-anything-else", "transition_condition": {"type": "prompt", "prompt": "Customer declines or has questions"}}
            ],
            "display_position": {"x": 2900, "y": 1700}
        },
        {
            "id": "node-not-found",
            "type": "conversation",
            "name": "Not Found",
            "instruction": {"type": "static_text", "text": "Hmm, that didn't come up in our system. Do you have another phone number to try, or would you like to provide your certificate number?"},
            "edges": [
                {"id": "edge-nf1", "destination_node_id": "node-phone-lookup", "transition_condition": {"type": "prompt", "prompt": "Customer provides another number"}},
                {"id": "edge-nf2", "destination_node_id": "node-generic-help", "transition_condition": {"type": "prompt", "prompt": "Customer needs general help"}}
            ],
            "display_position": {"x": 2300, "y": 1900}
        },

        # Deposit help with Hawaii offer
        {
            "id": "node-deposit-help",
            "type": "conversation",
            "name": "Deposit Instructions",
            "instruction": {"type": "prompt", "text": "Ask how they activated - online or mail. Online: 'Pay at activatemytrip.com with your login.' Mail: 'Mail a check to our office.' Then say: 'And while you're at it, we have a fantastic Hawaii special - round trip airfare for two plus four nights hotel for only $699 total. Would you like to add that on?'"},
            "edges": [
                {"id": "edge-dh1", "destination_node_id": "node-transfer-hawaii", "transition_condition": {"type": "prompt", "prompt": "Customer interested in Hawaii"}},
                {"id": "edge-dh2", "destination_node_id": "node-anything-else", "transition_condition": {"type": "prompt", "prompt": "Customer declines or has questions"}}
            ],
            "display_position": {"x": 1700, "y": 100}
        },

        # Resend itinerary
        {
            "id": "node-resend",
            "type": "function",
            "name": "Resend Itinerary",
            "tool_id": "tool-create-memo",
            "tool_type": "local",
            "speak_during_execution": True,
            "wait_for_result": True,
            "instruction": {"type": "static_text", "text": "Let me make a note to have your itinerary resent."},
            "edges": [{"id": "edge-rs1", "destination_node_id": "node-resend-confirm", "transition_condition": {"type": "prompt", "prompt": "Memo created"}}],
            "display_position": {"x": 1700, "y": 1100}
        },
        {
            "id": "node-resend-confirm",
            "type": "conversation",
            "name": "Resend Confirmed",
            "instruction": {"type": "prompt", "text": "Say: 'I've made a note to resend your itinerary. You should receive it within 24 hours. Is there anything else I can help you with?'"},
            "edges": [{"id": "edge-rc1", "destination_node_id": "node-offer-hawaii", "transition_condition": {"type": "prompt", "prompt": "After confirming"}}],
            "display_position": {"x": 2300, "y": 1100}
        },

        # Anything else and generic help
        {
            "id": "node-anything-else",
            "type": "conversation",
            "name": "Anything Else",
            "instruction": {"type": "prompt", "text": "Ask: 'Is there anything else I can help you with today?'"},
            "edges": [
                {"id": "edge-ae1", "destination_node_id": "node-ask-team", "transition_condition": {"type": "prompt", "prompt": "Customer has question you cannot answer"}},
                {"id": "edge-ae2", "destination_node_id": "node-offer-hawaii", "transition_condition": {"type": "prompt", "prompt": "Customer is satisfied"}}
            ],
            "display_position": {"x": 2300, "y": 700}
        },
        {
            "id": "node-generic-help",
            "type": "conversation",
            "name": "Generic Help",
            "instruction": {"type": "prompt", "text": "Help answer their questions. Then offer Hawaii upgrade."},
            "edges": [{"id": "edge-gh1", "destination_node_id": "node-offer-hawaii", "transition_condition": {"type": "prompt", "prompt": "After helping"}}],
            "display_position": {"x": 2900, "y": 1900}
        },

        # Ask team
        {
            "id": "node-ask-team",
            "type": "function",
            "name": "Ask Team",
            "tool_id": "tool-google-chat",
            "tool_type": "local",
            "speak_during_execution": True,
            "wait_for_result": True,
            "instruction": {"type": "static_text", "text": "Let me check with my team. Just a moment."},
            "edges": [
                {"id": "edge-at1", "destination_node_id": "node-relay-answer", "transition_condition": {"type": "prompt", "prompt": "Response received"}},
                {"id": "edge-at2", "destination_node_id": "node-team-unavailable", "transition_condition": {"type": "prompt", "prompt": "No response"}}
            ],
            "display_position": {"x": 2900, "y": 700}
        },
        {
            "id": "node-relay-answer",
            "type": "conversation",
            "name": "Relay Answer",
            "instruction": {"type": "prompt", "text": "Read team's response to customer. Ask: 'Does that answer your question?'"},
            "edges": [
                {"id": "edge-ra1", "destination_node_id": "node-offer-hawaii", "transition_condition": {"type": "prompt", "prompt": "Customer satisfied"}},
                {"id": "edge-ra2", "destination_node_id": "node-ask-team", "transition_condition": {"type": "prompt", "prompt": "Needs clarification"}}
            ],
            "display_position": {"x": 3500, "y": 700}
        },
        {
            "id": "node-team-unavailable",
            "type": "conversation",
            "name": "Team Unavailable",
            "instruction": {"type": "static_text", "text": "I apologize, I wasn't able to get that information right now. Would you like me to transfer you to customer service?"},
            "edges": [
                {"id": "edge-tu1", "destination_node_id": "node-transfer-cs", "transition_condition": {"type": "prompt", "prompt": "Customer wants transfer"}},
                {"id": "edge-tu2", "destination_node_id": "node-offer-hawaii", "transition_condition": {"type": "prompt", "prompt": "Customer declines"}}
            ],
            "display_position": {"x": 3500, "y": 900}
        },

        # Final Hawaii offer
        {
            "id": "node-offer-hawaii",
            "type": "conversation",
            "name": "Offer Hawaii",
            "instruction": {"type": "static_text", "text": "Before you go, I wanted to mention we have a special right now. You can add on a Hawaii package - round trip airfare for two and a four night hotel stay for only $699 total, not per person. Would you like me to transfer you to someone who can give you more details?"},
            "edges": [
                {"id": "edge-oh1", "destination_node_id": "node-transfer-hawaii", "transition_condition": {"type": "prompt", "prompt": "Customer wants Hawaii"}},
                {"id": "edge-oh2", "destination_node_id": "node-end", "transition_condition": {"type": "prompt", "prompt": "Customer declines"}}
            ],
            "display_position": {"x": 4100, "y": 500}
        },

        # Transfer nodes
        {
            "id": "node-transfer-scheduling",
            "type": "transfer_call",
            "name": "Transfer Scheduling",
            "transfer_destination": {"type": "predefined", "number": "+18189925100"},
            "transfer_option": {"type": "cold_transfer", "show_transferee_as_caller": False, "enable_bridge_audio_cue": True},
            "instruction": {"type": "static_text", "text": "One moment while I transfer you to scheduling."},
            "edge": {"id": "edge-ts-fail", "destination_node_id": "node-transfer-failed", "transition_condition": {"type": "prompt", "prompt": "Transfer failed"}},
            "display_position": {"x": 1700, "y": 300}
        },
        {
            "id": "node-transfer-cs",
            "type": "transfer_call",
            "name": "Transfer CS",
            "transfer_destination": {"type": "predefined", "number": "+18189925100"},
            "transfer_option": {"type": "cold_transfer", "show_transferee_as_caller": False, "enable_bridge_audio_cue": True},
            "instruction": {"type": "static_text", "text": "One moment while I transfer you to customer service."},
            "edge": {"id": "edge-tcs-fail", "destination_node_id": "node-transfer-failed", "transition_condition": {"type": "prompt", "prompt": "Transfer failed"}},
            "display_position": {"x": 4100, "y": 900}
        },
        {
            "id": "node-transfer-hawaii",
            "type": "transfer_call",
            "name": "Transfer Hawaii",
            "transfer_destination": {"type": "predefined", "number": "+18055567546"},
            "transfer_option": {"type": "cold_transfer", "show_transferee_as_caller": False, "enable_bridge_audio_cue": True},
            "instruction": {"type": "static_text", "text": "One moment while I get someone on the line to tell you about this Hawaii special."},
            "edge": {"id": "edge-th-fail", "destination_node_id": "node-hawaii-failed", "transition_condition": {"type": "prompt", "prompt": "Transfer failed"}},
            "display_position": {"x": 4700, "y": 300}
        },
        {
            "id": "node-transfer-failed",
            "type": "conversation",
            "name": "Transfer Failed",
            "instruction": {"type": "static_text", "text": "I apologize for the technical difficulty. You can reach us directly at 8-1-8-9-9-2-5-1-0-0, Monday through Friday, 9am to 5pm Pacific."},
            "edges": [{"id": "edge-tf1", "destination_node_id": "node-offer-hawaii", "transition_condition": {"type": "prompt", "prompt": "After providing number"}}],
            "display_position": {"x": 2300, "y": 300}
        },
        {
            "id": "node-hawaii-failed",
            "type": "conversation",
            "name": "Hawaii Failed",
            "instruction": {"type": "static_text", "text": "I'm sorry, the transfer didn't work. They must be busy! You can call 818-992-5100 to ask about the Hawaii package."},
            "edges": [{"id": "edge-hf1", "destination_node_id": "node-end", "transition_condition": {"type": "prompt", "prompt": "After providing number"}}],
            "display_position": {"x": 5300, "y": 300}
        },

        # End node
        {
            "id": "node-end",
            "type": "end",
            "name": "End Call",
            "instruction": {"type": "static_text", "text": "Thank you so much for calling Casablanca Express. Have a wonderful day!"},
            "display_position": {"x": 5300, "y": 500}
        }
    ],

    "tools": [
        {
            "tool_id": "tool-caller-id-status",
            "name": "caller_id_status_lookup",
            "type": "custom",
            "method": "GET",
            "url": "https://web-production-4080.up.railway.app/api/customer/status",
            "description": "Look up customer status using caller ID",
            "headers": {},
            "parameter_type": "query",
            "parameters": {
                "type": "object",
                "properties": {"phone": {"type": "string", "description": "Customer phone from caller ID"}},
                "required": ["phone"]
            },
            "timeout_ms": 10000,
            "response_variables": {
                "customer_found": "$.found",
                "status": "$.status",
                "status_label": "$.status_label",
                "customer_name": "$.customer.full_name",
                "customer_email": "$.customer.email",
                "vac_id": "$.customer.vac_id",
                "pkg_code2": "$.customer.pkg_code2",
                "destination": "$.customer.destination",
                "travel_date": "$.customer.travel_date",
                "travel_rep_name": "$.customer.travel_rep_name"
            }
        },
        {
            "tool_id": "tool-phone-lookup",
            "name": "phone_lookup",
            "type": "custom",
            "method": "POST",
            "url": "https://web-production-4080.up.railway.app/api/rims/phone-lookup",
            "description": "Look up customer by phone number",
            "headers": {"Content-Type": "application/json"},
            "parameter_type": "json",
            "parameters": {
                "type": "object",
                "properties": {"phone_number": {"type": "string"}},
                "required": ["phone_number"]
            },
            "args_at_root": True,
            "timeout_ms": 120000
        },
        {
            "tool_id": "tool-customer-status",
            "name": "customer_status",
            "type": "custom",
            "method": "POST",
            "url": "https://web-production-4080.up.railway.app/api/rims/customer-status",
            "description": "Get customer status",
            "headers": {"Content-Type": "application/json"},
            "parameter_type": "json",
            "parameters": {
                "type": "object",
                "properties": {"vac_id": {"type": "number"}, "pkg_code2": {"type": "string"}},
                "required": ["vac_id", "pkg_code2"]
            },
            "args_at_root": True,
            "timeout_ms": 120000
        },
        {
            "tool_id": "tool-create-memo",
            "name": "create_memo",
            "type": "custom",
            "method": "POST",
            "url": "https://web-production-4080.up.railway.app/api/rims/create-memo",
            "description": "Create a memo",
            "headers": {"Content-Type": "application/json"},
            "parameter_type": "json",
            "parameters": {
                "type": "object",
                "properties": {"vac_id": {"type": "string"}, "memo_type": {"type": "string"}, "details": {"type": "string"}},
                "required": ["vac_id", "memo_type"]
            },
            "timeout_ms": 120000
        },
        {
            "tool_id": "tool-google-chat",
            "name": "ask_team_for_help",
            "type": "custom",
            "method": "POST",
            "url": "https://retell-human-assistance-production.up.railway.app/api/human-assistance/ask",
            "description": "Ask team for help",
            "headers": {"Content-Type": "application/json"},
            "parameter_type": "json",
            "parameters": {
                "type": "object",
                "properties": {"question": {"type": "string"}, "customer_name": {"type": "string"}, "context": {"type": "string"}},
                "required": ["question"]
            },
            "args_at_root": True,
            "timeout_ms": 300000,
            "response_variables": {"team_response": "$.response"}
        }
    ],

    "default_dynamic_variables": {
        "{{call.from_number}}": ""
    }
}

print("Creating conversational flow...")
response = requests.post(
    f"{BASE_URL}/create-conversation-flow",
    headers=headers,
    json=flow_data
)

print(f"Status: {response.status_code}")
result = response.json()
print(json.dumps(result, indent=2))

if response.status_code == 201 or "conversation_flow_id" in result:
    flow_id = result.get("conversation_flow_id")
    print(f"\nFlow created: {flow_id}")

    # Create agent
    print("\nCreating agent...")
    agent_data = {
        "agent_name": "Caller ID Status Agent - Hawaii Upsell",
        "response_engine": {
            "type": "conversation-flow",
            "conversation_flow_id": flow_id
        },
        "voice_id": "11labs-Cimo",
        "voice_model": "eleven_flash_v2_5",
        "enable_backchannel": True,
        "backchannel_frequency": 0.8,
        "denoising_mode": "noise-and-background-speech-cancellation",
        "normalize_for_speech": True,
        "ambient_sound": "call-center",
        "ambient_sound_volume": 0.80,
        "interruption_sensitivity": 0.9,
        "post_call_analysis_data": [
            {"name": "customer_status", "type": "string", "description": "Customer status"},
            {"name": "call_outcome", "type": "enum", "options": ["transferred_scheduling", "transferred_hawaii", "answered", "not_found"]},
            {"name": "customer_found", "type": "boolean", "description": "Was customer found?"},
            {"name": "hawaii_offered", "type": "boolean", "description": "Was Hawaii offered?"},
            {"name": "hawaii_accepted", "type": "boolean", "description": "Did customer accept Hawaii?"}
        ]
    }

    agent_response = requests.post(
        f"{BASE_URL}/create-agent",
        headers=headers,
        json=agent_data
    )

    print(f"Agent Status: {agent_response.status_code}")
    agent_result = agent_response.json()
    print(json.dumps(agent_result, indent=2))

    if "agent_id" in agent_result:
        print("\n" + "="*50)
        print("DEPLOYMENT COMPLETE")
        print("="*50)
        print(f"Flow ID: {flow_id}")
        print(f"Agent ID: {agent_result['agent_id']}")
        print("="*50)
else:
    print(f"\nFailed to create flow: {result}")
