# Directive: Self-Annealing Process

## Goal

Enable the system to learn from experience and continuously improve by updating directives with new patterns, learnings, and best practices.

## What is Self-Annealing?

**Definition**: The process of the system improving itself by:
1. Identifying what works and what doesn't
2. Extracting patterns and learnings
3. Updating directives with new knowledge
4. Testing improvements
5. Becoming progressively better

**Why it matters**: LLMs are probabilistic, but business logic should be deterministic. By capturing learnings in directives, we make the system more reliable over time.

## When to Self-Anneal

### Trigger Events

1. **After building a flow** - Capture what worked well
2. **After encountering an error** - Document the fix
3. **After discovering a pattern** - Add to directive
4. **After user feedback** - Incorporate improvements
5. **After API changes** - Update integration patterns
6. **After testing** - Document edge cases

### Don't Anneal When

- Making one-off changes specific to single use case
- Experimenting without validation
- Based on single data point
- Without understanding root cause

## Self-Annealing Loop

```
Build Flow → Test → Identify Learning → Update Directive → Validate → System Improved
     ↑                                                                        ↓
     └────────────────────────────────────────────────────────────────────────┘
```

### Step 1: Identify Learning

**Questions to ask**:
- What pattern did I use that worked well?
- What error did I encounter and how did I fix it?
- What edge case did I discover?
- What API constraint did I learn?
- What user behavior surprised me?
- What could be done better next time?

**Examples of learnings**:
- "Users often say '9:41am' but only ':00' and ':30' times are valid"
- "Transfer failures happen ~5% of the time, need fallback"
- "Spelling out email addresses reduces errors by 80%"
- "Global escalation node reduces frustration"

### Step 2: Categorize Learning

**Types of learnings**:

1. **Pattern** - Reusable structure or approach
   - Example: "Use skip_response_edge before transfers"
   
2. **Best Practice** - Guideline for better results
   - Example: "Spell out non-common names"
   
3. **Edge Case** - Specific scenario to handle
   - Example: "User provides partial phone number"
   
4. **API Constraint** - Technical limitation
   - Example: "Calendar API timeout after 5 seconds"
   
5. **User Behavior** - How users actually interact
   - Example: "Users say 'representative' not 'human agent'"

### Step 3: Update Directive

**Tool**: `python execution/update_directive.py`

**Usage**:
```bash
python execution/update_directive.py \
  --directive "directives/node_design_patterns.md" \
  --section "Common Patterns" \
  --learning "Use skip_response_edge before transfers to avoid awkward pauses" \
  --type "pattern" \
  --source "Real Estate template analysis"
```

**What gets updated**:
- Add new pattern to relevant section
- Update examples with real cases
- Add to checklist if applicable
- Update decision trees
- Increment version number

### Step 4: Validate Update

**Checklist**:
- [ ] Learning is generalizable (not one-off)
- [ ] Directive structure maintained
- [ ] Examples are clear
- [ ] No contradictions with existing content
- [ ] Version incremented
- [ ] Change logged

### Step 5: Test Improvement

**How to test**:
1. Build a new flow using updated directive
2. Verify pattern is applied correctly
3. Compare results to previous approach
4. Measure improvement (if quantifiable)

## Directive Update Guidelines

### What to Add

✅ **Do add**:
- Patterns that appear in multiple examples
- Solutions to common problems
- API constraints discovered
- User behavior insights
- Successful workarounds
- Performance improvements

❌ **Don't add**:
- One-off solutions
- Unvalidated theories
- Personal preferences without data
- Contradictory advice
- Overly specific details

### How to Add

**Format**:
```markdown
### Pattern Name

**When to use**: [Specific scenario]

**Structure**:
```json
[Example code]
```

**Example from**: [Source]

**Best practices**:
- Point 1
- Point 2
```

**Location**:
- Patterns → `node_design_patterns.md`
- Architecture → `flow_architecture_patterns.md`
- Process → `build_conversational_flow.md`
- Meta → `self_annealing_process.md`

## Examples of Self-Annealing

### Example 1: Discovered Pattern

**Situation**: Built 3 flows, all used skip_response_edge before end nodes

**Learning**: "Use skip_response_edge for final goodbye messages"

**Action**: Added to `node_design_patterns.md` under "Skip Response Edge" section

**Result**: Next flow automatically used this pattern

### Example 2: API Constraint

**Situation**: Calendar API failed when checking >30 days ahead

**Learning**: "Calendar API limited to 30-day lookahead"

**Action**: Added to `build_conversational_flow.md` under "Edge Cases"

**Result**: Future flows validate date range before API call

### Example 3: User Behavior

**Situation**: Users say "rep" or "person" instead of "human agent"

**Learning**: "Expand global_node_setting condition to include variations"

**Action**: Updated `node_design_patterns.md` with example

**Result**: Better escalation trigger coverage

### Example 4: Error Fix

**Situation**: Transfer failures left users hanging

**Learning**: "Always have fallback node for transfer failures"

**Action**: Added to `flow_architecture_patterns.md` under "Error Handling"

**Result**: All transfers now have fallback paths

## Tracking Learnings

### Learning Log Format

**File**: `directives/learning_log.md`

**Entry structure**:
```markdown
## [Date] - [Learning Title]

**Type**: Pattern | Best Practice | Edge Case | API Constraint | User Behavior

**Source**: [Where discovered]

**Description**: [What was learned]

**Action Taken**: [Which directive updated, what section]

**Impact**: [How this improves the system]

**Validation**: [How we know it works]
```

### Metrics to Track

- Number of learnings captured
- Directives updated per month
- Patterns reused across flows
- Error rate reduction
- Time to build flows (should decrease)
- User satisfaction (should increase)

## Directive Versioning

### Version Format

`v[major].[minor].[patch]`

**Major**: Significant restructure or paradigm shift
**Minor**: New patterns or sections added
**Patch**: Small fixes or clarifications

### Version History

**Location**: Top of each directive file

**Format**:
```markdown
# Directive: [Name]

**Version**: v1.2.3
**Last Updated**: 2024-12-02
**Changelog**:
- v1.2.3 (2024-12-02): Added skip_response_edge pattern
- v1.2.2 (2024-12-01): Fixed transfer fallback example
- v1.2.0 (2024-11-30): Added global_node_setting section
```

## Quality Control

### Before Updating Directive

1. **Validate learning** - Is it generalizable?
2. **Check for conflicts** - Does it contradict existing advice?
3. **Test in isolation** - Does the pattern work independently?
4. **Get feedback** - Does it make sense to others?

### After Updating Directive

1. **Review diff** - What changed?
2. **Test with new flow** - Does it apply correctly?
3. **Document in log** - Record the change
4. **Share with team** - Communicate improvement

## Continuous Improvement Cycle

### Weekly
- Review learnings from past week
- Update relevant directives
- Test one updated pattern

### Monthly
- Analyze which patterns are most used
- Identify gaps in directives
- Major directive updates if needed

### Quarterly
- Review all directives for consistency
- Measure improvement metrics
- Plan major enhancements

## Anti-Patterns in Self-Annealing

### ❌ Over-Annealing
**Problem**: Updating directives too frequently with unvalidated learnings
**Solution**: Require validation before updating

### ❌ Under-Annealing
**Problem**: Not capturing learnings, repeating mistakes
**Solution**: Make annealing part of workflow

### ❌ Contradictory Updates
**Problem**: New advice conflicts with existing
**Solution**: Review entire directive before adding

### ❌ Overly Specific
**Problem**: Adding one-off solutions as patterns
**Solution**: Ensure generalizability

## Success Criteria

✅ System is self-annealing when:
- Directives grow with experience
- Same mistakes aren't repeated
- New flows are faster to build
- Patterns are consistently applied
- Error rates decrease over time
- Team knowledge is captured

---

**Remember**: Self-annealing is not automatic. It requires discipline to capture learnings and update directives. But the payoff is a system that gets smarter with every flow built.
