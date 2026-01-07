# Directive: Node Design Patterns

## Goal

Provide proven patterns for designing individual nodes in Retell AI conversational flows.

## Node Types Reference

### 1. Conversation Node
**Purpose**: Direct interaction with user

**When to use**:
- Asking questions
- Providing information
- Collecting data
- Confirming actions

**Structure**:
```json
{
  "id": "unique_id",
  "type": "conversation",
  "name": "Descriptive Name",
  "instruction": {
    "type": "static_text" | "prompt",
    "text": "Message content"
  },
  "edges": [...],
  "skip_response_edge": {...},  // Optional
  "global_node_setting": {...},  // Optional
  "finetune_transition_examples": [...],  // Optional
  "knowledge_base_ids": []
}
```

### 2. Function Node
**Purpose**: Call external APIs or tools

**When to use**:
- Checking calendar availability
- Booking appointments
- Retrieving customer data
- Processing payments
- Sending notifications

**Structure**:
```json
{
  "id": "unique_id",
  "type": "function",
  "name": "Descriptive Name",
  "tool_id": "tool_reference",
  "instruction": {
    "type": "prompt",
    "text": "What to say while calling function"
  },
  "speak_during_execution": true | false,
  "wait_for_result": true,
  "edges": [
    {
      "condition": "Success",
      "destination_node_id": "success_node"
    },
    {
      "condition": "Failure",
      "destination_node_id": "error_node"
    }
  ]
}
```

### 3. Transfer Call Node
**Purpose**: Transfer to human agent

**When to use**:
- User requests human
- Complex issue beyond AI capability
- Escalation needed
- Purchase/payment processing

**Structure**:
```json
{
  "id": "unique_id",
  "type": "transfer_call",
  "name": "Transfer to Agent",
  "transfer_destination": {
    "type": "predefined",
    "number": "+1234567890"
  },
  "transfer_option": {
    "type": "warm_transfer" | "cold_transfer",
    "option": {  // For warm transfer
      "type": "prompt",
      "prompt": "Summarize context for agent"
    },
    "show_transferee_as_caller": true | false  // For cold transfer
  },
  "instruction": {
    "type": "prompt",
    "text": "Transferring you now..."
  },
  "edge": {
    "condition": "Transfer failed",
    "destination_node_id": "fallback_node"
  },
  "global_node_setting": {  // Optional
    "condition": "User wants to talk to human"
  }
}
```

### 4. Logic Split Node
**Purpose**: Conditional branching

**When to use**:
- Business hours check
- Account status validation
- Eligibility determination
- Route based on criteria

**Structure**:
```json
{
  "id": "unique_id",
  "type": "logic_split",
  "name": "Check Condition",
  "edges": [
    {
      "condition": "Condition A met",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Describe condition A"
      },
      "destination_node_id": "path_a"
    },
    {
      "condition": "Condition B met",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Describe condition B"
      },
      "destination_node_id": "path_b"
    }
  ]
}
```

### 5. End Node
**Purpose**: Terminate conversation

**When to use**:
- Successful completion
- User declines service
- Error requiring callback
- Transfer completed

**Structure**:
```json
{
  "id": "unique_id",
  "type": "end",
  "name": "End Call",
  "instruction": {
    "type": "prompt",
    "text": "Politely end the call"
  }
}
```

## Special Features

### Skip Response Edge

**Purpose**: Say something and immediately transition without waiting for user response

**When to use**:
- Before transfers: "Transferring you now..."
- Before end: "Thank you, goodbye"
- After confirmations: "I've booked your appointment"

**Pattern**:
```json
{
  "type": "conversation",
  "instruction": {
    "type": "static_text",
    "text": "I've booked your appointment for Monday at 2pm."
  },
  "skip_response_edge": {
    "condition": "Skip response",
    "id": "edge-skip",
    "transition_condition": {
      "type": "prompt",
      "prompt": "Skip response"
    },
    "destination_node_id": "end_call"
  }
}
```

**Example from templates**:
- Dental Sales: "Thank you for your time!" → skip → End
- Patient Screening: Final message → skip → End
- Real Estate: "I've booked the meeting" → skip → End

### Global Node Setting

**Purpose**: Universal trigger that can activate from ANY node in the flow

**When to use**:
- Human escalation request
- Emergency exits
- Angry/frustrated user detection
- Universal commands ("start over", "cancel")

**Pattern**:
```json
{
  "type": "transfer_call",
  "global_node_setting": {
    "condition": "User explicitly says they would like to talk to a human agent"
  },
  "instruction": {
    "type": "prompt",
    "text": "Let me connect you with a human agent"
  }
}
```

**Best practices**:
- Use sparingly (1-3 per flow)
- Make conditions very specific
- Always have fallback if trigger fails

**Example from templates**:
- Dental Sales: "User wants human" → Transfer
- Patient Screening: "User angry or requests human" → Transfer
- Real Estate: "User wants to talk to human" → Transfer

### Finetune Transition Examples

**Purpose**: Train specific edge transitions with examples

**When to use**:
- Tricky validation (e.g., "9:41am" is invalid, need "9:30am")
- Spelling confirmation ("J-A-C-K-I-E" vs "Jockie")
- Edge cases AI might misinterpret

**Pattern**:
```json
{
  "type": "conversation",
  "finetune_transition_examples": [
    {
      "transcript": [
        {
          "content": "Which time do you prefer?",
          "role": "agent"
        },
        {
          "content": "Can I do 9:41am",
          "role": "user"
        }
      ],
      "id": "fe-unique-id"
    }
  ],
  "edges": [
    {
      "condition": "User selected invalid time",
      "destination_node_id": "clarify_time"
    }
  ]
}
```

**Example from templates**:
- Real Estate: Invalid appointment time (9:41am instead of 9:30am)
- Real Estate: Incorrect spelling confirmation

## Instruction Types

### Static Text

**When to use**:
- Scripted greetings
- Fixed confirmations
- Standard messages
- Compliance disclosures

**Pattern**:
```json
{
  "instruction": {
    "type": "static_text",
    "text": "Hi, this is {{agent_name}} from {{company}}. Am I speaking with {{customer_name}}?"
  }
}
```

**Variables allowed**: `{{variable_name}}`

**Example from templates**:
- "Hi, this is Grace from South Bay Dental Office..."
- "I'm sorry about that! Thank you for letting me know."
- "If you change your mind, feel free to call us back."

### Prompt (Dynamic)

**When to use**:
- Questions that adapt to context
- Responses based on user input
- Conditional messaging
- Complex interactions

**Pattern**:
```json
{
  "instruction": {
    "type": "prompt",
    "text": "Ask user for their preferred appointment time. Remember to use oral format like 'Monday, January 5th, five pm'."
  }
}
```

**Best practices**:
- Include context in prompt
- Specify format expectations
- Mention what NOT to do
- Reference available data

**Example from templates**:
- "Ask user if now is a good time to talk"
- "Check if the callee wants to buy the package for $1000"
- "Spell out their email address to double confirm"

## Edge Design Patterns

### Pattern 1: Binary Choice
```json
{
  "edges": [
    {
      "condition": "User says yes",
      "destination_node_id": "yes_path"
    },
    {
      "condition": "User says no",
      "destination_node_id": "no_path"
    }
  ]
}
```

### Pattern 2: Multi-Path Intent
```json
{
  "edges": [
    {
      "condition": "User wants to book",
      "destination_node_id": "booking_flow"
    },
    {
      "condition": "User has questions",
      "destination_node_id": "faq_flow"
    },
    {
      "condition": "User not interested",
      "destination_node_id": "polite_goodbye"
    }
  ]
}
```

### Pattern 3: Success/Failure
```json
{
  "edges": [
    {
      "condition": "API call succeeded",
      "destination_node_id": "success_handler"
    },
    {
      "condition": "API call failed",
      "destination_node_id": "error_handler"
    }
  ]
}
```

### Pattern 4: Validation Loop
```json
{
  "edges": [
    {
      "condition": "Input is valid",
      "destination_node_id": "continue_flow"
    },
    {
      "condition": "Input is invalid",
      "destination_node_id": "retry_input"  // Loops back with clarification
    }
  ]
}
```

## Common Patterns from Examples (6 Templates)

### Pattern: Identity Verification (Outbound Calls)
```
Greeting with name → Is this the right person? → Yes/No branch
```

**Example from Education Appointment Setter**:
```json
{
  "instruction": {
    "type": "static_text",
    "text": "Hi, this is Kate from Retell Education Program. Is this {{first_name}}?"
  },
  "edges": [
    {"condition": "It's not the right user", "destination_node_id": "leave_message"},
    {"condition": "It's the right user", "destination_node_id": "continue_call"}
  ]
}
```

**Nodes**:
1. Greeting with customer name variable
2. Ask for confirmation or details
3. Logic split: verified vs not verified
4. Continue flow or leave message/polite goodbye

### Pattern: New vs Existing Customer
```
Ask if ordered before → Existing → Has customer number? → Lookup
                     → New → Create account flow
```

**Example from Retail Receptionist**:
```json
{
  "instruction": {"type": "prompt", "text": "No problem! Have you placed an order with us before?"},
  "edges": [
    {"condition": "If They Have an Existing Account", "destination_node_id": "lookup_account"},
    {"condition": "If They Are a New Customer", "destination_node_id": "create_account"}
  ]
}
```

### Pattern: Multi-Intent Welcome (Inbound Support)
```
Welcome → [User states intent] → Route to appropriate flow
```

**Example from Delivery Support**:
- Start node has empty edges (listens for intent)
- Global nodes handle different intents:
  - "User needs to initiate a refund" → Refund flow
  - "User needs to check order status" → Order status flow
  - "User is angry and wants human" → Transfer

### Pattern: Interest Qualification
```
Introduction → Check Interest → Interested or Not Interested
```

**Nodes**:
1. Explain offering
2. Ask if interested
3. Branch: interested → details, not interested → goodbye

### Pattern: Appointment Booking with Cal.com
```
Collect Info → Check Availability → Present Options → Confirm → Book → Success
```

**Tools**:
```json
{
  "type": "check_availability_cal",
  "tool_id": "tool-cal-availability",
  "timezone": "America/Los_Angeles",
  "event_type_id": 0,
  "cal_api_key": ""
},
{
  "type": "book_appointment_cal",
  "tool_id": "tool-cal-book",
  "timezone": "America/Los_Angeles"
}
```

**Nodes**:
1. Collect name, email
2. Function: check_calendar_availability
3. Present 3 options
4. If none work → ask for new time range → retry
5. Confirm email
6. Function: book_appointment
7. Success message or transfer on failure

### Pattern: Payment Retry Loop
```
Get payment → Process → Success or Failure → Retry with new card
```

**Example from Retail Receptionist**:
```json
{
  "id": "payment_failed_retry",
  "instruction": {
    "type": "prompt",
    "text": "Let user know that the payment did not go through. Ask for a new payment method (new card number, expiry date, and the CVC). Confirm it by reading it back to user"
  },
  "edges": [
    {"condition": "Payment details obtained and confirmed", "destination_node_id": "process_payment"}
  ]
}
```

### Pattern: Reasonable/Unreasonable Validation
```
Ask for reason → Evaluate → Reasonable → Continue
                         → Unreasonable → Escalate to supervisor
```

**Example from Delivery Support (Refund)**:
```json
{
  "instruction": {"type": "prompt", "text": "Ask user what's the reason for their refund request."},
  "edges": [
    {"condition": "if the reason is not reasonable", "destination_node_id": "escalate_to_supervisor"},
    {"condition": "if the reason is reasonable", "destination_node_id": "get_order_id"}
  ]
}
```

### Pattern: Technical Difficulty → Transfer
```
API Failure → Apologize → Transfer to human
```

**Example from Education Setter**:
```json
{
  "instruction": {
    "type": "prompt",
    "text": "Tell user that there seems to be some technical difficulties, will transfer them to your supervisor, please hold."
  },
  "skip_response_edge": {
    "destination_node_id": "transfer_call"
  }
}
```

### Pattern: Spelling Confirmation
```
Collect Data → Spell Out → Confirm → Correct or Retry
```

**Nodes**:
1. Ask for name/email
2. Spell it out character by character
3. Ask for confirmation
4. If wrong, loop back to collect

### Pattern: Transfer with Fallback
```
Announce Transfer → Transfer → Success or Failure → Fallback
```

**Nodes**:
1. "Let me connect you..."
2. Transfer call node
3. If fails → apologize, offer callback

### Pattern: General Inquiry Handler (Global)
```
[Any node] → User asks general question → Answer from KB → Return to flow or close
```

**Example from Retail Receptionist**:
```json
{
  "global_node_setting": {
    "condition": "If User has a general inquiry (e.g., product info)"
  },
  "instruction": {
    "type": "prompt",
    "text": "Sure, could you tell me a bit more about what you're looking for?\n\nNote: answer the questions using knowledge base information"
  },
  "edges": [
    {"condition": "User's question has been answered", "destination_node_id": "anything_else"}
  ]
}
```

## Node Naming Conventions

**Good names**:
- "Welcome Node"
- "Check Business Hours"
- "Book Appointment"
- "Transfer to Agent"
- "End Call"

**Bad names**:
- "Node 1"
- "Conversation"
- "Function"
- "Logic"

**Best practice**: Name describes what the node DOES, not what type it is

## Testing Checklist

For each node:
- [ ] Has unique ID
- [ ] Has descriptive name
- [ ] Instruction is clear and complete
- [ ] All edges have valid destinations
- [ ] Error paths exist (for function nodes)
- [ ] Skip response edge used appropriately
- [ ] Global setting not overused
- [ ] Finetune examples for edge cases

---

## Critical Deployment Requirements

### Node Positioning (display_position)

**Every node MUST have a `display_position` object** with x and y coordinates to render properly in the Retell AI visual editor. Without this, all nodes stack on top of each other.

**Structure**:
```json
{
  "id": "node_id",
  "type": "conversation",
  "display_position": {
    "x": 500,
    "y": 300
  },
  ...
}
```

**Layout Algorithm**:
- Start node at approximately x: 250, y: 600
- Move right ~500px for each subsequent step in the main flow
- Branch nodes offset vertically by ~400px
- Error/fallback nodes positioned below main flow (higher y value)
- Global nodes positioned at bottom of canvas

**Example Layout Pattern**:
```
START (250, 600)
  → greeting (750, 500)
    → main_path (1250, 400)
      → function_call (1750, 400)
        → success (2250, 300)
        → failure (2250, 700)
    → alt_path (1250, 800)

GLOBAL: human_escalation (500, 1500)
END: end_call (3000, 500)
```

**Coordinate Ranges** (based on real templates):
- x: 0 to 6000+ (left to right progression)
- y: 0 to 2000+ (top to bottom for branches)

### Required Edge Fields

**Every edge MUST have these fields**:
```json
{
  "id": "edge_unique_id",           // REQUIRED - unique identifier
  "condition": "Description",        // Human-readable condition
  "transition_condition": {          // REQUIRED - how AI evaluates
    "type": "prompt",
    "prompt": "Detailed condition description"
  },
  "destination_node_id": "target"    // REQUIRED - where to go
}
```

**Common mistake**: Missing `id` field on edges causes deployment failure.

### Skip Response Edge Requirements

**Must include full structure**:
```json
{
  "skip_response_edge": {
    "id": "skip_edge_unique_id",     // REQUIRED
    "condition": "Skip response",
    "transition_condition": {
      "type": "prompt",
      "prompt": "Skip response"
    },
    "destination_node_id": "next_node"
  }
}
```

**Common mistake**: Omitting `id` or `transition_condition` causes deployment failure.

### Function Node Requirements

**Function nodes MUST have**:
```json
{
  "id": "function_node_id",
  "type": "function",
  "tool_id": "tool_reference_id",
  "tool_type": "local",              // REQUIRED
  "instruction": {                    // REQUIRED - what to say/do
    "type": "prompt",
    "text": "Instructions for the function call"
  },
  "speak_during_execution": false,
  "wait_for_result": true,           // Usually true
  "display_position": { "x": 0, "y": 0 },
  "edges": [...]
}
```

**Common mistakes**:
- Missing `tool_type` field
- Missing `instruction` field
- Missing `wait_for_result` field

### Transfer Call Node Requirements

**Transfer nodes MUST have**:
```json
{
  "id": "transfer_node_id",
  "type": "transfer_call",
  "instruction": {                    // REQUIRED
    "type": "prompt",
    "text": "Transferring your call now."
  },
  "transfer_destination": {
    "type": "predefined",
    "number": "+1234567890"
  },
  "transfer_option": {
    "type": "cold_transfer",
    "show_transferee_as_caller": false
  },
  "display_position": { "x": 0, "y": 0 },
  "edge": {                           // Single edge for failure
    "id": "edge_transfer_failed",     // REQUIRED
    "condition": "Transfer failed",
    "transition_condition": {
      "type": "prompt",
      "prompt": "Transfer failed"
    },
    "destination_node_id": "fallback_node"
  }
}
```

**Common mistakes**:
- Missing `instruction` field
- Missing `id` in the failure edge

### Tool Definition Requirements

**Custom tools MUST have**:
```json
{
  "type": "custom",
  "name": "tool_name",
  "description": "What the tool does",
  "tool_id": "tool_unique_id",        // Referenced by function nodes
  "url": "https://api.endpoint.com",
  "method": "POST",
  "headers": {},
  "timeout_ms": 120000,
  "speak_during_execution": false,
  "speak_after_execution": true,
  "args_at_root": true,               // Usually true for REST APIs
  "parameters": {
    "type": "object",
    "properties": {...},
    "required": [...]
  }
}
```

---

## Deployment Validation Checklist

Before deploying any flow, verify:

### Structure
- [ ] All nodes have unique `id` fields
- [ ] All nodes have `display_position` with x and y coordinates
- [ ] All nodes have appropriate `type` field
- [ ] Start node ID matches `start_node_id` in flow config

### Edges
- [ ] All edges have unique `id` fields
- [ ] All edges have `transition_condition` object
- [ ] All `destination_node_id` values reference existing nodes
- [ ] Skip response edges have complete structure

### Function Nodes
- [ ] All function nodes have `tool_type: "local"`
- [ ] All function nodes have `instruction` field
- [ ] All function nodes have `wait_for_result: true`
- [ ] All `tool_id` references match defined tools

### Transfer Nodes
- [ ] All transfer nodes have `instruction` field
- [ ] All transfer node failure edges have `id` field
- [ ] Transfer numbers are valid E.164 format

### Tools
- [ ] All tools have unique `tool_id`
- [ ] All tool URLs are valid
- [ ] All tool parameters match expected API schema

---

**Remember**: These patterns are extracted from real, working examples. Use them as templates but adapt to your specific use case.

---

## Enhanced Node Instruction Patterns (Advanced)

### Node Instructions as "Mini Sub-Agents"

For complex nodes, structure instructions as if the node is a specialized sub-agent with a specific task. This improves consistency and reduces errors.

**Pattern**:
```json
{
  "instruction": {
    "type": "prompt",
    "text": "## YOUR TASK\n[What the node should accomplish]\n\n## WHAT TO SAY\n[Exact or example phrasing]\n\n## WHAT TO LISTEN FOR\n[Key user responses to detect]\n\n## HANDLING EDGE CASES\n[How to handle unusual situations]\n\n## DO NOT\n[Common mistakes to avoid]"
  }
}
```

**Example - Collect Address Node**:
```json
{
  "instruction": {
    "type": "prompt",
    "text": "## YOUR TASK\nCollect the complete property address from the caller.\n\n## WHAT TO SAY\nAsk: 'Alright, um, what's the address of the property?'\n\n## WHAT TO LISTEN FOR\n- Street address (number and street name)\n- City\n- State\n- ZIP code\n\n## HANDLING PARTIAL INFO\nIf they only give street address, ask for city and state.\nIf they give everything except ZIP, that's okay - proceed.\n\n## DO NOT\n- Ask for the address if they already provided it in the greeting\n- Repeat yourself if they're still talking\n- Assume any part of the address"
  }
}
```

**Example - Confirm Email Node**:
```json
{
  "instruction": {
    "type": "prompt",
    "text": "## YOUR TASK\nSpell back the email address character by character for confirmation.\n\n## WHAT TO SAY\nFormat: 'j-o-h-n dot s-m-i-t-h at gmail dot com, correct?'\n\n## SPELLING RULES\n- Spell each character with dashes between\n- Say 'dot' for periods\n- Say 'at' for @\n- Pause after for confirmation\n\n## DO NOT\n- Skip confirmation for any email\n- Proceed if there's any doubt"
  }
}
```

**When to use enhanced instructions**:
- Data collection nodes (address, email, name)
- Confirmation nodes (spelling back critical info)
- Error handling nodes (graceful recovery)
- Nodes with multiple valid response types

---

## Global Nodes as Escape Routes

### Pattern: Universal Jump Destinations

Create global nodes that serve as "escape hatches" from any point in the conversation. This prevents users from getting stuck when they ask off-topic questions.

**Three Essential Global Nodes**:

1. **FAQ Node** - Answer general questions
```json
{
  "id": "answer_faq",
  "type": "conversation",
  "global_node_setting": {
    "condition": "User asks a general question about services, pricing, what's included, how inspections work, or company information at any point in the conversation"
  },
  "instruction": {
    "type": "prompt",
    "text": "## YOUR TASK\nAnswer the caller's question, then offer to help them schedule.\n\n## AFTER ANSWERING\nAsk: 'Would you like to schedule an inspection?'\n\n## IF YOU DON'T KNOW\nBe honest and offer to have someone call them back."
  },
  "edges": [
    {"destination_node_id": "collect_address", "transition_condition": {"type": "prompt", "prompt": "User wants to schedule or get specific quote"}},
    {"destination_node_id": "closing", "transition_condition": {"type": "prompt", "prompt": "User's questions answered, doesn't want to schedule"}}
  ]
}
```

2. **Transfer Node** - Route to humans
```json
{
  "id": "transfer_announce",
  "type": "conversation",
  "global_node_setting": {
    "condition": "User explicitly asks to speak with a human, manager, representative, or 'someone else', OR user wants to reschedule or cancel an existing appointment"
  },
  "instruction": {
    "type": "static_text",
    "text": "Sure, let me transfer you to someone who can help with that."
  },
  "edges": [
    {"destination_node_id": "transfer_call", "transition_condition": {"type": "prompt", "prompt": "Proceed immediately to transfer"}}
  ]
}
```

3. **Callback Node** - Offer callbacks
```json
{
  "id": "offer_callback",
  "type": "conversation",
  "global_node_setting": {
    "condition": "User explicitly requests a callback, wants someone to call them, or says 'just call me back'"
  },
  "instruction": {
    "type": "prompt",
    "text": "## YOUR TASK\nArrange for a callback.\n\n## WHAT TO SAY\n'No problem, I'll have someone from our team give you a call back. Is this number the best to reach you?'"
  }
}
```

**Adding Escape Edges to Regular Nodes**:

For nodes that DON'T have global_node_setting, add explicit edges to global nodes:

```json
{
  "id": "collect_address",
  "edges": [
    {"destination_node_id": "confirm_address", "transition_condition": {"type": "prompt", "prompt": "User provided address"}},
    {"destination_node_id": "answer_faq", "transition_condition": {"type": "prompt", "prompt": "User asks a question instead of providing info"}},
    {"destination_node_id": "transfer_announce", "transition_condition": {"type": "prompt", "prompt": "User asks to speak with someone"}}
  ]
}
```

---

## Advanced Fine-Tuning Patterns

### Finetune Conversation Examples

Use `finetune_conversation_examples` on a node to demonstrate HOW the node should behave:

```json
{
  "id": "greeting",
  "finetune_conversation_examples": [
    {
      "id": "greeting-booking-intent",
      "transcript": [
        {"role": "agent", "content": "Thanks for calling, this is Kate. How can I help you?"},
        {"role": "user", "content": "Hi, I need to schedule an inspection"},
        {"role": "agent", "content": "Sure thing, I can help with that. Um, what's the address of the property?"}
      ]
    },
    {
      "id": "greeting-pricing-intent",
      "transcript": [
        {"role": "agent", "content": "Thanks for calling, this is Kate. How can I help you?"},
        {"role": "user", "content": "How much do you guys charge?"},
        {"role": "agent", "content": "It depends on the property size and year built. Do you have an address I can check for you?"}
      ]
    }
  ]
}
```

### Finetune Transition Examples

Use `finetune_transition_examples` to train WHICH edge to take:

```json
{
  "id": "confirm_address",
  "finetune_transition_examples": [
    {
      "id": "confirm-correct",
      "destination_node_id": "collect_property_details",
      "transcript": [
        {"role": "agent", "content": "Okay so that's 937 Timbervalley Way - T-I-M-B-E-R-V-A-L-L-E-Y Way, correct?"},
        {"role": "user", "content": "Yes that's right"}
      ]
    },
    {
      "id": "confirm-incorrect",
      "destination_node_id": "collect_address",
      "transcript": [
        {"role": "agent", "content": "Okay so that's 937 Timbervalley Way - T-I-M-B-E-R-V-A-L-L-E-Y Way, correct?"},
        {"role": "user", "content": "No it's Timber Valley, two words"}
      ]
    }
  ]
}
```

**When to use fine-tuning**:
- Spelling/confirmation nodes (correct vs incorrect responses)
- Time selection (valid vs invalid time slots)
- Yes/no but with ambiguous phrasings
- Intent detection with subtle differences

---

## Transfer Node Critical Constraint

**IMPORTANT**: The transfer node failure edge's `transition_condition.prompt` MUST be exactly `"Transfer failed"`. Any other value will cause a deployment error.

**Correct**:
```json
{
  "edge": {
    "id": "edge_transfer_fail",
    "transition_condition": {
      "type": "prompt",
      "prompt": "Transfer failed"
    },
    "destination_node_id": "transfer_fallback"
  }
}
```

**Incorrect** (will fail deployment):
```json
{
  "edge": {
    "transition_condition": {
      "type": "prompt",
      "prompt": "Transfer failed, line busy, or no answer"  // WRONG!
    }
  }
}
```

---

## Global Prompt Framework

When designing the `global_prompt` for a conversational flow, use this comprehensive framework:

```
## ROLE
[Who the agent is - name, job title, company]

## PERSONALITY
[Character traits, speaking style, tone]

## RESPONSIBILITIES
[Numbered list of what the agent does]

## RULES (Non-negotiable)
[Critical behaviors that MUST always happen]

## SKILLS
[What the agent CAN do - capabilities]

## BOUNDARIES (What you CANNOT do)
[Explicit limitations and restrictions]

## KNOWLEDGE (Static Facts)
[Service details, pricing, IDs, contact numbers]

## CONVERSATION APPROACH
[High-level flow of how conversations should go]

## CURRENT CONTEXT
[Dynamic variables like time, caller info]

## SPEECH GUIDELINES
[How to pronounce times, dates, handle pauses]
```

**Example sections**:

```
## RULES (Non-negotiable)
- ALWAYS spell back addresses letter by letter for uncommon street names
- ALWAYS spell back email addresses character by character
- NEVER make up or assume information - if unsure, ask
- NEVER quote prices without calling calculate_charge first
- Keep responses SHORT - 1-2 sentences max before expecting input

## BOUNDARIES (What you CANNOT do)
- Cannot reschedule or cancel existing appointments (transfer to human)
- Cannot process payments or discuss payment methods
- Cannot give legal, structural, or repair advice
```

---

## Editing and Iteration Patterns

### When to Create New Flow vs Update Existing

**Create NEW flow when**:
- Making structural changes (adding/removing nodes)
- Changing fine-tuning examples that reference deleted nodes
- Major flow redesign

**Update EXISTING flow (PATCH) when**:
- Updating node instructions
- Changing edge conditions
- Updating global_prompt
- Fixing bugs in existing structure

**Common error**: "Please remove or update the finetune examples before deleting the associated node or edge" - this means you need to create a new flow instead of patching.

### Quick Editing Workflow

1. **Export**: Read current flow JSON
2. **Edit**: Modify in local file
3. **Validate**: Check required fields
4. **Deploy**: POST new or PATCH existing
5. **Test**: Make test calls
6. **Iterate**: Repeat as needed
