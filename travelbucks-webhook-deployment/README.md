# TravelBucks Webhook - Multi-Platform Lead Handler

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/travelbucks?referralCode=nickmc)

## Quick Deploy

Click the button above to deploy to Railway in one click!

Or deploy manually:

```bash
railway init
railway up
```

## Environment Variables

After deployment, add these in Railway dashboard:

### Required (Minimum)
```
RETELL_API_KEY=key_beadaa40bfd093b4f06eb4e2ac0a
RETELL_AGENT_ID=agent_f3133d562a14ddeddc46be10e9
PORT=3000
```

### Optional (Add when ready)
```
RETELL_PHONE_NUMBER=+1234567890
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
CASPIO_ACCOUNT_ID=c0abc123
CASPIO_CLIENT_ID=your_id
CASPIO_CLIENT_SECRET=your_secret
CASPIO_PAYMENT_URL=https://caspio.com/...
FB_ACCESS_TOKEN=your_token
FB_VERIFY_TOKEN=travelbucks_verify_token_2024
```

## Endpoints

- `POST /webhooks/facebook-leads` - Facebook Lead Ads
- `POST /webhooks/google-leads` - Google Ads
- `POST /webhooks/landing-page` - Landing page forms
- `POST /webhooks/send-payment-sms` - SMS payment links
- `GET /health` - Health check

## Testing

```bash
curl https://your-app.up.railway.app/health
```

Should return:
```json
{
  "status": "ok",
  "service": "TravelBucks Unified Lead Webhook"
}
```
