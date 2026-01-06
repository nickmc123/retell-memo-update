# TravelBucks Caspio Data Model

## Table: TravelBucks_Leads

This table stores all leads for the "Choose Your Dream Getaway — from $999" promotional offer.

### Field Specifications

| Field Name | Data Type | Size | Description | Constraints |
|------------|-----------|------|-------------|-------------|
| `lead_id` | Autonumber | - | Primary key, auto-generated | PK, NOT NULL |
| `full_name` | Text | 100 | Full name of the lead | NOT NULL |
| `phone` | Text | 20 | Phone number (E.164 format: +1XXXXXXXXXX) | NOT NULL, UNIQUE |
| `email` | Text | 120 | Email address | Optional |
| `source` | Text | 40 | Lead source (e.g., 'facebook', 'retell', 'website') | Default: 'facebook' |
| `offer` | Text | 60 | Offer identifier | Default: 'choose_your_trip_999' |
| `destination_interest` | Text | 40 | Primary destination interest | See values below |
| `travel_window` | Text | 20 | Preferred travel timeframe | See values below |
| `departure_city_or_port` | Text | 80 | Departure city or cruise port | Optional |
| `status` | Text | 20 | Lead workflow status | See values below |
| `selected_trip` | Text | 40 | Selected trip package | Optional |
| `planning_fee_amount` | Number | - | Activation fee amount | Default: 999 |
| `payment_status` | Text | 20 | Payment processing status | See values below |
| `payment_link_url` | Text | 300 | Generated Caspio payment page URL | Optional |
| `transaction_id` | Text | 80 | Authorize.Net transaction ID | Optional |
| `consent_checkbox` | Yes/No | - | TCPA consent captured | Default: No |
| `consent_timestamp` | Date/Time | - | When consent was captured | Optional |
| `call_status` | Text | 40 | Last call status | See values below |
| `notes` | Text | 500 | Additional notes | Optional |
| `created_at` | Date/Time | - | Record creation timestamp | Auto-set on create |
| `updated_at` | Date/Time | - | Last modification timestamp | Auto-update |

### Enumerated Values

#### `destination_interest`
- `Hawaii`
- `Cancun`
- `Las Vegas`
- `Orlando`
- `Cruise`
- `Domestic Airfare Promotion`
- `Open` (flexible/undecided)

#### `travel_window`
- `1_3_months` — Within 1-3 months
- `3_6_months` — Within 3-6 months
- `flexible` — Flexible/no specific timeframe

#### `status` (Lead Workflow Status)
- `new` — Lead just created, not yet contacted
- `contacted` — Initial contact made
- `qualified` — Lead qualified for offer
- `sent_payment_link` — Payment link sent to lead
- `paid` — Payment completed successfully
- `failed` — Payment failed or lead disqualified
- `refunded` — Refund processed
- `do_not_contact` — Opted out or requested no contact

#### `payment_status`
- `unpaid` — No payment attempted
- `pending` — Payment link sent, awaiting completion
- `paid` — Payment successful
- `failed` — Payment attempt failed
- `refunded` — Payment refunded
- `declined` — Card declined

#### `call_status`
- `no_answer` — No answer on call attempt
- `voicemail` — Voicemail left
- `in_progress` — Call currently active
- `completed` — Call completed successfully
- `transferred` — Call transferred to agent
- `callback_scheduled` — Callback scheduled
- `ended` — Call ended (generic)

---

## Creating the Table in Caspio

### Step 1: Access Tables
1. Log in to Caspio
2. Navigate to **Tables** in the left sidebar
3. Click **New Table**

### Step 2: Create Table
1. Name: `TravelBucks_Leads`
2. Click **Create**

### Step 3: Add Fields

Add each field according to the specifications above:

```
Field: lead_id
  Type: Autonumber
  Primary Key: Yes

Field: full_name
  Type: Text (100)
  Required: Yes

Field: phone
  Type: Text (20)
  Required: Yes
  Unique: Yes

Field: email
  Type: Text (120)
  Required: No

Field: source
  Type: Text (40)
  Default: facebook

Field: offer
  Type: Text (60)
  Default: choose_your_trip_999

Field: destination_interest
  Type: Text (40)

Field: travel_window
  Type: Text (20)

Field: departure_city_or_port
  Type: Text (80)

Field: status
  Type: Text (20)
  Default: new

Field: selected_trip
  Type: Text (40)

Field: planning_fee_amount
  Type: Number
  Default: 999

Field: payment_status
  Type: Text (20)
  Default: unpaid

Field: payment_link_url
  Type: Text (300)

Field: transaction_id
  Type: Text (80)

Field: consent_checkbox
  Type: Yes/No
  Default: No

Field: consent_timestamp
  Type: Date/Time

Field: call_status
  Type: Text (40)

Field: notes
  Type: Text (500)

Field: created_at
  Type: Date/Time

Field: updated_at
  Type: Date/Time
```

### Step 4: Enable REST API Access

1. Go to **Account Settings** > **Web Services Profile**
2. Ensure REST API is enabled
3. Note your **Account ID** (e.g., `***REMOVED***`)
4. Create or use existing OAuth credentials:
   - Client ID
   - Client Secret

---

## REST API Examples

### Authentication (Get Token)

```bash
curl -X POST "https://***REMOVED***.caspio.com/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "YOUR_CLIENT_ID:YOUR_CLIENT_SECRET" \
  -d "grant_type=client_credentials"
```

Response:
```json
{
  "access_token": "eyJhbGciOiJI...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

### Create Lead

```bash
curl -X POST "https://***REMOVED***.caspio.com/rest/v2/tables/TravelBucks_Leads/records" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Smith",
    "phone": "+15551234567",
    "email": "john@example.com",
    "source": "facebook",
    "destination_interest": "Hawaii",
    "travel_window": "3_6_months",
    "consent_checkbox": true,
    "consent_timestamp": "2025-01-06T12:00:00Z",
    "created_at": "2025-01-06T12:00:00Z",
    "updated_at": "2025-01-06T12:00:00Z"
  }'
```

### Get Lead by Phone

```bash
curl -X GET "https://***REMOVED***.caspio.com/rest/v2/tables/TravelBucks_Leads/records?q.where=phone%3D%27%2B15551234567%27" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

### Get Lead by ID

```bash
curl -X GET "https://***REMOVED***.caspio.com/rest/v2/tables/TravelBucks_Leads/records?q.where=lead_id%3D123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

### Update Lead

```bash
curl -X PUT "https://***REMOVED***.caspio.com/rest/v2/tables/TravelBucks_Leads/records?q.where=lead_id%3D123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paid",
    "payment_status": "paid",
    "transaction_id": "AUTH123456",
    "updated_at": "2025-01-06T14:00:00Z"
  }'
```

---

## Indexes (Recommended)

Create indexes for frequently queried fields:

1. `phone` — Primary lookup field
2. `lead_id` — Already indexed as PK
3. `status` — For filtering by workflow status
4. `payment_status` — For payment tracking
5. `created_at` — For date range queries

---

## Data Retention

Consider implementing:
- Archive leads older than 2 years
- Purge `do_not_contact` leads after 90 days (TCPA compliance)
- Regular backup of leads table
