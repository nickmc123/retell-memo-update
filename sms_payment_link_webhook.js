/**
 * SMS Payment Link Webhook for TravelBucks
 *
 * Receives requests from Retell AI when customer accepts planning fee,
 * generates Caspio payment URL, and sends via SMS
 */

const express = require('express');
const twilio = require('twilio');
const axios = require('axios');

const app = express();
app.use(express.json());

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 3000;

// Twilio Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER; // e.g., +14155551234

// Caspio Configuration
const CASPIO_PAYMENT_URL = process.env.CASPIO_PAYMENT_URL;
// e.g., https://c0abc123.caspio.com/dp/abc12345000/payment

// Caspio API (for updating lead status)
const CASPIO_ACCOUNT_ID = process.env.CASPIO_ACCOUNT_ID;
const CASPIO_CLIENT_ID = process.env.CASPIO_CLIENT_ID;
const CASPIO_CLIENT_SECRET = process.env.CASPIO_CLIENT_SECRET;
const CASPIO_TABLE_NAME = 'TravelBucks_Leads';

// Initialize Twilio
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// ============================================================================
// CASPIO API HELPER
// ============================================================================

class CaspioAPI {
  constructor(accountId, clientId, clientSecret) {
    this.accountId = accountId;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = `https://${accountId}.caspio.com/rest/v2`;
    this.accessToken = null;
    this.tokenExpiresAt = 0;
  }

  async getAccessToken() {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const tokenUrl = `https://${this.accountId}.caspio.com/oauth/token`;
    const response = await axios.post(tokenUrl,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    this.accessToken = response.data.access_token;
    this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000) - 60000;

    return this.accessToken;
  }

  async updateLead(leadId, updates) {
    const token = await this.getAccessToken();

    const url = `${this.baseUrl}/tables/${CASPIO_TABLE_NAME}/records`;
    const params = {
      q: { where: `LeadID='${leadId}'` }
    };

    await axios.put(url, updates, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params
    });

    return true;
  }
}

const caspio = new CaspioAPI(
  CASPIO_ACCOUNT_ID,
  CASPIO_CLIENT_ID,
  CASPIO_CLIENT_SECRET
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate Caspio payment URL with pre-filled parameters
 */
function generatePaymentURL(leadId, customerName, email) {
  const params = new URLSearchParams({
    lead_id: leadId,
    name: customerName,
    email: email
  });

  return `${CASPIO_PAYMENT_URL}?${params.toString()}`;
}

/**
 * Format phone number to E.164
 */
function formatPhoneNumber(phone) {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    return `+${digits}`;
  }

  return phone; // Return as-is if already formatted
}

/**
 * Send SMS via Twilio
 */
async function sendSMS(toNumber, message) {
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: toNumber
    });

    return {
      success: true,
      message_sid: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error('[SMS Error]', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// WEBHOOK ENDPOINT
// ============================================================================

/**
 * POST /webhooks/send-payment-sms
 *
 * Called by Retell AI when customer accepts planning fee
 *
 * Request body:
 * {
 *   "lead_id": "tb263421",
 *   "phone": "+14155551234",
 *   "customer_name": "John Smith",
 *   "email": "john@example.com",
 *   "amount": 149
 * }
 */
app.post('/webhooks/send-payment-sms', async (req, res) => {
  console.log('[Payment SMS Request]', req.body);

  const { lead_id, phone, customer_name, email, amount } = req.body;

  // Validation
  if (!lead_id || !phone || !customer_name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: lead_id, phone, customer_name, email'
    });
  }

  try {
    // 1. Generate payment URL
    const paymentURL = generatePaymentURL(lead_id, customer_name, email);
    console.log('[Payment URL Generated]', paymentURL);

    // 2. Format phone number
    const formattedPhone = formatPhoneNumber(phone);

    // 3. Compose SMS message
    const smsMessage =
`Hi ${customer_name}!

Complete your TravelBucks planning fee payment here:

${paymentURL}

Amount: $${amount}

This secure link will take you to our payment page. Once completed, your travel specialist will be in touch within 24 hours.

Questions? Call 1-800-TB-VOICE`;

    // 4. Send SMS
    const smsResult = await sendSMS(formattedPhone, smsMessage);

    if (!smsResult.success) {
      console.error('[SMS Send Failed]', smsResult.error);

      // Update Caspio with failure
      await caspio.updateLead(lead_id, {
        PaymentLinkStatus: 'sms_failed',
        PaymentLinkError: smsResult.error,
        PaymentLinkSentDate: new Date().toISOString()
      });

      return res.status(500).json({
        success: false,
        error: `Failed to send SMS: ${smsResult.error}`,
        result: "I'm having trouble sending the payment link. I'll have a specialist call you back to assist with payment."
      });
    }

    // 5. Update Caspio with success
    await caspio.updateLead(lead_id, {
      PaymentLinkStatus: 'sent',
      PaymentLinkURL: paymentURL,
      PaymentLinkSentDate: new Date().toISOString(),
      SMSMessageSID: smsResult.message_sid,
      LeadStatus: 'payment_link_sent'
    });

    console.log('[SMS Sent Successfully]', {
      lead_id,
      message_sid: smsResult.message_sid,
      phone: formattedPhone
    });

    // 6. Return success to Retell AI
    return res.json({
      success: true,
      message_sid: smsResult.message_sid,
      payment_url: paymentURL,
      result: `Payment link sent successfully to ${formattedPhone}`
    });

  } catch (error) {
    console.error('[Payment SMS Error]', error);

    return res.status(500).json({
      success: false,
      error: error.message,
      result: "There was an error sending the payment link. I'll have a specialist call you back."
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TravelBucks SMS Payment Link Webhook',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log('='.repeat(80));
  console.log('TravelBucks SMS Payment Link Webhook');
  console.log('='.repeat(80));
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Twilio configured: ${TWILIO_PHONE_NUMBER}`);
  console.log(`✓ Caspio payment URL: ${CASPIO_PAYMENT_URL}`);
  console.log();
  console.log('Endpoints:');
  console.log(`  POST /webhooks/send-payment-sms - Send payment link via SMS`);
  console.log(`  GET  /health - Health check`);
  console.log('='.repeat(80));
});

module.exports = app;
