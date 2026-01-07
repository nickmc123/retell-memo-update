#!/bin/bash

# Deploy Caller ID Status Agent to Retell AI
API_KEY="***REMOVED***"
BASE_URL="https://api.retellai.com"

echo "Creating conversational flow..."

# Create the conversational flow
FLOW_RESPONSE=$(curl -s -X POST "$BASE_URL/v2/create-conversation-flow" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d @- << 'FLOW_EOF'
{
  "name": "Caller ID Status Flow with Hawaii Upsell",
  "nodes": [
    {
      "id": "node-caller-id-lookup",
      "type": "function",
      "name": "Caller ID Status Lookup",
      "tool_id": "tool-caller-id-status",
      "tool_type": "local",
      "speak_during_execution": false,
      "wait_for_result": true,
      "instruction": {
        "type": "prompt",
        "text": "Silently look up customer status using caller ID. Do not speak during this lookup."
      },
      "edges": [
        {
          "id": "edge-status-deposit-needed",
          "destination_node_id": "node-greeting-deposit-needed",
          "transition_condition": {"type": "prompt", "prompt": "Customer found AND status equals 'Deposit Needed'"}
        },
        {
          "id": "edge-status-ready-schedule",
          "destination_node_id": "node-greeting-ready-schedule",
          "transition_condition": {"type": "prompt", "prompt": "Customer found AND status equals 'Ready to Schedule'"}
        },
        {
          "id": "edge-status-waiting-tr",
          "destination_node_id": "node-greeting-waiting-tr",
          "transition_condition": {"type": "prompt", "prompt": "Customer found AND status equals 'Waiting For Travel Rep'"}
        },
        {
          "id": "edge-status-tr-assigned",
          "destination_node_id": "node-greeting-tr-assigned",
          "transition_condition": {"type": "prompt", "prompt": "Customer found AND status equals 'Travel Rep Assigned'"}
        },
        {
          "id": "edge-status-booking-pending",
          "destination_node_id": "node-greeting-booking-pending",
          "transition_condition": {"type": "prompt", "prompt": "Customer found AND status equals 'Booking Pending'"}
        },
        {
          "id": "edge-status-travel-pending",
          "destination_node_id": "node-greeting-travel-pending",
          "transition_condition": {"type": "prompt", "prompt": "Customer found AND status equals 'Travel Pending'"}
        },
        {
          "id": "edge-status-refund-pending",
          "destination_node_id": "node-greeting-refund-pending",
          "transition_condition": {"type": "prompt", "prompt": "Customer found AND status equals 'Refund Pending'"}
        },
        {
          "id": "edge-status-trip-complete",
          "destination_node_id": "node-greeting-trip-complete",
          "transition_condition": {"type": "prompt", "prompt": "Customer found AND status equals 'Trip Complete'"}
        },
        {
          "id": "edge-not-found",
          "destination_node_id": "node-greeting-unknown",
          "transition_condition": {"type": "prompt", "prompt": "Customer not found OR lookup failed"}
        }
      ],
      "display_position": {"x": 500, "y": 300}
    },
    {
      "id": "node-greeting-deposit-needed",
      "type": "conversation",
      "name": "Greeting - Deposit Needed",
      "instruction": {"type": "prompt", "text": "Greet the customer by name from the lookup. Say: 'Thank you for calling Casablanca Express. This call may be recorded. Hi [customer_name], this is Kassie. I see you've activated your [destination] vacation package. It looks like we're just waiting on your deposit to get you scheduled. Would you like instructions on how to complete that?'"},
      "edges": [
        {"id": "edge-deposit-help-yes", "destination_node_id": "node-deposit-instructions", "transition_condition": {"type": "prompt", "prompt": "Customer wants deposit payment instructions"}},
        {"id": "edge-deposit-help-no", "destination_node_id": "node-anything-else", "transition_condition": {"type": "prompt", "prompt": "Customer has another question or already knows how to pay"}}
      ],
      "display_position": {"x": 1100, "y": 100}
    },
    {
      "id": "node-greeting-ready-schedule",
      "type": "conversation",
      "name": "Greeting - Ready to Schedule",
      "instruction": {"type": "static_text", "text": "Thank you for calling Casablanca Express. This call may be recorded. This is Kassie. Great news - I can see your deposit is all paid up and you're ready to select your travel dates! Before I transfer you to scheduling, I wanted to mention we have an incredible Hawaii special right now - round trip airfare for two plus a four night hotel stay for only $699 total. Would you like to add that on, or should I just go ahead and transfer you to scheduling?"},
      "edges": [
        {"id": "edge-hawaii-interest-schedule", "destination_node_id": "node-transfer-hawaii", "transition_condition": {"type": "prompt", "prompt": "Customer interested in Hawaii offer"}},
        {"id": "edge-schedule-yes", "destination_node_id": "node-transfer-scheduling", "transition_condition": {"type": "prompt", "prompt": "Customer wants to be transferred to scheduling"}},
        {"id": "edge-schedule-no", "destination_node_id": "node-anything-else", "transition_condition": {"type": "prompt", "prompt": "Customer has questions or doesn't want transfer now"}}
      ],
      "display_position": {"x": 1100, "y": 300}
    },
    {
      "id": "node-greeting-waiting-tr",
      "type": "conversation",
      "name": "Greeting - Waiting for TR",
      "instruction": {"type": "prompt", "text": "Greet the customer by name. Say: 'Thank you for calling Casablanca Express. This call may be recorded. Hi [customer_name], this is Kassie. I can see your travel dates are set for [travel_date] and you're just waiting for a travel rep to be assigned. That typically happens 45-75 days before your trip. While I have you, have you heard about our Hawaii add-on special? Round trip airfare for two plus a four night hotel stay for only $699 total. Perfect for after your Mexico trip! Would you like more details on that?'"},
      "edges": [
        {"id": "edge-waiting-hawaii-yes", "destination_node_id": "node-transfer-hawaii", "transition_condition": {"type": "prompt", "prompt": "Customer interested in Hawaii offer"}},
        {"id": "edge-waiting-tr-question", "destination_node_id": "node-anything-else", "transition_condition": {"type": "prompt", "prompt": "Customer declines Hawaii or has another question"}}
      ],
      "display_position": {"x": 1100, "y": 500}
    },
    {
      "id": "node-greeting-tr-assigned",
      "type": "conversation",
      "name": "Greeting - TR Assigned",
      "instruction": {"type": "prompt", "text": "Greet the customer by name. Say: 'Thank you for calling Casablanca Express. This call may be recorded. Hi [customer_name], this is Kassie. I can see your travel rep [travel_rep_name] has been assigned to your account. Be sure to answer any calls from the 805 area code - that will be your travel rep reaching out to finalize your trip details. By the way, have you thought about adding a Hawaii trip? We have an amazing deal right now - round trip airfare for two plus four nights hotel for only $699 total. Would you like more info?'"},
      "edges": [
        {"id": "edge-tr-hawaii-yes", "destination_node_id": "node-transfer-hawaii", "transition_condition": {"type": "prompt", "prompt": "Customer interested in Hawaii offer"}},
        {"id": "edge-tr-assigned-question", "destination_node_id": "node-anything-else", "transition_condition": {"type": "prompt", "prompt": "Customer declines Hawaii or has another question"}}
      ],
      "display_position": {"x": 1100, "y": 700}
    },
    {
      "id": "node-greeting-booking-pending",
      "type": "conversation",
      "name": "Greeting - Booking Pending",
      "instruction": {"type": "prompt", "text": "Greet the customer by name. Say: 'Thank you for calling Casablanca Express. This call may be recorded. Hi [customer_name], this is Kassie. I can see you've already spoken with your travel rep and we're just finalizing your booking. You should expect a call from our booking agent 7-14 days before your trip with final confirmation. Is there anything else I can help you with?'"},
      "edges": [{"id": "edge-booking-question", "destination_node_id": "node-anything-else", "transition_condition": {"type": "prompt", "prompt": "Customer has a question or responds"}}],
      "display_position": {"x": 1100, "y": 900}
    },
    {
      "id": "node-greeting-travel-pending",
      "type": "conversation",
      "name": "Greeting - Travel Pending",
      "instruction": {"type": "prompt", "text": "Greet the customer by name. Say: 'Thank you for calling Casablanca Express. This call may be recorded. Hi [customer_name], this is Kassie. Exciting news - I can see your trip to [destination] is all booked and your itinerary has been sent! Your trip is coming up on [travel_date]. Do you have your itinerary or would you like me to have it resent?'"},
      "edges": [
        {"id": "edge-travel-has-itinerary", "destination_node_id": "node-anything-else", "transition_condition": {"type": "prompt", "prompt": "Customer has itinerary or has another question"}},
        {"id": "edge-travel-resend", "destination_node_id": "node-resend-itinerary", "transition_condition": {"type": "prompt", "prompt": "Customer wants itinerary resent"}}
      ],
      "display_position": {"x": 1100, "y": 1100}
    },
    {
      "id": "node-greeting-refund-pending",
      "type": "conversation",
      "name": "Greeting - Refund Pending",
      "instruction": {"type": "prompt", "text": "Greet the customer by name. Say: 'Thank you for calling Casablanca Express. This call may be recorded. Hi [customer_name], this is Kassie. I see there's a pending matter on your account. How can I help you today?'"},
      "edges": [{"id": "edge-refund-question", "destination_node_id": "node-anything-else", "transition_condition": {"type": "prompt", "prompt": "Customer explains their question"}}],
      "display_position": {"x": 1100, "y": 1300}
    },
    {
      "id": "node-greeting-trip-complete",
      "type": "conversation",
      "name": "Greeting - Trip Complete",
      "instruction": {"type": "prompt", "text": "Greet the customer by name. Say: 'Thank you for calling Casablanca Express. This call may be recorded. Hi [customer_name], this is Kassie. I can see you've already traveled with us - welcome back! How was your trip to [destination]?' After they respond, say: 'So glad to hear that! Since you enjoyed traveling with us, I wanted to let you know about our Hawaii special - round trip airfare for two plus a four night hotel stay for only $699 total. It's a great way to plan your next getaway! Would you like to hear more about it?'"},
      "edges": [
        {"id": "edge-complete-hawaii-yes", "destination_node_id": "node-transfer-hawaii", "transition_condition": {"type": "prompt", "prompt": "Customer interested in Hawaii offer"}},
        {"id": "edge-complete-question", "destination_node_id": "node-anything-else", "transition_condition": {"type": "prompt", "prompt": "Customer declines Hawaii or has another question"}}
      ],
      "display_position": {"x": 1100, "y": 1500}
    },
    {
      "id": "node-greeting-unknown",
      "type": "conversation",
      "name": "Greeting - Unknown Caller",
      "instruction": {"type": "static_text", "text": "Thank you for calling Casablanca Express. This call may be recorded. This is Kassie. To pull up your account, can you please provide the phone number associated with your vacation package?"},
      "edges": [{"id": "edge-phone-provided", "destination_node_id": "node-manual-phone-lookup", "transition_condition": {"type": "prompt", "prompt": "Customer provides phone number"}}],
      "display_position": {"x": 1100, "y": 1700}
    },
    {
      "id": "node-manual-phone-lookup",
      "type": "function",
      "name": "Manual Phone Lookup",
      "tool_id": "tool-phone-lookup",
      "tool_type": "local",
      "speak_during_execution": false,
      "wait_for_result": true,
      "instruction": {"type": "prompt", "text": "Let me look that up for you."},
      "edges": [
        {"id": "edge-manual-found", "destination_node_id": "node-manual-status-check", "transition_condition": {"type": "prompt", "prompt": "Customer found"}},
        {"id": "edge-manual-not-found", "destination_node_id": "node-phone-not-found", "transition_condition": {"type": "prompt", "prompt": "Customer not found"}}
      ],
      "display_position": {"x": 1700, "y": 1700}
    },
    {
      "id": "node-manual-status-check",
      "type": "function",
      "name": "Manual Status Check",
      "tool_id": "tool-customer-status-manual",
      "tool_type": "local",
      "speak_during_execution": true,
      "wait_for_result": true,
      "instruction": {"type": "prompt", "text": "Let me check the status of your account."},
      "edges": [{"id": "edge-manual-status-complete", "destination_node_id": "node-status-response", "transition_condition": {"type": "prompt", "prompt": "Status retrieved successfully"}}],
      "display_position": {"x": 2300, "y": 1700}
    },
    {
      "id": "node-status-response",
      "type": "conversation",
      "name": "Status Response",
      "instruction": {"type": "prompt", "text": "Based on the customer status returned, provide the appropriate response. Then offer Hawaii: 'By the way, we have an amazing Hawaii deal - round trip airfare for two plus four nights hotel for only $699 total. Would you like more info?'"},
      "edges": [
        {"id": "edge-status-hawaii-yes", "destination_node_id": "node-transfer-hawaii", "transition_condition": {"type": "prompt", "prompt": "Customer interested in Hawaii"}},
        {"id": "edge-status-to-anything", "destination_node_id": "node-anything-else", "transition_condition": {"type": "prompt", "prompt": "Customer declines Hawaii or has questions"}},
        {"id": "edge-status-to-schedule", "destination_node_id": "node-transfer-scheduling", "transition_condition": {"type": "prompt", "prompt": "Customer wants to schedule"}}
      ],
      "display_position": {"x": 2900, "y": 1700}
    },
    {
      "id": "node-phone-not-found",
      "type": "conversation",
      "name": "Phone Not Found",
      "instruction": {"type": "static_text", "text": "Hmm, that didn't come up in our system. Do you have another phone number you'd like me to try, or would you like to provide your certificate number instead?"},
      "edges": [
        {"id": "edge-retry-phone", "destination_node_id": "node-manual-phone-lookup", "transition_condition": {"type": "prompt", "prompt": "Customer provides another phone number"}},
        {"id": "edge-generic-help", "destination_node_id": "node-generic-assistance", "transition_condition": {"type": "prompt", "prompt": "Customer wants generic help or doesn't have info"}}
      ],
      "display_position": {"x": 2300, "y": 1900}
    },
    {
      "id": "node-deposit-instructions",
      "type": "conversation",
      "name": "Deposit Instructions",
      "instruction": {"type": "prompt", "text": "Ask how they activated their certificate - online or by mail. For online: 'You can pay your deposit at activatemytrip.com.' For mail: 'You can mail a check to our office.' Then say: 'And while you're at it, we have a fantastic Hawaii special - round trip airfare for two plus a four night hotel stay for only $699 total. Would you like to add that on?'"},
      "edges": [
        {"id": "edge-deposit-hawaii-yes", "destination_node_id": "node-transfer-hawaii", "transition_condition": {"type": "prompt", "prompt": "Customer interested in Hawaii offer"}},
        {"id": "edge-deposit-done", "destination_node_id": "node-anything-else", "transition_condition": {"type": "prompt", "prompt": "Customer not interested in Hawaii or has more questions"}}
      ],
      "display_position": {"x": 1700, "y": 100}
    },
    {
      "id": "node-resend-itinerary",
      "type": "function",
      "name": "Create Resend Memo",
      "tool_id": "tool-create-memo",
      "tool_type": "local",
      "speak_during_execution": true,
      "wait_for_result": true,
      "instruction": {"type": "static_text", "text": "Let me make a note to have your itinerary resent to you."},
      "edges": [{"id": "edge-memo-created", "destination_node_id": "node-itinerary-confirmed", "transition_condition": {"type": "prompt", "prompt": "Memo created"}}],
      "display_position": {"x": 1700, "y": 1100}
    },
    {
      "id": "node-itinerary-confirmed",
      "type": "conversation",
      "name": "Itinerary Confirmation",
      "instruction": {"type": "prompt", "text": "Say: 'I've made a note to have your itinerary resent. You should receive it within 24 hours. Is there anything else I can help you with?'"},
      "edges": [{"id": "edge-itinerary-done", "destination_node_id": "node-offer-hawaii", "transition_condition": {"type": "prompt", "prompt": "After confirming"}}],
      "display_position": {"x": 2300, "y": 1100}
    },
    {
      "id": "node-transfer-scheduling",
      "type": "transfer_call",
      "name": "Transfer to Scheduling",
      "transfer_destination": {"type": "predefined", "number": "+18189925100"},
      "transfer_option": {"type": "cold_transfer", "show_transferee_as_caller": false, "enable_bridge_audio_cue": true},
      "instruction": {"type": "static_text", "text": "One moment while I transfer you to our scheduling department."},
      "edge": {"id": "edge-transfer-failed", "destination_node_id": "node-transfer-failed", "transition_condition": {"type": "prompt", "prompt": "Transfer failed"}},
      "display_position": {"x": 1700, "y": 300}
    },
    {
      "id": "node-transfer-failed",
      "type": "conversation",
      "name": "Transfer Failed",
      "instruction": {"type": "static_text", "text": "I apologize, I'm having some technical difficulty with the transfer. The scheduling department can be reached at 8 - 1 - 8 - 9 - 9 - 2 - 5 - 1 - 0 - 0, Monday through Friday, 9am to 5pm Pacific."},
      "edges": [{"id": "edge-transfer-failed-done", "destination_node_id": "node-offer-hawaii", "transition_condition": {"type": "prompt", "prompt": "After providing phone number"}}],
      "display_position": {"x": 2300, "y": 300}
    },
    {
      "id": "node-generic-assistance",
      "type": "conversation",
      "name": "Generic Assistance",
      "instruction": {"type": "prompt", "text": "Use knowledge base to help answer their questions. Then offer Hawaii upgrade."},
      "edges": [{"id": "edge-generic-done", "destination_node_id": "node-offer-hawaii", "transition_condition": {"type": "prompt", "prompt": "After helping customer"}}],
      "display_position": {"x": 2900, "y": 1900}
    },
    {
      "id": "node-anything-else",
      "type": "conversation",
      "name": "Anything Else",
      "instruction": {"type": "prompt", "text": "Ask: 'Is there anything else I can help you with today?' Answer questions or offer to connect with customer service."},
      "edges": [
        {"id": "edge-more-help", "destination_node_id": "node-ask-team", "transition_condition": {"type": "prompt", "prompt": "Customer has a question you cannot answer"}},
        {"id": "edge-no-more", "destination_node_id": "node-offer-hawaii", "transition_condition": {"type": "prompt", "prompt": "Customer is satisfied or has no more questions"}}
      ],
      "display_position": {"x": 2300, "y": 700}
    },
    {
      "id": "node-ask-team",
      "type": "function",
      "name": "Ask Team",
      "tool_id": "tool-google-chat",
      "tool_type": "local",
      "speak_during_execution": true,
      "wait_for_result": true,
      "instruction": {"type": "static_text", "text": "Let me check with my team on that. Just a moment."},
      "edges": [
        {"id": "edge-team-response", "destination_node_id": "node-relay-team-answer", "transition_condition": {"type": "prompt", "prompt": "Response received"}},
        {"id": "edge-team-timeout", "destination_node_id": "node-team-unavailable", "transition_condition": {"type": "prompt", "prompt": "No response or timeout"}}
      ],
      "display_position": {"x": 2900, "y": 700}
    },
    {
      "id": "node-relay-team-answer",
      "type": "conversation",
      "name": "Relay Team Answer",
      "instruction": {"type": "prompt", "text": "Read the team's response to the customer. Then ask: 'Does that answer your question?'"},
      "edges": [
        {"id": "edge-answer-yes", "destination_node_id": "node-offer-hawaii", "transition_condition": {"type": "prompt", "prompt": "Customer is satisfied"}},
        {"id": "edge-answer-clarify", "destination_node_id": "node-ask-team", "transition_condition": {"type": "prompt", "prompt": "Customer needs clarification"}}
      ],
      "display_position": {"x": 3500, "y": 700}
    },
    {
      "id": "node-team-unavailable",
      "type": "conversation",
      "name": "Team Unavailable",
      "instruction": {"type": "static_text", "text": "I apologize, I wasn't able to get that information right now. Would you like me to transfer you to customer service?"},
      "edges": [
        {"id": "edge-cs-transfer-yes", "destination_node_id": "node-transfer-cs", "transition_condition": {"type": "prompt", "prompt": "Customer wants transfer"}},
        {"id": "edge-cs-transfer-no", "destination_node_id": "node-offer-hawaii", "transition_condition": {"type": "prompt", "prompt": "Customer declines"}}
      ],
      "display_position": {"x": 3500, "y": 900}
    },
    {
      "id": "node-transfer-cs",
      "type": "transfer_call",
      "name": "Transfer to CS",
      "transfer_destination": {"type": "predefined", "number": "+18189925100"},
      "transfer_option": {"type": "cold_transfer", "show_transferee_as_caller": false, "enable_bridge_audio_cue": true},
      "instruction": {"type": "static_text", "text": "One moment while I transfer you to customer service."},
      "edge": {"id": "edge-cs-transfer-failed", "destination_node_id": "node-cs-transfer-failed", "transition_condition": {"type": "prompt", "prompt": "Transfer failed"}},
      "display_position": {"x": 4100, "y": 900}
    },
    {
      "id": "node-cs-transfer-failed",
      "type": "conversation",
      "name": "CS Transfer Failed",
      "instruction": {"type": "static_text", "text": "I apologize for the technical difficulty. You can reach customer service directly at 8 - 1 - 8 - 9 - 9 - 2 - 5 - 1 - 0 - 0, Monday through Friday, 9am to 5pm Pacific."},
      "edges": [{"id": "edge-cs-failed-done", "destination_node_id": "node-offer-hawaii", "transition_condition": {"type": "prompt", "prompt": "After providing number"}}],
      "display_position": {"x": 4700, "y": 900}
    },
    {
      "id": "node-offer-hawaii",
      "type": "conversation",
      "name": "Offer Hawaii",
      "instruction": {"type": "static_text", "text": "Before you go, I wanted to mention we have a special right now. You can add on a Hawaii package - round trip airfare for two people and a four night hotel stay for only $699 total, not per person. Would you like me to transfer you to someone who can give you more details?"},
      "edges": [
        {"id": "edge-hawaii-yes", "destination_node_id": "node-transfer-hawaii", "transition_condition": {"type": "prompt", "prompt": "Customer wants Hawaii transfer"}},
        {"id": "edge-hawaii-no", "destination_node_id": "node-end-call", "transition_condition": {"type": "prompt", "prompt": "Customer declines Hawaii offer"}}
      ],
      "display_position": {"x": 4100, "y": 500}
    },
    {
      "id": "node-transfer-hawaii",
      "type": "transfer_call",
      "name": "Transfer to Hawaii",
      "transfer_destination": {"type": "predefined", "number": "+18055567546"},
      "transfer_option": {"type": "cold_transfer", "show_transferee_as_caller": false, "enable_bridge_audio_cue": true},
      "instruction": {"type": "static_text", "text": "One moment while I get someone on the line to tell you more about this Hawaii special."},
      "edge": {"id": "edge-hawaii-transfer-failed", "destination_node_id": "node-hawaii-failed", "transition_condition": {"type": "prompt", "prompt": "Transfer failed"}},
      "display_position": {"x": 4700, "y": 300}
    },
    {
      "id": "node-hawaii-failed",
      "type": "conversation",
      "name": "Hawaii Transfer Failed",
      "instruction": {"type": "static_text", "text": "I'm sorry, the transfer didn't work. They must be really busy with this special. You can call 818-992-5100 to speak with someone about the Hawaii package."},
      "edges": [{"id": "edge-hawaii-failed-done", "destination_node_id": "node-end-call", "transition_condition": {"type": "prompt", "prompt": "After providing number"}}],
      "display_position": {"x": 5300, "y": 300}
    },
    {
      "id": "node-end-call",
      "type": "end",
      "name": "End Call",
      "instruction": {"type": "static_text", "text": "Thank you so much for calling Casablanca Express. Have a wonderful day!"},
      "display_position": {"x": 5300, "y": 500}
    }
  ],
  "start_node_id": "node-caller-id-lookup",
  "start_speaker": "agent",
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
      "parameters": {"type": "object", "properties": {"phone": {"type": "string", "description": "Customer phone from caller ID"}}, "required": ["phone"]},
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
      "parameters": {"type": "object", "properties": {"phone_number": {"type": "string", "description": "Phone number to look up"}}, "required": ["phone_number"]},
      "args_at_root": true,
      "timeout_ms": 120000
    },
    {
      "tool_id": "tool-customer-status-manual",
      "name": "customer_status",
      "type": "custom",
      "method": "POST",
      "url": "https://web-production-4080.up.railway.app/api/rims/customer-status",
      "description": "Check customer status with vac_id and pkg_code2",
      "headers": {"Content-Type": "application/json"},
      "parameter_type": "json",
      "parameters": {"type": "object", "properties": {"vac_id": {"type": "number"}, "pkg_code2": {"type": "string"}}, "required": ["vac_id", "pkg_code2"]},
      "args_at_root": true,
      "timeout_ms": 120000
    },
    {
      "tool_id": "tool-create-memo",
      "name": "create_memo",
      "type": "custom",
      "method": "POST",
      "url": "https://web-production-4080.up.railway.app/api/rims/create-memo",
      "description": "Create a memo in customer account",
      "headers": {"Content-Type": "application/json"},
      "parameter_type": "json",
      "parameters": {"type": "object", "properties": {"vac_id": {"type": "string"}, "memo_type": {"type": "string"}, "details": {"type": "string"}}, "required": ["vac_id", "memo_type"]},
      "timeout_ms": 120000
    },
    {
      "tool_id": "tool-google-chat",
      "name": "ask_team_for_help",
      "type": "custom",
      "method": "POST",
      "url": "https://retell-human-assistance-production.up.railway.app/api/human-assistance/ask",
      "description": "Ask human team for help via Google Chat",
      "headers": {"Content-Type": "application/json"},
      "parameter_type": "json",
      "parameters": {"type": "object", "properties": {"question": {"type": "string"}, "customer_name": {"type": "string"}, "vac_id": {"type": "number"}, "context": {"type": "string"}}, "required": ["question"]},
      "args_at_root": true,
      "timeout_ms": 300000,
      "response_variables": {"team_response": "$.response"}
    }
  ],
  "default_dynamic_variables": {
    "{{call.from_number}}": ""
  },
  "model_choice": {"type": "cascading", "model": "gpt-4.1"},
  "model_temperature": 0.4,
  "tool_call_strict_mode": true,
  "global_prompt": "## Agent Identity\nYou are Kassie, a professional customer service representative for Casablanca Express.\n\n## Caller ID Auto-Lookup\nThis agent automatically looks up customer status using caller ID BEFORE greeting. Use {{call.from_number}} for the initial lookup.\n\n## HAWAII UPGRADE - OFFER EARLY AND OFTEN\nThe Hawaii package is a huge value: round trip airfare for 2 people + 4 night hotel stay for only $699 TOTAL. Mention this special:\n- During deposit conversations\n- Before scheduling transfers\n- When customer is engaged and happy\n\n## CRITICAL: Deposit Amounts\nNEVER specify deposit amounts unless returned by the API."
}
FLOW_EOF
)

echo "Flow Response:"
echo "$FLOW_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$FLOW_RESPONSE"

# Extract flow ID
FLOW_ID=$(echo "$FLOW_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('conversation_flow_id', ''))" 2>/dev/null)

if [ -z "$FLOW_ID" ]; then
    echo "Failed to create flow. Check response above."
    exit 1
fi

echo ""
echo "Flow created with ID: $FLOW_ID"
echo ""
echo "Creating agent..."

# Create the agent
AGENT_RESPONSE=$(curl -s -X POST "$BASE_URL/create-agent" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"agent_name\": \"Caller ID Status Agent - Hawaii Upsell\",
    \"response_engine\": {
      \"type\": \"conversation-flow\",
      \"conversation_flow_id\": \"$FLOW_ID\"
    },
    \"voice_id\": \"11labs-Cimo\",
    \"voice_model\": \"eleven_flash_v2_5\",
    \"enable_backchannel\": true,
    \"backchannel_frequency\": 0.8,
    \"denoising_mode\": \"noise-and-background-speech-cancellation\",
    \"normalize_for_speech\": true,
    \"ambient_sound\": \"call-center\",
    \"ambient_sound_volume\": 0.80,
    \"interruption_sensitivity\": 0.9,
    \"post_call_analysis_data\": [
      {\"name\": \"customer_status\", \"type\": \"string\", \"description\": \"Customer status from lookup\"},
      {\"name\": \"call_outcome\", \"type\": \"enum\", \"options\": [\"transferred_scheduling\", \"transferred_hawaii\", \"question_answered\", \"not_found\"]},
      {\"name\": \"customer_found\", \"type\": \"boolean\", \"description\": \"Was customer found?\"},
      {\"name\": \"hawaii_offered\", \"type\": \"boolean\", \"description\": \"Was Hawaii offered?\"},
      {\"name\": \"hawaii_accepted\", \"type\": \"boolean\", \"description\": \"Did customer accept Hawaii transfer?\"}
    ]
  }")

echo "Agent Response:"
echo "$AGENT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$AGENT_RESPONSE"

AGENT_ID=$(echo "$AGENT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('agent_id', ''))" 2>/dev/null)

echo ""
echo "=========================================="
echo "DEPLOYMENT COMPLETE"
echo "=========================================="
echo "Flow ID: $FLOW_ID"
echo "Agent ID: $AGENT_ID"
echo "=========================================="
