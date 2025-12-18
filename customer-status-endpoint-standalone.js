// Standalone version - integrates with existing Railway API
// POST /api/rims/customer-status
// Copy this entire file to your Railway API project

const express = require('express');
const router = express.Router();

// Assumes you have a db connection available (adjust based on your setup)
// If using pg directly, import: const { pool } = require('../db/connection');
// If using Caspio API, import your existing caspio helper

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

function getExpectedDeposit(pkg_code) {
  const depositMap = {
    'ECF': 500,
    'EKCA': 500,
    'BEACH': 500,
    'CRUISE': 500,
  };
  return depositMap[pkg_code] || 500;
}

function determineStatus(customerData) {
  const {
    vac_id,
    p1F,
    p1L,
    pkg_code,
    pkg_code2,
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

  const expectedDeposit = getExpectedDeposit(pkg_code);
  const totalPaid = (val_dep || 0) + (conf_deposit || 0);
  const remaining = Math.max(0, expectedDeposit - totalPaid);
  const depositsComplete = totalPaid >= expectedDeposit;

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
  // 8. DEPOSIT NEEDED
  else {
    status = 'Deposit Needed';
    next_action = 'direct_to_payment';
    message = `Deposit required: $${remaining} remaining of $${expectedDeposit} total.`;
  }

  return {
    status,
    message,
    next_action,
    customer: {
      vac_id,
      name: `${p1F} ${p1L}`.trim(),
      pkg_code2,
      destination: dest,
      phone: phn1
    },
    details: {
      deposits: {
        val_dep: val_dep || 0,
        conf_deposit: conf_deposit || 0,
        total_paid: totalPaid,
        expected: expectedDeposit,
        remaining: remaining,
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
      }
    }
  };
}

// OPTION A: If you already have a phone lookup function, import it
// const { lookupCustomerByPhone } = require('./rims-lookup'); // Adjust path

// OPTION B: If using direct database query, implement here
async function lookupCustomer(phone_number, vac_id, pkg_code2) {
  // TODO: Replace this with your actual database lookup
  // This should match your existing phone-lookup implementation

  // Example using existing endpoint (internal call):
  const fetch = require('node-fetch');
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  // Try phone + pkg_code2 lookup first (most specific)
  if (phone_number && pkg_code2) {
    const response = await fetch(`${baseUrl}/api/rims/phone-pkg-lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number, pkg_code2 })
    });
    const result = await response.json();
    if (result.found) return result.customer_data;
  }

  // Fallback to just phone number
  if (phone_number) {
    const response = await fetch(`${baseUrl}/api/rims/phone-lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number })
    });
    const result = await response.json();
    if (result.found) return result.customer_data;
  }

  // If phone lookup fails and vac_id provided, try vac_id lookup
  if (vac_id) {
    const response = await fetch(`${baseUrl}/api/rims/vac-id-lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vac_id })
    });
    const result = await response.json();
    if (result.found) return result.customer_data;
  }

  return null;
}

// Main endpoint
router.post('/api/rims/customer-status', async (req, res) => {
  try {
    const { phone_number, vac_id, pkg_code2 } = req.body;

    if (!phone_number && !vac_id) {
      return res.status(400).json({
        error: 'Missing required parameter: phone_number or vac_id'
      });
    }

    // Lookup customer (with optional pkg_code2 for disambiguation)
    const customerData = await lookupCustomer(phone_number, vac_id, pkg_code2);

    if (!customerData) {
      return res.status(404).json({
        error: 'Customer not found',
        phone_number,
        vac_id
      });
    }

    // Determine status
    const result = determineStatus(customerData);

    return res.json(result);

  } catch (error) {
    console.error('Error in customer-status endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
