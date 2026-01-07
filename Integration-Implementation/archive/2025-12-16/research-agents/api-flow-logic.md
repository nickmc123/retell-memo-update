# Retell AI API & Flow Logic Research

## Overview

This document contains comprehensive research on Retell AI's conversational flow API, structure, and implementation details.

## API Endpoints

### Conversation Flow Management

#### Create Conversation Flow
**Endpoint**: `POST /create-conversation-flow`

**Authentication**: Bearer token in header
```
Authorization: Bearer YOUR_RETELL_API_KEY
```

**Request Body Structure**:
```json
{
  "model_choice": {
    "type": "cascading",
    "model": "gpt-4" | "gpt-3.5-turbo" | "claude-3-opus" | "claude-3-sonnet",
    "high_priority": true | false
  },
  "model_temperature": 0.0-1.0,
  "tool_call_strict_mode": true | false,
  "knowledge_base_ids": ["kb_001", "kb_002"],
  "kb_config": {
    "top_k": 3,
    "filter_score": 0.6
  },
  "start_speaker": "agent" | "user",
  "begin_after_user_silence_ms": 2000,
  "global_prompt": "You are a helpful customer service agent.",
  "tools": [...],
  "components": [...],
  "start_node_id": "start",
  "default_dynamic_variables": {
    "company_name": "Your Company",
    "support_hours": "9 AM - 5 PM"
  },
  "nodes": [...]
}
```

#### List Conversation Flows
**Endpoint**: `GET /list-conversation-flows`

Returns all conversation flows for your account.

#### Update Conversation Flow
**Endpoint**: `PATCH /update-conversation-flow/{conversation_flow_id}`

Updates an existing conversation flow with new configuration.

#### Delete Conversation Flow
**Endpoint**: `DELETE /delete-conversation-flow/{conversation_flow_id}`

Permanently deletes a conversation flow.

## Node Types

### 1. Conversation Node

The most common node type for direct user interaction.

**Structure**:
```json
{
  "id": "unique_node_id",
  "type": "conversation",
  "instruction": {
    "type": "prompt",
    "text": "Ask the customer how you can help them today."
  },
  "edges": [
    {
      "id": "edge_1",
      "transition_condition": {
        "type": "prompt",
        "prompt": "Customer wants to book an appointment"
      },
      "destination_node_id": "book_appointment"
    }
  ]
}
```

**Key Features**:
- Can sustain multi-turn conversations
- Supports dynamic response generation
- Can start with static sentence then become dynamic
- Handles natural language understanding

### 2. Function Node

Calls external APIs or performs specific actions.

**Structure**:
```json
{
  "id": "call_api",
  "type": "function",
  "tool_id": "tool_001",
  "edges": [...]
}
```

**Use Cases**:
- Retrieve customer information from database
- Book appointments
- Process payments
- Send notifications
- Update CRM systems

### 3. Logic Split Node

Introduces conditional branching based on criteria.

**Structure**:
```json
{
  "id": "check_business_hours",
  "type": "logic_split",
  "condition": {
    "type": "prompt",
    "prompt": "Is it currently during business hours?"
  },
  "edges": [
    {
      "id": "during_hours",
      "transition_condition": {
        "type": "prompt",
        "prompt": "It is during business hours"
      },
      "destination_node_id": "handle_inquiry"
    },
    {
      "id": "after_hours",
      "transition_condition": {
        "type": "prompt",
        "prompt": "It is after business hours"
      },
      "destination_node_id": "after_hours_message"
    }
  ]
}
```

### 4. End Node

Marks the conclusion of a conversation.

**Structure**:
```json
{
  "id": "end_call",
  "type": "end",
  "instruction": {
    "type": "prompt",
    "text": "Thank the customer and end the call politely."
  }
}
```

**Best Practices**:
- Always provide clear exit options
- Avoid abrupt endings
- Offer value or further assistance
- Leave door open for future interactions

## Edges & Transitions

Edges define how the conversation flows between nodes.

**Structure**:
```json
{
  "id": "unique_edge_id",
  "transition_condition": {
    "type": "prompt",
    "prompt": "Description of when this transition should occur"
  },
  "destination_node_id": "target_node_id"
}
```

**Types of Transitions**:
1. **Prompt-based**: AI determines when condition is met
2. **Default**: Fallback when no other conditions match
3. **Function result**: Based on API response
4. **Variable-based**: Based on dynamic variable values

## Tools Integration

### Custom Tools

**Structure**:
```json
{
  "type": "custom",
  "name": "get_customer_info",
  "description": "Retrieve customer information from database",
  "tool_id": "tool_001",
  "url": "https://api.example.com/customer",
  "method": "GET" | "POST" | "PUT" | "DELETE",
  "headers": {
    "Authorization": "Bearer token",
    "Content-Type": "application/json"
  },
  "body_schema": {...}
}
```

### Built-in Tools

Retell AI provides built-in tools for common tasks:
- Calendar/scheduling
- SMS sending
- Email sending
- Data extraction

## Knowledge Bases

Connect your agent to knowledge sources.

**Configuration**:
```json
{
  "knowledge_base_ids": ["kb_001", "kb_002"],
  "kb_config": {
    "top_k": 3,
    "filter_score": 0.6
  }
}
```

**Parameters**:
- `top_k`: Number of relevant chunks to retrieve
- `filter_score`: Minimum relevance score (0.0-1.0)

## Dynamic Variables

Runtime customization of agent behavior.

**Usage**:
```json
{
  "default_dynamic_variables": {
    "customer_name": "John Doe",
    "account_number": "12345",
    "company_name": "Acme Corp"
  }
}
```

**In Prompts**:
```
"Greet {{customer_name}} and reference their account {{account_number}}."
```

## Model Configuration

### Model Choice

**Options**:
- `gpt-4`: Most capable, slower
- `gpt-3.5-turbo`: Fast, cost-effective
- `claude-3-opus`: High quality
- `claude-3-sonnet`: Balanced

**Cascading Mode**:
```json
{
  "type": "cascading",
  "model": "gpt-4",
  "high_priority": true
}
```

### Temperature

Controls randomness (0.0-1.0):
- **0.0-0.3**: Deterministic, consistent
- **0.4-0.7**: Balanced creativity
- **0.8-1.0**: Creative, varied

## Components

Reusable sub-flows with their own nodes and tools.

**Structure**:
```json
{
  "name": "Customer Information Collector",
  "tools": [...],
  "nodes": [...],
  "start_node_id": "collect_info",
  "begin_tag_display_position": {
    "x": 100,
    "y": 200
  }
}
```

**Benefits**:
- Modularity
- Reusability
- Easier maintenance
- Cleaner flow design

## MCPs (Model Context Protocol)

External context providers for enhanced agent capabilities.

**Structure**:
```json
{
  "name": "context_provider",
  "url": "https://api.example.com/context",
  "headers": {
    "Authorization": "Bearer token"
  },
  "query_params": {
    "key": "value"
  },
  "timeout_ms": 5000
}
```

## Response Format

**Success Response**:
```json
{
  "conversation_flow_id": "cf_abc123",
  "version": 1,
  "model_choice": {...},
  "nodes": [...],
  ...
}
```

## Error Handling

**Common Errors**:
- `401`: Invalid API key
- `400`: Invalid request body
- `404`: Conversation flow not found
- `429`: Rate limit exceeded

**Best Practices**:
- Implement retry logic with exponential backoff
- Validate request body before sending
- Handle rate limits gracefully
- Log errors for debugging

## Rate Limits

- **Create/Update**: 10 requests per minute
- **List/Get**: 100 requests per minute
- **Delete**: 10 requests per minute

## Versioning

Each update creates a new version. Previous versions are retained for rollback.

**Version Management**:
- Track version numbers
- Test new versions before promoting
- Keep changelog of changes
- Rollback capability

---

**Next**: See [best-practices.md](./best-practices.md) for design patterns and optimization strategies.
