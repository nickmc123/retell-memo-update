"""
Retell AI Python Client

A comprehensive client for interacting with the Retell AI API.
Handles conversation flow management with proper error handling and validation.
"""

import os
import requests
from typing import Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()


class RetellClient:
    """Client for Retell AI API operations."""
    
    BASE_URL = "https://api.retellai.com"
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Retell AI client.
        
        Args:
            api_key: Retell AI API key. If not provided, reads from RETELL_API_KEY env var.
        """
        self.api_key = api_key or os.getenv('RETELL_API_KEY')
        if not self.api_key:
            raise ValueError("API key required. Set RETELL_API_KEY or pass api_key parameter.")
        
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def create_conversation_flow(self, flow_config: Dict) -> Dict:
        """
        Create a new conversation flow.
        
        Args:
            flow_config: Complete flow configuration dictionary
            
        Returns:
            Created flow with conversation_flow_id
            
        Raises:
            requests.HTTPError: If API request fails
        """
        url = f"{self.BASE_URL}/create-conversation-flow"
        response = requests.post(url, json=flow_config, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def list_conversation_flows(self) -> List[Dict]:
        """
        List all conversation flows.
        
        Returns:
            List of conversation flows
            
        Raises:
            requests.HTTPError: If API request fails
        """
        url = f"{self.BASE_URL}/list-conversation-flows"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def get_conversation_flow(self, flow_id: str) -> Dict:
        """
        Get a specific conversation flow.
        
        Args:
            flow_id: Conversation flow ID
            
        Returns:
            Flow configuration
            
        Raises:
            requests.HTTPError: If API request fails
        """
        url = f"{self.BASE_URL}/get-conversation-flow/{flow_id}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def update_conversation_flow(self, flow_id: str, flow_config: Dict) -> Dict:
        """
        Update an existing conversation flow.
        
        Args:
            flow_id: Conversation flow ID
            flow_config: Updated flow configuration
            
        Returns:
            Updated flow
            
        Raises:
            requests.HTTPError: If API request fails
        """
        url = f"{self.BASE_URL}/update-conversation-flow/{flow_id}"
        response = requests.patch(url, json=flow_config, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def delete_conversation_flow(self, flow_id: str) -> Dict:
        """
        Delete a conversation flow.
        
        Args:
            flow_id: Conversation flow ID
            
        Returns:
            Deletion confirmation
            
        Raises:
            requests.HTTPError: If API request fails
        """
        url = f"{self.BASE_URL}/delete-conversation-flow/{flow_id}"
        response = requests.delete(url, headers=self.headers)
        response.raise_for_status()
        return response.json()


# Example usage
if __name__ == "__main__":
    # Initialize client
    client = RetellClient()
    
    # Example flow configuration
    example_flow = {
        "model_choice": {
            "type": "cascading",
            "model": "gpt-4"
        },
        "model_temperature": 0.5,
        "start_speaker": "agent",
        "global_prompt": "You are a helpful assistant.",
        "start_node_id": "greeting",
        "nodes": [
            {
                "id": "greeting",
                "type": "conversation",
                "instruction": {
                    "type": "prompt",
                    "text": "Greet the user warmly and ask how you can help."
                },
                "edges": []
            }
        ]
    }
    
    # Create flow
    print("Creating conversation flow...")
    created_flow = client.create_conversation_flow(example_flow)
    print(f"Created flow ID: {created_flow.get('conversation_flow_id')}")
    
    # List flows
    print("\nListing all flows...")
    flows = client.list_conversation_flows()
    print(f"Total flows: {len(flows)}")
    
    # Get specific flow
    if created_flow.get('conversation_flow_id'):
        flow_id = created_flow['conversation_flow_id']
        print(f"\nGetting flow {flow_id}...")
        flow = client.get_conversation_flow(flow_id)
        print(f"Flow version: {flow.get('version')}")
