# Caspio Payment DataPage Specification
## TravelBucks $149 Planning Fee Payment System

---

## Overview

This DataPage creates a secure, PCI-compliant payment page hosted on Caspio that integrates with Authorize.Net. The page is accessed via SMS links sent by the AI agent after qualification.

**Purpose**: Collect $149 planning fee from qualified travel leads
**Integration**: Authorize.Net payment gateway
**Access Method**: Unique URL sent via SMS
**Security**: PCI DSS compliant (Caspio handles card data)

---

## DataPage Type

**Type**: Submission Form
**Data Source**: `TravelBucks_Leads` table
**Name**: `TravelBucks_Planning_Fee_Payment`
**Deploy**: As standalone page

---

## URL Parameters (Passed from SMS Link)

The SMS link will contain these parameters to pre-fill the form:

```
https://c0abc123.caspio.com/dp/abc12345000/payment?
  lead_id=tb263421&
  name=John+Smith&
  email=john@example.com
```

### URL Parameter Mapping:
- `lead_id` → Lead ID field (hidden, pre-filled)
- `name` → Customer Name field (visible, pre-filled)
- `email` → Email Address field (visible, pre-filled)

---

## Form Fields

### 1. Lead ID (Hidden)
- **Type**: Text Field
- **Field**: `LeadID` from URL parameter
- **Display**: Hidden
- **Required**: Yes
- **Default Value**: From URL parameter `lead_id`

### 2. Customer Name
- **Type**: Text Field
- **Label**: Full Name
- **Field**: `CustomerName`
- **Required**: Yes
- **Pre-filled**: From URL parameter `name`
- **Editable**: Yes (in case of typo)

### 3. Email Address
- **Type**: Email Field
- **Label**: Email Address
- **Field**: `Email`
- **Required**: Yes
- **Pre-filled**: From URL parameter `email`
- **Editable**: Yes
- **Validation**: Email format

### 4. Phone Number
- **Type**: Phone Field
- **Label**: Phone Number
- **Field**: `Phone`
- **Required**: Yes
- **Format**: US Phone (###) ###-####
- **Note**: This may already be in the database, but collect again for confirmation

### 5. Payment Amount (Read-Only)
- **Type**: Text Field (Display Only)
- **Label**: Planning Fee
- **Value**: $149.00 (fixed)
- **Display**: Large, bold text
- **Editable**: No

### 6. Credit Card Information
**Use Caspio's Authorize.Net Payment Element**

- **Payment Gateway**: Authorize.Net
- **Amount Field**: Fixed value `149`
- **Card Fields** (Caspio handles these securely):
  - Card Number
  - Expiration Date (MM/YY)
  - CVV
  - Billing ZIP Code

### 7. Terms Checkbox
- **Type**: Checkbox
- **Label**: I agree to the terms
- **Required**: Yes
- **Disclaimer Text**:
```
I authorize TravelBucks to charge my card $149 for custom travel planning services.
This fee covers itinerary design, supplier research, and concierge support.
The fee will be credited toward my booking if I proceed with TravelBucks.
This is a one-time non-refundable planning fee.
```

---

## Payment Configuration

### Authorize.Net Setup

**In Caspio Bridge:**
1. Navigate to: Tables & Views → Payment Settings
2. Select: Authorize.Net
3. Enter credentials:
   - API Login ID: (From Authorize.Net account)
   - Transaction Key: (From Authorize.Net account)
   - Gateway URL: https://secure.authorize.net/gateway/transact.dll
   - Test Mode: Enabled (for initial testing)

### Payment Field Configuration

**Amount**: Fixed `149.00`
**Currency**: USD
**Payment Type**: Charge (not authorize-only)
**Description**: "TravelBucks Planning Fee - Lead #[@field:LeadID]"

### Transaction Data Captured

Caspio will store in `TravelBucks_Leads` table:
- `PaymentStatus` → "completed" or "failed"
- `PaymentTransactionID` → Authorize.Net transaction ID
- `PaymentAmount` → 149
- `PaymentDate` → Current timestamp
- `PaymentMethod` → Last 4 digits of card (e.g., "Visa ****1234")

---

## Page Design

### Header
```
TravelBucks Travel Planning
Secure Payment - $149 Planning Fee
```

### Styling
- **Color Scheme**: Professional blues and whites
- **Logo**: TravelBucks logo at top
- **Security Badge**: "Secured by Authorize.Net" badge
- **SSL Indicator**: Padlock icon with "Secure Payment" text

### Layout
```
┌─────────────────────────────────┐
│  TravelBucks Logo               │
│  Secure Payment - $149          │
├─────────────────────────────────┤
│                                 │
│  Full Name: [John Smith____]    │
│  Email: [john@example.com___]   │
│  Phone: [(555) 555-1234____]    │
│                                 │
│  Planning Fee: $149.00          │
│                                 │
│  ─── Payment Information ───    │
│                                 │
│  [Authorize.Net Payment Form]   │
│  Card Number: [_______________] │
│  Expiration: [MM/YY] CVV: [___] │
│  Billing ZIP: [_____]           │
│                                 │
│  □ I agree to terms             │
│  (terms disclaimer text...)     │
│                                 │
│  [Pay $149.00 Securely]         │
│                                 │
│  🔒 Secured by Authorize.Net    │
└─────────────────────────────────┘
```

---

## Success Page (After Payment)

### Display Message
```
✅ Payment Successful!

Thank you, [CustomerName]!

Your $149 planning fee has been processed.

What happens next:
1. You'll receive a confirmation email at [Email]
2. A TravelBucks travel specialist will contact you within 24 hours
3. They'll begin designing your custom itinerary

Your confirmation number: [TransactionID]

Questions? Call us at 1-800-TB-VOICE
```

### Auto-Redirect
After 10 seconds, redirect to: `https://travelbucks.com/planning-confirmed`

---

## Failure Page (Payment Declined)

### Display Message
```
⚠️ Payment Could Not Be Processed

Your card was declined.

Common reasons:
- Insufficient funds
- Incorrect card number or CVV
- Expired card
- Billing address mismatch

Please try again with a different payment method.

[Try Again] button → Returns to payment form

Need help? Call 1-800-TB-VOICE
```

---

## Database Updates (Rules & Actions)

### On Successful Payment (AFTER SUBMIT EVENT)

**Update `TravelBucks_Leads` table:**
```javascript
UPDATE TravelBucks_Leads
SET
  PaymentStatus = 'completed',
  PaymentTransactionID = [@cbParamVirtual1], // Authorize.Net transaction ID
  PaymentAmount = 149,
  PaymentDate = NOW(),
  PaymentMethod = [@cbParamVirtual2], // Last 4 digits from Authorize.Net
  LeadStatus = 'payment_completed',
  Priority = 'high'
WHERE LeadID = [@field:LeadID]
```

### Send Confirmation Email (AFTER SUBMIT EVENT)

**To**: [@field:Email]
**Subject**: Your TravelBucks Planning Fee Confirmation
**Body**:
```
Hi [@field:CustomerName],

Thank you for your payment!

Your $149 planning fee has been processed successfully.

Confirmation Number: [@field:PaymentTransactionID]

What's Next:
A TravelBucks travel specialist will contact you within 24 hours to begin
designing your custom itinerary. They'll have all the details from your
initial conversation.

Your planning fee will be credited toward your booking when you decide to
move forward with TravelBucks.

Questions? Reply to this email or call 1-800-TB-VOICE.

Safe travels!
TravelBucks Team
```

### Notify Sales Team (AFTER SUBMIT EVENT)

**To**: sales@travelbucks.com
**Subject**: NEW PAID LEAD - [@field:CustomerName]
**Body**:
```
🎉 New planning fee collected!

Lead ID: [@field:LeadID]
Name: [@field:CustomerName]
Email: [@field:Email]
Phone: [@field:Phone]
Amount Paid: $149
Transaction ID: [@field:PaymentTransactionID]

PRIORITY: HIGH
Contact this lead within 24 hours to begin trip planning.

View in Caspio: [Link to lead record]
```

---

## Security Configuration

### SSL/HTTPS
- **Required**: Yes - Caspio DataPages are always HTTPS
- **Certificate**: Managed by Caspio

### PCI Compliance
- **Card Data**: Never stored in Caspio - passed directly to Authorize.Net
- **Tokenization**: Authorize.Net handles card tokenization
- **Storage**: Only transaction ID and last 4 digits stored in Caspio

### Access Control
- **Who can access**: Anyone with the unique URL (no login required)
- **URL Expiry**: Optional - can set links to expire after 72 hours
- **One-Time Use**: Optional - can restrict to single submission per lead_id

---

## Testing Checklist

Before going live, test:

- [ ] URL parameters pre-fill correctly
- [ ] Payment processes with test card (Authorize.Net test mode)
- [ ] Success page displays with correct data
- [ ] Failure page displays when card is declined
- [ ] Confirmation email sends to customer
- [ ] Notification email sends to sales team
- [ ] Database updates correctly on success
- [ ] Page displays correctly on mobile devices
- [ ] SSL certificate is valid (padlock shows in browser)

### Test Credit Cards (Authorize.Net Sandbox)

**Approved Transaction:**
- Card Number: 4111 1111 1111 1111
- Expiration: Any future date
- CVV: 123

**Declined Transaction:**
- Card Number: 4000 0000 0000 0002
- Expiration: Any future date
- CVV: 123

---

## SMS Link Generation

The webhook that sends the SMS will generate links in this format:

```javascript
const paymentLink = `https://c0abc123.caspio.com/dp/abc12345000/payment?` +
  `lead_id=${encodeURIComponent(leadId)}&` +
  `name=${encodeURIComponent(customerName)}&` +
  `email=${encodeURIComponent(email)}`;
```

### Example Link:
```
https://c0abc123.caspio.com/dp/abc12345000/payment?lead_id=tb263421&name=John+Smith&email=john@example.com
```

---

## Production Deployment

### Steps:
1. Create the DataPage in Caspio Bridge
2. Configure Authorize.Net integration with LIVE credentials
3. Test with real transactions (small amounts)
4. Deploy DataPage and copy the URL
5. Update the SMS webhook with the correct DataPage URL
6. Test end-to-end flow (Facebook form → AI call → SMS → Payment → Confirmation)

### Go-Live Checklist:
- [ ] Authorize.Net in LIVE mode (not test mode)
- [ ] Confirmation emails configured
- [ ] Sales notification emails configured
- [ ] Mobile responsiveness tested
- [ ] Terms & conditions reviewed by legal
- [ ] Success/failure pages tested
- [ ] Database rules working correctly

---

## Monitoring & Reporting

### Key Metrics to Track:
- **Payment Completion Rate**: (Payments completed / Links sent)
- **Average Time to Payment**: Time from SMS sent to payment completed
- **Declined Transaction Rate**: (Declined / Total attempts)
- **Revenue**: Total $149 fees collected

### Caspio Reports to Create:
1. **Daily Payment Summary**: All payments collected today
2. **Pending Payments**: SMS sent but not yet paid
3. **Failed Payments**: Declined transactions
4. **High-Priority Leads**: Paid leads awaiting specialist contact

---

## Support & Troubleshooting

### Common Issues:

**Issue**: Link doesn't pre-fill fields
**Solution**: Check URL parameter names match exactly (case-sensitive)

**Issue**: Payment fails with "Gateway error"
**Solution**: Verify Authorize.Net credentials are correct and account is active

**Issue**: Customer doesn't receive confirmation email
**Solution**: Check email is going to spam, verify SMTP settings in Caspio

**Issue**: Link expired
**Solution**: If expiry is enabled, generate a new link via webhook

---

## Cost Analysis

**Per Transaction Fees:**
- Authorize.Net: ~$0.10 + 2.9% = ~$4.42 per $149 transaction
- Caspio: Included in monthly subscription (no per-transaction fee)

**Net Revenue**: $149 - $4.42 = **$144.58 per planning fee**

---

**This DataPage is the secure payment collection system that completes the TCPA-compliant TravelBucks lead generation funnel.**
