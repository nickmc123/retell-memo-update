#!/bin/bash

# Monitor Railway logs for webhook activity

echo "=========================================="
echo "Monitoring Retell Webhook Activity"
echo "=========================================="
echo ""
echo "Watching Railway logs for incoming webhooks..."
echo "Look for: '📞 Fetching call' and 'Memo created successfully'"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""
echo "Make a test call to your Retell agent to see activity."
echo ""
echo "=========================================="
echo ""

# Note: User needs to run this manually in Railway dashboard or CLI
echo "To view logs, run ONE of these commands:"
echo ""
echo "Option 1: Railway CLI"
echo "  railway logs --follow"
echo ""
echo "Option 2: Railway Dashboard"
echo "  https://railway.app → Your Project → Service → Logs tab"
echo ""
echo "Look for these log entries when webhook triggers:"
echo "  - 📞 Fetching call call_XXXXX from Retell AI..."
echo "  - ✅ Customer found: [name]"
echo "  - ✅ Memo created successfully"
echo ""
