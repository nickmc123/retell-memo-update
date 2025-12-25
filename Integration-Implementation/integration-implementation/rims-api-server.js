/**
 * Casablanca Express - RIMS Database API
 * For Retell AI Agent Integration
 *
 * Implements RIMS_DATA field structure with:
 * - Customer lookup (phn1, phn2, pkg_code, pkg_code2, vac_id)
 * - Travel Rep logic (45-75 day window)
 * - Memo creation system
 * - Certificate activation flows
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

// =============================================================================
// MOCK DATA - RIMS_DATA Structure
// =============================================================================

const MOCK_RIMS_DATA = [
    {
        // Customer: Sarah Johnson - Complete profile, deposit paid, TR assigned
        phn1: "8182121359",
        phn2: "3105551234",
        pkg_code: "BEACH",
        pkg_code2: "BEACH123",
        vac_id: "123456",
        last_name: "Johnson",
        first_name: "Sarah",
        email: "sarah.johnson@email.com",

        // Deposits
        val_dep: 250.00,
        conf_deposit: 500.00,

        // Travel dates and status
        Asgn_trv_DT: "2025-06-15",
        confirm_status: "confirm",

        // Travel Rep
        tm: "John Smith",
        date_print_enc: "2025-05-01",

        // Booking
        agency_book_via: "FLIGHT123",
        htl_bk_via: "HOTEL456"
    },
    {
        // Customer: Mike Chen - Deposits complete, needs TR assignment (< 45 days)
        phn1: "3105559876",
        phn2: "",
        pkg_code: "E",
        pkg_code2: "E789",
        vac_id: "234567",
        last_name: "Chen",
        first_name: "Mike",
        email: "mike.chen@email.com",

        // Deposits - COMPLETE
        val_dep: 250.00,
        conf_deposit: 250.00,

        // Travel dates - 41 days away, needs TR!
        Asgn_trv_DT: "2025-01-26",
        confirm_status: "confirm",

        // Travel Rep - NOT assigned
        tm: "",
        date_print_enc: "",

        // Booking - not yet
        agency_book_via: "",
        htl_bk_via: ""
    },
    {
        // Customer: Lisa Martinez - No deposits, new customer
        phn1: "4155551212",
        phn2: "",
        pkg_code: "SKI",
        pkg_code2: "SKI555",
        vac_id: "345678",
        last_name: "Martinez",
        first_name: "Lisa",
        email: "lisa.martinez@email.com",

        // Deposits - NONE
        val_dep: 0,
        conf_deposit: 0,

        // Travel dates
        Asgn_trv_DT: "2025-08-15",
        confirm_status: "confirm",

        // Travel Rep
        tm: "",
        date_print_enc: "",

        // Booking
        agency_book_via: "",
        htl_bk_via: ""
    }
];

// Knowledge Base - Certificate package information
const MOCK_KNOWLEDGE_BASE = {
    "BEACH": { total_deposit: 750, activation_method: "online", destination_options: "Caribbean, Mexico", package_features: "Beach resort, 5 nights" },
    "BEACH1": { total_deposit: 750, activation_method: "online", destination_options: "Caribbean, Mexico", package_features: "Beach resort, 5 nights" },
    "BEACH12": { total_deposit: 750, activation_method: "online", destination_options: "Caribbean, Mexico", package_features: "Beach resort, 5 nights" },
    "BEACH123": { total_deposit: 750, activation_method: "online", destination_options: "Caribbean, Mexico", package_features: "Beach resort, 5 nights" },
    "E": { total_deposit: 500, activation_method: "online", destination_options: "Hawaii, Caribbean, Mexico", package_features: "All-inclusive, 7 nights" },
    "E7": { total_deposit: 500, activation_method: "online", destination_options: "Hawaii, Caribbean, Mexico", package_features: "All-inclusive, 7 nights" },
    "E78": { total_deposit: 500, activation_method: "online", destination_options: "Hawaii, Caribbean, Mexico", package_features: "All-inclusive, 7 nights" },
    "E789": { total_deposit: 500, activation_method: "online", destination_options: "Hawaii, Caribbean, Mexico", package_features: "All-inclusive, 7 nights" },
    "SKI": { total_deposit: 800, activation_method: "mail", destination_options: "Colorado, Utah", package_features: "Ski resort, 4 nights" },
    "SKI5": { total_deposit: 800, activation_method: "mail", destination_options: "Colorado, Utah", package_features: "Ski resort, 4 nights" },
    "SKI55": { total_deposit: 800, activation_method: "mail", destination_options: "Colorado, Utah", package_features: "Ski resort, 4 nights" },
    "SKI555": { total_deposit: 800, activation_method: "mail", destination_options: "Colorado, Utah", package_features: "Ski resort, 4 nights" }
};

// Memos storage (in-memory for mock mode)
const MOCK_MEMOS = [];

// Database connection (skip if using mock data)
const pool = USE_MOCK_DATA ? null : new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Import Google Chat live monitoring router
const googleChatMonitor = require('./google-chat-live-monitor');

// Middleware
app.use(cors());
app.use(express.json());

// Mount Google Chat monitoring router
app.use('/', googleChatMonitor);

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
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate days between two dates
 */
function daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date2 - date1) / oneDay);
}

/**
 * Normalize phone number to digits only
 */
function normalizePhone(phone) {
    return phone.replace(/\D/g, '');
}

/**
 * Check if date field is blank/null/invalid
 */
function isDateBlank(dateStr) {
    return !dateStr || dateStr === '' || dateStr === '0000-00-00';
}

/**
 * Strip numbers from certificate code for KB lookup
 */
function stripCertificateCode(code) {
    // Try original first, then progressively strip trailing digits
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
 *
 * Request body:
 *   { "phone_number": "8182121359" }
 *
 * Response:
 *   { "found": true, "customer_data": {...all RIMS_DATA fields...} }
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

    // DATABASE MODE
    const query = `
        SELECT * FROM account_holder
        WHERE REGEXP_REPLACE(phn1, '[^0-9]', '', 'g') = $1
           OR REGEXP_REPLACE(phn2, '[^0-9]', '', 'g') = $1
        LIMIT 1
    `;

    const result = await pool.query(query, [normalized]);

    if (result.rows.length === 0) {
        return res.json({
            found: false,
            message: 'Customer not found in RIMS database'
        });
    }

    res.json({
        found: true,
        customer_data: result.rows[0]
    });
}));

/**
 * POST /api/rims/certificate-lookup
 * Look up customer by certificate number (checks pkg_code2)
 *
 * Request body:
 *   { "certificate_number": "BEACH123" }
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

    // DATABASE MODE
    const query = `
        SELECT * FROM account_holder
        WHERE UPPER(pkg_code2) = UPPER($1)
        LIMIT 1
    `;

    const result = await pool.query(query, [certificate_number]);

    if (result.rows.length === 0) {
        return res.json({
            found: false,
            message: 'Certificate not found in RIMS database'
        });
    }

    res.json({
        found: true,
        customer_data: result.rows[0]
    });
}));

// =============================================================================
// KNOWLEDGE BASE ENDPOINTS
// =============================================================================

/**
 * GET /api/kb/package/:certificate_code
 * Get package information from knowledge base
 * Tries progressive stripping of numbers (BEACH123 → BEACH12 → BEACH1 → BEACH)
 */
app.get('/api/kb/package/:certificate_code', asyncHandler(async (req, res) => {
    const { certificate_code } = req.params;

    // MOCK MODE
    if (USE_MOCK_DATA) {
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
            message: `Package information not found for certificate code: ${certificate_code}`
        });
    }

    // DATABASE MODE
    const variations = stripCertificateCode(certificate_code);

    const query = `
        SELECT * FROM knowledge_base
        WHERE UPPER(certificate_code) = ANY($1::text[])
        LIMIT 1
    `;

    const result = await pool.query(query, [variations.map(v => v.toUpperCase())]);

    if (result.rows.length === 0) {
        return res.status(404).json({
            found: false,
            message: `Package information not found for certificate code: ${certificate_code}`
        });
    }

    res.json({
        found: true,
        certificate_code: result.rows[0].certificate_code,
        package_info: result.rows[0]
    });
}));

// =============================================================================
// BUSINESS LOGIC ENDPOINTS
// =============================================================================

/**
 * POST /api/logic/deposits-check
 * Check deposit status and compare to expected amount
 *
 * Request body:
 *   {
 *     "customer_data": {...RIMS_DATA record...}
 *   }
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

    let kb_info = null;
    if (USE_MOCK_DATA) {
        const variations = stripCertificateCode(certificate_code);
        for (const variant of variations) {
            if (MOCK_KNOWLEDGE_BASE[variant.toUpperCase()]) {
                kb_info = MOCK_KNOWLEDGE_BASE[variant.toUpperCase()];
                break;
            }
        }
    }

    if (!kb_info) {
        return res.status(404).json({
            error: 'Package info not found',
            message: `Could not find package information for code: ${certificate_code}`
        });
    }

    const expected_deposit = kb_info.total_deposit;

    // Determine status
    let status, message, next_action;

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
 *
 * Request body:
 *   { "customer_data": {...RIMS_DATA record...} }
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

    // Check if travel date is in future
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

    // Past date
    if (days_remaining < 0) {
        return res.json({
            status: "past_date",
            message: "Travel date has passed",
            days_remaining,
            action: "none"
        });
    }

    // Check if confirmed
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
 *
 * Request body:
 *   { "customer_data": {...RIMS_DATA record...} }
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
 *
 * Request body:
 *   {
 *     "memo_type": "needs tr assignment",
 *     "details": "Travel date: 2025-06-15, Days remaining: 42",
 *     "vac_id": "123456",
 *     "phone_number": "8182121359"
 *   }
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
        id: Date.now(),
        memo_type,
        details: details || '',
        vac_id,
        phone_number: phone_number || '',
        created_date: new Date().toISOString().split('T')[0],
        created_by: 'AI Agent'
    };

    // MOCK MODE
    if (USE_MOCK_DATA) {
        MOCK_MEMOS.push(memo);

        return res.json({
            success: true,
            message: 'Memo created successfully',
            memo_id: memo.id,
            memo
        });
    }

    // DATABASE MODE
    const query = `
        INSERT INTO rims_memos (memo_type, details, vac_id, phone_number, created_date, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;

    const result = await pool.query(query, [
        memo_type,
        details,
        vac_id,
        phone_number,
        memo.created_date,
        memo.created_by
    ]);

    res.json({
        success: true,
        message: 'Memo created successfully',
        memo_id: result.rows[0].id,
        memo: result.rows[0]
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

    // DATABASE MODE
    const query = `
        SELECT * FROM rims_memos
        WHERE vac_id = $1
        ORDER BY created_date DESC
    `;

    const result = await pool.query(query, [vac_id]);

    res.json({
        vac_id,
        memo_count: result.rows.length,
        memos: result.rows
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

        await pool.query('SELECT 1');
        res.json({
            status: 'healthy',
            mode: 'production',
            database: 'connected',
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
    console.log(`\n🚀 Casablanca Express - RIMS API Server`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📍 Running on: http://localhost:${PORT}`);
    console.log(`📊 Mode: ${USE_MOCK_DATA ? 'MOCK DATA (Testing)' : 'PRODUCTION (RIMS Database)'}`);
    console.log(`\n📚 RIMS API Endpoints:`);
    console.log(`   GET  /health`);
    console.log(`   POST /api/rims/phone-lookup`);
    console.log(`   POST /api/rims/certificate-lookup`);
    console.log(`   GET  /api/kb/package/:certificate_code`);
    console.log(`   POST /api/logic/deposits-check`);
    console.log(`   POST /api/logic/travel-rep-check`);
    console.log(`   POST /api/logic/booking-check`);
    console.log(`   POST /api/memos/create`);
    console.log(`   GET  /api/memos/:vac_id`);

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
    if (pool) {
        pool.end(() => {
            console.log('Database pool closed');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});

module.exports = app;
