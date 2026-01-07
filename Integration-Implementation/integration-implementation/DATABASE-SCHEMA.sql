-- Customer Database Schema for Casablanca Express
-- Designed for AI agent integration

-- =============================================================================
-- CUSTOMERS TABLE
-- =============================================================================
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(15) UNIQUE NOT NULL,  -- E.164 format: +1234567890
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- =============================================================================
-- CERTIFICATES TABLE
-- =============================================================================
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    certificate_number VARCHAR(50) UNIQUE NOT NULL,  -- e.g., "ABCD123456"
    package_type VARCHAR(100),  -- e.g., "Orlando 5-day", "Las Vegas 4-night"
    destination VARCHAR(100),   -- e.g., "Orlando", "Las Vegas", "Hawaii"

    -- Deposit Information
    deposit_required DECIMAL(10,2) DEFAULT 89.00,
    deposit_paid BOOLEAN DEFAULT FALSE,
    deposit_amount DECIMAL(10,2),
    deposit_date DATE,
    deposit_method VARCHAR(50),  -- 'credit_card', 'check', 'money_order'

    -- Status
    status VARCHAR(50) DEFAULT 'active',  -- 'active', 'scheduled', 'completed', 'cancelled', 'expired'
    activation_date DATE,
    expiration_date DATE,

    -- Travel Details
    travel_dates_scheduled BOOLEAN DEFAULT FALSE,
    travel_start_date DATE,
    travel_end_date DATE,
    travel_rep_assigned VARCHAR(100),

    -- Special Notes
    special_instructions TEXT,
    restrictions TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_certificates_number ON certificates(certificate_number);
CREATE INDEX idx_certificates_customer ON certificates(customer_id);
CREATE INDEX idx_certificates_status ON certificates(status);

-- =============================================================================
-- REFUNDS TABLE
-- =============================================================================
CREATE TABLE refunds (
    id SERIAL PRIMARY KEY,
    certificate_id INTEGER REFERENCES certificates(id),
    refund_amount DECIMAL(10,2) NOT NULL,
    refund_reason TEXT,

    -- Status Tracking
    requested_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'processing', 'approved', 'completed', 'denied'
    processed_date DATE,
    completed_date DATE,
    expected_arrival_date DATE,

    -- Details
    refund_method VARCHAR(50),  -- 'original_payment', 'check', 'store_credit'
    transaction_id VARCHAR(100),
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refunds_certificate ON refunds(certificate_id);
CREATE INDEX idx_refunds_status ON refunds(status);

-- =============================================================================
-- CALENDAR_BOOKINGS TABLE (for Google Sheets sync)
-- =============================================================================
CREATE TABLE calendar_bookings (
    id SERIAL PRIMARY KEY,
    certificate_id INTEGER REFERENCES certificates(id),
    destination VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Booking Details
    booking_status VARCHAR(50) DEFAULT 'confirmed',  -- 'confirmed', 'pending', 'cancelled'
    booked_by VARCHAR(50) DEFAULT 'ai_agent',  -- 'ai_agent', 'human_agent', 'customer'
    confirmation_number VARCHAR(50) UNIQUE,

    -- Hotel/Accommodation
    hotel_name VARCHAR(200),
    hotel_confirmation VARCHAR(100),

    -- Sync Status
    synced_to_sheets BOOLEAN DEFAULT FALSE,
    sheets_row_id INTEGER,
    last_sync_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_certificate ON calendar_bookings(certificate_id);
CREATE INDEX idx_bookings_dates ON calendar_bookings(start_date, end_date);
CREATE INDEX idx_bookings_destination ON calendar_bookings(destination);

-- =============================================================================
-- CALL_LOGS TABLE (for tracking AI interactions)
-- =============================================================================
CREATE TABLE call_logs (
    id SERIAL PRIMARY KEY,
    retell_call_id VARCHAR(100) UNIQUE,
    customer_id INTEGER REFERENCES customers(id),
    certificate_id INTEGER REFERENCES certificates(id),

    -- Call Details
    call_start TIMESTAMP NOT NULL,
    call_end TIMESTAMP,
    duration_seconds INTEGER,

    -- Outcome
    issue_category VARCHAR(100),
    issue_resolved BOOLEAN,
    hawaii_offer_made BOOLEAN DEFAULT FALSE,
    hawaii_transfer_requested BOOLEAN DEFAULT FALSE,

    -- Actions Taken
    database_lookups_performed INTEGER DEFAULT 0,
    calendar_checks_performed INTEGER DEFAULT 0,
    booking_created BOOLEAN DEFAULT FALSE,

    -- Quality
    customer_sentiment VARCHAR(50),  -- 'positive', 'neutral', 'negative', 'frustrated'

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_call_logs_retell ON call_logs(retell_call_id);
CREATE INDEX idx_call_logs_customer ON call_logs(customer_id);
CREATE INDEX idx_call_logs_date ON call_logs(call_start);

-- =============================================================================
-- SAMPLE DATA (for testing)
-- =============================================================================

-- Insert sample customer
INSERT INTO customers (phone, email, first_name, last_name) VALUES
('+13105551234', 'john.doe@example.com', 'John', 'Doe'),
('+14155559876', 'jane.smith@example.com', 'Jane', 'Smith');

-- Insert sample certificates
INSERT INTO certificates (
    customer_id, certificate_number, package_type, destination,
    deposit_required, deposit_paid, deposit_amount, deposit_date,
    status, activation_date, expiration_date
) VALUES
(1, 'ABCD123456', 'Orlando 5-Day Adventure', 'Orlando', 89.00, TRUE, 89.00, '2025-11-15', 'active', '2025-11-01', '2026-12-30'),
(1, 'EFGH789012', 'Las Vegas 4-Night Getaway', 'Las Vegas', 89.00, FALSE, NULL, NULL, 'active', '2025-12-01', '2026-12-31'),
(2, 'IJKL345678', 'Hawaii Paradise Package', 'Hawaii', 699.00, TRUE, 699.00, '2025-12-10', 'active', '2025-12-01', '2026-06-30');

-- Insert sample refund
INSERT INTO refunds (
    certificate_id, refund_amount, refund_reason,
    requested_date, status, processed_date, expected_arrival_date
) VALUES
(2, 89.00, 'Customer unable to travel', '2025-12-01', 'completed', '2025-12-05', '2025-12-12');

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON calendar_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Complete customer view with all certificates
CREATE VIEW customer_complete AS
SELECT
    c.id as customer_id,
    c.phone,
    c.email,
    c.first_name,
    c.last_name,
    cert.id as certificate_id,
    cert.certificate_number,
    cert.package_type,
    cert.destination,
    cert.deposit_paid,
    cert.deposit_amount,
    cert.deposit_date,
    cert.status,
    cert.travel_dates_scheduled,
    cert.travel_start_date,
    cert.travel_end_date,
    cert.expiration_date
FROM customers c
LEFT JOIN certificates cert ON c.id = cert.customer_id;

-- Active certificates requiring scheduling
CREATE VIEW certificates_need_scheduling AS
SELECT
    cert.*,
    c.phone,
    c.email,
    c.first_name,
    c.last_name
FROM certificates cert
JOIN customers c ON cert.customer_id = c.id
WHERE cert.deposit_paid = TRUE
  AND cert.travel_dates_scheduled = FALSE
  AND cert.status = 'active'
  AND cert.expiration_date > CURRENT_DATE;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX idx_certificates_needs_scheduling
ON certificates(deposit_paid, travel_dates_scheduled, status, expiration_date);

CREATE INDEX idx_call_logs_outcome
ON call_logs(issue_resolved, hawaii_offer_made);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE customers IS 'Customer contact information';
COMMENT ON TABLE certificates IS 'Vacation package certificates issued to customers';
COMMENT ON TABLE refunds IS 'Refund requests and processing status';
COMMENT ON TABLE calendar_bookings IS 'Travel date bookings synced with Google Sheets';
COMMENT ON TABLE call_logs IS 'AI agent call interaction logs';

COMMENT ON COLUMN certificates.certificate_number IS 'Unique certificate identifier, format: 2-6 letters + 6 digits (e.g., ABCD123456)';
COMMENT ON COLUMN certificates.deposit_paid IS 'Whether required deposit has been received';
COMMENT ON COLUMN certificates.travel_dates_scheduled IS 'Whether customer has booked specific travel dates';
COMMENT ON COLUMN refunds.expected_arrival_date IS 'Date customer should expect refund (typically 5-7 business days from processed_date)';

-- =============================================================================
-- COMPLETION
-- =============================================================================

-- Verify tables created
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database schema created successfully!';
    RAISE NOTICE 'Tables: customers, certificates, refunds, calendar_bookings, call_logs';
    RAISE NOTICE 'Sample data inserted for testing';
    RAISE NOTICE 'Ready for API integration';
END $$;
