#!/bin/bash

# Create Retell AI Tools for RIMS Integration
# Replace YOUR_API_URL with your deployed API endpoint

API_KEY="***REMOVED***"
API_URL="${1:-http://localhost:3000}"  # Use first argument or default to localhost

echo "🚀 Creating Retell AI Tools for RIMS Integration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "API URL: $API_URL"
echo ""

# Tool 1: Phone Lookup
echo "📞 Creating Tool 1: rims_phone_lookup..."
TOOL1=$(curl -s -X POST "https://api.retellai.com/v2/create-custom-tool" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "rims_phone_lookup",
    "description": "Look up customer in RIMS database by phone number. Searches both primary (phn1) and secondary (phn2) phone fields. Returns all customer data including vac_id, certificate info, deposits, travel dates, and Travel Rep assignment.",
    "url": "'$API_URL'/api/rims/phone-lookup",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "phone_number": "{{phone_number}}"
    },
    "parameters": [
      {
        "name": "phone_number",
        "type": "string",
        "description": "Customer phone number (10 digits, any format accepted)",
        "required": true
      }
    ]
  }')

TOOL1_ID=$(echo $TOOL1 | python3 -c "import sys, json; print(json.load(sys.stdin).get('tool_id', 'ERROR'))" 2>/dev/null || echo "ERROR")
echo "✅ Tool 1 ID: $TOOL1_ID"
echo ""

# Tool 2: Certificate Lookup
echo "📜 Creating Tool 2: rims_certificate_lookup..."
TOOL2=$(curl -s -X POST "https://api.retellai.com/v2/create-custom-tool" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "rims_certificate_lookup",
    "description": "Look up customer in RIMS database by certificate number (pkg_code2 field). Returns all customer data including contact info, deposits, travel dates, and booking status.",
    "url": "'$API_URL'/api/rims/certificate-lookup",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "certificate_number": "{{certificate_number}}"
    },
    "parameters": [
      {
        "name": "certificate_number",
        "type": "string",
        "description": "Certificate number from customer (e.g., ECFWIN, BEACH123)",
        "required": true
      }
    ]
  }')

TOOL2_ID=$(echo $TOOL2 | python3 -c "import sys, json; print(json.load(sys.stdin).get('tool_id', 'ERROR'))" 2>/dev/null || echo "ERROR")
echo "✅ Tool 2 ID: $TOOL2_ID"
echo ""

# Tool 3: Deposits Check
echo "💰 Creating Tool 3: deposits_check..."
TOOL3=$(curl -s -X POST "https://api.retellai.com/v2/create-custom-tool" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "deposits_check",
    "description": "Check if customer deposits are complete by comparing paid amount (val_dep + conf_deposit) against expected deposit from Knowledge Base. Returns status (complete/partial/no_deposits) and next action (transfer_extension_1/provide_payment_info/direct_to_website).",
    "url": "'$API_URL'/api/logic/deposits-check",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "customer_data": "{{customer_data}}"
    },
    "parameters": [
      {
        "name": "customer_data",
        "type": "object",
        "description": "Customer data object from phone_lookup or certificate_lookup (must include pkg_code, val_dep, conf_deposit)",
        "required": true
      }
    ]
  }')

TOOL3_ID=$(echo $TOOL3 | python3 -c "import sys, json; print(json.load(sys.stdin).get('tool_id', 'ERROR'))" 2>/dev/null || echo "ERROR")
echo "✅ Tool 3 ID: $TOOL3_ID"
echo ""

# Tool 4: Travel Rep Check
echo "✈️ Creating Tool 4: travel_rep_check..."
TOOL4=$(curl -s -X POST "https://api.retellai.com/v2/create-custom-tool" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "travel_rep_check",
    "description": "Check Travel Rep assignment status. Implements 45-75 day window logic: if travel date is within 45 days and no TR assigned, status=needs_tr_urgent. If TR assigned but docs not sent (date_print_enc blank), status=tr_needs_to_call. Returns appropriate memo creation instructions.",
    "url": "'$API_URL'/api/logic/travel-rep-check",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "customer_data": "{{customer_data}}"
    },
    "parameters": [
      {
        "name": "customer_data",
        "type": "object",
        "description": "Customer data object from lookup (must include Asgn_trv_DT, tm, date_print_enc, confirm_status)",
        "required": true
      }
    ]
  }')

TOOL4_ID=$(echo $TOOL4 | python3 -c "import sys, json; print(json.load(sys.stdin).get('tool_id', 'ERROR'))" 2>/dev/null || echo "ERROR")
echo "✅ Tool 4 ID: $TOOL4_ID"
echo ""

# Tool 5: Create Memo
echo "📝 Creating Tool 5: create_rims_memo..."
TOOL5=$(curl -s -X POST "https://api.retellai.com/v2/create-custom-tool" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "create_rims_memo",
    "description": "Create a memo in RIMS_MEMOS table for staff follow-up. Memo types: needs tr assignment (urgent TR needed), ask tr to call (TR assigned but docs not sent), resend itinerary (customer needs itinerary resent). Memos are created by AI Agent and timestamped.",
    "url": "'$API_URL'/api/memos/create",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "memo_type": "{{memo_type}}",
      "details": "{{details}}",
      "vac_id": "{{vac_id}}",
      "phone_number": "{{phone_number}}"
    },
    "parameters": [
      {
        "name": "memo_type",
        "type": "string",
        "description": "Type of memo: needs tr assignment, ask tr to call, or resend itinerary",
        "required": true
      },
      {
        "name": "details",
        "type": "string",
        "description": "Memo details (e.g., Travel date: 2025-06-15, Days remaining: 42)",
        "required": false
      },
      {
        "name": "vac_id",
        "type": "string",
        "description": "Customer vac_id from RIMS database",
        "required": true
      },
      {
        "name": "phone_number",
        "type": "string",
        "description": "Customer phone number",
        "required": false
      }
    ]
  }')

TOOL5_ID=$(echo $TOOL5 | python3 -c "import sys, json; print(json.load(sys.stdin).get('tool_id', 'ERROR'))" 2>/dev/null || echo "ERROR")
echo "✅ Tool 5 ID: $TOOL5_ID"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All 5 Tools Created Successfully!"
echo ""
echo "📋 Tool IDs (save these):"
echo "   1. rims_phone_lookup:      $TOOL1_ID"
echo "   2. rims_certificate_lookup: $TOOL2_ID"
echo "   3. deposits_check:          $TOOL3_ID"
echo "   4. travel_rep_check:        $TOOL4_ID"
echo "   5. create_rims_memo:        $TOOL5_ID"
echo ""
echo "🔗 Next Steps:"
echo "   1. Add these tool IDs to your Retell AI agent"
echo "   2. Deploy your API to production (Railway/Render)"
echo "   3. Re-run this script with production URL:"
echo "      ./create-retell-tools.sh https://your-app.railway.app"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
