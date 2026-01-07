#!/bin/bash
# Deploy A&F Luxury Travel agent to Retell AI

API_KEY="***REMOVED***"
BASE_URL="https://api.retellai.com"
CREATE_FLOW_ENDPOINT="create-conversation-flow"
CREATE_AGENT_ENDPOINT="create-agent"

echo "============================================================"
echo "   A&F LUXURY TRAVEL AGENT DEPLOYMENT"
echo "============================================================"
echo ""

# Step 1: Create conversational flow
echo "🚀 Creating conversational flow..."

# Read the flow.json and extract nodes
NODES=$(cat flow.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
flow_payload = {
    'nodes': data['nodes'],
    'start_node_id': data['starting_node'],
    'start_speaker': 'agent',
    'model_choice': data['model_choice'],
    'general_prompt': data['general_prompt']
}
print(json.dumps(flow_payload))
")

# Create flow via API
FLOW_RESPONSE=$(curl -s -X POST "${BASE_URL}/${CREATE_FLOW_ENDPOINT}" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$NODES")

echo "$FLOW_RESPONSE" > flow_response.json

# Extract flow ID
FLOW_ID=$(echo "$FLOW_RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    flow_id = data.get('conversation_flow_id') or data.get('id')
    if flow_id:
        print(flow_id)
    else:
        print('ERROR: No flow ID in response', file=sys.stderr)
        print(json.dumps(data, indent=2), file=sys.stderr)
        sys.exit(1)
except Exception as e:
    print(f'ERROR parsing response: {e}', file=sys.stderr)
    sys.exit(1)
")

if [ $? -ne 0 ]; then
    echo "❌ Failed to create flow"
    echo "Response saved to flow_response.json"
    exit 1
fi

echo "✅ Flow created successfully!"
echo "   Flow ID: ${FLOW_ID}"

# Step 2: Create agent
echo ""
echo "🚀 Creating agent..."

# Build agent payload
AGENT_PAYLOAD=$(cat flow.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
flow_id = '${FLOW_ID}'

agent_payload = {
    'agent_name': data['agent_name'],
    'voice_id': data['voice_id'],
    'voice_model': data.get('voice_model'),
    'response_engine': {
        'type': 'conversation-flow',
        'conversation_flow_id': flow_id
    },
    'enable_backchannel': data['enable_backchannel'],
    'backchannel_frequency': data['backchannel_frequency'],
    'backchannel_words': data['backchannel_words'],
    'ambient_sound': data['ambient_sound'],
    'ambient_sound_volume': data['ambient_sound_volume'],
    'interruption_sensitivity': data['interruption_sensitivity'],
    'post_call_analysis_data': data['post_call_analysis_data'],
    'post_call_analysis_model': 'gpt-4.1'
}

print(json.dumps(agent_payload))
")

# Create agent via API
AGENT_RESPONSE=$(curl -s -X POST "${BASE_URL}/${CREATE_AGENT_ENDPOINT}" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$AGENT_PAYLOAD")

echo "$AGENT_RESPONSE" > agent_response.json

# Extract agent ID
AGENT_ID=$(echo "$AGENT_RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    agent_id = data.get('agent_id') or data.get('id')
    if agent_id:
        print(agent_id)
    else:
        print('ERROR: No agent ID in response', file=sys.stderr)
        print(json.dumps(data, indent=2), file=sys.stderr)
        sys.exit(1)
except Exception as e:
    print(f'ERROR parsing response: {e}', file=sys.stderr)
    sys.exit(1)
")

if [ $? -ne 0 ]; then
    echo "❌ Failed to create agent"
    echo "Response saved to agent_response.json"
    exit 1
fi

echo "✅ Agent created successfully!"
echo "   Agent ID: ${AGENT_ID}"

# Summary
echo ""
echo "============================================================"
echo "   🎉 DEPLOYMENT COMPLETE!"
echo "============================================================"
echo ""
echo "📋 Flow ID: ${FLOW_ID}"
echo "🤖 Agent ID: ${AGENT_ID}"
echo ""
echo "🔗 View in dashboard: https://app.retellai.com/agent/${AGENT_ID}"
echo ""
