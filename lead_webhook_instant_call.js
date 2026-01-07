/**
 * TravelBucks Lead Webhook Handler with INSTANT CALL
 * Automatically calls leads within seconds of form submission
 */

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// ============================================================================
// CONFIGURATION
// ============================================================================

const RETELL_API_KEY = process.env.RETELL_API_KEY || '***REMOVED***';
const RETELL_AGENT_ID = process.env.RETELL_AGENT_ID || 'agent_0562fddc61ca674411c34cd69a';
const RETELL_PHONE_NUMBER = process.env.RETELL_PHONE_NUMBER || '';

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
    const randomNum = Math.floor(Math.random() * 900000) + 100000;
    return `tb${randomNum}`;
}

// ============================================================================
// RETELL AI INSTANT CALL
// ============================================================================

async function makeInstantCall(phone, clientId, customerName, email) {
    if (!RETELL_PHONE_NUMBER) {
        console.log('[Mock Call] Would call:', phone);
        return { success: true, call_id: 'mock_call_123' };
    }

    const url = 'https://api.retellai.com/create-phone-call';
    
    const payload = {
        from_number: RETELL_PHONE_NUMBER,
        to_number: phone,
        agent_id: RETELL_AGENT_ID,
        dynamic_variables: {
            client_id: clientId,
            customer_name: customerName,
            customer_email: email
        }
    };

    console.log(`[Retell] Initiating call to ${phone} with client_id: ${clientId}`);

    const response = await axios.post(url, payload, {
        headers: {
            'Authorization': `Bearer ${RETELL_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    console.log(`[Retell] Call initiated! Call ID: ${response.data.call_id}`);

    return response.data;
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
        console.log('[Mock Caspio] Would save:', leadData);
        return { success: true };
    }

    const token = await getCaspioAccessToken();
    const url = `https://${CASPIO_ACCOUNT_ID}.caspio.com/rest/v2/tables/${CASPIO_TABLE_NAME}/records`;

    await axios.post(url, leadData, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    return { success: true };
}

// ============================================================================
// WEBHOOK ENDPOINTS
// ============================================================================

/**
 * Landing Page with INSTANT CALL
 */
app.post('/webhooks/submit-lead', async (req, res) => {
    console.log('[Landing Page] Received lead:', req.body);

    try {
        const { name, phone, email, travel_frequency, preferred_time, source } = req.body;

        // Validate phone number
        const cleanPhone = phone.replace(/\D/g, '');
        const formattedPhone = cleanPhone.length === 10 ? `+1${cleanPhone}` : 
                              cleanPhone.length === 11 && cleanPhone[0] === '1' ? `+${cleanPhone}` : null;

        if (!formattedPhone) {
            throw new Error('Invalid phone number format');
        }

        // Generate client ID
        const clientId = generateClientId();

        // Prepare Caspio record
        const leadData = {
            ClientID: clientId,
            CustomerName: name,
            Phone: formattedPhone,
            Email: email,
            TravelFrequency: travel_frequency || '',
            PreferredCallTime: preferred_time || '',
            Source: source || 'landing_page',
            Status: 'calling_now',
            CreatedDate: new Date().toISOString(),
            LastCallDate: new Date().toISOString(),
            LastCallID: null
        };

        // Save to Caspio
        await saveToCaspio(leadData);
        console.log(`[Success] Lead saved with client_id: ${clientId}`);

        // INSTANT CALL - Don't wait for response
        makeInstantCall(formattedPhone, clientId, name, email).then(callResult => {
            console.log(`[Call Success] Call initiated: ${callResult.call_id}`);
            
            // Update Caspio with call ID
            leadData.LastCallID = callResult.call_id;
            leadData.Status = 'call_in_progress';
            saveToCaspio(leadData).catch(err => console.error('[Caspio Update Error]', err));
            
        }).catch(error => {
            console.error(`[Call Error]`, error.message);
        });

        // Respond immediately
        res.json({
            success: true,
            client_id: clientId,
            message: 'We\'re calling you right now!',
            calling: true
        });

    } catch (error) {
        console.error('[Error] Failed to process lead:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Facebook Lead Ads with INSTANT CALL
 */
app.get('/webhooks/facebook-leads', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === FACEBOOK_VERIFY_TOKEN) {
        console.log('[Facebook] Webhook verified!');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhooks/facebook-leads', async (req, res) => {
    console.log('[Facebook] Received webhook');

    try {
        const entry = req.body.entry;
        if (!entry) return res.sendStatus(200);

        for (const item of entry) {
            for (const change of item.changes) {
                if (change.field === 'leadgen') {
                    const leadgenId = change.value.leadgen_id;
                    
                    // Fetch and process lead
                    const fbLead = await fetchFacebookLead(leadgenId);
                    await processFacebookLeadWithCall(fbLead);
                }
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('[Facebook] Error:', error.message);
        res.sendStatus(200);
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

async function processFacebookLeadWithCall(fbLead) {
    const fields = {};
    for (const field of fbLead.field_data) {
        fields[field.name.toLowerCase().replace(/\s/g, '_')] = field.values[0];
    }

    const clientId = generateClientId();
    const name = fields.full_name || fields.name || '';
    const phone = fields.phone_number || fields.phone || '';
    const email = fields.email || '';

    // Format phone
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `+1${cleanPhone}` : 
                          cleanPhone.length === 11 && cleanPhone[0] === '1' ? `+${cleanPhone}` : null;

    if (!formattedPhone) {
        console.error('[Facebook] Invalid phone number:', phone);
        return;
    }

    const leadData = {
        ClientID: clientId,
        CustomerName: name,
        Phone: formattedPhone,
        Email: email,
        Source: 'facebook_lead_ad',
        Status: 'calling_now',
        CreatedDate: fbLead.created_time,
        LastCallDate: new Date().toISOString(),
        FacebookLeadID: fbLead.id
    };

    await saveToCaspio(leadData);
    console.log(`[Facebook] Lead saved: ${clientId}`);

    // INSTANT CALL
    makeInstantCall(formattedPhone, clientId, name, email).then(callResult => {
        console.log(`[Facebook Call] Initiated: ${callResult.call_id}`);
    }).catch(err => {
        console.error(`[Facebook Call Error]`, err.message);
    });
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        instant_calling_enabled: !!RETELL_PHONE_NUMBER,
        caspio_configured: !!(CASPIO_CLIENT_ID && CASPIO_CLIENT_SECRET),
        facebook_configured: !!FACEBOOK_PAGE_ACCESS_TOKEN
    });
});

app.get('/', (req, res) => {
    res.json({
        service: 'TravelBucks Lead Webhook with INSTANT CALLING',
        features: [
            'Automatic instant calls within seconds of form submission',
            'Facebook Lead Ads integration with instant calling',
            'Auto-generated client_id (tb######)',
            'Caspio database integration'
        ]
    });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
    console.log(`\n${'='.repeat(80)}`);
    console.log('TravelBucks Lead Webhook - INSTANT CALL MODE');
    console.log(`${'='.repeat(80)}`);
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`Instant Calling: ${RETELL_PHONE_NUMBER ? 'ENABLED ✓' : 'DISABLED (set RETELL_PHONE_NUMBER)'}`);
    console.log(`Caspio: ${CASPIO_CLIENT_ID ? 'ENABLED ✓' : 'MOCK MODE'}`);
    console.log(`Facebook: ${FACEBOOK_PAGE_ACCESS_TOKEN ? 'ENABLED ✓' : 'DISABLED'}`);
    console.log(`${'='.repeat(80)}\n`);
});
