# Example Template

Use this template to document your successful conversational flows as examples for future reference.

---

# [Agent Name]

## Use Case

**Purpose**: [What this agent accomplishes]

**Target Users**: [Who uses this agent]

**Business Context**: [When/where this is used]

## Flow Overview

### High-Level Structure

```
[Visual representation of the flow]

Example:
Start
├─ Greeting
├─ Intent Recognition
│  ├─ Path A: [Intent 1]
│  ├─ Path B: [Intent 2]
│  └─ Path C: [Intent 3]
└─ End
```

### Success Metrics

- **Completion Rate**: [X%]
- **Average Duration**: [X minutes]
- **User Satisfaction**: [X/10]
- **Escalation Rate**: [X%]

## Configuration

- **Model**: [GPT-4 / GPT-3.5 / Claude-3-Opus / Claude-3-Sonnet]
- **Temperature**: [0.0-1.0]
- **Knowledge Bases**: [List or "None"]
- **Components**: [Number of components]
- **Tools**: [Number of tools]

## Nodes

### Node: [node_id]

- **Type**: [Conversation / Function / Logic Split / End]
- **Purpose**: [What this node does]
- **Instruction/Configuration**:
  ```json
  {
    // Node configuration
  }
  ```
- **Transitions**:
  - Condition 1 → [destination_node]
  - Condition 2 → [destination_node]

[Repeat for each node]

## Tools

### Tool: [tool_name]

- **Type**: [Custom / Built-in]
- **Purpose**: [What this tool does]
- **Endpoint**: [URL]
- **Method**: [GET / POST / PUT / DELETE]
- **Configuration**:
  ```json
  {
    // Tool configuration
  }
  ```

[Repeat for each tool]

## Components

### Component: [component_name]

- **Purpose**: [What this component does]
- **Nodes**: [Number of nodes]
- **Tools**: [Number of tools]
- **Reuse Cases**: [Where this component is used]

[Repeat for each component]

## Dynamic Variables

| Variable | Purpose | Example Value |
|----------|---------|---------------|
| `customer_name` | Personalization | "John Doe" |
| `account_id` | Data retrieval | "ACC-12345" |
| `company_name` | Branding | "Acme Corp" |

## Error Handling

### Error Scenario 1: [Description]

- **Handler Node**: [node_id]
- **Recovery Path**: [How it recovers]
- **User Experience**: [What user sees/hears]

[Repeat for each error scenario]

## Key Learnings

### What Worked Well

1. [Learning 1]
2. [Learning 2]
3. [Learning 3]

### Challenges & Solutions

1. **Challenge**: [Description]
   - **Solution**: [How it was solved]

2. **Challenge**: [Description]
   - **Solution**: [How it was solved]

### Optimizations Made

1. [Optimization 1]
2. [Optimization 2]
3. [Optimization 3]

## Testing Scenarios

### Happy Path

1. [Step 1]
2. [Step 2]
3. [Step 3]
4. [Result]

### Error Scenarios

1. **Scenario**: [Description]
   - **Expected Behavior**: [What should happen]
   - **Actual Behavior**: [What did happen]

### Edge Cases

1. **Case**: [Description]
   - **Handling**: [How it's handled]

## Variations to Consider

### For Different Industries

- **Healthcare**: [How to adapt]
- **Finance**: [How to adapt]
- **Retail**: [How to adapt]

### For Different Scales

- **Small Business**: [Simplifications]
- **Enterprise**: [Additional complexity]

## Metrics & Results

### Before Deployment

- [Baseline metric 1]
- [Baseline metric 2]

### After Deployment

- [Result metric 1]
- [Result metric 2]

### ROI

- **Time Saved**: [Hours/week]
- **Cost Reduction**: [$/month]
- **Customer Satisfaction**: [Improvement %]

## Deployment Notes

### Prerequisites

1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]

### Configuration Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]

### Post-Deployment Checklist

- [ ] Tested in playground
- [ ] Ran simulation tests
- [ ] Monitored first 10 calls
- [ ] Collected user feedback
- [ ] Documented learnings

## Future Improvements

1. [Potential improvement 1]
2. [Potential improvement 2]
3. [Potential improvement 3]

## Related Examples

- [Link to related example 1]
- [Link to related example 2]

---

**Created**: [Date]
**Last Updated**: [Date]
**Version**: [Version number]
**Author**: [Your name]
