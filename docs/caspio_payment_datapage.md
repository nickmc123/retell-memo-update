# Caspio Payment DataPage Setup with Authorize.Net

This document provides step-by-step instructions for creating a Caspio DataPage that collects $999 activation payments via Authorize.Net.

---

## Overview

The payment page:
1. Accepts `lead_id` as a URL parameter
2. Displays offer summary and disclosures
3. Collects payment via Authorize.Net Accept.js (hosted form)
4. Updates `TravelBucks_Leads` on success/failure
5. Triggers webhook to Railway API
6. Redirects to confirmation page

---

## Prerequisites

1. **Caspio Account** with REST API enabled
2. **Authorize.Net Account** (Sandbox for testing, Production for live)
   - API Login ID
   - Transaction Key
   - Public Client Key (for Accept.js)
3. **TravelBucks_Leads table** created (see [caspio_data_model.md](./caspio_data_model.md))
4. **Railway API** deployed and accessible

---

## Step 1: Create the Payment DataPage

### 1.1 Navigate to DataPages
1. Log in to Caspio
2. Click **DataPages** in the left sidebar
3. Click **New DataPage**

### 1.2 Select DataPage Type
1. Choose **Submission Form**
2. Click **Next**

### 1.3 Select Data Source
1. Choose **TravelBucks_Leads** table
2. Click **Next**

### 1.4 Configure Authentication (Optional)
1. For public access, select **No authentication required**
2. Click **Next**

### 1.5 Select Form Type
1. Choose **Single Record Update**
2. Click **Next**

### 1.6 Configure Record Selection
1. **Receive value from**: External Parameter
2. **Parameter name**: `lead_id`
3. **Compare with field**: `lead_id`
4. Click **Next**

---

## Step 2: Design the Form Layout

### 2.1 Header Section

Add an **HTML Block** at the top with this content:

```html
<div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
    <h1 style="color: #2c5282; text-align: center;">
        Activate Your TravelBucks Promotional Package
    </h1>

    <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2d3748; margin-top: 0;">What's Included:</h3>
        <ul style="color: #4a5568; line-height: 1.8;">
            <li><strong>Select one primary vacation or cruise option</strong></li>
            <li><strong>Bonus 2-night hotel stay</strong> (redeemed separately)</li>
            <li><strong>$100 promotional dining</strong> (certificate/credit; separate terms)</li>
        </ul>
    </div>

    <div style="background: #ebf8ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3182ce;">
        <p style="margin: 0; font-size: 14px; color: #2c5282;">
            <strong>Activation Price: $999</strong>
        </p>
    </div>
</div>
```

### 2.2 Lead Information Display

Add **Calculated Fields** or **Display Fields** to show:
- Full Name (read-only)
- Phone (read-only)
- Email (read-only, if provided)
- Destination Interest (read-only)

### 2.3 Acknowledgment Checkbox

Add a **Virtual Field** of type Checkbox:

**Field Label:** Agreement

**HTML Block before checkbox:**
```html
<div style="background: #fffaf0; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ed8936;">
    <p style="margin: 0; font-size: 13px; color: #744210;">
        <strong>IMPORTANT:</strong> The $999 activation price applies to one selected promotional travel package.
        Final travel dates, departure cities/ports, and inclusions vary by destination. Taxes, fees, and
        optional upgrades may apply. Bonus items are redeemed separately and subject to their own terms.
    </p>
</div>
```

**Checkbox text:**
> I understand this is a promotional travel package with availability, taxes, fees, and restrictions that vary by destination.

**Make this field REQUIRED.**

---

## Step 3: Configure Authorize.Net Payment

### 3.1 Enable Payment Processing

In the DataPage Wizard:
1. Go to **Payment** section
2. Enable **Accept Payments**
3. Select **Authorize.Net** as the payment processor

### 3.2 Enter Authorize.Net Credentials

**For Sandbox Testing:**
```
API Login ID: [Your Sandbox API Login ID]
Transaction Key: [Your Sandbox Transaction Key]
Test Mode: Enabled
```

**For Production:**
```
API Login ID: [Your Production API Login ID]
Transaction Key: [Your Production Transaction Key]
Test Mode: Disabled
```

### 3.3 Configure Payment Fields

| Setting | Value |
|---------|-------|
| Amount | Fixed: `999` (or use field: `planning_fee_amount`) |
| Currency | USD |
| Description | TravelBucks Package Activation |
| Invoice Number | Use formula: `[@lead_id]` |

### 3.4 Payment Form Fields

Enable these fields in the payment form:
- Credit Card Number
- Expiration Date
- CVV/Security Code
- Billing Name
- Billing Address (optional)
- Billing Zip Code

---

## Step 4: Configure Success/Failure Actions

### 4.1 On Payment Success

1. **Update Fields:**
   - `payment_status` = `paid`
   - `status` = `paid`
   - `transaction_id` = `[@authnet_transaction_id]` (or equivalent Caspio variable)
   - `updated_at` = `[@cbTimestamp]`

2. **Redirect to Success Page:**
   - Create a separate "Confirmation" DataPage
   - Or redirect to: `https://yourdomain.com/payment-success?lead_id=[@lead_id]`

### 4.2 On Payment Failure

1. **Update Fields:**
   - `payment_status` = `failed`
   - `updated_at` = `[@cbTimestamp]`

2. **Display Error Message:**
   - Show friendly message
   - Allow retry

---

## Step 5: Trigger Webhook to Railway API

### Option A: Using Caspio Triggered Actions (Recommended)

If your Caspio plan supports **Triggered Actions**:

1. Go to **Tables** > **TravelBucks_Leads** > **Triggered Actions**
2. Create new trigger:
   - **Name:** Payment Webhook
   - **When:** After Update
   - **Condition:** `[@payment_status]` = `paid` OR `[@payment_status]` = `failed`
   - **Action:** HTTP Request

3. Configure HTTP Request:
```
Method: POST
URL: https://travelbucks-voice-ops-production.up.railway.app/webhooks/payment
Headers:
  Content-Type: application/json
  X-App-Secret: [YOUR_APP_SECRET]
Body:
{
  "lead_id": [@lead_id],
  "status": "[@payment_status]",
  "transaction_id": "[@transaction_id]",
  "amount": [@planning_fee_amount]
}
```

### Option B: JavaScript Webhook (If Triggered Actions Unavailable)

Add this to the **Success** page HTML Block:

```html
<script>
(function() {
    var leadId = '[@lead_id]';
    var status = '[@payment_status]';
    var transactionId = '[@transaction_id]';
    var amount = '[@planning_fee_amount]';

    var webhookUrl = 'https://travelbucks-voice-ops-production.up.railway.app/webhooks/payment';

    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-App-Secret': 'YOUR_APP_SECRET_HERE'
        },
        body: JSON.stringify({
            lead_id: parseInt(leadId),
            status: status,
            transaction_id: transactionId,
            amount: parseFloat(amount)
        })
    }).then(function(response) {
        console.log('Webhook sent:', response.status);
    }).catch(function(error) {
        console.error('Webhook error:', error);
    });
})();
</script>
```

### Option C: Hidden Image/Pixel (Fallback)

If JavaScript is blocked, use a hidden image:

```html
<img src="https://travelbucks-voice-ops-production.up.railway.app/webhooks/payment-pixel?lead_id=[@lead_id]&status=[@payment_status]&transaction_id=[@transaction_id]&secret=YOUR_APP_SECRET"
     style="display:none"
     width="1"
     height="1"
     alt="" />
```

Note: This requires adding a GET endpoint to the Railway API.

---

## Step 6: Create Confirmation DataPage

### 6.1 Create New DataPage
1. Type: **Report** or **Details Page**
2. Data Source: **TravelBucks_Leads**
3. Filter by: `lead_id` from external parameter

### 6.2 Confirmation Page Content

```html
<div style="max-width: 600px; margin: 50px auto; text-align: center; font-family: Arial, sans-serif;">
    <div style="background: #c6f6d5; padding: 30px; border-radius: 12px;">
        <h1 style="color: #276749; margin-top: 0;">Payment Successful!</h1>
        <p style="font-size: 18px; color: #2d3748;">
            Thank you for activating your TravelBucks package.
        </p>
    </div>

    <div style="margin-top: 30px; padding: 20px; background: #f7fafc; border-radius: 8px;">
        <h3 style="color: #2d3748;">What's Next?</h3>
        <ol style="text-align: left; color: #4a5568; line-height: 2;">
            <li>You'll receive a confirmation email shortly</li>
            <li>A travel specialist will contact you within 24-48 hours</li>
            <li>Have your destination preferences ready to discuss</li>
        </ol>
    </div>

    <div style="margin-top: 30px; padding: 15px; background: #ebf8ff; border-radius: 8px;">
        <p style="margin: 0; color: #2c5282;">
            <strong>Confirmation Number:</strong> [@transaction_id]<br>
            <strong>Amount Paid:</strong> $[@planning_fee_amount]
        </p>
    </div>

    <p style="margin-top: 30px; color: #718096; font-size: 14px;">
        Questions? Contact us at support@travelbucks.com
    </p>
</div>
```

---

## Step 7: Deploy and Test

### 7.1 Deploy the DataPage
1. Click **Finish** to save the DataPage
2. Go to **Deploy** tab
3. Copy the **Deploy Code** or **Direct URL**

### 7.2 Get the DataPage URL

The URL will be something like:
```
https://***REMOVED***.caspio.com/dp/abc123def456
```

Update your Railway environment variable:
```
PAYMENT_PAGE_BASE_URL=https://***REMOVED***.caspio.com/dp/abc123def456
```

### 7.3 Test Flow

1. **Create test lead via API:**
```bash
curl -X POST "https://travelbucks-voice-ops-production.up.railway.app/lead" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "phone": "+15551234567",
    "destination_interest": "Hawaii",
    "consent_checkbox": true
  }'
```

2. **Generate payment link:**
```bash
curl -X POST "https://travelbucks-voice-ops-production.up.railway.app/payment-link" \
  -H "Content-Type: application/json" \
  -d '{"lead_id": 1}'
```

3. **Open the payment link in browser**

4. **Use test card:**
   - Card: `4111111111111111`
   - Exp: Any future date
   - CVV: `123`

5. **Verify webhook received:**
   - Check Railway logs
   - Verify lead status updated in Caspio

---

## Security Considerations

1. **Never expose API credentials** in client-side code
2. **Validate APP_SECRET** on all webhook endpoints
3. **Use HTTPS** for all URLs
4. **Enable CORS** only for trusted origins
5. **Log all payment attempts** for audit trail
6. **Implement rate limiting** on payment endpoints

---

## Authorize.Net Sandbox Test Cards

| Card Number | Result |
|-------------|--------|
| `4111111111111111` | Approved |
| `4012888818888` | Approved |
| `5424000000000015` | Approved (Mastercard) |
| `370000000000002` | Approved (Amex) |
| `4000000000000002` | Declined |
| `4000000000000119` | Declined (Referral) |

Use any future expiration date and any 3-4 digit CVV.

---

## Troubleshooting

### Payment Not Processing
- Verify Authorize.Net credentials
- Check test mode setting
- Review Caspio DataPage logs

### Webhook Not Firing
- Check Railway app logs
- Verify APP_SECRET matches
- Test webhook endpoint manually

### Lead Not Found
- Ensure lead_id parameter is passed correctly
- Check TravelBucks_Leads table for record
- Verify URL encoding

---

## Related Documentation

- [Caspio Data Model](./caspio_data_model.md)
- [Deployment Checklist](./deployment_checklist.md)
- [Authorize.Net Accept.js Documentation](https://developer.authorize.net/api/reference/features/acceptjs.html)
