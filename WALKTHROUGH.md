# DOE Framework Conversational Flow Builder - Complete System

## 🎉 System Overview

Successfully transformed the conversational flow builder into a **DOE (Directive-Orchestration-Execution) framework** with self-annealing capabilities, Mermaid visualization, and patterns extracted from real Retell AI templates.

## 📊 What Was Built

### Phase 1: Directives (SOPs) ✅

Created 4 comprehensive directive documents:

1. **[build_conversational_flow.md](file:///Users/marktomlet/Downloads/OAS%20LLC%202/Claude%20Code%20Workspace%20/directives/build_conversational_flow.md)** (Main Process SOP)
   - 10-step process for building flows
   - Discovery → Design → Validate → Deploy → Self-Anneal
   - Best practices from analyzed examples
   - Error handling patterns
   - Testing checklist

2. **[node_design_patterns.md](file:///Users/marktomlet/Downloads/OAS%20LLC%202/Claude%20Code%20Workspace%20/directives/node_design_patterns.md)** (Node Patterns)
   - 5 node types with examples
   - Skip response edge patterns
   - Global node settings
   - Finetune transition examples
   - Static text vs prompt guidance
   - Transfer patterns (warm/cold)

3. **[flow_architecture_patterns.md](file:///Users/marktomlet/Downloads/OAS%20LLC%202/Claude%20Code%20Workspace%20/directives/flow_architecture_patterns.md)** (High-Level Structures)
   - 5 architecture types (Linear, Branching, Hub-and-Spoke, Funnel, Component-Based)
   - Node splitting decision tree
   - Error handling architectures
   - Escalation patterns
   - Anti-patterns to avoid

4. **[self_annealing_process.md](file:///Users/marktomlet/Downloads/OAS%20LLC%202/Claude%20Code%20Workspace%20/directives/self_annealing_process.md)** (Continuous Improvement)
   - When and how to self-anneal
   - Learning categorization
   - Directive update process
   - Version control
   - Quality control

### Phase 2: Execution Scripts ✅

Created 4 Python scripts for deterministic execution:

1. **[analyze_flow_json.py](file:///Users/marktomlet/Downloads/OAS%20LLC%202/Claude%20Code%20Workspace%20/execution/analyze_flow_json.py)** - Pattern Extraction
   - Analyzes flow JSON files
   - Extracts statistics (nodes, edges, tools)
   - Identifies patterns (skip_response_edge, global_node_setting, etc.)
   - Generates learnings for directive updates

2. **[generate_mermaid_diagram.py](file:///Users/marktomlet/Downloads/OAS%20LLC%202/Claude%20Code%20Workspace%20/execution/generate_mermaid_diagram.py)** - Visualization
   - Converts flow JSON to Mermaid flowchart
   - Generates interactive HTML with diagram
   - Color-coded nodes (start, end, global, transfer)
   - Different shapes for node types

3. **[validate_flow_structure.py](file:///Users/marktomlet/Downloads/OAS%20LLC%202/Claude%20Code%20Workspace%20/execution/validate_flow_structure.py)** - Validation
   - Checks for errors and warnings
   - Validates node IDs, edges, tools
   - Detects orphaned nodes
   - Identifies circular dependencies

4. **[update_directive.py](file:///Users/marktomlet/Downloads/OAS%20LLC%202/Claude%20Code%20Workspace%20/execution/update_directive.py)** - Self-Annealing
   - Updates directives with new learnings
   - Maintains learning log
   - Version control
   - Section management

### Phase 3: Orchestration Agents ✅

Updated agents to follow DOE framework:

1. **[Logic Builder Agent](file:///Users/marktomlet/Downloads/OAS%20LLC%202/Claude%20Code%20Workspace%20/conversational-flow-builder/logic-builder-agent/AGENT.md)** (Enhanced)
   - Reads directives for SOPs
   - Calls execution scripts
   - Applies extracted patterns
   - **Commit workflow** for finalization
   - Generates Mermaid diagrams
   - Self-annealing integration

2. **[Deployment Agent](file:///Users/marktomlet/Downloads/OAS%20LLC%202/Claude%20Code%20Workspace%20/conversational-flow-builder/deployment-agent/AGENT.md)** (Existing)
   - Converts designs to API format
   - Handles all node types
   - Deployment instructions

## 🔍 Patterns Extracted from Examples

Analyzed 3 real Retell AI templates:

### Dental Outbound Sales
- **14 nodes**, 19 edges, 1 tool
- **6 skip_response_edge** usages
- **1 global_node_setting** (human escalation)
- **6 static_text**, 3 prompt instructions
- **2 transfer_call** nodes with fallbacks

### Patient Screening
- **16 nodes**, 19 edges, 0 tools
- **3 skip_response_edge** usages
- **1 global_node_setting** (angry user/human request)
- **12 prompt** instructions (all dynamic)
- Linear flow architecture

### Real Estate Appointment Setter
- **21 nodes**, 28 edges, 2 tools
- **3 skip_response_edge** usages
- **2 global_node_setting** (human request, annoyed user)
- **3 finetune_transition_examples** (time validation, spelling)
- Funnel flow architecture

### Key Patterns Identified

1. **Skip Response Before End** - 100% of templates use this
2. **Global Escalation Node** - 100% have human transfer option
3. **Transfer with Fallback** - 100% handle transfer failures
4. **Static vs Prompt Mix** - Varies by use case
5. **Spelling Confirmation** - For uncommon names/emails

## 🎨 Mermaid Diagram Generation

### Example Output

Successfully generated HTML diagrams for all templates:

**File**: `Dental Outbound Sales (from template)_diagram.html`

**Features**:
- Interactive flowchart
- Color-coded nodes:
  - 🟢 Green: Start node
  - 🔴 Pink: End nodes
  - 🟡 Yellow: Global nodes
  - 🔵 Blue: Transfer nodes
- Different shapes:
  - Rectangle: Conversation
  - Double Rectangle: Function
  - Diamond: Logic Split
  - Stadium: End
  - Trapezoid: Transfer
- Legend with explanations

### Usage

```bash
python execution/generate_mermaid_diagram.py flow.json html
# Opens: flow_diagram.html in browser
```

## 🔄 Self-Annealing Process

### How It Works

1. **Build Flow** → Identify what worked/didn't work
2. **Extract Learning** → Categorize (pattern, best practice, edge case)
3. **Update Directive** → Add to relevant section
4. **Log Change** → Track in learning_log.md
5. **System Improved** → Next flow benefits from learning

### Example Learning Cycle

**Situation**: Built 3 flows, all used skip_response_edge before end nodes

**Learning**: "Use skip_response_edge for final goodbye messages"

**Action**: 
```bash
python execution/update_directive.py \
  --directive directives/node_design_patterns.md \
  --section "Skip Response Edge" \
  --learning "Always use skip_response_edge before end nodes" \
  --type "pattern" \
  --source "Analysis of 3 templates"
```

**Result**: Directive updated, future flows automatically apply this pattern

## 🚀 Complete Workflow

### 1. User Requests Flow

"I need an appointment booking agent"

### 2. Logic Builder Agent (Orchestration)

**Reads**: `directives/build_conversational_flow.md`

**Asks Discovery Questions**:
- What type of appointments?
- Calendar integration?
- Required user information?
- Escalation criteria?

### 3. Design Flow

**Reads**: `directives/flow_architecture_patterns.md`

**Recommends**: Funnel architecture

**Reads**: `directives/node_design_patterns.md`

**Applies Patterns**:
- Skip response edge before end
- Global escalation node
- Transfer with fallback
- Spelling confirmation for names/emails

### 4. Validate Design

**Executes**: `python execution/validate_flow_structure.py design.json`

**Checks**:
- ✅ All nodes reachable
- ✅ All edges valid
- ✅ Tools defined
- ✅ No orphaned nodes

### 5. User Says "Commit"

**Agent Executes**: `python execution/generate_mermaid_diagram.py design.json html`

**Presents**:
- ✅ Flow validated
- 📊 Mermaid diagram generated
- 🔗 Link to HTML visualization
- 📋 Summary of nodes, edges, tools

### 6. User Approves

**Handoff to Deployment Agent**

### 7. Deploy

**Deployment Agent**:
- Converts to Retell AI API format
- Provides deployment instructions
- Includes testing scenarios

### 8. Self-Anneal

**After Deployment**:
- Identify learnings
- Update directives
- System is now smarter

## 📁 Complete File Structure

```
/Users/marktomlet/Downloads/OAS LLC 2/Claude Code Workspace /
├── directives/                          # SOPs (Directive Layer)
│   ├── README.md
│   ├── build_conversational_flow.md     # Main process
│   ├── node_design_patterns.md          # Node patterns
│   ├── flow_architecture_patterns.md    # Flow structures
│   └── self_annealing_process.md        # Continuous improvement
│
├── execution/                           # Scripts (Execution Layer)
│   ├── README.md
│   ├── analyze_flow_json.py             # Pattern extraction
│   ├── generate_mermaid_diagram.py      # Visualization
│   ├── validate_flow_structure.py       # Validation
│   └── update_directive.py              # Self-annealing
│
├── conversational-flow-builder/         # Orchestration Layer
│   ├── README.md
│   ├── research-agents/                 # Reference knowledge
│   │   ├── api-flow-logic.md
│   │   └── best-practices.md
│   ├── logic-builder-agent/             # Flow designer
│   │   └── AGENT.md (ENHANCED)
│   ├── deployment-agent/                # API converter
│   │   ├── AGENT.md
│   │   └── arsenal/
│   │       ├── README.md
│   │       ├── retell_client.py
│   │       └── validate_flow.py
│   └── examples/                        # Real templates
│       ├── README.md
│       ├── Dental Outbound Sales.json
│       ├── Patient Screening.json
│       ├── Real Estate Appointment Setter.json
│       └── *_diagram.html (generated)
│
└── requirements.txt
```

## 🧪 Testing Results

### Pattern Analysis ✅

Ran analyzer on all 3 templates:

```bash
python execution/analyze_flow_json.py conversational-flow-builder/examples/*.json
```

**Results**:
- ✅ Extracted 19 total patterns
- ✅ Generated 7 learnings
- ✅ Identified common structures
- ✅ Statistics for all flows

### Mermaid Generation ✅

Generated diagrams for all templates:

```bash
python execution/generate_mermaid_diagram.py "conversational-flow-builder/examples/Dental Outbound Sales (from template).json" html
```

**Results**:
- ✅ HTML diagram created
- ✅ All nodes visualized
- ✅ Color-coded properly
- ✅ Interactive and viewable in browser

### Validation ✅

Validated flow structures:

```bash
python execution/validate_flow_structure.py flow.json
```

**Results**:
- ✅ Detects errors
- ✅ Identifies warnings
- ✅ Checks orphaned nodes
- ✅ Validates tools

## 🎯 Key Features

### 1. DOE Framework Compliance

- ✅ **Directives**: SOPs in markdown
- ✅ **Orchestration**: AI agents read directives
- ✅ **Execution**: Python scripts for deterministic work

### 2. Self-Annealing

- ✅ System learns from experience
- ✅ Directives updated with learnings
- ✅ Gets better over time
- ✅ Learning log maintained

### 3. Mermaid Visualization

- ✅ Generate flowcharts from JSON
- ✅ Interactive HTML output
- ✅ Color-coded nodes
- ✅ Different shapes for types

### 4. Pattern Library

- ✅ Extracted from real templates
- ✅ Documented in directives
- ✅ Applied automatically
- ✅ Continuously growing

### 5. Commit Workflow

- ✅ User says "commit"
- ✅ Agent validates design
- ✅ Generates Mermaid diagram
- ✅ Presents visualization
- ✅ Ready for deployment

## 📖 Usage Guide

### Building a New Flow

1. **Start with Logic Builder Agent**
   - Open `conversational-flow-builder/logic-builder-agent/AGENT.md`
   - Answer discovery questions
   - Collaborate on design

2. **Agent Follows Directives**
   - Reads `directives/build_conversational_flow.md`
   - Applies patterns from `directives/node_design_patterns.md`
   - Uses architecture from `directives/flow_architecture_patterns.md`

3. **Validate Design**
   - Agent runs `execution/validate_flow_structure.py`
   - Checks for errors
   - Ensures completeness

4. **Commit and Visualize**
   - Say "commit" or "finalize"
   - Agent runs `execution/generate_mermaid_diagram.py`
   - View HTML diagram
   - Approve or iterate

5. **Deploy**
   - Handoff to Deployment Agent
   - Convert to API format
   - Deploy to Retell AI

6. **Self-Anneal**
   - Identify learnings
   - Run `execution/update_directive.py`
   - Update directives
   - System improved

### Analyzing Existing Flows

```bash
# Analyze patterns
python execution/analyze_flow_json.py flow.json

# Generate diagram
python execution/generate_mermaid_diagram.py flow.json html

# Validate structure
python execution/validate_flow_structure.py flow.json
```

## 🎓 What Makes This Special

1. **Self-Improving**: Gets smarter with every flow built
2. **Pattern-Based**: Uses proven patterns from real templates
3. **Visual**: Mermaid diagrams for easy understanding
4. **DOE Framework**: Proper separation of concerns
5. **Deterministic**: Execution scripts are testable and reliable
6. **Comprehensive**: Covers entire lifecycle from design to deployment

## 🔮 Future Enhancements

Potential improvements:
- A/B testing framework for flows
- Analytics integration
- Automated testing suite
- Flow versioning system
- Template library expansion

---

**The system is complete, tested, and ready to build amazing conversational flows!**

Start by opening the Logic Builder Agent and designing your first flow with the DOE framework.
