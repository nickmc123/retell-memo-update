/**
 * TravelBucks Lead Webhook Handler
 * Receives leads from landing page and Facebook Lead Ads
 * Generates client_id and stores in Caspio
 */

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS for landing page
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// ============================================================================
// CONFIGURATION
// ============================================================================

const CASPIO_ACCOUNT_ID = process.env.CASPIO_ACCOUNT_ID || '';
const CASPIO_CLIENT_ID = process.env.CASPIO_CLIENT_ID || '';
const CASPIO_CLIENT_SECRET = process.env.CASPIO_CLIENT_SECRET || '';
const CASPIO_TABLE_NAME = process.env.CASPIO_TABLE_NAME || 'TravelBucks_Leads';

const FACEBOOK_VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || '***REMOVED***';
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '';

// ============================================================================
// CLIENT ID GENERATION
// ============================================================================

function generateClientId() {
    // Generate format: tb######
    const randomNum = Math.floor(Math.random() * 900000) + 100000; // 6 digits
    return `tb${randomNum}`;
}

// ============================================================================
// CASPIO INTEGRATION
// ============================================================================

let caspioAccessToken = null;
let tokenExpiresAt = 0;

async function getCaspioAccessToken() {
    if (caspioAccessToken && Date.now() < tokenExpiresAt) {
        return caspioAccessToken;
    }

    const tokenUrl = `https://${CASPIO_ACCOUNT_ID}.caspio.com/oauth/token`;
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CASPIO_CLIENT_ID);
    params.append('client_secret', CASPIO_CLIENT_SECRET);

    const response = await axios.post(tokenUrl, params);
    caspioAccessToken = response.data.access_token;
    tokenExpiresAt = Date.now() + (response.data.expires_in * 1000) - 60000;

    return caspioAccessToken;
}

async function saveToCaspio(leadData) {
    if (!CASPIO_CLIENT_ID || !CASPIO_CLIENT_SECRET) {
        console.log('[Mock] Would save to Caspio:', leadData);
        return { success: true, client_id: leadData.ClientID };
    }

    const token = await getCaspioAccessToken();
    const url = `https://${CASPIO_ACCOUNT_ID}.caspio.com/rest/v2/tables/${CASPIO_TABLE_NAME}/records`;

    const response = await axios.post(url, leadData, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    return { success: true, client_id: leadData.ClientID };
}

// ============================================================================
// WEBHOOK ENDPOINTS
// ============================================================================

/**
 * Landing Page Form Submission
 */
app.post('/webhooks/submit-lead', async (req, res) => {
    console.log('[Landing Page] Received lead:', req.body);

    try {
        const { name, phone, email, travel_frequency, preferred_time, source } = req.body;

        // Generate client ID
        const clientId = generateClientId();

        // Prepare Caspio record
        const leadData = {
            ClientID: clientId,
            CustomerName: name,
            Phone: phone,
            Email: email,
            TravelFrequency: travel_frequency || '',
            PreferredCallTime: preferred_time || '',
            Source: source || 'landing_page',
            Status: 'callback_requested',
            CreatedDate: new Date().toISOString(),
            LastCallDate: null,
            LastCallID: null
        };

        // Save to Caspio
        const result = await saveToCaspio(leadData);

        console.log(`[Success] Lead saved with client_id: ${clientId}`);

        res.json({
            success: true,
            client_id: clientId,
            message: 'Lead submitted successfully'
        });

    } catch (error) {
        console.error('[Error] Failed to save lead:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Facebook Lead Ads Webhook Verification
 */
app.get('/webhooks/facebook-leads', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === FACEBOOK_VERIFY_TOKEN) {
        console.log('[Facebook] Webhook verified!');
        res.status(200).send(challenge);
    } else {
        console.log('[Facebook] Verification failed');
        res.sendStatus(403);
    }
});

/**
 * Facebook Lead Ads Webhook Receiver
 */
app.post('/webhooks/facebook-leads', async (req, res) => {
    console.log('[Facebook] Received webhook:', JSON.stringify(req.body, null, 2));

    try {
        const entry = req.body.entry;

        if (!entry) {
            return res.sendStatus(200);
        }

        for (const item of entry) {
            const changes = item.changes;

            for (const change of changes) {
                if (change.field === 'leadgen') {
                    const leadgenId = change.value.leadgen_id;
                    const formId = change.value.form_id;
                    const pageId = change.value.page_id;

                    console.log(`[Facebook] New lead - ID: ${leadgenId}, Form: ${formId}, Page: ${pageId}`);

                    // Fetch lead data from Facebook
                    const leadData = await fetchFacebookLead(leadgenId);

                    // Process and save to Caspio
                    await processFacebookLead(leadData);
                }
            }
        }

        res.sendStatus(200);

    } catch (error) {
        console.error('[Facebook] Error processing webhook:', error.message);
        res.sendStatus(200); // Always return 200 to Facebook
    }
});

async function fetchFacebookLead(leadId) {
    const url = `https://graph.facebook.com/v18.0/${leadId}`;
    const response = await axios.get(url, {
        params: {
            access_token: FACEBOOK_PAGE_ACCESS_TOKEN,
            fields: 'id,created_time,field_data'
        }
    });

    return response.data;
}

async function processFacebookLead(fbLead) {
    console.log('[Facebook] Processing lead:', fbLead);

    // Parse field data
    const fields = {};
    for (const field of fbLead.field_data) {
        fields[field.name.toLowerCase()] = field.values[0];
    }

    // Generate client ID
    const clientId = generateClientId();

    // Map to Caspio format
    const leadData = {
        ClientID: clientId,
        CustomerName: fields.full_name || fields.name || '',
        Phone: fields.phone_number || fields.phone || '',
        Email: fields.email || '',
        TravelFrequency: fields.travel_frequency || '',
        PreferredCallTime: '',
        Source: 'facebook_lead_ad',
        Status: 'callback_requested',
        CreatedDate: fbLead.created_time,
        LastCallDate: null,
        LastCallID: null,
        FacebookLeadID: fbLead.id
    };

    // Save to Caspio
    const result = await saveToCaspio(leadData);

    console.log(`[Facebook] Lead saved with client_id: ${clientId}`);

    return result;
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        caspio_configured: !!(CASPIO_CLIENT_ID && CASPIO_CLIENT_SECRET),
        facebook_configured: !!FACEBOOK_PAGE_ACCESS_TOKEN
    });
});

app.get('/', (req, res) => {
    res.json({
        service: 'TravelBucks Lead Webhook Handler',
        endpoints: [
            'POST /webhooks/submit-lead - Landing page form submission',
            'GET /webhooks/facebook-leads - Facebook webhook verification',
            'POST /webhooks/facebook-leads - Facebook lead ads receiver',
            'GET /health - Health check'
        ]
    });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
    console.log(`\n${'='.repeat(80)}`);
    console.log('TravelBucks Lead Webhook Handler');
    console.log(`${'='.repeat(80)}`);
    console.log(`Server running on port ${PORT}`);
    console.log(`Caspio configured: ${!!(CASPIO_CLIENT_ID && CASPIO_CLIENT_SECRET)}`);
    console.log(`Facebook configured: ${!!FACEBOOK_PAGE_ACCESS_TOKEN}`);
    console.log(`\nEndpoints:`);
    console.log(`  - POST /webhooks/submit-lead`);
    console.log(`  - GET/POST /webhooks/facebook-leads`);
    console.log(`  - GET /health`);
    console.log(`${'='.repeat(80)}\n`);
});
