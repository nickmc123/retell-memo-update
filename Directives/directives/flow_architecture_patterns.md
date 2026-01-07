# Directive: Flow Architecture Patterns

## Goal

Provide proven high-level flow architectures for different use cases.

## Architecture Types

### 1. Linear Flow

**Use when**: Simple, straightforward process with minimal branching

**Structure**:
```
Start → Step 1 → Step 2 → Step 3 → End
```

**Example use cases**:
- Simple data collection (surveys, screening)
- Sequential verification
- Step-by-step instructions

**From examples**: Patient Screening
```
Greeting → Identity Verification → Consent → Q1 → Q2 → Q3 → Q4 → Q5 → Closing → End
```

**Best practices**:
- Keep each step focused on one thing
- Provide progress indicators ("Question 3 of 5")
- Allow "go back" if needed

---

### 2. Branching Flow

**Use when**: Multiple user intents or paths based on responses

**Structure**:
```
Start → Identify Intent
  ├→ Path A → Handle A → End
  ├→ Path B → Handle B → End
  └→ Path C → Handle C → End
```

**Example use cases**:
- Customer service (billing, support, sales)
- Qualification (interested vs not interested)
- Routing based on user type

**From examples**: Dental Outbound Sales
```
Welcome → Correct User?
  ├→ Yes → Still Interested?
  │   ├→ Yes → Wants to Buy?
  │   │   ├→ Yes → Transfer
  │   │   ├→ Questions → Transfer
  │   │   └→ No → Goodbye
  │   └→ No → Goodbye
  └→ No → Goodbye
```

**Best practices**:
- Make intent recognition clear
- Provide escape hatches at each branch
- Don't nest too deeply (max 3 levels)

---

### 3. Hub-and-Spoke Flow

**Use when**: Multiple services available, user may need several

**Structure**:
```
Main Menu (Hub)
  ├→ Service A → Return to Hub
  ├→ Service B → Return to Hub
  └→ Service C → Return to Hub or End
```

**Example use cases**:
- Banking (check balance, transfer, pay bill)
- Healthcare (schedule, refill, billing)
- Multi-service support

**Best practices**:
- Clear menu at hub
- Easy return to hub
- Track what's been done
- Offer "anything else?" before ending

---

### 4. Funnel Flow

**Use when**: Progressive qualification or data collection

**Structure**:
```
Wide Entry → Filter 1 → Filter 2 → Filter 3 → Qualified → Action
                ↓           ↓           ↓
            Not Qualified → Polite Exit
```

**Example use cases**:
- Sales qualification
- Eligibility screening
- Lead scoring

**From examples**: Real Estate Appointment Setter
```
Welcome → Available Now?
  ├→ Yes → Interested in Meeting?
  │   ├→ Yes → Collect Info → Book → Success
  │   └→ No → Offer Transfer or Goodbye
  └→ No → Schedule Callback → Goodbye
```

**Best practices**:
- Qualify early to save time
- Provide value at each stage
- Graceful exits for unqualified
- Capture partial data even if not qualified

---

### 5. Component-Based Flow

**Use when**: Reusable sub-flows needed across multiple paths

**Structure**:
```
Main Flow
  ├→ [Address Collection Component]
  ├→ [Payment Component]
  └→ [Confirmation Component]
```

**Example use cases**:
- E-commerce (cart, checkout, payment)
- Complex forms with reusable sections
- Multi-step processes with shared logic

**Best practices**:
- Make components truly reusable
- Clear entry/exit points
- Independent tool sets
- Document component purpose

---

## Node Splitting Decision Tree

```
Is there conditional logic?
├→ No → Keep in one node
└→ Yes → Are there >2 conditions?
    ├→ No (2 conditions) → Keep in one node with 2 edges
    └→ Yes (>2 conditions) → Split into logic_split node
    
Does this involve an API call?
├→ No → Keep in one node
└→ Yes → Split into:
    ├→ Conversation node (prepare user)
    ├→ Function node (make call)
    └→ Conversation node (handle result)
    
Does this need validation?
├→ No → Keep in one node
└→ Yes → Split into:
    ├→ Collect node
    ├→ Validate node
    └→ Retry node (if invalid)
    
Is this a transfer?
├→ No → Keep in one node
└→ Yes → Split into:
    ├→ Announce node (with skip_response_edge)
    ├→ Transfer node
    └→ Fallback node (if transfer fails)
```

## Error Handling Architecture

### Pattern 1: Retry with Limit
```
Collect Input → Validate
  ├→ Valid → Continue
  └→ Invalid → Retry (track count)
      ├→ Count < 3 → Ask again
      └→ Count >= 3 → Escalate to human
```

### Pattern 2: Graceful Degradation
```
Try Primary Method → Success or Failure
  ├→ Success → Continue
  └→ Failure → Try Secondary Method
      ├→ Success → Continue
      └→ Failure → Manual Fallback
```

### Pattern 3: Universal Escape
```
Any Node → Global Setting Triggered
  └→ Transfer to Human (with context)
      ├→ Success → (transferred)
      └→ Failure → Offer Callback → End
```

## Escalation Patterns

### Pattern 1: Immediate Escalation
**When**: User explicitly requests human

**Flow**:
```
User says "talk to human" → Announce → Transfer → Fallback if fails
```

**Implementation**: Use `global_node_setting` on transfer node

### Pattern 2: Conditional Escalation
**When**: AI can't handle request

**Flow**:
```
Attempt to Help → Can't Resolve → Offer Human → Transfer or Continue
```

### Pattern 3: Frustrated User Detection
**When**: Multiple failed attempts or negative sentiment

**Flow**:
```
Track Failures → Threshold Reached → Proactive Offer → Transfer
```

## Flow Complexity Guidelines

### Simple Flow (5-10 nodes)
- Linear or simple branching
- 1-2 decision points
- Minimal API integration
- Example: Survey, simple booking

### Medium Flow (10-25 nodes)
- Multiple branches
- 3-5 decision points
- Several API calls
- Error handling
- Example: Customer service, appointment booking

### Complex Flow (25+ nodes)
- Multiple paths and components
- Many decision points
- Extensive API integration
- Comprehensive error handling
- Example: Multi-service platform, complex sales

**Best practice**: Start simple, add complexity as needed

## Common Anti-Patterns

### ❌ Anti-Pattern 1: Too Many Nodes
**Problem**: Over-splitting creates confusion
**Solution**: Combine simple sequential steps

### ❌ Anti-Pattern 2: No Error Handling
**Problem**: Flow breaks on API failure
**Solution**: Always have success/failure paths

### ❌ Anti-Pattern 3: Deep Nesting
**Problem**: User gets lost in sub-flows
**Solution**: Keep max 3 levels deep, provide "start over"

### ❌ Anti-Pattern 4: No Escape Hatch
**Problem**: User stuck in loop
**Solution**: Global escalation node

### ❌ Anti-Pattern 5: Unclear Intent
**Problem**: AI guesses wrong path
**Solution**: Explicit confirmation before branching

## Flow Design Checklist

### Before Building
- [ ] Identified primary user intent
- [ ] Mapped happy path
- [ ] Identified error scenarios
- [ ] Planned escalation points
- [ ] Determined architecture type

### During Building
- [ ] Each node has clear purpose
- [ ] Edges have specific conditions
- [ ] Error handlers in place
- [ ] Transfer fallbacks exist
- [ ] Global escalation available

### After Building
- [ ] All paths lead to end or transfer
- [ ] No orphaned nodes
- [ ] No infinite loops
- [ ] Mermaid diagram makes sense
- [ ] Test scenarios cover all paths

## Architecture Selection Guide

| Use Case | Recommended Architecture | Example |
|----------|-------------------------|---------|
| Survey/Screening | Linear | Patient Screening |
| Sales/Qualification | Funnel | Dental Sales, Real Estate |
| Customer Service | Branching | Multi-intent support |
| Multi-Service | Hub-and-Spoke | Banking, Healthcare |
| Complex Process | Component-Based | E-commerce checkout |

## Scaling Patterns

### From Simple to Complex

**Phase 1: MVP**
- Linear flow
- Happy path only
- Manual fallback

**Phase 2: Enhanced**
- Add branching
- Basic error handling
- Transfer capability

**Phase 3: Production**
- Full error handling
- Multiple paths
- Components for reuse
- Analytics and monitoring

**Phase 4: Optimized**
- A/B tested paths
- Personalization
- Advanced routing
- Self-improving prompts

---

**Remember**: Choose the simplest architecture that meets your needs. You can always add complexity later.
