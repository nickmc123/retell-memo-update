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
    accountId: process.env.CASPIO_ACCOUNT_ID || '***REMOVED***',
    baseUrl: process.env.CASPIO_BASE_URL || 'https://***REMOVED***.caspio.com',
    tokenUrl: process.env.CASPIO_TOKEN_URL || 'https://***REMOVED***.caspio.com/oauth/token',
    clientId: process.env.CASPIO_CLIENT_ID,
    clientSecret: process.env.CASPIO_CLIENT_SECRET,

    // Table names (update these to match your actual Caspio table names)
    tables: {
        rims_data: process.env.CASPIO_TABLE_RIMS || 'RIMS_DATA',
        knowledge_base: process.env.CASPIO_TABLE_KB || 'Knowledge_Base',
        rims_memos: process.env.CASPIO_TABLE_MEMOS || 'RIMS_MEMOS',
        destsel: process.env.CASPIO_TABLE_DESTSEL || 'destsel'
    }
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

    // EVX packages (Las Vegas)
    "EVX": { total_deposit: 50, activation_method: "online" },
    "EVXV": { total_deposit: 50, activation_method: "online" },

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
// HELPER FUNCTIONS
// =============================================================================

function daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date2 - date1) / oneDay);
}

function normalizePhone(phone) {
    return phone.replace(/\D/g, '');
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

/**
 * Query destsel table to get package info by pkgcode2
 * Returns deposit amount and package details
 */
async function getPackageFromDestsel(pkgCode2) {
    if (!pkgCode2) return null;

    const code = pkgCode2.toUpperCase();
    console.log(`[Destsel Lookup] Looking up pkgcode2: ${code}`);

    if (USE_MOCK_DATA) {
        // Return mock data for testing
        return null;
    }

    try {
        // Query destsel table using pkgcode2 field (exact match)
        const results = await queryCaspioTable(
            CASPIO_CONFIG.tables.destsel,
            `pkgcode2='${code}'`
        );

        if (results && results.length > 0) {
            const pkg = results[0];
            console.log(`[Destsel Lookup] Found package:`, JSON.stringify(pkg));

            // destsel has two deposit fields:
            // - ref_dep: validation/reference deposit (paid first, stored in val_dep)
            // - deposit: confirmation deposit (paid second, stored in conf_deposit)
            const refDeposit = pkg.ref_dep || 0;
            const confDeposit = pkg.deposit || 0;
            const totalExpected = refDeposit + confDeposit;

            return {
                found: true,
                pkgcode2: code,
                // Individual deposit amounts from destsel
                ref_dep: refDeposit,           // Expected validation deposit
                deposit: confDeposit,          // Expected confirmation deposit
                total_expected: totalExpected, // Total of both deposits
                destination: pkg.destination || pkg.dest || null,
                nights: pkg.ngts || pkg.nights || pkg.num_nights || null,
                vacation_type: pkg.vacation_type || pkg.vac_type || null,
                depart_city: pkg.depart_city || pkg.city || null,
                vaca_desc: pkg.vaca_desc || null,
                raw: pkg
            };
        }

        console.log(`[Destsel Lookup] No exact match for ${code}`);
        return null;
    } catch (error) {
        console.error(`[Destsel Lookup] Error:`, error.message);
        return null;
    }
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
        const customers = MOCK_RIMS_DATA.filter(c =>
            normalizePhone(c.phn1) === normalized || normalizePhone(c.phn2) === normalized
        );

        if (customers.length === 0) {
            return res.json({
                found: false,
                message: 'Customer not found in RIMS database'
            });
        }

        return res.json({
            found: true,
            count: customers.length,
            customer_data: customers[0],  // Backward compatibility
            all_records: customers         // All matching records
        });
    }

    // CASPIO MODE
    // Query: find ALL records where phn1 or phn2 matches (Caspio uses SQL-like syntax)
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
        count: results.length,
        customer_data: results[0],  // First record for backward compatibility
        all_records: results         // All matching records
    });
}));

/**
 * POST /api/rims/phone-pkg-lookup
 * Look up customer by phone number AND package code (pkg_code2)
 * Useful when a customer has multiple records with same phone but different certificates
 */
app.post('/api/rims/phone-pkg-lookup', asyncHandler(async (req, res) => {
    const { phone_number, pkg_code2 } = req.body;

    if (!phone_number || !pkg_code2) {
        return res.status(400).json({
            error: 'Missing required parameters',
            message: 'Both phone_number and pkg_code2 are required'
        });
    }

    const normalized = normalizePhone(phone_number);
    const cert_upper = pkg_code2.toUpperCase();

    // MOCK MODE
    if (USE_MOCK_DATA) {
        const customer = MOCK_RIMS_DATA.find(c =>
            (normalizePhone(c.phn1) === normalized || normalizePhone(c.phn2) === normalized) &&
            c.pkg_code2.toUpperCase() === cert_upper
        );

        if (!customer) {
            return res.json({
                found: false,
                message: 'Customer not found with matching phone and certificate'
            });
        }

        return res.json({
            found: true,
            customer_data: customer
        });
    }

    // CASPIO MODE
    // Query: find record where (phn1 OR phn2) AND pkg_code2 match
    const whereClause = `(phn1='${normalized}' OR phn2='${normalized}') AND pkg_code2='${cert_upper}'`;

    const results = await queryCaspioTable(CASPIO_CONFIG.tables.rims_data, whereClause);

    if (results.length === 0) {
        return res.json({
            found: false,
            message: 'Customer not found with matching phone and certificate'
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

/**
 * POST /api/rims/vac-id-lookup
 * Look up customer by vacation ID
 */
app.post('/api/rims/vac-id-lookup', asyncHandler(async (req, res) => {
    const { vac_id } = req.body;

    if (!vac_id) {
        return res.status(400).json({
            error: 'Missing vac_id',
            message: 'Vacation ID is required'
        });
    }

    // MOCK MODE
    if (USE_MOCK_DATA) {
        const customer = MOCK_RIMS_DATA.find(c =>
            c.vac_id.toString() === vac_id.toString()
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
    const whereClause = `vac_id=${vac_id}`;
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
 * POST /api/rims/pkg-vac-lookup
 * Look up customer by package code (pkg_code2) AND vacation ID
 * Most specific lookup - guarantees exact record match
 */
app.post('/api/rims/pkg-vac-lookup', asyncHandler(async (req, res) => {
    const { pkg_code2, vac_id } = req.body;

    if (!pkg_code2 || !vac_id) {
        return res.status(400).json({
            error: 'Missing required parameters',
            message: 'Both pkg_code2 and vac_id are required'
        });
    }

    const cert_upper = pkg_code2.toUpperCase();

    // MOCK MODE
    if (USE_MOCK_DATA) {
        const customer = MOCK_RIMS_DATA.find(c =>
            c.pkg_code2.toUpperCase() === cert_upper &&
            c.vac_id.toString() === vac_id.toString()
        );

        if (!customer) {
            return res.json({
                found: false,
                message: 'Customer not found with matching certificate and vacation ID'
            });
        }

        return res.json({
            found: true,
            customer_data: customer
        });
    }

    // CASPIO MODE
    const whereClause = `pkg_code2='${cert_upper}' AND vac_id=${vac_id}`;
    const results = await queryCaspioTable(CASPIO_CONFIG.tables.rims_data, whereClause);

    if (results.length === 0) {
        return res.json({
            found: false,
            message: 'Customer not found with matching certificate and vacation ID'
        });
    }

    res.json({
        found: true,
        customer_data: results[0]
    });
}));

/**
 * POST /api/rims/customer-status
 * Unified customer status endpoint - determines current status in vacation journey
 * Returns one of 8 possible statuses with appropriate messaging
 */
app.post('/api/rims/customer-status', asyncHandler(async (req, res) => {
    const { phone_number, vac_id, pkg_code2 } = req.body;

    if (!phone_number && !vac_id) {
        return res.status(400).json({
            error: 'Missing required parameter',
            message: 'Either phone_number or vac_id is required'
        });
    }

    // Helper functions
    function daysUntilDate(dateString) {
        if (!dateString) return null;
        const targetDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);
        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    function isInFuture(dateString) {
        if (!dateString) return false;
        return daysUntilDate(dateString) > 0;
    }

    function isInPast(dateString) {
        if (!dateString) return false;
        return daysUntilDate(dateString) < 0;
    }

    // getExpectedDeposit moved to use destsel lookup - see below

    // Lookup customer using priority: phone+pkg → phone → vac_id
    let customerData = null;

    if (phone_number && pkg_code2) {
        // Try phone + pkg_code2 lookup first (most specific)
        const normalized = normalizePhone(phone_number);
        const cert_upper = pkg_code2.toUpperCase();

        if (USE_MOCK_DATA) {
            customerData = MOCK_RIMS_DATA.find(c =>
                (normalizePhone(c.phn1) === normalized || normalizePhone(c.phn2) === normalized) &&
                c.pkg_code2.toUpperCase() === cert_upper
            );
        } else {
            const whereClause = `(phn1='${normalized}' OR phn2='${normalized}') AND pkg_code2='${cert_upper}'`;
            const results = await queryCaspioTable(CASPIO_CONFIG.tables.rims_data, whereClause);
            if (results.length > 0) customerData = results[0];
        }
    }

    // Fallback to phone-only lookup
    if (!customerData && phone_number) {
        const normalized = normalizePhone(phone_number);

        if (USE_MOCK_DATA) {
            customerData = MOCK_RIMS_DATA.find(c =>
                normalizePhone(c.phn1) === normalized || normalizePhone(c.phn2) === normalized
            );
        } else {
            const whereClause = `phn1='${normalized}' OR phn2='${normalized}'`;
            const results = await queryCaspioTable(CASPIO_CONFIG.tables.rims_data, whereClause);
            if (results.length > 0) customerData = results[0];
        }
    }

    // Fallback to vac_id lookup
    if (!customerData && vac_id) {
        if (USE_MOCK_DATA) {
            customerData = MOCK_RIMS_DATA.find(c => c.vac_id.toString() === vac_id.toString());
        } else {
            const whereClause = `vac_id=${vac_id}`;
            const results = await queryCaspioTable(CASPIO_CONFIG.tables.rims_data, whereClause);
            if (results.length > 0) customerData = results[0];
        }
    }

    if (!customerData) {
        return res.status(404).json({
            error: 'Customer not found',
            phone_number,
            vac_id
        });
    }

    // Determine status based on customer data
    const {
        vac_id: custVacId,
        p1F,
        p1L,
        pkg_code,
        pkg_code2: custPkgCode2,
        dest,
        val_dep,
        conf_deposit,
        asgn_trv_dt,
        tm,
        conf_valid_code,
        arv_date,
        cash_back_amt,
        Fnl_Doc_MO_Date,
        date_print_enc,
        phn1,
        decReady,
        date_htl_book,
        date_agncy_book
    } = customerData;

    // Look up deposit amounts from destsel table using pkg_code2
    const packageInfo = await getPackageFromDestsel(custPkgCode2);

    // Compare customer deposits to destsel expected amounts:
    // - val_dep (customer) vs ref_dep (destsel) - validation/reference deposit
    // - conf_deposit (customer) vs deposit (destsel) - confirmation deposit
    const expectedRefDep = packageInfo ? packageInfo.ref_dep : null;
    const expectedConfDep = packageInfo ? packageInfo.deposit : null;
    const expectedTotal = packageInfo ? packageInfo.total_expected : null;

    const paidValDep = val_dep || 0;
    const paidConfDep = conf_deposit || 0;
    const totalPaid = paidValDep + paidConfDep;

    // Determine deposit status
    const valDepPaid = expectedRefDep !== null ? paidValDep >= expectedRefDep : false;
    const confDepPaid = expectedConfDep !== null ? paidConfDep >= expectedConfDep : false;
    const depositsComplete = expectedTotal !== null ? totalPaid >= expectedTotal : false;
    const remaining = expectedTotal !== null ? Math.max(0, expectedTotal - totalPaid) : null;

    console.log(`[Customer Status] pkg_code2: ${custPkgCode2}`);
    console.log(`[Customer Status] Expected: ref_dep=${expectedRefDep}, deposit=${expectedConfDep}, total=${expectedTotal}`);
    console.log(`[Customer Status] Paid: val_dep=${paidValDep}, conf_deposit=${paidConfDep}, total=${totalPaid}`);
    console.log(`[Customer Status] Status: valDepPaid=${valDepPaid}, confDepPaid=${confDepPaid}, complete=${depositsComplete}`);

    const daysUntilTravel = asgn_trv_dt ? daysUntilDate(asgn_trv_dt) : null;
    const daysUntilArrival = arv_date ? daysUntilDate(arv_date) : null;

    let status, next_action, message;

    // 1. REFUND PENDING
    if (cash_back_amt && cash_back_amt > 0 && !Fnl_Doc_MO_Date) {
        status = 'Refund Pending';
        next_action = 'check_with_accounting';
        message = `Refund of $${cash_back_amt} is being processed. Documents not yet mailed.`;
    }
    // 2. TRIP COMPLETE
    else if (arv_date && isInPast(arv_date)) {
        status = 'Trip Complete';
        next_action = 'thank_customer';
        message = `Trip to ${dest} was completed. Thank you for traveling with us!`;
    }
    // 3. TRAVEL PENDING
    else if (arv_date && isInFuture(arv_date)) {
        status = 'Travel Pending';
        next_action = 'trip_confirmed_upcoming';
        message = `Trip to ${dest} is confirmed. Arrival date: ${arv_date} (${daysUntilArrival} days away).`;
    }
    // 4. BOOKING PENDING
    else if (decReady === true && (!date_htl_book || date_htl_book === null || date_htl_book === '') && (!date_agncy_book || date_agncy_book === null || date_agncy_book === '')) {
        status = 'Booking Pending';
        next_action = 'awaiting_booking';
        message = `Customer has made travel decision. Waiting for hotel and agency booking to be completed.`;
    }
    // 5. TRAVEL REP ASSIGNED
    else if (tm && tm.trim() !== '' && conf_valid_code === 'CONFIRM' && decReady !== true) {
        status = 'Travel Rep Assigned';
        next_action = 'provide_tr_contact';
        message = `Travel Rep ${tm} is assigned. Awaiting final booking confirmation.`;
    }
    // 6. WAITING FOR TRAVEL REP
    else if (asgn_trv_dt && (!tm || tm.trim() === '') && conf_valid_code === 'CONFIRM' && daysUntilTravel <= 75 && daysUntilTravel >= 1) {
        status = 'Waiting For Travel Rep';
        next_action = 'create_tr_memo_urgent';
        message = `Travel date is ${asgn_trv_dt} (${daysUntilTravel} days away). Needs Travel Rep assignment urgently.`;
    }
    // 7. READY TO SCHEDULE
    else if (depositsComplete && !asgn_trv_dt) {
        status = 'Ready to Schedule';
        next_action = 'offer_scheduling';
        message = 'Deposits complete. Ready to schedule travel dates.';
    }
    // 8. DATES SCHEDULED - deposits paid, dates set, confirmed, but outside TR window (>75 days out)
    else if (depositsComplete && asgn_trv_dt && (!tm || tm.trim() === '') && conf_valid_code === 'CONFIRM' && daysUntilTravel > 75) {
        status = 'Dates Scheduled';
        next_action = 'confirm_all_set';
        message = `Travel dates are set for ${asgn_trv_dt} (${daysUntilTravel} days away). A travel rep will be assigned 45-75 days before your trip.`;
    }
    // 9. SCHEDULED NOT CONFIRMED - dates set but not confirmed, decReady not true
    else if (asgn_trv_dt && conf_valid_code !== 'CONFIRM' && decReady !== true) {
        if (daysUntilTravel <= 75) {
            status = 'Scheduled Not Confirmed - Must Reschedule';
            next_action = 'transfer_to_scheduling';
            message = `Travel date ${asgn_trv_dt} (${daysUntilTravel} days away) was not confirmed and may no longer be available. Customer needs to reschedule.`;
        } else {
            status = 'Scheduled Not Confirmed - Can Confirm';
            next_action = 'confirm_over_phone';
            message = `Travel date ${asgn_trv_dt} (${daysUntilTravel} days away) is scheduled but not yet confirmed. Customer can confirm over the phone.`;
        }
    }
    // 10. DEPOSIT NEEDED
    else {
        status = 'Deposit Needed';
        next_action = 'direct_to_payment';
        if (expectedTotal !== null) {
            message = `Deposit required: $${remaining} remaining of $${expectedTotal} total.`;
        } else {
            message = `Deposit required as shown on your certificate.`;
        }
    }

    res.json({
        status,
        message,
        next_action,
        customer: {
            vac_id: custVacId,
            name: `${p1F || ''} ${p1L || ''}`.trim(),
            pkg_code2: custPkgCode2,
            destination: dest,
            phone: phn1
        },
        details: {
            deposits: {
                // What customer has paid
                val_dep_paid: paidValDep,
                conf_deposit_paid: paidConfDep,
                total_paid: totalPaid,
                // What destsel says is expected
                ref_dep_expected: expectedRefDep,
                deposit_expected: expectedConfDep,
                total_expected: expectedTotal,
                // Status
                remaining: remaining,
                val_dep_complete: valDepPaid,
                conf_dep_complete: confDepPaid,
                complete: depositsComplete
            },
            travel_info: {
                assigned_date: asgn_trv_dt,
                arrival_date: arv_date,
                days_until_travel: daysUntilTravel,
                days_until_arrival: daysUntilArrival,
                confirmed: conf_valid_code === 'CONFIRM'
            },
            travel_rep: {
                name: tm || null,
                paperwork_submitted: date_print_enc || null
            },
            refund: {
                amount: cash_back_amt || 0,
                docs_mailed: Fnl_Doc_MO_Date || null
            },
            package: packageInfo ? {
                source: 'destsel',
                pkgcode2: packageInfo.pkgcode2,
                ref_dep: packageInfo.ref_dep,
                deposit: packageInfo.deposit,
                total_expected: packageInfo.total_expected,
                destination: packageInfo.destination,
                nights: packageInfo.nights,
                vacation_type: packageInfo.vacation_type,
                vaca_desc: packageInfo.vaca_desc
            } : {
                source: 'not_found',
                pkgcode2: custPkgCode2,
                note: 'Package not found in destsel table'
            }
        }
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

        const packageInfo = MOCK_KNOWLEDGE_BASE[customer.pkg_code] || { total_deposit: null };

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
    const packageInfo = MOCK_KNOWLEDGE_BASE[customer.pkg_code] || { total_deposit: null };

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
// PACKAGE DESCRIPTION LOOKUP (destsel table)
// =============================================================================

/**
 * GET /api/package/description
 * Look up package description from destsel table
 *
 * Query params:
 *   - pkg_code2: The package code (e.g., MIWCA, MIGCH, DBVH)
 *
 * Returns: Package description including vacation type, nights, departure rules
 */
app.get('/api/package/description', asyncHandler(async (req, res) => {
    const { pkg_code2 } = req.query;

    if (!pkg_code2) {
        return res.status(400).json({ error: 'pkg_code2 is required' });
    }

    console.log(`[Package Description] Looking up: ${pkg_code2}`);

    if (USE_MOCK_DATA) {
        // Mock package descriptions based on code prefix patterns
        const mockDescriptions = getMockPackageDescription(pkg_code2);
        return res.json(mockDescriptions);
    }

    try {
        // Query destsel table by pkgcode2 (the correct field name)
        let records = await queryCaspioTable(
            CASPIO_CONFIG.tables.destsel,
            `pkgcode2='${pkg_code2.toUpperCase()}'`
        );

        console.log(`[Package Description] Query for pkgcode2='${pkg_code2.toUpperCase()}' returned ${records.length} records`);

        if (records.length === 0) {
            // Fall back to deriving from code prefix
            return res.json(getMockPackageDescription(pkg_code2));
        }

        const record = records[0];

        // Map destsel fields to our standardized response format
        // (Field names may vary based on actual Caspio table structure)
        const packageInfo = {
            found: true,
            pkg_code2: pkg_code2,
            vacation_type: record.vacation_type || record.vac_type || record.type || deriveVacationType(pkg_code2),
            nights: record.nights || record.num_nights || deriveNights(pkg_code2),
            depart_city: record.depart_city || record.departure_city || record.city || null,
            destination: record.destination || record.dest || record.dest_name || deriveDestination(pkg_code2),
            calendar_type: record.calendar_type || deriveCalendarType(pkg_code2),
            departure_rules: getDepartureRules(pkg_code2),
            description: record.description || record.pkg_description || null,
            // Include all raw fields from destsel for reference
            raw_data: record
        };

        res.json(packageInfo);
    } catch (error) {
        console.error('[Package Description] Error:', error.message);
        // Fall back to derived description
        res.json(getMockPackageDescription(pkg_code2));
    }
}));

/**
 * GET /api/package/list
 * List all package descriptions from destsel table
 */
app.get('/api/package/list', asyncHandler(async (req, res) => {
    console.log('[Package List] Fetching all package descriptions');

    if (USE_MOCK_DATA) {
        return res.json({
            count: 0,
            message: 'Mock mode - no package list available. Query individual packages.',
            sample_prefixes: ['MIW', 'MIG', 'DB', 'DH', 'MI', 'AI']
        });
    }

    try {
        const records = await queryCaspioTable(CASPIO_CONFIG.tables.destsel, null);

        res.json({
            count: records.length,
            packages: records
        });
    } catch (error) {
        console.error('[Package List] Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch package list' });
    }
}));

/**
 * Helper: Derive vacation type from package code prefix
 */
function deriveVacationType(pkgCode2) {
    const prefix = (pkgCode2 || '').substring(0, 2).toUpperCase();
    const prefix3 = (pkgCode2 || '').substring(0, 3).toUpperCase();

    const typeMap = {
        'MIW': '3 Night Air All-Inclusive',
        'MIG': '2 Night Air All-Inclusive',
        'DB': '2 Night Hotel Vacation',
        'DH': '3 Night Hotel Vacation',
        'MI': 'Air All-Inclusive Vacation',
        'AI': 'Air Inclusive Package',
        'CR': 'Cruise Vacation',
        'EVX': 'Las Vegas Vacation'
    };

    return typeMap[prefix3] || typeMap[prefix] || 'Vacation Package';
}

/**
 * Helper: Derive number of nights from package code
 */
function deriveNights(pkgCode2) {
    const prefix3 = (pkgCode2 || '').substring(0, 3).toUpperCase();

    if (prefix3 === 'MIW' || prefix3.startsWith('DH')) return 3;
    if (prefix3 === 'MIG' || prefix3.startsWith('DB')) return 2;

    // Try to extract number from code
    const match = pkgCode2.match(/(\d)/);
    return match ? parseInt(match[1]) : null;
}

/**
 * Helper: Derive calendar type from package code
 */
function deriveCalendarType(pkgCode2) {
    const prefix = (pkgCode2 || '').substring(0, 2).toUpperCase();

    if (prefix === 'CR') return 'cruise';
    if (['MI', 'AI', 'MIW', 'MIG'].some(p => pkgCode2.toUpperCase().startsWith(p))) return 'air';
    return 'hotel';
}

/**
 * Helper: Derive destination from package code
 */
function deriveDestination(pkgCode2) {
    // Common destination mappings based on code patterns
    const code = (pkgCode2 || '').toUpperCase();

    if (code.includes('MEX') || code.includes('CAN')) return 'Mexico';
    if (code.includes('CAR') || code.includes('JAM')) return 'Caribbean';
    if (code.includes('VEG') || code.includes('LV')) return 'Las Vegas';
    if (code.includes('ORL') || code.includes('FL')) return 'Orlando';
    if (code.includes('BAH')) return 'Bahamas';

    return null;
}

/**
 * Helper: Get departure rules based on package type
 */
function getDepartureRules(pkgCode2) {
    const prefix3 = (pkgCode2 || '').substring(0, 3).toUpperCase();
    const calendarType = deriveCalendarType(pkgCode2);

    if (calendarType === 'cruise') {
        return {
            type: 'cruise',
            valid_days: null,
            description: 'Cruise departures are on specific dates - check cruise calendar'
        };
    }

    if (prefix3 === 'MIW' || deriveNights(pkgCode2) === 3) {
        return {
            type: 'air',
            valid_days: ['monday', 'tuesday'],
            description: '3-night air packages: Monday or Tuesday departures only'
        };
    }

    if (prefix3 === 'MIG' || deriveNights(pkgCode2) === 2) {
        return {
            type: 'air',
            valid_days: ['monday', 'tuesday', 'wednesday'],
            description: '2-night air packages: Monday, Tuesday, or Wednesday departures only'
        };
    }

    return {
        type: 'flexible',
        valid_days: null,
        description: 'Check availability for any departure date'
    };
}

/**
 * Helper: Generate mock package description from code prefix
 */
function getMockPackageDescription(pkgCode2) {
    const prefix3 = (pkgCode2 || '').substring(0, 3).toUpperCase();

    return {
        found: true,
        pkg_code2: pkgCode2,
        source: 'derived',
        vacation_type: deriveVacationType(pkgCode2),
        nights: deriveNights(pkgCode2),
        depart_city: null,
        destination: deriveDestination(pkgCode2),
        calendar_type: deriveCalendarType(pkgCode2),
        departure_rules: getDepartureRules(pkgCode2),
        description: null,
        note: 'Package details derived from code prefix. Deploy with Caspio access for full destsel lookup.'
    };
}

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
    console.log(`   POST /api/rims/phone-lookup`);
    console.log(`   POST /api/rims/phone-pkg-lookup`);
    console.log(`   POST /api/rims/vac-id-lookup`);
    console.log(`   POST /api/rims/pkg-vac-lookup`);
    console.log(`   POST /api/rims/customer-status`);
    console.log(`   POST /api/rims/certificate-lookup`);
    console.log(`   GET  /api/kb/package/:certificate_code`);
    console.log(`   POST /api/logic/deposits-check`);
    console.log(`   POST /api/logic/travel-rep-check`);
    console.log(`   POST /api/logic/booking-check`);
    console.log(`   POST /api/memos/create`);
    console.log(`   GET  /api/memos/:vac_id`);
    console.log(`\n📦 Package Description API (destsel):`);
    console.log(`   GET  /api/package/description?pkg_code2=XXX ⭐ NEW`);
    console.log(`   GET  /api/package/list ⭐ NEW`);

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
