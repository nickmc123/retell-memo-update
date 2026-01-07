# Directive: Build Conversational Flow

## Goal

Build production-ready Retell AI conversational flow agents that are robust, user-friendly, and follow best practices.

## Inputs

- **User Requirements**: What the agent should accomplish
- **Use Case Description**: Context, users, business goals
- **Integration Needs**: External APIs, databases, tools
- **Constraints**: Compliance, security, business rules

## Tools

Execute these scripts in order:

1. **Discovery**: `execution/analyze_flow_json.py` - Study existing examples for patterns
2. **Design**: Work with Logic Builder Agent (orchestration layer)
3. **Validate**: `execution/validate_flow_structure.py` - Check structure
4. **Visualize**: `execution/generate_mermaid_diagram.py` - Create diagram
5. **Deploy**: Use Deployment Agent (orchestration layer)

## Outputs

- **Flow JSON**: Complete Retell AI conversation flow configuration
- **Mermaid Diagram**: Visual representation of the flow
- **Test Scenarios**: Cases to validate the flow
- **Documentation**: How the flow works and why decisions were made

## Process

### Step 1: Discovery (Orchestration)

**Agent asks questions**:
1. What is the primary purpose of this agent?
2. Who are the users and what do they need?
3. What external systems need integration?
4. What data do you have about users?
5. What actions should the agent take?
6. When should it escalate to humans?
7. Are there compliance requirements?

**Agent references**: `directives/node_design_patterns.md`, `directives/flow_architecture_patterns.md`

### Step 2: Design Flow Structure (Orchestration)

**Agent proposes**:
- High-level flow architecture (linear, branching, hub-and-spoke, component-based)
- Node breakdown with types
- Edge conditions and transitions
- Error handling paths
- Escalation points

**Agent applies patterns from**: Analyzed examples, best practices directives

### Step 3: Design Each Node (Orchestration)

**For each node, agent specifies**:
- **Type**: conversation, function, logic_split, end, transfer_call
- **Instruction**: static_text or prompt
- **Edges**: Transition conditions and destinations
- **Special features**: skip_response_edge, global_node_setting, finetune_transition_examples

**Agent references**: `directives/node_design_patterns.md`

### Step 4: Define Tools & Components (Orchestration)

**Agent specifies**:
- External API integrations
- Calendar/booking tools
- Custom webhooks
- Reusable components

### Step 5: Add Error Handling (Orchestration)

**Agent ensures**:
- Every API call has success/failure paths
- Transfer failures have fallbacks
- Invalid input has retry logic
- Universal escalation path exists (global_node_setting)

### Step 6: Validate Design (Execution)

**Run**: `python execution/validate_flow_structure.py design.json`

**Checks**:
- All nodes reachable from start
- All edges have valid destinations
- All tools defined
- End nodes exist
- No circular dependencies without exit

### Step 7: Generate Visualization (Execution)

**Run**: `python execution/generate_mermaid_diagram.py design.json`

**Outputs**: Mermaid diagram showing flow structure

### Step 8: User Review & Iterate (Orchestration)

**Agent presents**:
- Flow structure diagram
- Node-by-node breakdown
- Tool integrations
- Test scenarios

**Agent asks**: "Does this cover all use cases? Any edge cases to handle?"

### Step 9: Finalize & Deploy (Orchestration + Execution)

**Agent uses**: Deployment Agent to convert to API format

**Agent provides**: Deployment instructions, testing checklist

### Step 10: Self-Anneal (Execution)

**After deployment**:
- Identify learnings (new patterns, issues, improvements)
- Run: `python execution/update_directive.py` with learnings
- Update relevant directives
- System is now smarter

## Default Agent Configuration

**ALWAYS apply these settings to every agent unless specifically overridden:**

```json
{
  "model_choice": {
    "type": "cascading",
    "model": "gpt-4.1"
  },
  "ambient_sound": "call-center",
  "ambient_sound_volume": 0.80
}
```

### Execution Mode Selection

**Rigid Mode (default)** - Use when:
- Flow is linear and predictable
- User must complete steps in order
- Compliance requirements (HIPAA, PCI) demand controlled paths
- Simple use cases with <15 nodes

**Flex Mode** - Use when:
- Users frequently jump between topics
- Multiple intents can be handled in any order
- Users change their mind mid-conversation
- Complex flows with >20 nodes that need context switching
- Single-prompt flexibility with flowchart structure

**Enable Flex Mode at agent level**:
```json
{
  "flex_mode": true
}
```

**Enable Flex Mode on specific component only**:
- Keep main flow rigid, enable flex on complex sub-flows
- Useful for multi-intent service flows

**Flex Mode Limitations**:
- No "Speak After Execution" setting (always speaks after function)
- No "waitForResult" setting (always waits)
- Node-level knowledge base ignored (use agent-level KB)
- Performance degrades beyond 20 nodes
- Keep node instructions concise
- Use only Prompt edges (avoid Equation edges)

### Post-Call Analysis Configuration

**Configure post-call analysis based on use case:**

```json
{
  "post_call_analysis_data": [
    {
      "name": "caller_intent",
      "type": "enum",
      "description": "Primary reason for calling",
      "options": ["booking", "inquiry", "support", "complaint", "other"]
    },
    {
      "name": "outcome",
      "type": "enum",
      "description": "Call outcome",
      "options": ["completed", "transferred", "callback_scheduled", "declined", "dropped"]
    },
    {
      "name": "customer_name",
      "type": "string",
      "description": "Customer's full name if provided"
    },
    {
      "name": "appointment_booked",
      "type": "boolean",
      "description": "Whether an appointment was successfully booked"
    }
  ],
  "post_call_analysis_model": "gpt-4.1"
}
```

**Standard fields by use case:**

| Use Case | Recommended Fields |
|----------|-------------------|
| **Appointment Booking** | appointment_booked (bool), appointment_time (string), customer_email (string), outcome (enum) |
| **Sales/Lead Qualification** | lead_qualified (bool), interest_level (enum: hot/warm/cold), objections (string), next_steps (string) |
| **Customer Support** | issue_resolved (bool), issue_category (enum), escalated (bool), satisfaction_expressed (enum) |
| **Inbound Inquiry** | inquiry_type (enum), answered_satisfactorily (bool), follow_up_needed (bool) |

---

## Best Practices

### From Examples Analysis (6 Templates)

1. **Use skip_response_edge** for announcements that don't need user response
   - Transfer announcements
   - Confirmations before end
   - Goodbye messages

2. **Use global_node_setting** for universal triggers
   - Human escalation ("talk to human")
   - Emergency exits
   - Angry user detection
   - General inquiries (route to FAQ node)

3. **Use static_text** for scripted messages
   - Greetings with variables: "Hi, this is {name} from {company}"
   - Confirmations: "I've booked your appointment"
   - Goodbyes: "Thank you, have a great day"

4. **Use prompt** for dynamic responses
   - Questions that adapt to context
   - Responses based on user input
   - Conditional messaging

5. **Always handle transfer failures**
   - Have fallback node when transfer fails
   - Offer callback or alternative

6. **Spell out complex information**
   - Names that aren't common
   - Email addresses (character by character)
   - Confirmation numbers

7. **Use finetune_transition_examples** for tricky transitions
   - When AI might misinterpret
   - Edge cases in user responses
   - Specific validation rules

### Node Splitting Rules

**Split nodes when**:
- Different user intents need different handling
- API calls have success/failure paths
- Validation requires retry logic
- Confirmation loops needed
- Complex conditional logic (>3 conditions)

**Don't split when**:
- Simple linear flow
- Single question-answer
- No branching needed
- Would create unnecessary complexity

### Error Handling Patterns

**Pattern 1: API Failure**
```
API Call Node → Success Edge → Continue Flow
             → Failure Edge → Error Handler → Retry or Escalate
```

**Pattern 2: Invalid Input**
```
Collect Input → Validate → Valid → Continue
                        → Invalid → Clarify → Retry (max 3 times) → Escalate
```

**Pattern 3: Transfer Failure**
```
Transfer Node → Success → (call transferred)
             → Failure → Apologize → Offer Callback → End
```

## Stuck-Node Problem & Mitigation Strategies

### The Problem

Conversational flows are inherently forward-moving. When a user says "yes, I want to buy" and moves to a "purchase order" node, then changes their mind to "actually, I want to sell instead", the agent cannot naturally backtrack. This creates friction and poor user experience.

### Mitigation Strategy 1: Global Intent Nodes

Add global nodes that can intercept intent changes from ANY point in the flow:

```json
{
  "id": "intent_change_handler",
  "type": "conversation",
  "global_node_setting": {
    "condition": "User changes their mind, wants to do something different, asks to start over, or expresses a completely different intent than the current flow path"
  },
  "instruction": {
    "type": "prompt",
    "text": "Acknowledge their change of direction and ask what they'd like to do instead. Route them to the appropriate path."
  },
  "edges": [
    {"destination_node_id": "path_a", "transition_condition": {"type": "prompt", "prompt": "User wants option A"}},
    {"destination_node_id": "path_b", "transition_condition": {"type": "prompt", "prompt": "User wants option B"}},
    {"destination_node_id": "start_node", "transition_condition": {"type": "prompt", "prompt": "User wants to start over completely"}}
  ]
}
```

### Mitigation Strategy 2: Use Flex Mode

For flows where users frequently jump between topics or change direction, enable **Flex Mode**:

- Converts nodes to "Tasks" that can be navigated dynamically
- Allows context switching without losing progress
- Agent can resume previous tasks after handling interruptions
- Best for multi-intent flows (support, sales with multiple products)

**When to use**: If >30% of calls involve users changing direction mid-flow.

### Mitigation Strategy 3: Escape Edges on Every Collection Node

Add explicit "escape routes" to nodes that collect information:

```json
{
  "id": "collect_address",
  "edges": [
    {"destination_node_id": "next_step", "transition_condition": {"type": "prompt", "prompt": "User provided address"}},
    {"destination_node_id": "intent_router", "transition_condition": {"type": "prompt", "prompt": "User wants to do something else instead"}},
    {"destination_node_id": "faq_handler", "transition_condition": {"type": "prompt", "prompt": "User asks a question"}},
    {"destination_node_id": "transfer", "transition_condition": {"type": "prompt", "prompt": "User asks for human"}}
  ]
}
```

### Mitigation Strategy 4: Confirmation Loops with Exit

Before committing to irreversible actions, add confirmation with escape:

```json
{
  "id": "confirm_purchase",
  "instruction": {
    "type": "prompt",
    "text": "Just to confirm - you'd like to purchase [item] for [price]. Is that correct, or would you like to do something else?"
  },
  "edges": [
    {"destination_node_id": "process_payment", "transition_condition": {"type": "prompt", "prompt": "User confirms purchase"}},
    {"destination_node_id": "intent_router", "transition_condition": {"type": "prompt", "prompt": "User wants something different"}},
    {"destination_node_id": "cancel_flow", "transition_condition": {"type": "prompt", "prompt": "User wants to cancel"}}
  ]
}
```

### Mitigation Strategy 5: Intent Router Hub

Create a central "hub" node that routes based on current intent:

```
Welcome → Intent Router → [Buying Flow]
                       → [Selling Flow]
                       → [Questions Flow]
                       → [Transfer]
```

Any node can route back to the Intent Router when user expresses different intent.

---

## Edge Cases

### Common Issues

1. **User changes mind mid-flow**
   - Solution 1: Add global intent change handler node
   - Solution 2: Enable Flex Mode for complex flows
   - Solution 3: Add escape edges to all collection nodes
   - Solution 4: Create intent router hub for re-routing

2. **API timeout**
   - Solution: Set reasonable timeouts, have fallback message

3. **Unclear user intent**
   - Solution: Clarify node that asks for confirmation

4. **User provides partial information**
   - Solution: Collect missing pieces, don't assume

5. **Transcription errors**
   - Solution: Confirm critical information (spell out names, emails)

### Timing Considerations

- **API calls**: Should complete in <3 seconds
- **User silence**: Wait 2-3 seconds before prompting
- **Transfer wait**: Inform user if >5 seconds

### Compliance

- **PCI**: Never store credit card info in prompts
- **HIPAA**: Don't log sensitive health data
- **GDPR**: Provide opt-out, data deletion
- **TCPA**: Respect do-not-call, provide opt-out

## Notes

### Continuous Improvement

After each flow deployment:
1. Monitor call transcripts
2. Identify failure points
3. Update prompts/transitions
4. Add new patterns to directives
5. Share learnings with team

### Version Control

- Track directive versions
- Log all updates with reasoning
- Keep changelog of patterns added

### Testing Checklist

Before deployment:
- [ ] Happy path works end-to-end
- [ ] All error handlers tested
- [ ] Transfer failures handled
- [ ] Invalid inputs handled
- [ ] Escalation path works
- [ ] All tools tested independently
- [ ] Mermaid diagram matches implementation

---

## Deployment Technical Requirements

### Node Positioning

**CRITICAL**: Every node MUST have a `display_position` object with x and y coordinates. Without this, nodes stack on top of each other in the Retell AI visual editor.

```json
{
  "id": "node_id",
  "display_position": {
    "x": 500,
    "y": 300
  }
}
```

**Layout Algorithm**:
```
Column 1 (x: 250)   - Start/Entry point
Column 2 (x: 750)   - Greeting/Initial routing
Column 3 (x: 1250)  - First action nodes
Column 4 (x: 1750)  - Function calls
Column 5 (x: 2250)  - Results/Next steps
Column 6 (x: 2750)  - Secondary actions
Column 7+ (x: 3250+) - Closing/End nodes

Rows (y values):
- Primary path: y: 300-500
- Alternative paths: y: 700-900
- Error handlers: y: 1200-1400
- Global nodes: y: 1500-1800
```

### Required Schema Fields (Learned from Deployment)

**All Edges MUST have**:
```json
{
  "id": "edge_unique_id",              // REQUIRED - causes failure if missing
  "condition": "Human readable",
  "transition_condition": {             // REQUIRED
    "type": "prompt",
    "prompt": "Detailed condition"
  },
  "destination_node_id": "target_node"  // REQUIRED
}
```

**Skip Response Edges MUST have**:
```json
{
  "skip_response_edge": {
    "id": "skip_edge_id",               // REQUIRED
    "condition": "Skip response",
    "transition_condition": {
      "type": "prompt",
      "prompt": "Skip response"
    },
    "destination_node_id": "next_node"
  }
}
```

**Function Nodes MUST have**:
```json
{
  "type": "function",
  "tool_id": "tool_reference",
  "tool_type": "local",                 // REQUIRED - often missed
  "instruction": {                       // REQUIRED - often missed
    "type": "prompt",
    "text": "What to do"
  },
  "wait_for_result": true,              // REQUIRED
  "speak_during_execution": false,
  "display_position": {"x": 0, "y": 0}
}
```

**Transfer Nodes MUST have**:
```json
{
  "type": "transfer_call",
  "instruction": {                       // REQUIRED - often missed
    "type": "prompt",
    "text": "Transferring now"
  },
  "transfer_destination": {...},
  "transfer_option": {...},
  "display_position": {"x": 0, "y": 0},
  "edge": {
    "id": "edge_transfer_fail",          // REQUIRED - often missed
    "condition": "Transfer failed",
    "transition_condition": {...},
    "destination_node_id": "fallback"
  }
}
```

### Common Deployment Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `must have required property 'id'` | Edge missing ID | Add unique `id` to every edge |
| `must have required property 'tool_type'` | Function node missing tool_type | Add `"tool_type": "local"` |
| `must have required property 'instruction'` | Function/transfer missing instruction | Add instruction object |
| Nodes stacked in UI | Missing display_position | Add coordinates to every node |
| `must match exactly one schema in oneOf` | Multiple schema issues | Check all required fields |
| `Edge destination node id cannot be the same as source` | Self-referencing edge | **NEVER create edges that point back to the same node** - the UI breaks and nodes become immovable |

### CRITICAL: No Self-Referencing Edges

**NEVER create an edge where `destination_node_id` equals the node's own `id`.**

Self-referencing edges (e.g., a node with an edge pointing back to itself) will break the Retell AI visual editor - users won't be able to drag or move any nodes.

**Bad example (DO NOT DO THIS):**
```json
{
  "id": "faq_handler",
  "edges": [
    {
      "id": "edge_faq_more",
      "destination_node_id": "faq_handler"  // ❌ BREAKS THE UI
    }
  ]
}
```

**Solution:** If you need looping behavior (e.g., user can ask multiple questions), rely on the node's natural conversation handling or create a separate intermediate node.

### Tool Definition Requirements

```json
{
  "type": "custom",
  "name": "tool_name",
  "description": "Clear description",
  "tool_id": "unique_tool_id",           // Must match function node references
  "url": "https://api.endpoint.com",
  "method": "POST",
  "headers": {},
  "timeout_ms": 120000,
  "speak_during_execution": false,
  "speak_after_execution": true,
  "args_at_root": true,
  "parameters": {
    "type": "object",
    "properties": {...},
    "required": [...]
  }
}
```

### Pre-Deployment Validation

Run these checks before calling the Retell API:

1. **Structure validation**:
   - Every node has `id`, `type`, `display_position`
   - Every edge has `id`, `transition_condition`, `destination_node_id`
   - `start_node_id` matches an existing node

2. **Function node validation**:
   - Has `tool_type: "local"`
   - Has `instruction` object
   - Has `wait_for_result: true`
   - `tool_id` matches a defined tool

3. **Transfer node validation**:
   - Has `instruction` object
   - Failure edge has `id` field
   - Phone numbers in E.164 format (+1234567890)

4. **Tool validation**:
   - Every `tool_id` referenced exists in tools array
   - URLs are valid
   - Parameters match expected API schema

---

**Remember**: This directive is a living document. Update it with new learnings, patterns, and best practices as you build more flows.
