# RIMS API Integration Guide

**Complete guide to using the RIMS-specific API for Casablanca Express Step 1 Agent**

---

## Overview

This API implements the exact RIMS_DATA field structure from your Casablanca Express database system, including:

- ✅ RIMS field names (`phn1`, `phn2`, `pkg_code`, `pkg_code2`, `vac_id`, etc.)
- ✅ Travel Rep logic (45-75 day assignment window)
- ✅ Deposit checking with Knowledge Base lookup
- ✅ Memo creation system (`RIMS_MEMOS`)
- ✅ Certificate activation workflows
- ✅ Booking status verification

---

## Quick Start

### Start the RIMS API Server

```bash
# Install dependencies (if not already done)
npm install

# Start in mock mode (for testing)
npm run start:rims

# Start in production mode (with real database)
USE_MOCK_DATA=false npm run start:rims
```

### Run Tests

```bash
npm run test:rims
```

**Expected**: 17/17 tests pass (100%)

---

## API Endpoints

### 1. Phone Lookup

**Find customer by phone number (checks `phn1` and `phn2`)**

```bash
POST /api/rims/phone-lookup
Content-Type: application/json

{
  "phone_number": "8182121359"
}
```

**Response:**
```json
{
  "found": true,
  "customer_data": {
    "phn1": "8182121359",
    "phn2": "3105551234",
    "pkg_code": "BEACH",
    "pkg_code2": "BEACH123",
    "vac_id": "123456",
    "last_name": "Johnson",
    "first_name": "Sarah",
    "email": "sarah.johnson@email.com",
    "val_dep": 250.00,
    "conf_deposit": 500.00,
    "Asgn_trv_DT": "2025-06-15",
    "confirm_status": "confirm",
    "tm": "John Smith",
    "date_print_enc": "2025-05-01",
    "agency_book_via": "FLIGHT123",
    "htl_bk_via": "HOTEL456"
  }
}
```

**Use in Agent:** First node after collecting phone number

---

### 2. Certificate Lookup

**Find customer by certificate number (searches `pkg_code2`)**

```bash
POST /api/rims/certificate-lookup
Content-Type: application/json

{
  "certificate_number": "BEACH123"
}
```

**Response:** Same as phone lookup

**Use in Agent:** After customer provides certificate number (not found by phone)

---

### 3. Knowledge Base Lookup

**Get package information (with automatic number stripping)**

```bash
GET /api/kb/package/:certificate_code
```

**Examples:**
- `/api/kb/package/BEACH` → Direct match
- `/api/kb/package/BEACH123` → Strips to BEACH
- `/api/kb/package/E789` → Strips to E

**Response:**
```json
{
  "found": true,
  "certificate_code": "BEACH",
  "package_info": {
    "total_deposit": 750,
    "activation_method": "online",
    "destination_options": "Caribbean, Mexico",
    "package_features": "Beach resort, 5 nights"
  }
}
```

**Use in Agent:** Deposits check node (to get expected deposit amount)

---

### 4. Deposits Check

**Calculate deposit status and compare to expected amount**

```bash
POST /api/logic/deposits-check
Content-Type: application/json

{
  "customer_data": {
    "phn1": "8182121359",
    "pkg_code": "BEACH",
    "pkg_code2": "BEACH123",
    "vac_id": "123456",
    "val_dep": 250,
    "conf_deposit": 500
  }
}
```

**Response (Complete):**
```json
{
  "status": "complete",
  "message": "Deposits complete - ready to schedule travel",
  "next_action": "transfer_extension_1",
  "deposits": {
    "val_dep": 250,
    "conf_deposit": 500,
    "total_paid": 750,
    "expected_deposit": 750,
    "remaining": 0
  },
  "activation_method": "online"
}
```

**Response (Partial):**
```json
{
  "status": "partial",
  "message": "Partial payment received. Remaining: $550",
  "next_action": "provide_payment_info",
  "deposits": {
    "val_dep": 100,
    "conf_deposit": 100,
    "total_paid": 200,
    "expected_deposit": 750,
    "remaining": 550
  },
  "activation_method": "online"
}
```

**Response (None):**
```json
{
  "status": "no_deposits",
  "message": "No deposits received",
  "next_action": "direct_to_website",
  "deposits": {
    "val_dep": 0,
    "conf_deposit": 0,
    "total_paid": 0,
    "expected_deposit": 750,
    "remaining": 750
  },
  "activation_method": "online"
}
```

**Use in Agent:** Deposits check node (determines routing)

---

### 5. Travel Rep Check

**Check if Travel Rep needs assignment or contact**

```bash
POST /api/logic/travel-rep-check
Content-Type: application/json

{
  "customer_data": {
    "Asgn_trv_DT": "2025-01-26",
    "confirm_status": "confirm",
    "tm": "",
    "date_print_enc": "",
    "phn1": "8182121359"
  }
}
```

**Response (Needs TR - Urgent):**
```json
{
  "status": "needs_tr_urgent",
  "message": "Travel date in 41 days - Travel Rep assignment urgent",
  "days_remaining": 41,
  "action": "create_memo",
  "memo_type": "needs tr assignment",
  "memo_details": "Travel date: 2025-01-26, Days remaining: 41"
}
```

**Response (TR Assigned, Needs to Call):**
```json
{
  "status": "tr_needs_to_call",
  "message": "Travel Rep John Smith assigned but hasn't sent documents",
  "travel_rep_name": "John Smith",
  "action": "create_memo",
  "memo_type": "ask tr to call",
  "memo_details": "Travel Rep: John Smith, Customer: 8182121359"
}
```

**Response (Complete):**
```json
{
  "status": "tr_complete",
  "message": "Travel Rep John Smith assigned and documents sent on 2025-05-01",
  "travel_rep_name": "John Smith",
  "docs_sent_date": "2025-05-01",
  "action": "contact_tr_directly"
}
```

**Use in Agent:** Travel Rep check node (after deposits if not complete)

---

### 6. Booking Check

**Check if customer is booked and has itinerary**

```bash
POST /api/logic/booking-check
Content-Type: application/json

{
  "customer_data": {
    "agency_book_via": "FLIGHT123",
    "htl_bk_via": "HOTEL456"
  }
}
```

**Response (Booked):**
```json
{
  "status": "booked",
  "message": "Customer is booked",
  "booking_refs": {
    "agency": "FLIGHT123",
    "hotel": "HOTEL456"
  },
  "action": "ask_about_itinerary"
}
```

**Response (Not Booked):**
```json
{
  "status": "not_booked",
  "message": "Customer has not booked travel yet",
  "action": "none"
}
```

**Use in Agent:** Booking check node (after TR check)

---

### 7. Create Memo

**Create a memo in RIMS_MEMOS system**

```bash
POST /api/memos/create
Content-Type: application/json

{
  "memo_type": "needs tr assignment",
  "details": "Travel date: 2025-01-26, Days remaining: 41",
  "vac_id": "234567",
  "phone_number": "3105559876"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Memo created successfully",
  "memo_id": 1734360000000,
  "memo": {
    "id": 1734360000000,
    "memo_type": "needs tr assignment",
    "details": "Travel date: 2025-01-26, Days remaining: 41",
    "vac_id": "234567",
    "phone_number": "3105559876",
    "created_date": "2025-12-16",
    "created_by": "AI Agent"
  }
}
```

**Memo Types:**
- `"needs tr assignment"` - Travel date < 45 days, no TR assigned
- `"ask tr to call"` - TR assigned but hasn't sent docs
- `"resend itinerary"` - Customer needs itinerary resent

**Use in Agent:** Called by Travel Rep/Booking check when action is `"create_memo"`

---

### 8. Get Memos

**Retrieve all memos for a customer**

```bash
GET /api/memos/:vac_id
```

**Response:**
```json
{
  "vac_id": "234567",
  "memo_count": 1,
  "memos": [
    {
      "id": 1734360000000,
      "memo_type": "needs tr assignment",
      "details": "Travel date: 2025-01-26, Days remaining: 41",
      "vac_id": "234567",
      "phone_number": "3105559876",
      "created_date": "2025-12-16",
      "created_by": "AI Agent"
    }
  ]
}
```

---

## Retell AI Agent Flow

### Recommended Node Structure

```
1. collect_phone
   ↓
2. phone_lookup (POST /api/rims/phone-lookup)
   ↓
3. verify_identity (compare last_name)
   ├─ MATCH → 4
   └─ NO MATCH → activation_flow

4. deposits_check (POST /api/logic/deposits-check)
   ├─ status="complete" → transfer_extension_1 → END
   ├─ status="partial" → provide_payment_info → END
   └─ status="no_deposits" → activation_guidance → END

5. travel_rep_check (POST /api/logic/travel-rep-check)
   ├─ action="create_memo" → create_memo (POST /api/memos/create)
   ├─ action="contact_tr_directly" → provide_tr_info
   └─ action="none" → 6

6. booking_check (POST /api/logic/booking-check)
   ├─ status="booked" → ask_about_itinerary
   └─ status="not_booked" → normal_flow
```

---

## Retell AI Tool Definitions

### Tool 1: RIMS Phone Lookup

```json
{
  "tool_name": "rims_phone_lookup",
  "description": "Look up customer in RIMS database by phone number",
  "url": "https://your-api-url.com/api/rims/phone-lookup",
  "method": "POST",
  "parameters": {
    "phone_number": {
      "type": "string",
      "description": "Customer's phone number (digits only)",
      "required": true
    }
  },
  "speak_during_execution": true,
  "instruction": "Look up the customer using their phone number from caller ID"
}
```

### Tool 2: RIMS Certificate Lookup

```json
{
  "tool_name": "rims_certificate_lookup",
  "description": "Look up customer in RIMS database by certificate number",
  "url": "https://your-api-url.com/api/rims/certificate-lookup",
  "method": "POST",
  "parameters": {
    "certificate_number": {
      "type": "string",
      "description": "Certificate number provided by customer",
      "required": true
    }
  },
  "speak_during_execution": true,
  "instruction": "Look up the customer using the certificate number they provided"
}
```

### Tool 3: Deposits Check

```json
{
  "tool_name": "deposits_check",
  "description": "Check customer's deposit status and compare to expected amount",
  "url": "https://your-api-url.com/api/logic/deposits-check",
  "method": "POST",
  "parameters": {
    "customer_data": {
      "type": "object",
      "description": "Full customer data from RIMS lookup",
      "required": true
    }
  },
  "speak_during_execution": false,
  "instruction": "Check if customer's deposits are complete"
}
```

### Tool 4: Travel Rep Check

```json
{
  "tool_name": "travel_rep_check",
  "description": "Check if Travel Rep needs assignment or needs to contact customer",
  "url": "https://your-api-url.com/api/logic/travel-rep-check",
  "method": "POST",
  "parameters": {
    "customer_data": {
      "type": "object",
      "description": "Full customer data from RIMS lookup",
      "required": true
    }
  },
  "speak_during_execution": false,
  "instruction": "Check Travel Rep status for this customer"
}
```

### Tool 5: Create Memo

```json
{
  "tool_name": "create_rims_memo",
  "description": "Create a memo in RIMS system for staff follow-up",
  "url": "https://your-api-url.com/api/memos/create",
  "method": "POST",
  "parameters": {
    "memo_type": {
      "type": "string",
      "description": "Type of memo (needs tr assignment, ask tr to call, resend itinerary)",
      "required": true
    },
    "details": {
      "type": "string",
      "description": "Memo details and context",
      "required": false
    },
    "vac_id": {
      "type": "string",
      "description": "Customer's vacation ID from RIMS",
      "required": true
    },
    "phone_number": {
      "type": "string",
      "description": "Customer's phone number",
      "required": false
    }
  },
  "speak_during_execution": false,
  "instruction": "Create a memo for staff to follow up with this customer"
}
```

---

## Mock Data Reference

### Test Customers

**Sarah Johnson** - Complete profile, TR assigned, booked
- phn1: `8182121359`
- phn2: `3105551234`
- Certificate: `BEACH123`
- Deposits: ✅ Complete ($750)
- Travel Date: June 15, 2025
- Travel Rep: John Smith (docs sent May 1)
- Booking: ✅ Booked (FLIGHT123, HOTEL456)

**Mike Chen** - Deposits complete, needs TR urgent
- phn1: `3105559876`
- Certificate: `E789`
- Deposits: ✅ Complete ($500)
- Travel Date: January 26, 2025 (41 days away!)
- Travel Rep: ❌ Not assigned (URGENT)
- Booking: ❌ Not booked

**Lisa Martinez** - New customer, no deposits
- phn1: `4155551212`
- Certificate: `SKI555`
- Deposits: ❌ None ($0 of $800)
- Travel Date: August 15, 2025
- Travel Rep: Not assigned (normal - 8 months away)
- Booking: ❌ Not booked

---

## Testing

### Start Test Server

```bash
# Terminal 1 - Start server
npm run start:rims
```

### Run All Tests

```bash
# Terminal 2 - Run tests
npm run test:rims
```

### Expected Results

**17/17 tests should pass:**
1. ✅ Health check
2. ✅ Phone lookup (phn1)
3. ✅ Phone lookup (phn2)
4. ✅ Phone lookup (not found)
5. ✅ Certificate lookup
6. ✅ KB lookup (exact match)
7. ✅ KB lookup (strip numbers)
8. ✅ Deposits - complete
9. ✅ Deposits - partial
10. ✅ Deposits - none
11. ✅ TR check - needs assignment
12. ✅ TR check - needs to call
13. ✅ TR check - complete
14. ✅ Booking - is booked
15. ✅ Booking - not booked
16. ✅ Create memo
17. ✅ Get memos

---

## Production Deployment

See main [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) for deployment instructions.

### Environment Variables

```bash
# Production mode
USE_MOCK_DATA=false
DATABASE_URL=postgresql://user:pass@host:5432/rims_db

# Development/testing mode
USE_MOCK_DATA=true
```

---

## Field Mapping Reference

| RIMS Field | Type | Description | Example |
|------------|------|-------------|---------|
| `phn1` | String | Primary phone | `"8182121359"` |
| `phn2` | String | Secondary phone | `"3105551234"` |
| `pkg_code` | String | Certificate letter code | `"BEACH"` |
| `pkg_code2` | String | Full certificate code | `"BEACH123"` |
| `vac_id` | String | Vacation ID (6 digits) | `"123456"` |
| `val_dep` | Number | Validation deposit | `250.00` |
| `conf_deposit` | Number | Confirmation deposit | `500.00` |
| `Asgn_trv_DT` | Date String | Travel date | `"2025-06-15"` |
| `confirm_status` | String | Confirmation status | `"confirm"` |
| `tm` | String | Travel Rep name | `"John Smith"` |
| `date_print_enc` | Date String | Docs sent date | `"2025-05-01"` |
| `agency_book_via` | String | Agency booking ref | `"FLIGHT123"` |
| `htl_bk_via` | String | Hotel booking ref | `"HOTEL456"` |
| `last_name` | String | Customer last name | `"Johnson"` |
| `first_name` | String | Customer first name | `"Sarah"` |
| `email` | String | Customer email | `"email@example.com"` |

---

## Next Steps

1. ✅ **Test API locally** - `npm run test:rims`
2. 🔄 **Deploy to production** - Follow deployment guide
3. 🔄 **Create Retell AI tools** - Use tool definitions above
4. 🔄 **Update agent flow** - Use recommended node structure
5. 🔄 **Test with live calls** - Monitor and iterate

---

**Status**: ✅ Ready for production deployment
**Last Updated**: December 16, 2025
