/**
 * Casablanca Express - RIMS Database API (Caspio Integration)
 * For Retell AI Agent Integration
 *
 * Uses Caspio REST API with OAuth 2.0 authentication
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

// =============================================================================
// CASPIO CONFIGURATION
// =============================================================================

const CASPIO_CONFIG = {
    accountId: process.env.CASPIO_ACCOUNT_ID || 'c3afw288',
    baseUrl: process.env.CASPIO_BASE_URL || 'https://c3afw288.caspio.com',
    tokenUrl: process.env.CASPIO_TOKEN_URL || 'https://c3afw288.caspio.com/oauth/token',
    clientId: process.env.CASPIO_CLIENT_ID,
    clientSecret: process.env.CASPIO_CLIENT_SECRET,

    // Table names (update these to match your actual Caspio table names)
    tables: {
        rims_data: process.env.CASPIO_TABLE_RIMS || 'RIMS_DATA',
        knowledge_base: process.env.CASPIO_TABLE_KB || 'Knowledge_Base',
        rims_memos: process.env.CASPIO_TABLE_MEMOS || 'RIMS_MEMOS'
    }
};

// Retell AI Configuration
const RETELL_CONFIG = {
    apiKey: process.env.RETELL_API_KEY,
    baseUrl: 'https://api.retellai.com'
};

// OAuth token cache
let cachedToken = null;
let tokenExpiry = null;

// =============================================================================
// MOCK DATA - RIMS_DATA Structure
// =============================================================================

const MOCK_RIMS_DATA = [
    {
        phn1: "8182121359",
        phn2: "3105551234",
        pkg_code: "BEACH",
        pkg_code2: "BEACH123",
        vac_id: "123456",
        last_name: "Johnson",
        first_name: "Sarah",
        email: "sarah.johnson@email.com",
        val_dep: 250.00,
        conf_deposit: 500.00,
        Asgn_trv_DT: "2025-06-15",
        confirm_status: "confirm",
        tm: "John Smith",
        date_print_enc: "2025-05-01",
        agency_book_via: "FLIGHT123",
        htl_bk_via: "HOTEL456"
    },
    {
        phn1: "3105559876",
        phn2: "",
        pkg_code: "E",
        pkg_code2: "E789",
        vac_id: "234567",
        last_name: "Chen",
        first_name: "Mike",
        email: "mike.chen@email.com",
        val_dep: 250.00,
        conf_deposit: 250.00,
        Asgn_trv_DT: "2025-01-26",
        confirm_status: "confirm",
        tm: "",
        date_print_enc: "",
        agency_book_via: "",
        htl_bk_via: ""
    },
    {
        phn1: "4155551212",
        phn2: "",
        pkg_code: "SKI",
        pkg_code2: "SKI555",
        vac_id: "345678",
        last_name: "Martinez",
        first_name: "Lisa",
        email: "lisa.martinez@email.com",
        val_dep: 0,
        conf_deposit: 0,
        Asgn_trv_DT: "2025-08-15",
        confirm_status: "confirm",
        tm: "",
        date_print_enc: "",
        agency_book_via: "",
        htl_bk_via: ""
    }
];

// Hardcoded Knowledge Base - Deposit amounts only
// (Package descriptions are in Retell AI Knowledge Base)
const MOCK_KNOWLEDGE_BASE = {
    // ECF packages
    "ECF": { total_deposit: 500, activation_method: "online" },
    "ECFWIN": { total_deposit: 500, activation_method: "online" },

    // E packages
    "E": { total_deposit: 500, activation_method: "online" },
    "E7": { total_deposit: 500, activation_method: "online" },
    "E78": { total_deposit: 500, activation_method: "online" },
    "E789": { total_deposit: 500, activation_method: "online" },

    // BEACH packages
    "BEACH": { total_deposit: 750, activation_method: "online" },
    "BEACH1": { total_deposit: 750, activation_method: "online" },
    "BEACH12": { total_deposit: 750, activation_method: "online" },
    "BEACH123": { total_deposit: 750, activation_method: "online" },

    // SKI packages
    "SKI": { total_deposit: 800, activation_method: "mail" },
    "SKI5": { total_deposit: 800, activation_method: "mail" },
    "SKI55": { total_deposit: 800, activation_method: "mail" },
    "SKI555": { total_deposit: 800, activation_method: "mail" },

    // Add more package codes as needed
};

const MOCK_MEMOS = [];

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// =============================================================================
// CASPIO API CLIENT
// =============================================================================

/**
 * Get OAuth access token (cached)
 */
async function getCaspioToken() {
    // Return cached token if still valid
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    try {
        const credentials = Buffer.from(`${CASPIO_CONFIG.clientId}:${CASPIO_CONFIG.clientSecret}`).toString('base64');

        const response = await axios.post(
            CASPIO_CONFIG.tokenUrl,
            'grant_type=client_credentials',
            {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        cachedToken = response.data.access_token;
        // Set expiry to 5 minutes before actual expiry for safety
        tokenExpiry = Date.now() + ((response.data.expires_in - 300) * 1000);

        console.log('✅ Caspio OAuth token obtained');
        return cachedToken;
    } catch (error) {
        console.error('❌ Caspio OAuth error:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with Caspio');
    }
}

/**
 * Query Caspio table
 */
async function queryCaspioTable(tableName, whereClause = null) {
    const token = await getCaspioToken();

    const url = `${CASPIO_CONFIG.baseUrl}/rest/v2/tables/${tableName}/records`;
    const params = {};

    if (whereClause) {
        params['q.where'] = whereClause;
    }

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
        console.error(`❌ Caspio query error (${tableName}):`, error.response?.data || error.message);
        throw new Error(`Failed to query ${tableName}`);
    }
}

/**
 * Insert record into Caspio table
 */
async function insertCaspioRecord(tableName, data) {
    const token = await getCaspioToken();

    const url = `${CASPIO_CONFIG.baseUrl}/rest/v2/tables/${tableName}/records`;

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
        console.error(`❌ Caspio insert error (${tableName}):`, error.response?.data || error.message);
        throw new Error(`Failed to insert into ${tableName}`);
    }
}

// =============================================================================
// RETELL AI API CLIENT
// =============================================================================

/**
 * Get call details from Retell AI
 */
async function getRetellCall(callId) {
    if (!RETELL_CONFIG.apiKey) {
        throw new Error('RETELL_API_KEY not configured');
    }

    const url = `${RETELL_CONFIG.baseUrl}/v2/get-call/${callId}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${RETELL_CONFIG.apiKey}`,
                'Accept': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        console.error(`❌ Retell API error (get-call):`, error.response?.data || error.message);
        throw new Error(`Failed to fetch call ${callId}`);
    }
}

/**
 * List calls from Retell AI
 */
async function listRetellCalls(filters = {}) {
    if (!RETELL_CONFIG.apiKey) {
        throw new Error('RETELL_API_KEY not configured');
    }

    const url = `${RETELL_CONFIG.baseUrl}/v2/list-calls`;

    try {
        const response = await axios.post(url, filters, {
            headers: {
                'Authorization': `Bearer ${RETELL_CONFIG.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        console.error(`❌ Retell API error (list-calls):`, error.response?.data || error.message);
        throw new Error('Failed to list calls');
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date2 - date1) / oneDay);
}

function normalizePhone(phone) {
    // Remove all non-digits
    let normalized = phone.replace(/\D/g, '');

    // Remove leading 1 for US numbers (11 digits starting with 1)
    if (normalized.length === 11 && normalized.startsWith('1')) {
        normalized = normalized.substring(1);
    }

    return normalized;
}

function isDateBlank(dateStr) {
    return !dateStr || dateStr === '' || dateStr === '0000-00-00';
}

function stripCertificateCode(code) {
    const variations = [code];
    let current = code;

    while (current.length > 0 && /\d$/.test(current)) {
        current = current.slice(0, -1);
        if (current) variations.push(current);
    }

    return variations;
}

// =============================================================================
// RIMS_DATA ENDPOINTS
// =============================================================================

/**
 * POST /api/rims/phone-lookup
 * Look up customer by phone number (checks phn1 and phn2)
 */
app.post('/api/rims/phone-lookup', asyncHandler(async (req, res) => {
    const { phone_number } = req.body;

    if (!phone_number) {
        return res.status(400).json({
            error: 'Missing phone_number',
            message: 'Phone number is required'
        });
    }

    const normalized = normalizePhone(phone_number);

    // MOCK MODE
    if (USE_MOCK_DATA) {
        const customer = MOCK_RIMS_DATA.find(c =>
            normalizePhone(c.phn1) === normalized || normalizePhone(c.phn2) === normalized
        );

        if (!customer) {
            return res.json({
                found: false,
                message: 'Customer not found in RIMS database'
            });
        }

        return res.json({
            found: true,
            customer_data: customer
        });
    }

    // CASPIO MODE
    // Query: find record where phn1 or phn2 matches (Caspio uses SQL-like syntax)
    const whereClause = `phn1='${normalized}' OR phn2='${normalized}'`;

    const results = await queryCaspioTable(CASPIO_CONFIG.tables.rims_data, whereClause);

    if (results.length === 0) {
        return res.json({
            found: false,
            message: 'Customer not found in RIMS database'
        });
    }

    res.json({
        found: true,
        customer_data: results[0]
    });
}));

/**
 * POST /api/rims/certificate-lookup
 * Look up customer by certificate number (checks pkg_code2)
 */
app.post('/api/rims/certificate-lookup', asyncHandler(async (req, res) => {
    const { certificate_number } = req.body;

    if (!certificate_number) {
        return res.status(400).json({
            error: 'Missing certificate_number',
            message: 'Certificate number is required'
        });
    }

    // MOCK MODE
    if (USE_MOCK_DATA) {
        const customer = MOCK_RIMS_DATA.find(c =>
            c.pkg_code2.toUpperCase() === certificate_number.toUpperCase()
        );

        if (!customer) {
            return res.json({
                found: false,
                message: 'Certificate not found in RIMS database'
            });
        }

        return res.json({
            found: true,
            customer_data: customer
        });
    }

    // CASPIO MODE
    const whereClause = `pkg_code2='${certificate_number.toUpperCase()}'`;
    const results = await queryCaspioTable(CASPIO_CONFIG.tables.rims_data, whereClause);

    if (results.length === 0) {
        return res.json({
            found: false,
            message: 'Certificate not found in RIMS database'
        });
    }

    res.json({
        found: true,
        customer_data: results[0]
    });
}));

// =============================================================================
// KNOWLEDGE BASE ENDPOINTS
// =============================================================================

/**
 * GET /api/kb/package/:certificate_code
 * Get package deposit information (hardcoded - descriptions are in Retell KB)
 */
app.get('/api/kb/package/:certificate_code', asyncHandler(async (req, res) => {
    const { certificate_code } = req.params;

    // Try progressive stripping to find package
    const variations = stripCertificateCode(certificate_code);

    for (const variant of variations) {
        const pkg = MOCK_KNOWLEDGE_BASE[variant.toUpperCase()];
        if (pkg) {
            return res.json({
                found: true,
                certificate_code: variant,
                package_info: pkg
            });
        }
    }

    return res.status(404).json({
        found: false,
        message: `Package deposit information not found for certificate code: ${certificate_code}`,
        note: "Package descriptions are in Retell AI Knowledge Base"
    });
}));

// =============================================================================
// BUSINESS LOGIC ENDPOINTS
// =============================================================================

/**
 * POST /api/logic/deposits-check
 * Check deposit status and compare to expected amount
 */
app.post('/api/logic/deposits-check', asyncHandler(async (req, res) => {
    const { customer_data } = req.body;

    if (!customer_data) {
        return res.status(400).json({
            error: 'Missing customer_data'
        });
    }

    const val_dep = parseFloat(customer_data.val_dep) || 0;
    const conf_deposit = parseFloat(customer_data.conf_deposit) || 0;
    const total_paid = val_dep + conf_deposit;

    // Get expected deposit from KB
    const certificate_code = customer_data.pkg_code || customer_data.pkg_code2;

    // Get KB info from hardcoded knowledge base (works in both modes)
    let kb_info = null;
    const variations = stripCertificateCode(certificate_code);
    for (const variant of variations) {
        if (MOCK_KNOWLEDGE_BASE[variant.toUpperCase()]) {
            kb_info = MOCK_KNOWLEDGE_BASE[variant.toUpperCase()];
            break;
        }
    }

    const expected_deposit = kb_info ? kb_info.total_deposit : null;

    // Determine status
    let status, message, next_action;

    if (!expected_deposit) {
        // If KB info not found, return what we know
        return res.json({
            status: "unknown_package",
            message: "Package deposit amount not configured",
            deposits: {
                val_dep,
                conf_deposit,
                total_paid
            },
            note: "Add this package code to MOCK_KNOWLEDGE_BASE in the API"
        });
    }

    if (total_paid === 0) {
        status = "no_deposits";
        message = "No deposits received";
        next_action = kb_info.activation_method === "online"
            ? "direct_to_website"
            : "ask_if_mailed";
    } else if (total_paid >= expected_deposit) {
        status = "complete";
        message = "Deposits complete - ready to schedule travel";
        next_action = "transfer_extension_1";
    } else {
        status = "partial";
        const remaining = expected_deposit - total_paid;
        message = `Partial payment received. Remaining: $${remaining}`;
        next_action = "provide_payment_info";
    }

    res.json({
        status,
        message,
        next_action,
        deposits: {
            val_dep,
            conf_deposit,
            total_paid,
            expected_deposit,
            remaining: Math.max(0, expected_deposit - total_paid)
        },
        activation_method: kb_info.activation_method
    });
}));

/**
 * POST /api/logic/travel-rep-check
 * Check if Travel Rep needs to be assigned or contacted
 */
app.post('/api/logic/travel-rep-check', asyncHandler(async (req, res) => {
    const { customer_data } = req.body;

    if (!customer_data) {
        return res.status(400).json({
            error: 'Missing customer_data'
        });
    }

    const travel_date = customer_data.Asgn_trv_DT;
    const confirm_status = customer_data.confirm_status;
    const tm = customer_data.tm;
    const date_print_enc = customer_data.date_print_enc;

    if (isDateBlank(travel_date)) {
        return res.json({
            status: "no_date",
            message: "No travel date assigned yet",
            action: "none"
        });
    }

    const travelDate = new Date(travel_date);
    const today = new Date();
    const days_remaining = daysBetween(today, travelDate);

    if (days_remaining < 0) {
        return res.json({
            status: "past_date",
            message: "Travel date has passed",
            days_remaining,
            action: "none"
        });
    }

    if (confirm_status !== "confirm") {
        return res.json({
            status: "not_confirmed",
            message: "Trip not confirmed yet",
            action: "none"
        });
    }

    // TR not assigned
    if (!tm || tm === '') {
        if (days_remaining < 45) {
            return res.json({
                status: "needs_tr_urgent",
                message: `Travel date in ${days_remaining} days - Travel Rep assignment urgent`,
                days_remaining,
                action: "create_memo",
                memo_type: "needs tr assignment",
                memo_details: `Travel date: ${travel_date}, Days remaining: ${days_remaining}`
            });
        } else if (days_remaining >= 45 && days_remaining <= 75) {
            return res.json({
                status: "normal_window",
                message: `Travel date in ${days_remaining} days - normal TR assignment window`,
                days_remaining,
                action: "none"
            });
        } else {
            return res.json({
                status: "too_early",
                message: `Travel date in ${days_remaining} days - too early for TR assignment`,
                days_remaining,
                action: "none"
            });
        }
    }

    // TR assigned, check if docs sent
    if (isDateBlank(date_print_enc)) {
        return res.json({
            status: "tr_needs_to_call",
            message: `Travel Rep ${tm} assigned but hasn't sent documents`,
            travel_rep_name: tm,
            action: "create_memo",
            memo_type: "ask tr to call",
            memo_details: `Travel Rep: ${tm}, Customer: ${customer_data.phn1}`
        });
    }

    // All good - docs sent
    return res.json({
        status: "tr_complete",
        message: `Travel Rep ${tm} assigned and documents sent on ${date_print_enc}`,
        travel_rep_name: tm,
        docs_sent_date: date_print_enc,
        action: "contact_tr_directly"
    });
}));

/**
 * POST /api/logic/booking-check
 * Check if customer is booked and has itinerary
 */
app.post('/api/logic/booking-check', asyncHandler(async (req, res) => {
    const { customer_data } = req.body;

    if (!customer_data) {
        return res.status(400).json({
            error: 'Missing customer_data'
        });
    }

    const agency_book_via = customer_data.agency_book_via;
    const htl_bk_via = customer_data.htl_bk_via;

    const is_booked = (agency_book_via && agency_book_via !== '') ||
                     (htl_bk_via && htl_bk_via !== '');

    if (!is_booked) {
        return res.json({
            status: "not_booked",
            message: "Customer has not booked travel yet",
            action: "none"
        });
    }

    return res.json({
        status: "booked",
        message: "Customer is booked",
        booking_refs: {
            agency: agency_book_via || null,
            hotel: htl_bk_via || null
        },
        action: "ask_about_itinerary"
    });
}));

// =============================================================================
// MEMOS ENDPOINTS
// =============================================================================

/**
 * POST /api/memos/create
 * Create a new memo in RIMS_MEMOS
 */
app.post('/api/memos/create', asyncHandler(async (req, res) => {
    const { memo_type, details, vac_id, phone_number } = req.body;

    if (!memo_type || !vac_id) {
        return res.status(400).json({
            error: 'Missing required fields',
            required: ['memo_type', 'vac_id']
        });
    }

    const memo = {
        memo_type,
        details: details || '',
        vac_id,
        phone_number: phone_number || '',
        created_date: new Date().toISOString().split('T')[0],
        created_by: 'AI Agent'
    };

    // MOCK MODE
    if (USE_MOCK_DATA) {
        memo.id = Date.now();
        MOCK_MEMOS.push(memo);

        return res.json({
            success: true,
            message: 'Memo created successfully',
            memo_id: memo.id,
            memo
        });
    }

    // CASPIO MODE
    const result = await insertCaspioRecord(CASPIO_CONFIG.tables.rims_memos, memo);

    res.json({
        success: true,
        message: 'Memo created successfully',
        memo_id: result.id || Date.now(),
        memo: result
    });
}));

/**
 * GET /api/memos/:vac_id
 * Get all memos for a customer
 */
app.get('/api/memos/:vac_id', asyncHandler(async (req, res) => {
    const { vac_id } = req.params;

    // MOCK MODE
    if (USE_MOCK_DATA) {
        const memos = MOCK_MEMOS.filter(m => m.vac_id === vac_id);

        return res.json({
            vac_id,
            memo_count: memos.length,
            memos
        });
    }

    // CASPIO MODE
    const whereClause = `vac_id='${vac_id}'`;
    const memos = await queryCaspioTable(CASPIO_CONFIG.tables.rims_memos, whereClause);

    res.json({
        vac_id,
        memo_count: memos.length,
        memos
    });
}));

/**
 * POST /api/memos/from-retell-call
 * Create memo in Caspio from Retell AI call history
 *
 * Body parameters:
 * - call_id (required): Retell AI call ID
 * - memo_type (optional): Override default memo type
 * - include_transcript (optional): Include full transcript in details (default: true)
 */
app.post('/api/memos/from-retell-call', asyncHandler(async (req, res) => {
    const { call_id, memo_type, include_transcript = true } = req.body;

    if (!call_id) {
        return res.status(400).json({
            error: 'Missing call_id',
            message: 'Retell AI call_id is required'
        });
    }

    if (!RETELL_CONFIG.apiKey) {
        return res.status(500).json({
            error: 'Retell API not configured',
            message: 'RETELL_API_KEY environment variable not set'
        });
    }

    try {
        // STEP 1: Fetch call details from Retell AI
        console.log(`📞 Fetching call ${call_id} from Retell AI...`);
        const callData = await getRetellCall(call_id);

        // STEP 2: Extract vac_id and pkg_code2 from call data
        const customAnalysis = callData.custom_analysis_data || {};
        const collectedVars = callData.collected_dynamic_variables || {};
        const retellVars = callData.retell_llm_dynamic_variables || {};

        // Extract vac_id and pkg_code2 from the call data
        const vac_id = customAnalysis.vac_id || customAnalysis.VAC_ID ||
                       collectedVars.vac_id || collectedVars.VAC_ID ||
                       retellVars.vac_id || retellVars.VAC_ID;

        const pkg_code2 = customAnalysis.pkg_code2 || customAnalysis.certificate ||
                          collectedVars.pkg_code2 || collectedVars.certificate ||
                          retellVars.pkg_code2 || retellVars.certificate ||
                          customAnalysis.PKG_CODE2;

        console.log(`📋 Extracted from call data:`, {
            vac_id,
            pkg_code2,
            customAnalysis: Object.keys(customAnalysis),
            collectedVars: Object.keys(collectedVars),
            retellVars: Object.keys(retellVars)
        });

        // STEP 3: Verify required fields are present
        if (!vac_id || !pkg_code2) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'Cannot create memo: vac_id and pkg_code2 must be in call data',
                call_id: call_id,
                phone_number: callData.from_number,
                available_data: {
                    custom_analysis: Object.keys(customAnalysis),
                    collected_variables: Object.keys(collectedVars),
                    retell_variables: Object.keys(retellVars)
                },
                note: 'vac_id and pkg_code2 must be collected during the call'
            });
        }

        // STEP 4: Look up customer in RIMS_DATA using vac_id AND pkg_code2 to get RIMS_ID
        let customer = null;
        let rims_id = null;

        if (USE_MOCK_DATA) {
            customer = MOCK_RIMS_DATA.find(c => c.vac_id === vac_id && c.pkg_code2 === pkg_code2);
        } else {
            const whereClause = `vac_id='${vac_id}' AND pkg_code2='${pkg_code2}'`;
            console.log(`🔍 Looking up customer in RIMS_DATA: ${whereClause}`);
            const results = await queryCaspioTable(CASPIO_CONFIG.tables.rims_data, whereClause);
            customer = results.length > 0 ? results[0] : null;
        }

        if (!customer) {
            return res.status(400).json({
                success: false,
                error: 'Customer not found',
                message: `No customer found in RIMS_DATA with vac_id: ${vac_id} AND pkg_code2: ${pkg_code2}`,
                call_id: call_id,
                vac_id: vac_id,
                pkg_code2: pkg_code2
            });
        }

        // Get RIMS_ID from customer record
        rims_id = customer.rims_id || customer.RIMS_ID;

        if (!rims_id) {
            return res.status(400).json({
                success: false,
                error: 'RIMS_ID not found',
                message: 'Customer record does not have RIMS_ID field',
                call_id: call_id,
                vac_id: vac_id,
                pkg_code2: pkg_code2
            });
        }

        console.log(`✅ Found customer - RIMS_ID: ${rims_id}`);

        // STEP 4: Build memo details from call data
        const callAnalysis = callData.call_analysis || {};
        const transcript = callData.transcript || '';

        // Extract key information
        const callDuration = callData.duration_ms ? Math.round(callData.duration_ms / 1000) : 0;
        const callDate = callData.start_timestamp
            ? new Date(callData.start_timestamp).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

        const sentiment = callAnalysis.call_sentiment || 'Unknown';
        const callSummary = callAnalysis.call_summary || 'No summary available';
        const callSuccessful = callAnalysis.call_successful !== undefined
            ? callAnalysis.call_successful
            : null;

        // Build simple memo text (like existing format)
        let memoText = callSummary || 'AI CALL SUMMARY NOT AVAILABLE';

        // Clean up the text - remove special characters, keep only periods
        memoText = memoText.replace(/[^\w\s.]/g, '').toUpperCase();

        // Format datetime as MM/DD/YYYY HH:MM:SS
        const callDateTime = new Date(callData.start_timestamp);
        const month = String(callDateTime.getMonth() + 1).padStart(2, '0');
        const day = String(callDateTime.getDate()).padStart(2, '0');
        const year = callDateTime.getFullYear();
        const hours = String(callDateTime.getHours()).padStart(2, '0');
        const minutes = String(callDateTime.getMinutes()).padStart(2, '0');
        const seconds = String(callDateTime.getSeconds()).padStart(2, '0');
        const formattedDateTime = `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;

        // STEP 5: Create memo in Caspio with correct field names
        const memo = {
            rims_id: rims_id,
            rims_memos: memoText,
            tm: 'AI',
            dt: formattedDateTime
        };

        let memoId;
        if (USE_MOCK_DATA) {
            memo.id = Date.now();
            MOCK_MEMOS.push(memo);
            memoId = memo.id;
        } else {
            const result = await insertCaspioRecord(CASPIO_CONFIG.tables.rims_memos, memo);
            memoId = result.id || Date.now();
        }

        // STEP 6: Return success response
        res.json({
            success: true,
            message: 'Memo created successfully from Retell call',
            memo_id: memoId,
            call_id: call_id,
            memo: {
                rims_id: rims_id,
                pkg_code2: pkg_code2,
                memo_text: memoText,
                datetime: formattedDateTime
            }
        });

    } catch (error) {
        console.error('❌ Error creating memo from Retell call:', error);
        res.status(500).json({
            error: 'Failed to create memo',
            message: error.message,
            call_id: call_id
        });
    }
}));

/**
 * POST /api/memos/batch-from-retell
 * Create memos from multiple Retell AI calls
 *
 * Body parameters:
 * - agent_id (optional): Filter by agent ID
 * - start_timestamp (optional): Filter calls after this timestamp (ms)
 * - end_timestamp (optional): Filter calls before this timestamp (ms)
 * - limit (optional): Maximum number of calls to process (default: 50)
 * - filter_registered (optional): Only include calls with status 'registered' (default: false)
 */
app.post('/api/memos/batch-from-retell', asyncHandler(async (req, res) => {
    const {
        agent_id,
        start_timestamp,
        end_timestamp,
        limit = 50,
        filter_registered = false
    } = req.body;

    if (!RETELL_CONFIG.apiKey) {
        return res.status(500).json({
            error: 'Retell API not configured',
            message: 'RETELL_API_KEY environment variable not set'
        });
    }

    try {
        // Build filter for Retell API
        const filters = {
            limit: Math.min(limit, 100), // Cap at 100 for safety
            sort_order: 'descending'
        };

        if (agent_id) filters.agent_id = agent_id;
        if (start_timestamp) filters.start_timestamp = start_timestamp;
        if (end_timestamp) filters.end_timestamp = end_timestamp;
        if (filter_registered) filters.filter_criteria = { call_status: ['registered'] };

        // Fetch calls from Retell AI
        console.log(`📞 Fetching calls from Retell AI with filters:`, filters);
        const callsResponse = await listRetellCalls(filters);
        const calls = callsResponse.calls || [];

        console.log(`📊 Found ${calls.length} calls to process`);

        // Process each call and create memos
        const results = {
            total_calls: calls.length,
            memos_created: 0,
            memos_failed: 0,
            results: []
        };

        for (const call of calls) {
            try {
                // Get full call details
                const callData = await getRetellCall(call.call_id);

                // Extract vac_id and pkg_code2 from the call data
                const customAnalysis = callData.custom_analysis_data || {};
                const collectedVars = callData.collected_dynamic_variables || {};
                const retellVars = callData.retell_llm_dynamic_variables || {};

                // Extract vac_id and pkg_code2 from the call data
                const vac_id = customAnalysis.vac_id || customAnalysis.VAC_ID ||
                               collectedVars.vac_id || collectedVars.VAC_ID ||
                               retellVars.vac_id || retellVars.VAC_ID;

                const pkg_code2 = customAnalysis.pkg_code2 || customAnalysis.certificate ||
                                  collectedVars.pkg_code2 || collectedVars.certificate ||
                                  retellVars.pkg_code2 || retellVars.certificate ||
                                  customAnalysis.PKG_CODE2;

                // SKIP if missing required fields from call data
                if (!vac_id || !pkg_code2) {
                    console.log(`⚠ Skipping call ${call.call_id} - Missing vac_id or pkg_code2 in call data`);
                    results.results.push({
                        call_id: call.call_id,
                        status: 'skipped',
                        reason: 'Missing required fields (vac_id, pkg_code2) in call data',
                        phone: callData.from_number,
                        available_data: {
                            custom_analysis: Object.keys(customAnalysis),
                            collected_variables: Object.keys(collectedVars)
                        }
                    });
                    continue;
                }

                // Look up customer in RIMS_DATA using vac_id AND pkg_code2 to get RIMS_ID
                let customer = null;
                let rims_id = null;

                if (USE_MOCK_DATA) {
                    customer = MOCK_RIMS_DATA.find(c => c.vac_id === vac_id && c.pkg_code2 === pkg_code2);
                } else {
                    const whereClause = `vac_id='${vac_id}' AND pkg_code2='${pkg_code2}'`;
                    const dbResults = await queryCaspioTable(CASPIO_CONFIG.tables.rims_data, whereClause);
                    customer = dbResults.length > 0 ? dbResults[0] : null;
                }

                if (!customer) {
                    console.log(`⚠ Skipping call ${call.call_id} - Customer not found with vac_id: ${vac_id} AND pkg_code2: ${pkg_code2}`);
                    results.results.push({
                        call_id: call.call_id,
                        status: 'skipped',
                        reason: 'Customer not found in RIMS_DATA',
                        vac_id: vac_id,
                        pkg_code2: pkg_code2
                    });
                    continue;
                }

                // Get RIMS_ID from customer record
                rims_id = customer.rims_id || customer.RIMS_ID;

                if (!rims_id) {
                    console.log(`⚠ Skipping call ${call.call_id} - Customer record missing RIMS_ID`);
                    results.results.push({
                        call_id: call.call_id,
                        status: 'skipped',
                        reason: 'Customer record does not have RIMS_ID field',
                        vac_id: vac_id,
                        pkg_code2: pkg_code2
                    });
                    continue;
                }

                // Build simple memo text (like existing format)
                const callAnalysis = callData.call_analysis || {};
                const callSummary = callAnalysis.call_summary || 'AI CALL SUMMARY NOT AVAILABLE';

                // Clean up the text - remove special characters, keep only periods
                let memoText = callSummary.replace(/[^\w\s.]/g, '').toUpperCase();

                // Format datetime as MM/DD/YYYY HH:MM:SS
                const callDateTime = new Date(callData.start_timestamp);
                const month = String(callDateTime.getMonth() + 1).padStart(2, '0');
                const day = String(callDateTime.getDate()).padStart(2, '0');
                const year = callDateTime.getFullYear();
                const hours = String(callDateTime.getHours()).padStart(2, '0');
                const minutes = String(callDateTime.getMinutes()).padStart(2, '0');
                const seconds = String(callDateTime.getSeconds()).padStart(2, '0');
                const formattedDateTime = `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;

                const memo = {
                    rims_id: rims_id,
                    rims_memos: memoText,
                    tm: 'AI',
                    dt: formattedDateTime
                };

                // Insert memo
                if (USE_MOCK_DATA) {
                    memo.id = Date.now() + results.memos_created;
                    MOCK_MEMOS.push(memo);
                } else {
                    await insertCaspioRecord(CASPIO_CONFIG.tables.rims_memos, memo);
                }

                results.memos_created++;
                results.results.push({
                    call_id: call.call_id,
                    status: 'success',
                    rims_id: rims_id,
                    pkg_code2: pkg_code2
                });

            } catch (error) {
                console.error(`❌ Failed to process call ${call.call_id}:`, error.message);
                results.memos_failed++;
                results.results.push({
                    call_id: call.call_id,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `Processed ${results.total_calls} calls`,
            summary: {
                total_calls: results.total_calls,
                memos_created: results.memos_created,
                memos_failed: results.memos_failed
            },
            results: results.results
        });

    } catch (error) {
        console.error('❌ Error in batch memo creation:', error);
        res.status(500).json({
            error: 'Batch processing failed',
            message: error.message
        });
    }
}));

// =============================================================================
// RETELL AI COMPATIBILITY ENDPOINTS
// =============================================================================

/**
 * GET /api/customer/lookup
 * Retell AI compatible customer lookup endpoint
 * Wraps the existing POST /api/rims/phone-lookup endpoint
 */
app.get('/api/customer/lookup', asyncHandler(async (req, res) => {
    const { phone, email, certificate } = req.query;

    // Use phone lookup if phone is provided
    if (phone) {
        // Call existing phone lookup logic
        const cleanPhone = phone.replace(/\D/g, '').replace(/^1/, ''); // Remove +1 and non-digits

        if (USE_MOCK_DATA) {
            const customer = MOCK_RIMS_DATA.find(c =>
                c.phn1 === cleanPhone || c.phn2 === cleanPhone
            );

            if (!customer) {
                return res.json({
                    found: false,
                    message: 'Customer not found'
                });
            }

            return res.json({
                found: true,
                customer: {
                    customer_id: customer.vac_id,
                    phone: '+1' + customer.phn1,
                    email: customer.email,
                    first_name: customer.first_name,
                    last_name: customer.last_name,
                    full_name: `${customer.first_name} ${customer.last_name}`,
                    certificates: [{
                        certificate_number: customer.pkg_code2,
                        package_type: customer.pkg_code,
                        deposit_paid: customer.conf_deposit >= customer.val_dep,
                        deposit_amount: customer.conf_deposit,
                        travel_dates_scheduled: !!customer.Asgn_trv_DT,
                        travel_start_date: customer.Asgn_trv_DT
                    }]
                }
            });
        }

        // Production mode - query Caspio
        const response = await queryCaspioTable(CASPIO_CONFIG.tables.rims_data, `phn1='${cleanPhone}' OR phn2='${cleanPhone}'`);

        if (!response || response.length === 0) {
            return res.json({
                found: false,
                message: 'Customer not found'
            });
        }

        const customer = response[0];
        const firstName = customer.first_name || '';
        const lastName = customer.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Customer';

        return res.json({
            found: true,
            customer: {
                customer_id: customer.vac_id,
                phone: '+1' + customer.phn1,
                email: customer.email || '',
                first_name: firstName,
                last_name: lastName,
                full_name: fullName,
                certificates: [{
                    certificate_number: customer.pkg_code2 || customer.pkg_code,
                    package_type: customer.pkg_code || 'Unknown',
                    deposit_paid: (customer.conf_deposit || 0) >= (customer.val_dep || 0),
                    deposit_amount: customer.conf_deposit || 0,
                    travel_dates_scheduled: !!customer.Asgn_trv_DT,
                    travel_start_date: customer.Asgn_trv_DT || null
                }]
            }
        });
    }

    // Certificate lookup
    if (certificate) {
        if (USE_MOCK_DATA) {
            const customer = MOCK_RIMS_DATA.find(c =>
                c.pkg_code2 === certificate.toUpperCase() || c.vac_id === certificate
            );

            if (!customer) {
                return res.json({
                    found: false,
                    message: 'Certificate not found'
                });
            }

            return res.json({
                found: true,
                customer: {
                    customer_id: customer.vac_id,
                    phone: '+1' + customer.phn1,
                    email: customer.email,
                    first_name: customer.first_name,
                    last_name: customer.last_name,
                    full_name: `${customer.first_name} ${customer.last_name}`,
                    certificates: [{
                        certificate_number: customer.pkg_code2,
                        package_type: customer.pkg_code,
                        deposit_paid: customer.conf_deposit >= customer.val_dep,
                        deposit_amount: customer.conf_deposit,
                        travel_dates_scheduled: !!customer.Asgn_trv_DT,
                        travel_start_date: customer.Asgn_trv_DT
                    }]
                }
            });
        }

        // Production - query by certificate (handle both pkg_code2 and numeric vac_id)
        const isNumeric = /^\d+$/.test(certificate);
        const whereClause = isNumeric
            ? `vac_id=${certificate} OR pkg_code2='${certificate}'`
            : `pkg_code2='${certificate.toUpperCase()}'`;
        const response = await queryCaspioTable(CASPIO_CONFIG.tables.rims_data, whereClause);

        if (!response || response.length === 0) {
            return res.json({
                found: false,
                message: 'Certificate not found'
            });
        }

        const customer = response[0];
        const firstName = customer.first_name || '';
        const lastName = customer.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Customer';

        return res.json({
            found: true,
            customer: {
                customer_id: customer.vac_id,
                phone: '+1' + customer.phn1,
                email: customer.email || '',
                first_name: firstName,
                last_name: lastName,
                full_name: fullName,
                certificates: [{
                    certificate_number: customer.pkg_code2 || customer.pkg_code,
                    package_type: customer.pkg_code || 'Unknown',
                    deposit_paid: (customer.conf_deposit || 0) >= (customer.val_dep || 0),
                    deposit_amount: customer.conf_deposit || 0,
                    travel_dates_scheduled: !!customer.Asgn_trv_DT,
                    travel_start_date: customer.Asgn_trv_DT || null
                }]
            }
        });
    }

    return res.status(400).json({
        error: 'Missing required parameter',
        message: 'Provide at least one of: phone, email, or certificate'
    });
}));

/**
 * GET /api/certificate/:certificate_number
 * Retell AI compatible certificate details endpoint
 */
app.get('/api/certificate/:certificate_number', asyncHandler(async (req, res) => {
    const { certificate_number } = req.params;

    if (USE_MOCK_DATA) {
        const customer = MOCK_RIMS_DATA.find(c =>
            c.pkg_code2 === certificate_number.toUpperCase() || c.vac_id === certificate_number
        );

        if (!customer) {
            return res.json({
                found: false,
                message: 'Certificate not found'
            });
        }

        const packageInfo = MOCK_KNOWLEDGE_BASE[customer.pkg_code] || { total_deposit: 500 };

        return res.json({
            found: true,
            certificate: {
                certificate_number: customer.pkg_code2,
                package_type: customer.pkg_code,
                destination: customer.pkg_code,
                customer: {
                    phone: '+1' + customer.phn1,
                    email: customer.email,
                    first_name: customer.first_name,
                    last_name: customer.last_name
                },
                deposit: {
                    required: packageInfo.total_deposit,
                    paid: customer.conf_deposit >= customer.val_dep,
                    amount: customer.conf_deposit,
                    date: null
                },
                status: customer.confirm_status === 'confirm' ? 'active' : 'pending',
                dates: {
                    scheduled: !!customer.Asgn_trv_DT,
                    start: customer.Asgn_trv_DT,
                    end: null,
                    expiration: null
                },
                travel_rep: customer.tm || null,
                booking: customer.agency_book_via || customer.htl_bk_via ? {
                    flight: customer.agency_book_via,
                    hotel: customer.htl_bk_via
                } : null
            }
        });
    }

    // Production mode - handle both pkg_code2 (2-6 letters) and vac_id (6 digit number)
    const isNumeric = /^\d+$/.test(certificate_number);
    const whereClause = isNumeric
        ? `vac_id=${certificate_number} OR pkg_code2='${certificate_number}'`
        : `pkg_code2='${certificate_number.toUpperCase()}'`;
    const response = await queryCaspioTable(CASPIO_CONFIG.tables.rims_data, whereClause);

    if (!response || response.length === 0) {
        return res.json({
            found: false,
            message: 'Certificate not found'
        });
    }

    const customer = response[0];
    const packageInfo = MOCK_KNOWLEDGE_BASE[customer.pkg_code] || { total_deposit: 500 };

    res.json({
        found: true,
        certificate: {
            certificate_number: customer.pkg_code2 || customer.pkg_code,
            package_type: customer.pkg_code || 'Unknown',
            destination: customer.pkg_code || 'Unknown',
            customer: {
                phone: '+1' + customer.phn1,
                email: customer.email || '',
                first_name: customer.first_name || '',
                last_name: customer.last_name || ''
            },
            deposit: {
                required: packageInfo.total_deposit || 0,
                paid: (customer.conf_deposit || 0) >= (customer.val_dep || 0),
                amount: customer.conf_deposit || 0,
                date: null
            },
            status: customer.confirm_status === 'confirm' ? 'active' : 'pending',
            dates: {
                scheduled: !!customer.Asgn_trv_DT,
                start: customer.Asgn_trv_DT || null,
                end: null,
                expiration: null
            },
            travel_rep: customer.tm || null,
            booking: customer.agency_book_via || customer.htl_bk_via ? {
                flight: customer.agency_book_via || null,
                hotel: customer.htl_bk_via || null
            } : null
        }
    });
}));

/**
 * GET /api/refunds/:certificate_number
 * Retell AI compatible refund status endpoint
 * Note: RIMS doesn't track refunds, so this returns "no refund"
 */
app.get('/api/refunds/:certificate_number', asyncHandler(async (req, res) => {
    res.json({
        has_refund: false,
        message: 'No refund request found for this certificate'
    });
}));

/**
 * GET /api/calendar/availability/:destination
 * Retell AI compatible calendar availability endpoint
 * Note: This is a mock response - actual calendar would need Google Sheets integration
 */
app.get('/api/calendar/availability/:destination', asyncHandler(async (req, res) => {
    const { destination } = req.params;
    const { month, year } = req.query;

    // Generate mock available dates for next 90 days
    const availableDates = [];
    const today = new Date();

    for (let i = 0; i < 90; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);

        // Filter by month/year if provided
        if (month && checkDate.getMonth() + 1 !== parseInt(month)) continue;
        if (year && checkDate.getFullYear() !== parseInt(year)) continue;

        availableDates.push({
            date: checkDate.toISOString().split('T')[0],
            day_of_week: checkDate.toLocaleDateString('en-US', { weekday: 'long' }),
            available_slots: 10
        });
    }

    res.json({
        destination,
        total_available_dates: availableDates.length,
        dates: availableDates.slice(0, 30), // Return first 30 days
        message: `Found ${availableDates.length} available dates for ${destination}`
    });
}));

/**
 * POST /api/calendar/book
 * Retell AI compatible booking endpoint
 * Note: This is a mock response - actual booking would update RIMS_DATA
 */
app.post('/api/calendar/book', asyncHandler(async (req, res) => {
    const { certificate_number, destination, start_date, end_date, hotel_name } = req.body;

    if (!certificate_number || !destination || !start_date || !end_date) {
        return res.status(400).json({
            error: 'Missing required fields',
            required: ['certificate_number', 'destination', 'start_date', 'end_date']
        });
    }

    // Verify certificate exists
    if (USE_MOCK_DATA) {
        const customer = MOCK_RIMS_DATA.find(c =>
            c.pkg_code2 === certificate_number.toUpperCase() || c.vac_id === certificate_number
        );

        if (!customer) {
            return res.status(404).json({
                error: 'Certificate not found'
            });
        }

        // Check deposit paid
        if (customer.conf_deposit < customer.val_dep) {
            return res.status(400).json({
                error: 'Deposit not paid',
                message: 'Deposit must be paid before booking travel dates'
            });
        }
    } else {
        // Production - check Caspio (handle both pkg_code2 and vac_id)
        const isNumeric = /^\d+$/.test(certificate_number);
        const whereClause = isNumeric
            ? `vac_id=${certificate_number} OR pkg_code2='${certificate_number}'`
            : `pkg_code2='${certificate_number.toUpperCase()}'`;
        const response = await queryCaspioTable(CASPIO_CONFIG.tables.rims_data, whereClause);

        if (!response || response.length === 0) {
            return res.status(404).json({
                error: 'Certificate not found'
            });
        }

        const customer = response[0];
        if ((customer.conf_deposit || 0) < (customer.val_dep || 0)) {
            return res.status(400).json({
                error: 'Deposit not paid',
                message: 'Deposit must be paid before booking travel dates'
            });
        }

        // TODO: Update RIMS_DATA with booking info
        // This would require a Caspio UPDATE operation
    }

    // Generate confirmation number
    const confirmationNumber = `CB${Date.now()}${Math.floor(Math.random() * 1000)}`;

    res.json({
        success: true,
        message: 'Travel dates booked successfully',
        booking: {
            confirmation_number: confirmationNumber,
            destination: destination,
            start_date: start_date,
            end_date: end_date,
            hotel_name: hotel_name || null,
            status: 'confirmed'
        }
    });
}));

// =============================================================================
// COMPREHENSIVE CUSTOMER STATUS ENDPOINT
// =============================================================================

/**
 * GET /api/customer/status
 * Comprehensive customer status from caller ID - ONE CALL, ALL STATUS INFO
 *
 * Returns:
 * - Customer basic info
 * - Deposit status (complete/partial/none)
 * - Travel rep status
 * - Booking status
 * - Next recommended action
 */
app.get('/api/customer/status', asyncHandler(async (req, res) => {
    const { phone } = req.query;

    if (!phone) {
        return res.status(400).json({
            error: 'Missing phone parameter',
            message: 'Phone number is required'
        });
    }

    const normalized = normalizePhone(phone);

    // STEP 1: Look up customer
    let customer = null;

    if (USE_MOCK_DATA) {
        customer = MOCK_RIMS_DATA.find(c =>
            normalizePhone(c.phn1) === normalized || normalizePhone(c.phn2) === normalized
        );
    } else {
        const whereClause = `phn1='${normalized}' OR phn2='${normalized}'`;
        const results = await queryCaspioTable(CASPIO_CONFIG.tables.rims_data, whereClause);
        customer = results.length > 0 ? results[0] : null;
    }

    // Customer not found
    if (!customer) {
        return res.json({
            found: false,
            message: 'Customer not found in RIMS database',
            status: {
                overall: 'unknown',
                category: 'new_caller'
            }
        });
    }

    // STEP 2: Check deposits
    const val_dep = parseFloat(customer.val_dep) || 0;
    const conf_deposit = parseFloat(customer.conf_deposit) || 0;
    const total_paid = val_dep + conf_deposit;

    const certificate_code = customer.pkg_code || customer.pkg_code2;
    const variations = stripCertificateCode(certificate_code);
    let kb_info = null;
    for (const variant of variations) {
        if (MOCK_KNOWLEDGE_BASE[variant.toUpperCase()]) {
            kb_info = MOCK_KNOWLEDGE_BASE[variant.toUpperCase()];
            break;
        }
    }

    const expected_deposit = kb_info ? kb_info.total_deposit : 500;

    let deposit_status;
    if (total_paid >= expected_deposit) {
        deposit_status = 'complete';
    } else if (total_paid > 0) {
        deposit_status = 'partial';
    } else {
        deposit_status = 'none';
    }

    // STEP 3: Check travel rep
    const travel_date = customer.Asgn_trv_DT;
    const confirm_status = customer.confirm_status;
    const tm = customer.tm;
    const date_print_enc = customer.date_print_enc;

    let tr_status = 'not_needed';
    let days_remaining = null;

    if (travel_date && travel_date !== '' && travel_date !== '0000-00-00') {
        const travelDate = new Date(travel_date);
        const today = new Date();
        days_remaining = daysBetween(today, travelDate);

        if (days_remaining >= 0 && confirm_status === 'confirm') {
            if (!tm || tm === '') {
                if (days_remaining < 45) {
                    tr_status = 'needs_urgent';
                } else if (days_remaining >= 45 && days_remaining <= 75) {
                    tr_status = 'normal_window';
                } else {
                    tr_status = 'too_early';
                }
            } else {
                if (!date_print_enc || date_print_enc === '' || date_print_enc === '0000-00-00') {
                    tr_status = 'assigned_no_docs';
                } else {
                    tr_status = 'complete';
                }
            }
        }
    }

    // STEP 4: Check booking
    const agency_book_via = customer.agency_book_via;
    const htl_bk_via = customer.htl_bk_via;
    const is_booked = (agency_book_via && agency_book_via !== '') || (htl_bk_via && htl_bk_via !== '');

    // STEP 5: Determine overall status and recommended action
    let overall_status;
    let recommended_action;
    let agent_message;

    if (deposit_status === 'complete') {
        if (is_booked) {
            overall_status = 'ready_to_travel';
            recommended_action = 'verify_itinerary';
            agent_message = `Great news! Your deposits are complete and you're booked. Your travel rep is ${tm || 'being assigned'}. Do you need your itinerary resent?`;
        } else if (travel_date && days_remaining !== null && days_remaining >= 0) {
            overall_status = 'ready_to_schedule';
            recommended_action = 'transfer_to_scheduling';
            agent_message = `Your deposits are complete! You're all set to schedule your travel dates. Would you like me to transfer you to our scheduling team?`;
        } else {
            overall_status = 'deposits_complete';
            recommended_action = 'offer_scheduling';
            agent_message = `Your deposits are complete! You can now schedule your travel dates. When would you like to travel?`;
        }
    } else if (deposit_status === 'partial') {
        const remaining = expected_deposit - total_paid;
        overall_status = 'deposits_incomplete';
        recommended_action = 'collect_payment';
        agent_message = `I see you've paid $${total_paid} toward your $${expected_deposit} deposit. You have $${remaining} remaining. Would you like to complete your payment today?`;
    } else {
        overall_status = 'deposits_pending';
        recommended_action = 'collect_payment';
        const activation_method = kb_info ? kb_info.activation_method : 'online';
        if (activation_method === 'online') {
            agent_message = `Your deposits haven't been received yet. You can activate your certificate online at our website. Would you like me to send you the link?`;
        } else {
            agent_message = `Your deposits haven't been received yet. Have you mailed in your activation form? The total deposit needed is $${expected_deposit}.`;
        }
    }

    // STEP 6: Build comprehensive response
    res.json({
        found: true,
        status: {
            overall: overall_status,
            category: deposit_status === 'complete' ? 'active_customer' : 'pending_customer',
            recommended_action: recommended_action,
            agent_message: agent_message
        },
        customer: {
            customer_id: customer.vac_id,
            phone: '+1' + (customer.phn1 || normalized),
            email: customer.email || '',
            first_name: customer.first_name || '',
            last_name: customer.last_name || '',
            full_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer'
        },
        certificate: {
            certificate_number: customer.pkg_code2 || customer.pkg_code,
            package_type: customer.pkg_code || 'Unknown',
            confirmation_status: customer.confirm_status || 'pending'
        },
        deposits: {
            status: deposit_status,
            val_dep: val_dep,
            conf_deposit: conf_deposit,
            total_paid: total_paid,
            expected_deposit: expected_deposit,
            remaining: Math.max(0, expected_deposit - total_paid),
            activation_method: kb_info ? kb_info.activation_method : 'online'
        },
        travel_rep: {
            status: tr_status,
            name: tm || null,
            documents_sent: !isDateBlank(date_print_enc),
            docs_date: date_print_enc || null
        },
        travel_dates: {
            scheduled: !isDateBlank(travel_date),
            start_date: travel_date || null,
            days_until_travel: days_remaining
        },
        booking: {
            is_booked: is_booked,
            flight_booking: agency_book_via || null,
            hotel_booking: htl_bk_via || null
        }
    });
}));

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/health', async (req, res) => {
    try {
        if (USE_MOCK_DATA) {
            return res.json({
                status: 'healthy',
                mode: 'mock',
                database: 'mock_rims_data',
                mock_customers: MOCK_RIMS_DATA.length,
                mock_packages: Object.keys(MOCK_KNOWLEDGE_BASE).length,
                timestamp: new Date().toISOString()
            });
        }

        // Test Caspio connection
        await getCaspioToken();

        res.json({
            status: 'healthy',
            mode: 'production',
            database: 'caspio',
            account: CASPIO_CONFIG.accountId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message
        });
    }
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

app.use((err, req, res, next) => {
    console.error('Error:', err);

    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
    });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
    console.log(`\n🚀 Casablanca Express - RIMS API Server (Caspio)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📍 Running on: http://localhost:${PORT}`);
    console.log(`📊 Mode: ${USE_MOCK_DATA ? 'MOCK DATA (Testing)' : 'PRODUCTION (Caspio Database)'}`);

    if (!USE_MOCK_DATA) {
        console.log(`🗄️  Caspio Account: ${CASPIO_CONFIG.accountId}`);
        console.log(`📋 Tables: ${Object.values(CASPIO_CONFIG.tables).join(', ')}`);
    }

    console.log(`\n📚 RIMS API Endpoints:`);
    console.log(`   GET  /health`);
    console.log(`   GET  /api/customer/status ⭐ Complete status from caller ID!`);
    console.log(`   POST /api/rims/phone-lookup`);
    console.log(`   POST /api/rims/certificate-lookup`);
    console.log(`   GET  /api/kb/package/:certificate_code`);
    console.log(`   POST /api/logic/deposits-check`);
    console.log(`   POST /api/logic/travel-rep-check`);
    console.log(`   POST /api/logic/booking-check`);
    console.log(`   POST /api/memos/create`);
    console.log(`   GET  /api/memos/:vac_id`);
    console.log(`   POST /api/memos/from-retell-call ⭐ NEW - Create memo from Retell call!`);
    console.log(`   POST /api/memos/batch-from-retell ⭐ NEW - Batch import Retell calls!`);

    if (USE_MOCK_DATA) {
        console.log(`\n🧪 Mock RIMS Test Data:`);
        console.log(`   Customers: ${MOCK_RIMS_DATA.length}`);
        MOCK_RIMS_DATA.forEach(c => {
            console.log(`   - ${c.first_name} ${c.last_name}: phn1=${c.phn1}, cert=${c.pkg_code2}, vac_id=${c.vac_id}`);
        });
        console.log(`   Knowledge Base: ${Object.keys(MOCK_KNOWLEDGE_BASE).length} package codes`);
    }
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    process.exit(0);
});

module.exports = app;
