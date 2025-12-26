# TravelBucks Webhook

Multi-platform lead webhook for TravelBucks AI Voice Concierge.

## Deployment to Railway

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Initialize project:
   ```bash
   railway init
   ```

4. Set environment variables:
   ```bash
   railway variables set RETELL_API_KEY=your_key
   railway variables set TWILIO_ACCOUNT_SID=your_sid
   # ... set all variables from .env.example
   ```

5. Deploy:
   ```bash
   railway up
   ```

6. Get your Railway URL:
   ```bash
   railway status
   ```

## Endpoints

- `POST /webhooks/facebook-leads` - Facebook Lead Ads
- `POST /webhooks/google-leads` - Google Ads
- `POST /webhooks/landing-page` - Landing page form
- `POST /webhooks/send-payment-sms` - SMS payment links
- `GET /health` - Health check

## Environment Variables

See `.env.example` for required environment variables.
