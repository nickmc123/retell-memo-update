#!/bin/bash
# Update existing A&F Luxury Travel flow

API_KEY="***REMOVED***"
BASE_URL="https://api.retellai.com"
FLOW_ID="conversation_flow_5b4fc8627ee4"

echo "============================================================"
echo "   UPDATING A&F LUXURY TRAVEL FLOW"
echo "============================================================"
echo ""

# Build the flow payload
FLOW_PAYLOAD=$(cat flow.json | python3 -c "
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

echo "🚀 Updating conversation flow..."

# Update flow via API
UPDATE_RESPONSE=$(curl -s -X PATCH "${BASE_URL}/update-conversation-flow/${FLOW_ID}" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$FLOW_PAYLOAD")

echo "$UPDATE_RESPONSE" > update_response.json

# Check if update was successful
if echo "$UPDATE_RESPONSE" | grep -q "conversation_flow_id"; then
    echo "✅ Flow updated successfully!"
else
    echo "❌ Flow update failed"
    echo "Response saved to update_response.json"
    cat update_response.json
    exit 1
fi

echo ""
echo "🚀 Updating agent settings..."

# Build agent update payload
AGENT_PAYLOAD=$(cat flow.json | python3 -c "
import json, sys
data = json.load(sys.stdin)

agent_payload = {
    'agent_name': data['agent_name'],
    'voice_id': data['voice_id'],
    'voice_model': data.get('voice_model'),
    'voice_speed': data.get('voice_speed', 1.0),
    'voice_settings': data.get('voice_settings', {}),
    'enable_backchannel': data['enable_backchannel'],
    'backchannel_frequency': data['backchannel_frequency'],
    'backchannel_words': data['backchannel_words'],
    'ambient_sound': data['ambient_sound'],
    'ambient_sound_volume': data['ambient_sound_volume'],
    'interruption_sensitivity': data['interruption_sensitivity']
}

print(json.dumps(agent_payload))
")

# Update agent via API
AGENT_UPDATE_RESPONSE=$(curl -s -X PATCH "${BASE_URL}/update-agent/agent_bd4afb5c63bd6778e747f32eb4" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$AGENT_PAYLOAD")

echo "$AGENT_UPDATE_RESPONSE" > agent_update_response.json

# Check if agent update was successful
if echo "$AGENT_UPDATE_RESPONSE" | grep -q "agent_id"; then
    echo "✅ Agent updated successfully!"
    echo ""
    echo "Changes made:"
    echo "  1. Changed agent name from Nathan to Annabelle"
    echo "  2. Agent now repeats customer's name back to confirm"
    echo "  3. Removed 'Hahaha' from social proof section"
    echo "  4. Slowed down speech speed to 0.9x (more conversational pace)"
    echo ""
    echo "🔗 View in dashboard: https://app.retellai.com/agent/agent_bd4afb5c63bd6778e747f32eb4"
else
    echo "❌ Agent update failed"
    echo "Response saved to agent_update_response.json"
    cat agent_update_response.json
    exit 1
fi
