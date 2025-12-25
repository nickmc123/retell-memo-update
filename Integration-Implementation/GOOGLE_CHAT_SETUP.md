# Google Chat Live Call Monitoring Setup Guide

This guide will help you set up live call monitoring and transcription for your Retell AI agents in Google Chat.

## Features

✅ **Real-time call alerts** - Get notified when a call starts with customer details
✅ **Live transcription** - Every exchange is transcribed and sent to Google Chat
✅ **Call takeover** - Team members can request to take over the call
✅ **Customer information** - Shows lead details, source, campaign, etc.
✅ **Call summary** - Automatic summary when call ends

---

## Setup Steps

### 1. Create Google Chat Webhook

1. Open Google Chat and go to your team space
2. Click the space name > **Manage webhooks**
3. Click **+ Add webhook**
4. Name it: "Retell AI Live Call Monitor"
5. Avatar URL (optional): `https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg`
6. Click **Save**
7. **Copy the webhook URL** - you'll need this for the `.env` file

### 2. Configure Environment Variables

Edit your `.env` file and add:

```bash
# Google Chat Webhook URL (required)
GOOGLE_CHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/AAAA.../messages?key=...&token=...

# Dashboard URL (optional - for clickable links)
DASHBOARD_URL=https://app.retellai.com
```

### 3. Configure Retell AI Webhooks

You need to configure Retell AI to send webhook events to your server.

#### Option A: Via Retell Dashboard

1. Go to https://app.retellai.com/dashboard
2. Navigate to **Settings** > **Webhooks**
3. Add these webhook URLs:

```
Call Started: https://your-server.com/webhook/retell/call-started
Transcript Update: https://your-server.com/webhook/retell/transcript-update
Call Ended: https://your-server.com/webhook/retell/call-ended
```

#### Option B: Via API (per agent)

Update your agent configuration:

```javascript
{
  "agent_id": "agent_7fc88535f674cdbdeeb70d41bf",
  "webhook_url": "https://your-server.com/webhook/retell",
  "webhook_events": [
    "call_started",
    "transcript",
    "call_ended"
  ]
}
```

### 4. Deploy Your Server

Make sure your API server is running and accessible:

```bash
cd Integration-Implementation/integration-implementation
npm install
node api-server.js
```

Your server should show:

```
🚀 Casablanca Express API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Running on: http://localhost:3000

💬 Google Chat Live Monitoring:
   POST /webhook/retell/call-started
   POST /webhook/retell/transcript-update
   POST /webhook/retell/call-ended
```

### 5. Expose Your Server (for Retell webhooks)

Retell AI needs to reach your webhook endpoints. Options:

#### Development/Testing: Use ngrok

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and use it in Retell webhook configuration.

#### Production: Deploy to Railway/Heroku/etc.

Deploy your server to a cloud platform and use the public URL.

---

## Testing the Integration

### Test 1: Send Test Alert

```bash
curl -X POST http://localhost:3000/google-chat/test
```

You should see a test call alert in your Google Chat space.

### Test 2: Check Active Calls

```bash
curl http://localhost:3000/google-chat/active-calls
```

Returns JSON of currently monitored calls.

### Test 3: Simulate Call Flow

```bash
# 1. Start call
curl -X POST http://localhost:3000/webhook/retell/call-started \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "test-call-123",
    "call": {
      "from_number": "+1234567890",
      "to_number": "+0987654321"
    },
    "metadata": {
      "customer_name": "Jane Doe",
      "customer_email": "jane@example.com",
      "lead_source": "Website",
      "campaign": "TravelBucks Summer"
    },
    "agent": {
      "agent_name": "TravelBucks Concierge"
    }
  }'

# 2. Send transcript updates
curl -X POST http://localhost:3000/webhook/retell/transcript-update \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "test-call-123",
    "transcript": [
      {
        "role": "agent",
        "content": "Hi there! This is Alex from TravelBucks.",
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
      },
      {
        "role": "user",
        "content": "Hi! I received a call from you earlier.",
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
      }
    ]
  }'

# 3. End call
curl -X POST http://localhost:3000/webhook/retell/call-ended \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "test-call-123",
    "call_analysis": {
      "outcome": "activated"
    }
  }'
```

---

## How It Works

### 1. Call Starts
- Retell sends webhook to `/webhook/retell/call-started`
- Server sends rich card to Google Chat with:
  - Customer name, phone, email
  - Lead source & campaign info
  - "Request Takeover" button
  - Link to Retell dashboard

### 2. During Call
- Retell sends transcript updates to `/webhook/retell/transcript-update`
- Each exchange is posted to the same Google Chat thread:
  - 🤖 Agent messages
  - 👤 Customer messages
  - Timestamps

### 3. Call Ends
- Retell sends webhook to `/webhook/retell/call-ended`
- Server posts summary card with:
  - Call duration
  - Outcome (activated, callback, etc.)
  - Final status

### 4. Call Takeover (Future Enhancement)
- Team member clicks "Request Takeover" button
- Server receives interaction via `/webhook/google-chat/interaction`
- **TODO:** Implement Retell transfer API call

---

## Webhook Payload Examples

### Call Started Payload (from Retell)

```json
{
  "call_id": "call_abc123xyz",
  "call": {
    "from_number": "+14155551234",
    "to_number": "+18005551234",
    "direction": "outbound"
  },
  "agent": {
    "agent_id": "agent_7fc88535f674cdbdeeb70d41bf",
    "agent_name": "TravelBucks Travel Concierge"
  },
  "metadata": {
    "customer_name": "Sarah Johnson",
    "customer_email": "sarah@example.com",
    "customer_phone": "+14155551234",
    "lead_source": "Facebook Ad",
    "campaign": "Summer Travel 2025",
    "interests": "Orlando vacation packages",
    "notes": "Called back after web inquiry"
  }
}
```

### Transcript Update Payload (from Retell)

```json
{
  "call_id": "call_abc123xyz",
  "transcript": [
    {
      "role": "agent",
      "content": "Thanks for your interest in our exclusive travel membership.",
      "timestamp": "2025-12-25T10:30:15Z"
    },
    {
      "role": "user",
      "content": "Yes, I'd like to hear more about the savings.",
      "timestamp": "2025-12-25T10:30:22Z"
    }
  ]
}
```

### Call Ended Payload (from Retell)

```json
{
  "call_id": "call_abc123xyz",
  "call_analysis": {
    "outcome": "activated",
    "lead_qualified": true,
    "membership_activated": true,
    "customer_email": "sarah@example.com",
    "customer_phone": "+14155551234"
  },
  "end_reason": "completed",
  "duration_seconds": 420
}
```

---

## Customization

### Modify Google Chat Card Appearance

Edit `google-chat-live-monitor.js` function `buildCallAlertCard()` to customize:
- Card colors
- Displayed fields
- Button text
- Header/footer

### Add More Call Controls

Add buttons to the card for:
- Mute/unmute
- Send notes
- Flag for review
- Assign to team member

### Filter Which Calls Are Monitored

Add logic in `sendCallAlert()` to filter:
- By agent
- By customer tags
- By lead source
- High-value leads only

---

## Troubleshooting

### No alerts appearing in Google Chat

1. **Check webhook URL**: Verify `GOOGLE_CHAT_WEBHOOK_URL` in `.env`
2. **Test directly**:
   ```bash
   curl -X POST "${GOOGLE_CHAT_WEBHOOK_URL}" \
     -H "Content-Type: application/json" \
     -d '{"text": "Test message"}'
   ```
3. **Check server logs**: Look for errors when call started

### Transcript not showing up

1. **Verify Retell webhook config**: Check transcript events are enabled
2. **Check call is in activeCalls**: Visit `/google-chat/active-calls`
3. **Test manually**:
   ```bash
   curl -X POST http://localhost:3000/webhook/retell/transcript-update \
     -H "Content-Type: application/json" \
     -d '{"call_id": "test", "transcript": [...]}'
   ```

### Call takeover button doesn't work

Currently, the takeover button sends a notification but doesn't actually transfer the call. This requires:
1. Implementing Retell's transfer call API
2. Having a valid transfer phone number
3. Configuring transfer settings in your agent

---

## Next Steps

1. ✅ Set up Google Chat webhook
2. ✅ Configure `.env` with webhook URL
3. ✅ Deploy server and test
4. ✅ Configure Retell webhooks
5. ⏳ Implement actual call transfer logic
6. ⏳ Add custom metadata fields
7. ⏳ Configure for production deployment

---

## Support

- **Google Chat Webhook Docs**: https://developers.google.com/chat/how-tos/webhooks
- **Retell AI Webhook Docs**: https://docs.retellai.com/api-references/webhook
- **Issues**: Report in your project's issue tracker

---

**Ready to monitor calls live!** 🚀
