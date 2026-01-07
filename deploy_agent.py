#!/usr/bin/env python3
"""Deploy A&F Luxury Travel agent to Retell AI"""

import json
import requests
import sys

API_KEY = "***REMOVED***"
BASE_URL = "https://api.retellai.com"

def load_flow():
    """Load the flow configuration"""
    with open('flow.json', 'r') as f:
        return json.load(f)

def create_conversational_flow(flow_config):
    """Create conversational flow via Retell API"""

    # Extract nodes and build the flow
    nodes = flow_config['nodes']
    starting_node = flow_config['starting_node']

    # Build the conversational flow payload
    payload = {
        "nodes": nodes,
        "start_node_id": starting_node
    }

    print("🚀 Creating conversational flow...")
    print(f"   Nodes: {len(nodes)}")
    print(f"   Starting node: {starting_node}")

    response = requests.post(
        f"{BASE_URL}/v2/create-conversational-flow",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json=payload
    )

    if response.status_code != 200:
        print(f"❌ Error creating flow: {response.status_code}")
        print(f"   Response: {response.text}")
        sys.exit(1)

    flow_data = response.json()
    flow_id = flow_data.get('conversational_flow_id') or flow_data.get('id')
    print(f"✅ Flow created successfully!")
    print(f"   Flow ID: {flow_id}")

    return flow_id

def create_agent(flow_config, flow_id):
    """Create agent that uses the conversational flow"""

    payload = {
        "agent_name": flow_config['agent_name'],
        "voice_id": flow_config['voice_id'],
        "voice_model": flow_config['voice_model'],
        "response_engine": {
            "type": "retell-llm",
            "llm_id": flow_id
        },
        "enable_backchannel": flow_config['enable_backchannel'],
        "backchannel_frequency": flow_config['backchannel_frequency'],
        "backchannel_words": flow_config['backchannel_words'],
        "denoising_mode": flow_config['denoising_mode'],
        "normalize_for_speech": flow_config['normalize_for_speech'],
        "ambient_sound": flow_config['ambient_sound'],
        "ambient_sound_volume": flow_config['ambient_sound_volume'],
        "interruption_sensitivity": flow_config['interruption_sensitivity'],
        "post_call_analysis_data": flow_config['post_call_analysis_data']
    }

    print("\n🚀 Creating agent...")
    print(f"   Name: {flow_config['agent_name']}")

    response = requests.post(
        f"{BASE_URL}/v2/create-agent",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json=payload
    )

    if response.status_code != 200:
        print(f"❌ Error creating agent: {response.status_code}")
        print(f"   Response: {response.text}")
        sys.exit(1)

    agent_data = response.json()
    agent_id = agent_data.get('agent_id') or agent_data.get('id')
    print(f"✅ Agent created successfully!")
    print(f"   Agent ID: {agent_id}")

    return agent_id

def main():
    print("=" * 60)
    print("   A&F LUXURY TRAVEL AGENT DEPLOYMENT")
    print("=" * 60)
    print()

    # Load flow configuration
    flow_config = load_flow()

    # Create conversational flow
    flow_id = create_conversational_flow(flow_config)

    # Create agent
    agent_id = create_agent(flow_config, flow_id)

    # Summary
    print("\n" + "=" * 60)
    print("   🎉 DEPLOYMENT COMPLETE!")
    print("=" * 60)
    print(f"\n📋 Flow ID: {flow_id}")
    print(f"🤖 Agent ID: {agent_id}")
    print(f"\n🔗 View in dashboard: https://app.retellai.com/agent/{agent_id}")
    print()

if __name__ == "__main__":
    main()
