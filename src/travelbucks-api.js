/**
 * TravelBucks Voice Ops API
 * Lead-to-Payment System with Retell AI, Caspio, and Authorize.Net
 *
 * Endpoints:
 * - GET  /health - Health check
 * - POST /lead - Create/update lead from FB or Retell
 * - POST /payment-link - Generate Caspio payment link
 * - POST /retell/webhook - Retell call event webhook
 * - POST /webhooks/payment - Payment completion webhook from Caspio
 * - POST /sms - Send SMS via Retell
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
    // Caspio settings
    caspio: {
        baseUrl: process.env.CASPIO_BASE_URL || 'https://***REMOVED***.caspio.com',
        tokenUrl: process.env.CASPIO_TOKEN_URL || 'https://***REMOVED***.caspio.com/oauth/token',
        clientId: process.env.CASPIO_CLIENT_ID,
        clientSecret: process.env.CASPIO_CLIENT_SECRET,
        tables: {
            leads: process.env.CASPIO_TABLE_LEADS || 'TravelBucks_Leads'
        }
    },
    // Retell settings
    retell: {
        apiKey: process.env.RETELL_API_KEY,
        baseUrl: 'https://api.retellai.com'
    },
    // Payment settings
    payment: {
        pageBaseUrl: process.env.PAYMENT_PAGE_BASE_URL || 'https://***REMOVED***.caspio.com/dp/your-datapage-id',
        amount: 999
    },
    // Security
    appSecret: process.env.APP_SECRET || 'change-me-in-production'
};

// OAuth token cache
let cachedToken = null;
let tokenExpiry = null;

// =============================================================================
// MIDDLEWARE
// =============================================================================

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`  Body: ${JSON.stringify(req.body).substring(0, 200)}...`);
    }
    next();
});

// Async error handler
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// =============================================================================
// CASPIO CLIENT
// =============================================================================

/**
 * Get Caspio OAuth access token (cached)
 */
async function getCaspioToken() {
    // Return cached token if still valid (with 5-minute buffer)
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - 300000) {
        return cachedToken;
    }

    try {
        const credentials = Buffer.from(
            `${CONFIG.caspio.clientId}:${CONFIG.caspio.clientSecret}`
        ).toString('base64');

        const response = await axios.post(
            CONFIG.caspio.tokenUrl,
            'grant_type=client_credentials',
            {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        cachedToken = response.data.access_token;
        tokenExpiry = Date.now() + (response.data.expires_in * 1000);

        console.log('[Caspio] OAuth token obtained successfully');
        return cachedToken;
    } catch (error) {
        console.error('[Caspio] OAuth error:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with Caspio');
    }
}

/**
 * Query Caspio table with optional WHERE clause
 */
async function queryCaspio(tableName, whereClause = null) {
    const token = await getCaspioToken();
    const url = `${CONFIG.caspio.baseUrl}/rest/v2/tables/${tableName}/records`;
    const params = whereClause ? { 'q.where': whereClause } : {};

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            params
        });
        return response.data.Result || [];
    } catch (error) {
        console.error(`[Caspio] Query error (${tableName}):`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Insert record into Caspio table
 */
async function insertCaspio(tableName, data) {
    const token = await getCaspioToken();
    const url = `${CONFIG.caspio.baseUrl}/rest/v2/tables/${tableName}/records`;

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error(`[Caspio] Insert error (${tableName}):`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Update record in Caspio table
 */
async function updateCaspio(tableName, whereClause, data) {
    const token = await getCaspioToken();
    const url = `${CONFIG.caspio.baseUrl}/rest/v2/tables/${tableName}/records`;

    try {
        const response = await axios.put(url, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            params: { 'q.where': whereClause }
        });
        return response.data;
    } catch (error) {
        console.error(`[Caspio] Update error (${tableName}):`, error.response?.data || error.message);
        throw error;
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Normalize phone number to E.164 format
 */
function normalizePhone(phone) {
    if (!phone) return null;

    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '');

    // Handle US numbers
    if (digits.length === 10) {
        digits = '1' + digits;
    }

    // Add + prefix
    if (digits.length === 11 && digits.startsWith('1')) {
        return '+' + digits;
    }

    // Already has country code
    if (digits.length > 10) {
        return '+' + digits;
    }

    return phone; // Return as-is if can't normalize
}

/**
 * Validate required fields
 */
function validateRequired(body, fields) {
    const missing = fields.filter(f => !body[f]);
    if (missing.length > 0) {
        return { valid: false, missing };
    }
    return { valid: true };
}

/**
 * Generate ISO timestamp
 */
function nowISO() {
    return new Date().toISOString();
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/health', async (req, res) => {
    try {
        // Test Caspio connection
        await getCaspioToken();

        res.json({
            status: 'ok',
            service: 'TravelBucks Voice Ops',
            caspio: 'connected',
            timestamp: nowISO(),
            version: '1.0.0'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            service: 'TravelBucks Voice Ops',
            caspio: 'disconnected',
            error: error.message,
            timestamp: nowISO()
        });
    }
});

// =============================================================================
// LEAD ENDPOINTS
// =============================================================================

/**
 * POST /lead
 * Create or update lead (upsert by phone)
 *
 * Body: {
 *   full_name: string (required),
 *   phone: string (required),
 *   email?: string,
 *   source?: string (default: 'facebook'),
 *   destination_interest?: string,
 *   travel_window?: string,
 *   departure_city_or_port?: string,
 *   consent_checkbox?: boolean,
 *   consent_timestamp?: string
 * }
 */
app.post('/lead', asyncHandler(async (req, res) => {
    const validation = validateRequired(req.body, ['full_name', 'phone']);
    if (!validation.valid) {
        return res.status(400).json({
            error: 'Missing required fields',
            missing: validation.missing
        });
    }

    const {
        full_name,
        phone,
        email,
        source = 'facebook',
        destination_interest,
        travel_window,
        departure_city_or_port,
        consent_checkbox,
        consent_timestamp
    } = req.body;

    const normalizedPhone = normalizePhone(phone);
    const table = CONFIG.caspio.tables.leads;

    // Check if lead exists by phone
    const existing = await queryCaspio(table, `phone='${normalizedPhone}'`);

    let lead;
    if (existing.length > 0) {
        // Update existing lead
        lead = existing[0];
        const updateData = {
            full_name,
            email: email || lead.email,
            destination_interest: destination_interest || lead.destination_interest,
            travel_window: travel_window || lead.travel_window,
            departure_city_or_port: departure_city_or_port || lead.departure_city_or_port,
            updated_at: nowISO()
        };

        // Only update consent if provided
        if (consent_checkbox !== undefined) {
            updateData.consent_checkbox = consent_checkbox;
            updateData.consent_timestamp = consent_timestamp || nowISO();
        }

        await updateCaspio(table, `lead_id=${lead.lead_id}`, updateData);

        // Merge for response
        lead = { ...lead, ...updateData };
        console.log(`[Lead] Updated existing lead: ${lead.lead_id}`);
    } else {
        // Create new lead
        const newLead = {
            full_name,
            phone: normalizedPhone,
            email: email || '',
            source,
            offer: 'choose_your_trip_999',
            destination_interest: destination_interest || '',
            travel_window: travel_window || '',
            departure_city_or_port: departure_city_or_port || '',
            status: 'new',
            planning_fee_amount: 999,
            payment_status: 'unpaid',
            consent_checkbox: consent_checkbox || false,
            consent_timestamp: consent_checkbox ? (consent_timestamp || nowISO()) : null,
            created_at: nowISO(),
            updated_at: nowISO()
        };

        const result = await insertCaspio(table, newLead);
        lead = { ...newLead, lead_id: result.lead_id || result.ID || 'new' };
        console.log(`[Lead] Created new lead: ${lead.lead_id}`);
    }

    res.json({
        success: true,
        lead_id: lead.lead_id,
        phone: lead.phone,
        status: lead.status,
        payment_status: lead.payment_status,
        payment_link_url: lead.payment_link_url || null
    });
}));

/**
 * GET /lead/:lead_id
 * Get lead by ID
 */
app.get('/lead/:lead_id', asyncHandler(async (req, res) => {
    const { lead_id } = req.params;
    const table = CONFIG.caspio.tables.leads;

    const results = await queryCaspio(table, `lead_id=${lead_id}`);

    if (results.length === 0) {
        return res.status(404).json({
            error: 'Lead not found',
            lead_id
        });
    }

    res.json({
        success: true,
        lead: results[0]
    });
}));

/**
 * GET /lead/phone/:phone
 * Get lead by phone number
 */
app.get('/lead/phone/:phone', asyncHandler(async (req, res) => {
    const phone = normalizePhone(req.params.phone);
    const table = CONFIG.caspio.tables.leads;

    const results = await queryCaspio(table, `phone='${phone}'`);

    if (results.length === 0) {
        return res.status(404).json({
            error: 'Lead not found',
            phone
        });
    }

    res.json({
        success: true,
        lead: results[0]
    });
}));

// =============================================================================
// PAYMENT LINK ENDPOINT
// =============================================================================

/**
 * POST /payment-link
 * Generate payment link for a lead
 *
 * Body: { lead_id: number }
 */
app.post('/payment-link', asyncHandler(async (req, res) => {
    const { lead_id } = req.body;

    if (!lead_id) {
        return res.status(400).json({
            error: 'Missing required field: lead_id'
        });
    }

    const table = CONFIG.caspio.tables.leads;

    // Get lead
    const results = await queryCaspio(table, `lead_id=${lead_id}`);
    if (results.length === 0) {
        return res.status(404).json({
            error: 'Lead not found',
            lead_id
        });
    }

    const lead = results[0];

    // Generate payment link URL
    const paymentUrl = `${CONFIG.payment.pageBaseUrl}?lead_id=${lead_id}`;

    // Update lead with payment link
    await updateCaspio(table, `lead_id=${lead_id}`, {
        payment_link_url: paymentUrl,
        payment_status: 'pending',
        status: 'sent_payment_link',
        updated_at: nowISO()
    });

    console.log(`[Payment] Generated link for lead ${lead_id}: ${paymentUrl}`);

    res.json({
        success: true,
        lead_id,
        payment_link_url: paymentUrl,
        amount: CONFIG.payment.amount
    });
}));

// =============================================================================
// RETELL WEBHOOK
// =============================================================================

/**
 * POST /retell/webhook
 * Handle Retell call events
 *
 * Events: call_started, call_ended, tool_call, etc.
 */
app.post('/retell/webhook', asyncHandler(async (req, res) => {
    const { event, call } = req.body;

    // Optional: Validate Retell signature
    // const signature = req.headers['x-retell-signature'];
    // if (!validateRetellSignature(signature, req.body)) {
    //     return res.status(401).json({ error: 'Invalid signature' });
    // }

    console.log(`[Retell] Event: ${event}`, JSON.stringify(call || {}).substring(0, 200));

    const table = CONFIG.caspio.tables.leads;

    switch (event) {
        case 'call_started': {
            // Try to find lead by caller phone
            if (call?.from_number) {
                const phone = normalizePhone(call.from_number);
                const leads = await queryCaspio(table, `phone='${phone}'`);

                if (leads.length > 0) {
                    await updateCaspio(table, `lead_id=${leads[0].lead_id}`, {
                        call_status: 'in_progress',
                        updated_at: nowISO()
                    });
                }
            }
            break;
        }

        case 'call_ended': {
            // Update call status
            if (call?.from_number) {
                const phone = normalizePhone(call.from_number);
                const leads = await queryCaspio(table, `phone='${phone}'`);

                if (leads.length > 0) {
                    const callStatus = call.disconnection_reason === 'user_hangup'
                        ? 'completed'
                        : call.disconnection_reason || 'ended';

                    await updateCaspio(table, `lead_id=${leads[0].lead_id}`, {
                        call_status: callStatus,
                        notes: `Call duration: ${call.duration_seconds || 0}s. ${leads[0].notes || ''}`,
                        updated_at: nowISO()
                    });
                }
            }
            break;
        }

        case 'tool_call': {
            // Log tool calls for debugging
            console.log(`[Retell] Tool call: ${call?.tool_name}`, call?.tool_arguments);
            break;
        }

        default:
            console.log(`[Retell] Unhandled event: ${event}`);
    }

    res.json({ success: true, event });
}));

// =============================================================================
// PAYMENT WEBHOOK (FROM CASPIO)
// =============================================================================

/**
 * POST /webhooks/payment
 * Handle payment completion from Caspio DataPage
 *
 * Body: {
 *   lead_id: number,
 *   status: 'paid' | 'failed' | 'declined',
 *   transaction_id?: string,
 *   amount?: number,
 *   reason?: string
 * }
 */
app.post('/webhooks/payment', asyncHandler(async (req, res) => {
    // Validate APP_SECRET
    const authHeader = req.headers['x-app-secret'] || req.headers['authorization'];
    if (authHeader !== CONFIG.appSecret && authHeader !== `Bearer ${CONFIG.appSecret}`) {
        console.log('[Payment Webhook] Invalid secret');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { lead_id, status, transaction_id, amount, reason } = req.body;

    if (!lead_id || !status) {
        return res.status(400).json({
            error: 'Missing required fields',
            required: ['lead_id', 'status']
        });
    }

    const table = CONFIG.caspio.tables.leads;

    // Verify lead exists
    const leads = await queryCaspio(table, `lead_id=${lead_id}`);
    if (leads.length === 0) {
        return res.status(404).json({
            error: 'Lead not found',
            lead_id
        });
    }

    const lead = leads[0];

    // Update based on payment status
    const updateData = {
        payment_status: status,
        updated_at: nowISO()
    };

    if (status === 'paid') {
        updateData.status = 'paid';
        updateData.transaction_id = transaction_id || '';
        updateData.planning_fee_amount = amount || 999;
        console.log(`[Payment] SUCCESS - Lead ${lead_id} paid $${amount || 999}`);
    } else if (status === 'failed' || status === 'declined') {
        updateData.status = 'failed';
        updateData.notes = `Payment ${status}: ${reason || 'No reason provided'}. ${lead.notes || ''}`;
        console.log(`[Payment] FAILED - Lead ${lead_id}: ${reason}`);
    }

    await updateCaspio(table, `lead_id=${lead_id}`, updateData);

    // TODO: Send notification (email/SMS/Slack) on payment success
    // await sendPaymentNotification(lead, status, amount);

    res.json({
        success: true,
        lead_id,
        payment_status: status,
        transaction_id: transaction_id || null
    });
}));

// =============================================================================
// SMS ENDPOINT (VIA RETELL)
// =============================================================================

/**
 * POST /sms
 * Send SMS via Retell API
 *
 * Body: {
 *   phone: string,
 *   message: string
 * }
 */
app.post('/sms', asyncHandler(async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({
            error: 'Missing required fields',
            required: ['phone', 'message']
        });
    }

    const normalizedPhone = normalizePhone(phone);

    try {
        // Retell SMS API
        // Note: Check Retell docs for exact endpoint - this may vary
        const response = await axios.post(
            `${CONFIG.retell.baseUrl}/v2/send-sms`,
            {
                to_number: normalizedPhone,
                message: message
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.retell.apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`[SMS] Sent to ${normalizedPhone}: ${message.substring(0, 50)}...`);

        res.json({
            success: true,
            phone: normalizedPhone,
            message_id: response.data?.id || null
        });
    } catch (error) {
        console.error('[SMS] Error:', error.response?.data || error.message);

        // Return success anyway if this is just a logging issue
        res.status(500).json({
            success: false,
            error: 'SMS send failed',
            details: error.response?.data?.message || error.message
        });
    }
}));

/**
 * POST /send-payment-sms
 * Generate payment link and send via SMS
 *
 * Body: {
 *   lead_id: number,
 *   phone?: string (optional, uses lead phone if not provided)
 * }
 */
app.post('/send-payment-sms', asyncHandler(async (req, res) => {
    const { lead_id, phone } = req.body;

    if (!lead_id) {
        return res.status(400).json({
            error: 'Missing required field: lead_id'
        });
    }

    const table = CONFIG.caspio.tables.leads;

    // Get lead
    const leads = await queryCaspio(table, `lead_id=${lead_id}`);
    if (leads.length === 0) {
        return res.status(404).json({
            error: 'Lead not found',
            lead_id
        });
    }

    const lead = leads[0];
    const targetPhone = phone ? normalizePhone(phone) : lead.phone;

    // Generate payment link if not exists
    let paymentUrl = lead.payment_link_url;
    if (!paymentUrl) {
        paymentUrl = `${CONFIG.payment.pageBaseUrl}?lead_id=${lead_id}`;
        await updateCaspio(table, `lead_id=${lead_id}`, {
            payment_link_url: paymentUrl,
            payment_status: 'pending',
            status: 'sent_payment_link',
            updated_at: nowISO()
        });
    }

    // SMS message with required disclosure
    const smsMessage = `TravelBucks: Here's your secure activation link: ${paymentUrl}. Msgs may be sent using automated or AI-assisted technology. Reply STOP to opt out.`;

    // Send SMS
    try {
        await axios.post(
            `${CONFIG.retell.baseUrl}/v2/send-sms`,
            {
                to_number: targetPhone,
                message: smsMessage
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.retell.apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`[SMS] Payment link sent to ${targetPhone}`);

        res.json({
            success: true,
            lead_id,
            phone: targetPhone,
            payment_link_url: paymentUrl,
            sms_sent: true
        });
    } catch (error) {
        console.error('[SMS] Error sending payment link:', error.response?.data || error.message);

        res.json({
            success: true,
            lead_id,
            phone: targetPhone,
            payment_link_url: paymentUrl,
            sms_sent: false,
            sms_error: error.response?.data?.message || error.message
        });
    }
}));

// =============================================================================
// ERROR HANDLING
// =============================================================================

app.use((err, req, res, next) => {
    console.error('[Error]', err.stack || err);

    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production'
            ? 'An error occurred'
            : err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path
    });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
    console.log(`
================================================================================
  TravelBucks Voice Ops API
================================================================================
  URL:     http://localhost:${PORT}
  Health:  http://localhost:${PORT}/health

  Endpoints:
    POST /lead                - Create/update lead
    GET  /lead/:lead_id       - Get lead by ID
    GET  /lead/phone/:phone   - Get lead by phone
    POST /payment-link        - Generate payment link
    POST /send-payment-sms    - Generate and send payment link via SMS
    POST /retell/webhook      - Retell call event webhook
    POST /webhooks/payment    - Payment completion webhook
    POST /sms                 - Send SMS via Retell

  Config:
    Caspio Base:    ${CONFIG.caspio.baseUrl}
    Leads Table:    ${CONFIG.caspio.tables.leads}
    Payment URL:    ${CONFIG.payment.pageBaseUrl}
================================================================================
    `);
});

module.exports = app;
