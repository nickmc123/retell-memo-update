# Retell AI Tools - Dashboard Setup Guide

**Tools updated with Railway production URL:** `https://web-production-4080.up.railway.app`

## How to Add Tools

1. Log into [Retell AI Dashboard](https://beta.retellai.com)
2. Click **"Tools"** in the left sidebar
3. Click **"Create Tool"** button
4. For each tool below, copy the configuration and paste into the form

---

## Tool 1: lookup_customer

### Basic Info
- **Tool Name:** `lookup_customer`
- **Description:** Look up customer information by phone number, email, or certificate number. Returns customer details and all associated certificates with deposit status and travel dates.

### HTTP Configuration
- **Method:** GET
- **URL:** `https://web-production-4080.up.railway.app/api/customer/lookup`

### Parameters
Click "Add Parameter" for each:

**Parameter 1: phone**
- Name: `phone`
- Type: `string`
- Description: Customer phone number in E.164 format (e.g., +13105551234)
- Required: No

**Parameter 2: email**
- Name: `email`
- Type: `string`
- Description: Customer email address
- Required: No

**Parameter 3: certificate**
- Name: `certificate`
- Type: `string`
- Description: Certificate number (e.g., ABCD123456)
- Required: No

---

## Tool 2: get_certificate_details

### Basic Info
- **Tool Name:** `get_certificate_details`
- **Description:** Get detailed information about a specific certificate including deposit status, travel dates, and current bookings.

### HTTP Configuration
- **Method:** GET
- **URL:** `https://web-production-4080.up.railway.app/api/certificate/{certificate_number}`

### Parameters

**Parameter 1: certificate_number**
- Name: `certificate_number`
- Type: `string`
- Description: Certificate number to look up (e.g., ABCD123456)
- Required: Yes
- **Location:** Path parameter (in URL)

---

## Tool 3: check_refund_status

### Basic Info
- **Tool Name:** `check_refund_status`
- **Description:** Check if a refund has been requested for a certificate and get its current status and expected completion date.

### HTTP Configuration
- **Method:** GET
- **URL:** `https://web-production-4080.up.railway.app/api/refunds/{certificate_number}`

### Parameters

**Parameter 1: certificate_number**
- Name: `certificate_number`
- Type: `string`
- Description: Certificate number to check refund status for
- Required: Yes
- **Location:** Path parameter (in URL)

---

## Tool 4: check_calendar_availability

### Basic Info
- **Tool Name:** `check_calendar_availability`
- **Description:** Check available travel dates for a specific destination. Returns list of open dates with slot availability.

### HTTP Configuration
- **Method:** GET
- **URL:** `https://web-production-4080.up.railway.app/api/calendar/availability/{destination}`

### Parameters

**Parameter 1: destination**
- Name: `destination`
- Type: `string`
- Description: Destination to check availability for (e.g., Orlando, Las Vegas, Hawaii)
- Required: Yes
- **Location:** Path parameter (in URL)

**Parameter 2: month**
- Name: `month`
- Type: `number`
- Description: Optional: Filter by month (1-12)
- Required: No

**Parameter 3: year**
- Name: `year`
- Type: `number`
- Description: Optional: Filter by year (e.g., 2025)
- Required: No

---

## Tool 5: book_travel_dates

### Basic Info
- **Tool Name:** `book_travel_dates`
- **Description:** Book specific travel dates for a certificate. Requires certificate number, destination, and start/end dates. Returns confirmation number if successful.

### HTTP Configuration
- **Method:** POST
- **URL:** `https://web-production-4080.up.railway.app/api/calendar/book`

### Parameters
Click "Add Parameter" for each:

**Parameter 1: certificate_number**
- Name: `certificate_number`
- Type: `string`
- Description: Certificate number to book dates for
- Required: Yes

**Parameter 2: destination**
- Name: `destination`
- Type: `string`
- Description: Destination name (must match certificate destination)
- Required: Yes

**Parameter 3: start_date**
- Name: `start_date`
- Type: `string`
- Description: Travel start date in YYYY-MM-DD format (e.g., 2025-04-15)
- Required: Yes

**Parameter 4: end_date**
- Name: `end_date`
- Type: `string`
- Description: Travel end date in YYYY-MM-DD format (e.g., 2025-04-19)
- Required: Yes

**Parameter 5: hotel_name**
- Name: `hotel_name`
- Type: `string`
- Description: Optional: Hotel name for booking
- Required: No

---

## Quick Test After Setup

Once all 5 tools are created, you can test them individually in the Retell dashboard:

### Test 1: lookup_customer
```
phone: +13105551234
```
Expected: Returns customer Sarah Johnson with her certificates

### Test 2: get_certificate_details
```
certificate_number: ORLANDO123456
```
Expected: Returns certificate details with deposit status

### Test 3: check_refund_status
```
certificate_number: ORLANDO123456
```
Expected: Returns refund information if exists

### Test 4: check_calendar_availability
```
destination: Orlando
month: 4
year: 2025
```
Expected: Returns available dates for Orlando in April 2025

### Test 5: book_travel_dates
```json
{
  "certificate_number": "ORLANDO123456",
  "destination": "Orlando",
  "start_date": "2025-04-15",
  "end_date": "2025-04-19"
}
```
Expected: Returns booking confirmation with confirmation number

---

## Next Steps

After creating all 5 tools:
1. Copy each tool's ID from the Retell dashboard
2. Go to your agent settings
3. Add all 5 tools to your agent
4. Update your agent's general prompt with the tool usage instructions (see DEPLOYMENT-GUIDE.md Step 4.4)

---

**Status:** ✅ Tool configurations ready with Railway production URL
**API Endpoint:** https://web-production-4080.up.railway.app
**Database:** Connected to Caspio (verified healthy)
