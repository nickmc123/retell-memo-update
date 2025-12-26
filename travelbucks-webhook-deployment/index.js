/**
 * Unified Lead Webhook for TravelBucks
 *
 * Handles leads from multiple sources:
 * - Facebook Lead Ads
 * - Google Ads Lead Forms
 * - Landing Page Form Submissions
 *
 * All leads flow through the same TCPA-compliant process:
 * 1. Validate consent was given
 * 2. Save to Caspio
 * 3. Trigger instant AI callback
 */

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 3000;

// Retell AI Configuration
const RETELL_API_KEY = process.env.RETELL_API_KEY;
const RETELL_AGENT_ID = process.env.RETELL_AGENT_ID || 'agent_f3133d562a14ddeddc46be10e9';
const RETELL_PHONE_NUMBER = process.env.RETELL_PHONE_NUMBER;

// Caspio Configuration
const CASPIO_ACCOUNT_ID = process.env.CASPIO_ACCOUNT_ID;
const CASPIO_CLIENT_ID = process.env.CASPIO_CLIENT_ID;
const CASPIO_CLIENT_SECRET = process.env.CASPIO_CLIENT_SECRET;
const CASPIO_TABLE_NAME = 'TravelBucks_Leads';

// Facebook Configuration
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'travelbucks_verify_token_2024';

// ============================================================================
// CASPIO API
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

  async createLead(leadData) {
    const token = await this.getAccessToken();

    const url = `${this.baseUrl}/tables/${CASPIO_TABLE_NAME}/records`;

    await axios.post(url, leadData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return true;
  }

  async updateLead(leadId, updates) {
    const token = await this.getAccessToken();

    const url = `${this.baseUrl}/tables/${CASPIO_TABLE_NAME}/records`;

    await axios.put(url, updates, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        q: { where: `LeadID='${leadId}'` }
      }
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
// RETELL AI API
// ============================================================================

async function makeInstantCall(phone, leadId, name, email) {
  try {
    const response = await axios.post(
      'https://api.retellai.com/create-phone-call',
      {
        from_number: RETELL_PHONE_NUMBER,
        to_number: phone,
        agent_id: RETELL_AGENT_ID,
        dynamic_variables: {
          lead_id: leadId,
          customer_name: name,
          customer_email: email
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${RETELL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('[Call Initiated]', {
      lead_id: leadId,
      call_id: response.data.call_id,
      phone: phone
    });

    // Update Caspio with call ID
    await caspio.updateLead(leadId, {
      CallID: response.data.call_id,
      LastCallDate: new Date().toISOString(),
      LeadStatus: 'callback_in_progress'
    });

    return {
      success: true,
      call_id: response.data.call_id
    };

  } catch (error) {
    console.error('[Call Failed]', error.response?.data || error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateLeadId() {
  return 'tb' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
}

function formatPhoneNumber(phone) {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    return `+${digits}`;
  }

  return phone;
}

// ============================================================================
// FACEBOOK LEAD ADS WEBHOOK
// ============================================================================

/**
 * GET /webhooks/facebook-leads
 * Facebook webhook verification
 */
app.get('/webhooks/facebook-leads', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
    console.log('[Facebook Webhook Verified]');
    res.status(200).send(challenge);
  } else {
    console.log('[Facebook Verification Failed]');
    res.sendStatus(403);
  }
});

/**
 * POST /webhooks/facebook-leads
 * Receive Facebook lead form submissions
 */
app.post('/webhooks/facebook-leads', async (req, res) => {
  console.log('[Facebook Lead Received]', JSON.stringify(req.body, null, 2));

  // Respond immediately to Facebook
  res.status(200).send('OK');

  // Process lead asynchronously
  if (req.body.object === 'page') {
    req.body.entry.forEach(entry => {
      entry.changes.forEach(async change => {
        if (change.field === 'leadgen') {
          const leadgenId = change.value.leadgen_id;
          console.log('[Processing Facebook Lead]', leadgenId);

          try {
            // Fetch full lead data from Facebook
            const leadData = await fetchFacebookLead(leadgenId);
            await processFacebookLead(leadData);
          } catch (error) {
            console.error('[Facebook Lead Processing Error]', error);
          }
        }
      });
    });
  }
});

async function fetchFacebookLead(leadgenId) {
  const response = await axios.get(
    `https://graph.facebook.com/v18.0/${leadgenId}`,
    {
      params: {
        access_token: FB_ACCESS_TOKEN,
        fields: 'id,created_time,field_data'
      }
    }
  );

  return response.data;
}

async function processFacebookLead(leadData) {
  // Parse field data
  const fieldData = {};
  leadData.field_data.forEach(field => {
    fieldData[field.name] = field.values[0];
  });

  const leadId = generateLeadId();
  const phone = formatPhoneNumber(fieldData.phone || fieldData.phone_number);
  const name = fieldData.full_name || fieldData.name;
  const email = fieldData.email;
  const consentGiven = fieldData.consent_checkbox === 'true' ||
                       fieldData.consent === 'true' ||
                       fieldData.i_consent_to_be_contacted === 'true';

  console.log('[Facebook Lead Parsed]', {
    leadId,
    name,
    phone,
    email,
    consentGiven
  });

  // CRITICAL: Only proceed if consent was given
  if (!consentGiven) {
    console.log('[Lead Rejected] No consent given');
    return;
  }

  // Save to Caspio
  await caspio.createLead({
    LeadID: leadId,
    CustomerName: name,
    Phone: phone,
    Email: email,
    Destination: fieldData.destination || fieldData.where_do_you_want_to_travel || '',
    TravelDates: fieldData.travel_dates || fieldData.when_are_you_planning_to_travel || '',
    TravelersCount: fieldData.travelers_count || fieldData.how_many_travelers || '',
    BudgetRange: fieldData.budget_range || fieldData.estimated_budget_per_person || '',
    SpecialOccasion: '',
    ConsentGiven: true,
    ConsentTimestamp: new Date().toISOString(),
    LeadSource: 'facebook',
    LeadStatus: 'callback_requested',
    Priority: 'medium',
    CreatedDate: new Date().toISOString(),
    ModifiedDate: new Date().toISOString()
  });

  console.log('[Lead Saved to Caspio]', leadId);

  // Make instant call
  await makeInstantCall(phone, leadId, name, email);
}

// ============================================================================
// GOOGLE ADS WEBHOOK
// ============================================================================

/**
 * POST /webhooks/google-leads
 * Receive Google Ads lead form submissions
 * (Called from Google Apps Script or Zapier)
 */
app.post('/webhooks/google-leads', async (req, res) => {
  console.log('[Google Ads Lead Received]', req.body);

  const {
    full_name,
    phone,
    email,
    destination,
    travel_timeline,
    travelers_count,
    budget_range,
    consent_given,
    campaign_id,
    campaign_name
  } = req.body;

  // Validation
  if (!full_name || !phone || !email) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: full_name, phone, email'
    });
  }

  // CRITICAL: Verify consent
  if (!consent_given || consent_given === 'false') {
    console.log('[Lead Rejected] No consent given');
    return res.json({
      success: false,
      message: 'Lead rejected - no consent given'
    });
  }

  try {
    const leadId = req.body.lead_id || generateLeadId();
    const formattedPhone = formatPhoneNumber(phone);

    // Save to Caspio
    await caspio.createLead({
      LeadID: leadId,
      CustomerName: full_name,
      Phone: formattedPhone,
      Email: email,
      Destination: destination || '',
      TravelDates: travel_timeline || '',
      TravelersCount: travelers_count || '',
      BudgetRange: budget_range || '',
      SpecialOccasion: '',
      ConsentGiven: true,
      ConsentTimestamp: new Date().toISOString(),
      LeadSource: 'google_ads',
      LeadStatus: 'callback_requested',
      Priority: 'medium',
      Notes: `Campaign: ${campaign_name} (${campaign_id})`,
      CreatedDate: new Date().toISOString(),
      ModifiedDate: new Date().toISOString()
    });

    console.log('[Google Lead Saved to Caspio]', leadId);

    // Make instant call
    const callResult = await makeInstantCall(formattedPhone, leadId, full_name, email);

    return res.json({
      success: true,
      lead_id: leadId,
      call_initiated: callResult.success,
      call_id: callResult.call_id
    });

  } catch (error) {
    console.error('[Google Lead Processing Error]', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// LANDING PAGE FORM WEBHOOK
// ============================================================================

/**
 * POST /webhooks/landing-page
 * Receive submissions from standalone landing page
 */
app.post('/webhooks/landing-page', async (req, res) => {
  console.log('[Landing Page Lead Received]', req.body);

  const {
    name,
    phone,
    email,
    destination,
    travel_dates,
    travelers_count,
    budget_range,
    consent
  } = req.body;

  // Validation
  if (!name || !phone || !email) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }

  // Verify consent
  if (consent !== 'true' && consent !== true) {
    return res.status(400).json({
      success: false,
      error: 'Consent required'
    });
  }

  try {
    const leadId = generateLeadId();
    const formattedPhone = formatPhoneNumber(phone);

    // Save to Caspio
    await caspio.createLead({
      LeadID: leadId,
      CustomerName: name,
      Phone: formattedPhone,
      Email: email,
      Destination: destination || '',
      TravelDates: travel_dates || '',
      TravelersCount: travelers_count || '',
      BudgetRange: budget_range || '',
      SpecialOccasion: '',
      ConsentGiven: true,
      ConsentTimestamp: new Date().toISOString(),
      LeadSource: 'landing_page',
      LeadStatus: 'callback_requested',
      Priority: 'medium',
      CreatedDate: new Date().toISOString(),
      ModifiedDate: new Date().toISOString()
    });

    console.log('[Landing Page Lead Saved]', leadId);

    // Make instant call (async - don't wait)
    makeInstantCall(formattedPhone, leadId, name, email)
      .then(result => {
        console.log('[Call Success]', result.call_id);
      })
      .catch(error => {
        console.error('[Call Error]', error);
      });

    // Respond immediately
    return res.json({
      success: true,
      message: "We're calling you now!",
      lead_id: leadId
    });

  } catch (error) {
    console.error('[Landing Page Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process lead'
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TravelBucks Unified Lead Webhook',
    timestamp: new Date().toISOString(),
    endpoints: {
      facebook: '/webhooks/facebook-leads',
      google: '/webhooks/google-leads',
      landing_page: '/webhooks/landing-page',
      sms_payment: '/webhooks/send-payment-sms'
    }
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log('='.repeat(80));
  console.log('TravelBucks Unified Lead Webhook');
  console.log('='.repeat(80));
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Retell Agent ID: ${RETELL_AGENT_ID}`);
  console.log(`✓ Retell Phone: ${RETELL_PHONE_NUMBER}`);
  console.log(`✓ Caspio configured: ${CASPIO_ACCOUNT_ID}`);
  console.log();
  console.log('Endpoints:');
  console.log(`  POST /webhooks/facebook-leads - Facebook Lead Ads`);
  console.log(`  POST /webhooks/google-leads - Google Ads Lead Forms`);
  console.log(`  POST /webhooks/landing-page - Landing Page Forms`);
  console.log(`  POST /webhooks/send-payment-sms - SMS Payment Links`);
  console.log(`  GET  /health - Health Check`);
  console.log('='.repeat(80));
});

module.exports = app;
