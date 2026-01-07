#!/usr/bin/env python3
"""
TravelBucks Outbound Callback Script
Fetches leads from Caspio and makes outbound calls via Retell AI
"""

import os
import sys
import json
import time
import requests
from typing import List, Dict, Optional
from datetime import datetime

# ============================================================================
# CONFIGURATION
# ============================================================================

# Retell AI Configuration
RETELL_API_KEY = os.getenv("RETELL_API_KEY", "***REMOVED***")
RETELL_AGENT_ID = "agent_0562fddc61ca674411c34cd69a"
RETELL_PHONE_NUMBER = os.getenv("RETELL_PHONE_NUMBER", "")  # Your Retell phone number

# Caspio Configuration
CASPIO_ACCOUNT_ID = os.getenv("CASPIO_ACCOUNT_ID", "")
CASPIO_CLIENT_ID = os.getenv("CASPIO_CLIENT_ID", "")
CASPIO_CLIENT_SECRET = os.getenv("CASPIO_CLIENT_SECRET", "")
CASPIO_TABLE_NAME = os.getenv("CASPIO_TABLE_NAME", "TravelBucks_Leads")

# Call Configuration
MAX_CALLS_PER_BATCH = int(os.getenv("MAX_CALLS_PER_BATCH", "10"))
DELAY_BETWEEN_CALLS = int(os.getenv("DELAY_BETWEEN_CALLS", "5"))  # seconds

# ============================================================================
# CASPIO API FUNCTIONS
# ============================================================================

class CaspioAPI:
    """Handle Caspio API authentication and requests"""

    def __init__(self, account_id: str, client_id: str, client_secret: str):
        self.account_id = account_id
        self.client_id = client_id
        self.client_secret = client_secret
        self.base_url = f"https://{account_id}.caspio.com/rest/v2"
        self.access_token = None
        self.token_expires_at = 0

    def get_access_token(self) -> str:
        """Get or refresh Caspio access token"""
        if self.access_token and time.time() < self.token_expires_at:
            return self.access_token

        token_url = f"https://{self.account_id}.caspio.com/oauth/token"
        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret
        }

        response = requests.post(token_url, data=data)
        response.raise_for_status()

        token_data = response.json()
        self.access_token = token_data["access_token"]
        self.token_expires_at = time.time() + token_data.get("expires_in", 3600) - 60

        return self.access_token

    def get_leads(self, status: str = "callback_requested", limit: int = 100) -> List[Dict]:
        """Fetch leads from Caspio that need callbacks"""
        token = self.get_access_token()

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Query leads where status = callback_requested and not called today
        url = f"{self.base_url}/tables/{CASPIO_TABLE_NAME}/records"
        params = {
            "q.where": f"Status='{status}' AND (LastCallDate IS NULL OR LastCallDate < '{datetime.now().date()}')",
            "q.limit": limit
        }

        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()

        return response.json().get("Result", [])

    def update_lead(self, client_id: str, updates: Dict) -> bool:
        """Update a lead record in Caspio"""
        token = self.get_access_token()

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        url = f"{self.base_url}/tables/{CASPIO_TABLE_NAME}/records"
        params = {
            "q.where": f"ClientID='{client_id}'"
        }

        response = requests.put(url, headers=headers, params=params, json=updates)
        response.raise_for_status()

        return True

# ============================================================================
# RETELL AI FUNCTIONS
# ============================================================================

class RetellAPI:
    """Handle Retell AI API calls"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.retellai.com"

    def create_phone_call(
        self,
        to_number: str,
        from_number: str,
        agent_id: str,
        dynamic_variables: Dict
    ) -> Dict:
        """Create an outbound phone call via Retell AI"""

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "from_number": from_number,
            "to_number": to_number,
            "agent_id": agent_id,
            "dynamic_variables": dynamic_variables
        }

        response = requests.post(
            f"{self.base_url}/create-phone-call",
            headers=headers,
            json=payload
        )
        response.raise_for_status()

        return response.json()

    def get_call_details(self, call_id: str) -> Dict:
        """Get details about a specific call"""

        headers = {
            "Authorization": f"Bearer {self.api_key}"
        }

        response = requests.get(
            f"{self.base_url}/get-call/{call_id}",
            headers=headers
        )
        response.raise_for_status()

        return response.json()

# ============================================================================
# MAIN SCRIPT
# ============================================================================

def validate_phone_number(phone: str) -> Optional[str]:
    """Validate and format phone number to E.164"""
    # Remove all non-digits
    digits = ''.join(filter(str.isdigit, phone))

    # Must be 10 or 11 digits
    if len(digits) == 10:
        return f"+1{digits}"
    elif len(digits) == 11 and digits[0] == '1':
        return f"+{digits}"
    else:
        return None

def make_outbound_calls(dry_run: bool = False):
    """Main function to fetch leads and make calls"""

    print("=" * 80)
    print("TravelBucks Outbound Callback System")
    print("=" * 80)
    print()

    # Validate configuration
    if not RETELL_PHONE_NUMBER:
        print("❌ ERROR: RETELL_PHONE_NUMBER not set")
        print("Set it with: export RETELL_PHONE_NUMBER='+1234567890'")
        return

    # Initialize APIs
    if CASPIO_CLIENT_ID and CASPIO_CLIENT_SECRET:
        print("✓ Caspio API configured")
        caspio = CaspioAPI(CASPIO_ACCOUNT_ID, CASPIO_CLIENT_ID, CASPIO_CLIENT_SECRET)
    else:
        print("⚠️  Caspio credentials not set - using mock data")
        caspio = None

    retell = RetellAPI(RETELL_API_KEY)
    print("✓ Retell AI configured")
    print()

    # Fetch leads
    print(f"📋 Fetching leads from Caspio...")
    if caspio:
        try:
            leads = caspio.get_leads(limit=MAX_CALLS_PER_BATCH)
            print(f"✓ Found {len(leads)} leads ready for callbacks")
        except Exception as e:
            print(f"❌ Error fetching leads: {e}")
            return
    else:
        # Mock data for testing
        leads = [
            {
                "ClientID": "tb263421",
                "CustomerName": "John Smith",
                "Phone": "555-123-4567",
                "Email": "john@example.com"
            }
        ]
        print(f"✓ Using {len(leads)} mock leads for testing")

    print()

    # Process each lead
    successful_calls = 0
    failed_calls = 0

    for i, lead in enumerate(leads, 1):
        client_id = lead.get("ClientID", "")
        customer_name = lead.get("CustomerName", "Unknown")
        phone = lead.get("Phone", "")
        email = lead.get("Email", "")

        print(f"[{i}/{len(leads)}] Processing: {customer_name} ({client_id})")

        # Validate phone number
        formatted_phone = validate_phone_number(phone)
        if not formatted_phone:
            print(f"   ❌ Invalid phone number: {phone}")
            failed_calls += 1
            continue

        print(f"   📞 Calling: {formatted_phone}")

        # Prepare dynamic variables
        dynamic_vars = {
            "client_id": client_id,
            "customer_name": customer_name,
            "customer_email": email
        }

        if dry_run:
            print(f"   🔍 DRY RUN - Would call with variables: {json.dumps(dynamic_vars, indent=6)}")
            successful_calls += 1
        else:
            try:
                # Make the call
                call_result = retell.create_phone_call(
                    to_number=formatted_phone,
                    from_number=RETELL_PHONE_NUMBER,
                    agent_id=RETELL_AGENT_ID,
                    dynamic_variables=dynamic_vars
                )

                call_id = call_result.get("call_id", "unknown")
                print(f"   ✓ Call initiated: {call_id}")

                # Update Caspio
                if caspio:
                    caspio.update_lead(client_id, {
                        "LastCallDate": datetime.now().isoformat(),
                        "LastCallID": call_id,
                        "Status": "callback_in_progress"
                    })
                    print(f"   ✓ Updated Caspio record")

                successful_calls += 1

                # Delay before next call
                if i < len(leads):
                    print(f"   ⏳ Waiting {DELAY_BETWEEN_CALLS}s before next call...")
                    time.sleep(DELAY_BETWEEN_CALLS)

            except Exception as e:
                print(f"   ❌ Call failed: {e}")
                failed_calls += 1

        print()

    # Summary
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total leads processed: {len(leads)}")
    print(f"✓ Successful calls: {successful_calls}")
    print(f"✗ Failed calls: {failed_calls}")
    print()

# ============================================================================
# CLI
# ============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="TravelBucks Outbound Callback System")
    parser.add_argument("--dry-run", action="store_true", help="Test without making actual calls")
    parser.add_argument("--max-calls", type=int, help="Maximum number of calls to make")

    args = parser.parse_args()

    if args.max_calls:
        MAX_CALLS_PER_BATCH = args.max_calls

    try:
        make_outbound_calls(dry_run=args.dry_run)
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        sys.exit(1)
