/**
 * Casablanca Express - Customer Database API
 * For Retell AI Agent Integration
 *
 * This API provides customer lookup, certificate management,
 * and calendar booking functionality for the AI phone agent.
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

// Import Google Chat live monitoring router
const googleChatMonitor = require('./google-chat-live-monitor');

const app = express();
const PORT = process.env.PORT || 3000;
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

// Mock data for testing without database
const MOCK_CUSTOMERS = [
    {
        id: 1,
        phone: '+13105551234',
        email: 'sarah.johnson@email.com',
        first_name: 'Sarah',
        last_name: 'Johnson',
        certificates: [
            {
                certificate_id: 1,
                certificate_number: 'ORLANDO123456',
                package_type: '3-Day Orlando Package',
                destination: 'Orlando',
                deposit_required: 99.00,
                deposit_paid: true,
                deposit_amount: 99.00,
                deposit_date: '2025-01-05',
                status: 'active',
                travel_dates_scheduled: true,
                travel_start_date: '2025-04-15',
                travel_end_date: '2025-04-19',
                expiration_date: '2026-01-01',
                travel_rep_assigned: false
            }
        ]
    },
    {
        id: 2,
        phone: '+13105559876',
        email: 'mike.chen@email.com',
        first_name: 'Mike',
        last_name: 'Chen',
        certificates: [
            {
                certificate_id: 2,
                certificate_number: 'VEGAS789012',
                package_type: '4-Day Las Vegas Package',
                destination: 'Las Vegas',
                deposit_required: 99.00,
                deposit_paid: false,
                deposit_amount: null,
                deposit_date: null,
                status: 'active',
                travel_dates_scheduled: false,
                travel_start_date: null,
                travel_end_date: null,
                expiration_date: '2026-03-01',
                travel_rep_assigned: false
            }
        ]
    }
];

const MOCK_REFUNDS = [
    {
        certificate_number: 'ORLANDO123456',
        refund_amount: 99.00,
        refund_reason: 'Unable to travel',
        requested_date: '2025-01-10',
        status: 'processing',
        processed_date: null,
        completed_date: null,
        expected_arrival_date: '2025-01-20',
        refund_method: 'original_payment',
        transaction_id: null,
        notes: 'Standard refund processing'
    }
];

// Database connection (skip if using mock data)
const pool = USE_MOCK_DATA ? null : new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'casablanca_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

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
// CUSTOMER LOOKUP ENDPOINTS
// =============================================================================

/**
 * GET /api/customer/lookup
 * Look up customer by phone number, email, or certificate number
 *
 * Query params:
 *   - phone: Customer phone number (E.164 format)
 *   - email: Customer email address
 *   - certificate: Certificate number
 *
 * Returns: Customer details with all certificates
 */
app.get('/api/customer/lookup', asyncHandler(async (req, res) => {
    const { phone, email, certificate } = req.query;

    if (!phone && !email && !certificate) {
        return res.status(400).json({
            error: 'Missing required parameter',
            message: 'Provide at least one of: phone, email, or certificate'
        });
    }

    // MOCK MODE
    if (USE_MOCK_DATA) {
        let customer = null;

        if (phone) {
            customer = MOCK_CUSTOMERS.find(c => c.phone === phone);
        } else if (email) {
            customer = MOCK_CUSTOMERS.find(c => c.email === email.toLowerCase());
        } else if (certificate) {
            customer = MOCK_CUSTOMERS.find(c =>
                c.certificates.some(cert => cert.certificate_number === certificate.toUpperCase())
            );
        }

        if (!customer) {
            return res.status(404).json({
                found: false,
                message: 'Customer not found'
            });
        }

        return res.json({
            found: true,
            customer: {
                customer_id: customer.id,
                phone: customer.phone,
                email: customer.email,
                first_name: customer.first_name,
                last_name: customer.last_name,
                full_name: `${customer.first_name} ${customer.last_name}`,
                certificates: customer.certificates || []
            }
        });
    }

    // DATABASE MODE
    let query;
    let params;

    if (certificate) {
        // Lookup by certificate number
        query = `
            SELECT
                c.id as customer_id,
                c.phone,
                c.email,
                c.first_name,
                c.last_name,
                json_agg(
                    json_build_object(
                        'certificate_id', cert.id,
                        'certificate_number', cert.certificate_number,
                        'package_type', cert.package_type,
                        'destination', cert.destination,
                        'deposit_required', cert.deposit_required,
                        'deposit_paid', cert.deposit_paid,
                        'deposit_amount', cert.deposit_amount,
                        'deposit_date', cert.deposit_date,
                        'status', cert.status,
                        'travel_dates_scheduled', cert.travel_dates_scheduled,
                        'travel_start_date', cert.travel_start_date,
                        'travel_end_date', cert.travel_end_date,
                        'expiration_date', cert.expiration_date,
                        'travel_rep_assigned', cert.travel_rep_assigned
                    ) ORDER BY cert.created_at DESC
                ) as certificates
            FROM customers c
            JOIN certificates cert ON c.id = cert.customer_id
            WHERE cert.certificate_number = $1
            GROUP BY c.id
        `;
        params = [certificate.toUpperCase()];
    } else if (phone) {
        // Lookup by phone
        query = `
            SELECT
                c.id as customer_id,
                c.phone,
                c.email,
                c.first_name,
                c.last_name,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'certificate_id', cert.id,
                            'certificate_number', cert.certificate_number,
                            'package_type', cert.package_type,
                            'destination', cert.destination,
                            'deposit_required', cert.deposit_required,
                            'deposit_paid', cert.deposit_paid,
                            'deposit_amount', cert.deposit_amount,
                            'deposit_date', cert.deposit_date,
                            'status', cert.status,
                            'travel_dates_scheduled', cert.travel_dates_scheduled,
                            'travel_start_date', cert.travel_start_date,
                            'travel_end_date', cert.travel_end_date,
                            'expiration_date', cert.expiration_date,
                            'travel_rep_assigned', cert.travel_rep_assigned
                        ) ORDER BY cert.created_at DESC
                    ) FILTER (WHERE cert.id IS NOT NULL),
                    '[]'
                ) as certificates
            FROM customers c
            LEFT JOIN certificates cert ON c.id = cert.customer_id
            WHERE c.phone = $1
            GROUP BY c.id
        `;
        params = [phone];
    } else if (email) {
        // Lookup by email
        query = `
            SELECT
                c.id as customer_id,
                c.phone,
                c.email,
                c.first_name,
                c.last_name,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'certificate_id', cert.id,
                            'certificate_number', cert.certificate_number,
                            'package_type', cert.package_type,
                            'destination', cert.destination,
                            'deposit_required', cert.deposit_required,
                            'deposit_paid', cert.deposit_paid,
                            'deposit_amount', cert.deposit_amount,
                            'deposit_date', cert.deposit_date,
                            'status', cert.status,
                            'travel_dates_scheduled', cert.travel_dates_scheduled,
                            'travel_start_date', cert.travel_start_date,
                            'travel_end_date', cert.travel_end_date,
                            'expiration_date', cert.expiration_date,
                            'travel_rep_assigned', cert.travel_rep_assigned
                        ) ORDER BY cert.created_at DESC
                    ) FILTER (WHERE cert.id IS NOT NULL),
                    '[]'
                ) as certificates
            FROM customers c
            LEFT JOIN certificates cert ON c.id = cert.customer_id
            WHERE c.email = $1
            GROUP BY c.id
        `;
        params = [email.toLowerCase()];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
        return res.status(404).json({
            found: false,
            message: 'Customer not found'
        });
    }

    const customer = result.rows[0];

    res.json({
        found: true,
        customer: {
            customer_id: customer.customer_id,
            phone: customer.phone,
            email: customer.email,
            first_name: customer.first_name,
            last_name: customer.last_name,
            full_name: `${customer.first_name} ${customer.last_name}`,
            certificates: customer.certificates || []
        }
    });
}));

/**
 * GET /api/certificate/:certificate_number
 * Get detailed information about a specific certificate
 */
app.get('/api/certificate/:certificate_number', asyncHandler(async (req, res) => {
    const { certificate_number } = req.params;

    // MOCK MODE
    if (USE_MOCK_DATA) {
        const customer = MOCK_CUSTOMERS.find(c =>
            c.certificates.some(cert => cert.certificate_number === certificate_number.toUpperCase())
        );

        if (!customer) {
            return res.status(404).json({
                found: false,
                message: 'Certificate not found'
            });
        }

        const cert = customer.certificates.find(
            cert => cert.certificate_number === certificate_number.toUpperCase()
        );

        return res.json({
            found: true,
            certificate: {
                certificate_number: cert.certificate_number,
                package_type: cert.package_type,
                destination: cert.destination,
                customer: {
                    phone: customer.phone,
                    email: customer.email,
                    first_name: customer.first_name,
                    last_name: customer.last_name
                },
                deposit: {
                    required: parseFloat(cert.deposit_required),
                    paid: cert.deposit_paid,
                    amount: cert.deposit_amount ? parseFloat(cert.deposit_amount) : null,
                    date: cert.deposit_date,
                    method: null
                },
                status: cert.status,
                dates: {
                    scheduled: cert.travel_dates_scheduled,
                    start: cert.travel_start_date,
                    end: cert.travel_end_date,
                    expiration: cert.expiration_date
                },
                travel_rep: cert.travel_rep_assigned,
                booking: null,
                special_instructions: null
            }
        });
    }

    // DATABASE MODE
    const query = `
        SELECT
            cert.*,
            c.phone,
            c.email,
            c.first_name,
            c.last_name,
            (
                SELECT json_build_object(
                    'booking_id', cb.id,
                    'start_date', cb.start_date,
                    'end_date', cb.end_date,
                    'hotel_name', cb.hotel_name,
                    'confirmation_number', cb.confirmation_number
                )
                FROM calendar_bookings cb
                WHERE cb.certificate_id = cert.id
                AND cb.booking_status = 'confirmed'
                ORDER BY cb.created_at DESC
                LIMIT 1
            ) as current_booking
        FROM certificates cert
        JOIN customers c ON cert.customer_id = c.id
        WHERE cert.certificate_number = $1
    `;

    const result = await pool.query(query, [certificate_number.toUpperCase()]);

    if (result.rows.length === 0) {
        return res.status(404).json({
            found: false,
            message: 'Certificate not found'
        });
    }

    const cert = result.rows[0];

    res.json({
        found: true,
        certificate: {
            certificate_number: cert.certificate_number,
            package_type: cert.package_type,
            destination: cert.destination,
            customer: {
                phone: cert.phone,
                email: cert.email,
                first_name: cert.first_name,
                last_name: cert.last_name
            },
            deposit: {
                required: parseFloat(cert.deposit_required),
                paid: cert.deposit_paid,
                amount: cert.deposit_amount ? parseFloat(cert.deposit_amount) : null,
                date: cert.deposit_date,
                method: cert.deposit_method
            },
            status: cert.status,
            dates: {
                scheduled: cert.travel_dates_scheduled,
                start: cert.travel_start_date,
                end: cert.travel_end_date,
                expiration: cert.expiration_date
            },
            travel_rep: cert.travel_rep_assigned,
            booking: cert.current_booking,
            special_instructions: cert.special_instructions
        }
    });
}));

/**
 * GET /api/refunds/:certificate_number
 * Get refund status for a certificate
 */
app.get('/api/refunds/:certificate_number', asyncHandler(async (req, res) => {
    const { certificate_number } = req.params;

    // MOCK MODE
    if (USE_MOCK_DATA) {
        const refund = MOCK_REFUNDS.find(
            r => r.certificate_number === certificate_number.toUpperCase()
        );

        if (!refund) {
            return res.json({
                has_refund: false,
                message: 'No refund request found for this certificate'
            });
        }

        return res.json({
            has_refund: true,
            refund: {
                amount: parseFloat(refund.refund_amount),
                reason: refund.refund_reason,
                requested_date: refund.requested_date,
                status: refund.status,
                processed_date: refund.processed_date,
                completed_date: refund.completed_date,
                expected_arrival_date: refund.expected_arrival_date,
                method: refund.refund_method,
                transaction_id: refund.transaction_id,
                notes: refund.notes
            }
        });
    }

    // DATABASE MODE
    const query = `
        SELECT r.*
        FROM refunds r
        JOIN certificates cert ON r.certificate_id = cert.id
        WHERE cert.certificate_number = $1
        ORDER BY r.requested_date DESC
        LIMIT 1
    `;

    const result = await pool.query(query, [certificate_number.toUpperCase()]);

    if (result.rows.length === 0) {
        return res.json({
            has_refund: false,
            message: 'No refund request found for this certificate'
        });
    }

    const refund = result.rows[0];

    res.json({
        has_refund: true,
        refund: {
            amount: parseFloat(refund.refund_amount),
            reason: refund.refund_reason,
            requested_date: refund.requested_date,
            status: refund.status,
            processed_date: refund.processed_date,
            completed_date: refund.completed_date,
            expected_arrival_date: refund.expected_arrival_date,
            method: refund.refund_method,
            transaction_id: refund.transaction_id,
            notes: refund.notes
        }
    });
}));

/**
 * PATCH /api/customer/:customer_id
 * Update customer information
 */
app.patch('/api/customer/:customer_id', asyncHandler(async (req, res) => {
    const { customer_id } = req.params;
    const { email, first_name, last_name } = req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(email.toLowerCase());
    }
    if (first_name !== undefined) {
        updates.push(`first_name = $${paramIndex++}`);
        values.push(first_name);
    }
    if (last_name !== undefined) {
        updates.push(`last_name = $${paramIndex++}`);
        values.push(last_name);
    }

    if (updates.length === 0) {
        return res.status(400).json({
            error: 'No fields to update',
            message: 'Provide at least one field to update'
        });
    }

    values.push(customer_id);
    const query = `
        UPDATE customers
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
        return res.status(404).json({
            error: 'Customer not found'
        });
    }

    res.json({
        success: true,
        customer: result.rows[0]
    });
}));

// =============================================================================
// CALENDAR / BOOKING ENDPOINTS
// =============================================================================

/**
 * GET /api/calendar/availability/:destination
 * Check available dates for a destination
 *
 * This queries Google Sheets via the calendar sync
 */
app.get('/api/calendar/availability/:destination', asyncHandler(async (req, res) => {
    const { destination } = req.params;
    const { month, year } = req.query;

    // MOCK MODE
    if (USE_MOCK_DATA) {
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

        return res.json({
            destination,
            total_available_dates: availableDates.length,
            dates: availableDates.slice(0, 30), // Return first 30 days
            message: `Found ${availableDates.length} available dates for ${destination}`
        });
    }

    // DATABASE MODE
    // Query existing bookings to determine availability
    const query = `
        SELECT
            start_date,
            end_date,
            COUNT(*) as booking_count
        FROM calendar_bookings
        WHERE destination = $1
          AND booking_status = 'confirmed'
          AND start_date >= CURRENT_DATE
        GROUP BY start_date, end_date
        ORDER BY start_date
    `;

    const result = await pool.query(query, [destination]);

    // Get booked dates
    const bookedDates = result.rows.map(row => ({
        start: row.start_date,
        end: row.end_date,
        slots_remaining: 10 - row.booking_count // Assume 10 slots per date
    }));

    // Generate available dates for next 90 days
    const availableDates = [];
    const today = new Date();

    for (let i = 0; i < 90; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);

        const dateStr = checkDate.toISOString().split('T')[0];

        // Check if date is already booked
        const existingBooking = bookedDates.find(b => b.start === dateStr);

        if (!existingBooking || existingBooking.slots_remaining > 0) {
            availableDates.push({
                date: dateStr,
                day_of_week: checkDate.toLocaleDateString('en-US', { weekday: 'long' }),
                available_slots: existingBooking ? existingBooking.slots_remaining : 10
            });
        }
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
 * Book travel dates for a certificate
 */
app.post('/api/calendar/book', asyncHandler(async (req, res) => {
    const {
        certificate_number,
        destination,
        start_date,
        end_date,
        hotel_name
    } = req.body;

    // Validate required fields
    if (!certificate_number || !destination || !start_date || !end_date) {
        return res.status(400).json({
            error: 'Missing required fields',
            required: ['certificate_number', 'destination', 'start_date', 'end_date']
        });
    }

    // MOCK MODE
    if (USE_MOCK_DATA) {
        // Find certificate in mock data
        const customer = MOCK_CUSTOMERS.find(c =>
            c.certificates.some(cert => cert.certificate_number === certificate_number.toUpperCase())
        );

        if (!customer) {
            return res.status(404).json({
                error: 'Certificate not found'
            });
        }

        const cert = customer.certificates.find(
            cert => cert.certificate_number === certificate_number.toUpperCase()
        );

        // Check if deposit is paid
        if (!cert.deposit_paid) {
            return res.status(400).json({
                error: 'Deposit not paid',
                message: 'Deposit must be paid before booking travel dates'
            });
        }

        // Check if certificate is active
        if (cert.status !== 'active') {
            return res.status(400).json({
                error: 'Certificate not active',
                status: cert.status
            });
        }

        // Generate confirmation number
        const confirmationNumber = `CB${Date.now()}${Math.floor(Math.random() * 1000)}`;

        // Return successful booking
        return res.json({
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
    }

    // DATABASE MODE
    // Start transaction
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Verify certificate exists and deposit is paid
        const certQuery = `
            SELECT id, deposit_paid, travel_dates_scheduled, status
            FROM certificates
            WHERE certificate_number = $1
        `;
        const certResult = await client.query(certQuery, [certificate_number.toUpperCase()]);

        if (certResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: 'Certificate not found'
            });
        }

        const cert = certResult.rows[0];

        if (!cert.deposit_paid) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'Deposit not paid',
                message: 'Deposit must be paid before booking travel dates'
            });
        }

        if (cert.status !== 'active') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'Certificate not active',
                status: cert.status
            });
        }

        // 2. Check if dates are available (not overbooked)
        const availabilityQuery = `
            SELECT COUNT(*) as booking_count
            FROM calendar_bookings
            WHERE destination = $1
              AND start_date = $2
              AND booking_status = 'confirmed'
        `;
        const availResult = await client.query(availabilityQuery, [destination, start_date]);

        if (parseInt(availResult.rows[0].booking_count) >= 10) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                error: 'Date not available',
                message: 'Selected dates are fully booked'
            });
        }

        // 3. Generate confirmation number
        const confirmationNumber = `CB${Date.now()}${Math.floor(Math.random() * 1000)}`;

        // 4. Create booking
        const bookingQuery = `
            INSERT INTO calendar_bookings (
                certificate_id, destination, start_date, end_date,
                booking_status, booked_by, confirmation_number, hotel_name
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const bookingResult = await client.query(bookingQuery, [
            cert.id,
            destination,
            start_date,
            end_date,
            'confirmed',
            'ai_agent',
            confirmationNumber,
            hotel_name || null
        ]);

        // 5. Update certificate
        const updateCertQuery = `
            UPDATE certificates
            SET travel_dates_scheduled = TRUE,
                travel_start_date = $1,
                travel_end_date = $2,
                status = 'scheduled'
            WHERE id = $3
        `;
        await client.query(updateCertQuery, [start_date, end_date, cert.id]);

        await client.query('COMMIT');

        const booking = bookingResult.rows[0];

        res.json({
            success: true,
            message: 'Travel dates booked successfully',
            booking: {
                confirmation_number: booking.confirmation_number,
                destination: booking.destination,
                start_date: booking.start_date,
                end_date: booking.end_date,
                hotel_name: booking.hotel_name,
                status: booking.booking_status
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}));

// =============================================================================
// CALL LOGGING ENDPOINT
// =============================================================================

/**
 * POST /api/call/log
 * Log AI agent call interaction
 */
app.post('/api/call/log', asyncHandler(async (req, res) => {
    const {
        retell_call_id,
        customer_id,
        certificate_id,
        duration_seconds,
        issue_category,
        issue_resolved,
        hawaii_offer_made,
        hawaii_transfer_requested,
        database_lookups_performed,
        calendar_checks_performed,
        booking_created,
        customer_sentiment
    } = req.body;

    const query = `
        INSERT INTO call_logs (
            retell_call_id, customer_id, certificate_id,
            call_start, call_end, duration_seconds,
            issue_category, issue_resolved,
            hawaii_offer_made, hawaii_transfer_requested,
            database_lookups_performed, calendar_checks_performed,
            booking_created, customer_sentiment
        ) VALUES (
            $1, $2, $3,
            NOW() - INTERVAL '1 second' * $4, NOW(), $4,
            $5, $6, $7, $8, $9, $10, $11, $12
        )
        RETURNING *
    `;

    const result = await pool.query(query, [
        retell_call_id,
        customer_id || null,
        certificate_id || null,
        duration_seconds || 0,
        issue_category || null,
        issue_resolved || false,
        hawaii_offer_made || false,
        hawaii_transfer_requested || false,
        database_lookups_performed || 0,
        calendar_checks_performed || 0,
        booking_created || false,
        customer_sentiment || 'neutral'
    ]);

    res.json({
        success: true,
        log_id: result.rows[0].id
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
                database: 'mock_data',
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

    if (err.code === '23505') { // Unique violation
        return res.status(409).json({
            error: 'Duplicate entry',
            message: err.detail
        });
    }

    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
    });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
    console.log(`\n🚀 Casablanca Express API Server`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📍 Running on: http://localhost:${PORT}`);
    console.log(`📊 Mode: ${USE_MOCK_DATA ? 'MOCK DATA (Testing)' : 'PRODUCTION'}`);
    console.log(`\n📚 Available Endpoints:`);
    console.log(`   GET  /health`);
    console.log(`   GET  /api/customer/lookup?phone=...`);
    console.log(`   GET  /api/certificate/:certificate_number`);
    console.log(`   GET  /api/refunds/:certificate_number`);
    console.log(`   GET  /api/calendar/availability/:destination`);
    console.log(`   POST /api/calendar/book`);
    console.log(`\n💬 Google Chat Live Monitoring:`);
    console.log(`   POST /webhook/retell/call-started`);
    console.log(`   POST /webhook/retell/transcript-update`);
    console.log(`   POST /webhook/retell/call-ended`);
    console.log(`   POST /webhook/google-chat/interaction`);
    console.log(`   GET  /google-chat/active-calls`);
    console.log(`   POST /google-chat/test`);

    if (USE_MOCK_DATA) {
        console.log(`\n🧪 Mock Test Data:`);
        console.log(`   Phone: +13105551234 (Sarah Johnson - Orlando)`);
        console.log(`   Phone: +13105559876 (Mike Chen - Las Vegas)`);
        console.log(`   Certificate: ORLANDO123456`);
        console.log(`   Certificate: VEGAS789012`);
    }
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    pool.end(() => {
        console.log('Database pool closed');
        process.exit(0);
    });
});
