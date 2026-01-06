# Facebook Lead Ads Campaign Setup - TravelBucks $999 Offer

## Campaign Overview

This document provides complete setup instructions for Facebook Lead Ads campaigns promoting the "Choose Your Dream Getaway — from $999" TravelBucks promotional offer.

---

## Campaign Configuration

### Campaign Objective
- **Objective**: Lead Generation
- **Campaign Name**: `TravelBucks - Choose Your Getaway - [Date]`

### Ad Set Settings
| Setting | Value |
|---------|-------|
| Conversion Location | Instant Forms |
| Optimization | Leads |
| Budget | Daily or Lifetime (as needed) |
| Bid Strategy | Lowest Cost or Cost Cap |
| Audience | See targeting below |
| Placements | Automatic (recommended) or Facebook/Instagram feeds |

---

## Audience Targeting

### Demographics
- **Age**: 25-65
- **Gender**: All
- **Location**: United States (or specific states)

### Interests (Choose 3-5)
- Travel
- Vacation
- Beach holidays
- Cruises
- Las Vegas
- Hawaii
- All-inclusive resorts
- Travel deals
- Booking.com
- Expedia
- TripAdvisor

### Behaviors
- Frequent travelers
- Recently returned from trip
- Upcoming anniversary
- Newlyweds
- Credit card users (travel rewards)

### Exclusions
- Existing customers (upload list)
- Previous purchasers

---

## Lead Form Configuration

### Form Type
- **Higher Intent** (requires more commitment, better quality leads)

### Form Fields

| Field | Type | Required |
|-------|------|----------|
| Full Name | Pre-filled from FB | Yes |
| Phone Number | Pre-filled from FB | Yes |
| Email | Pre-filled from FB | No |
| Destination Interest | Multiple Choice | Yes |

#### Destination Interest Options
- Hawaii
- Cancun/Mexico
- Las Vegas
- Orlando/Florida
- Caribbean Cruise
- I'm flexible/Open to options

### REQUIRED: Privacy Policy & Consent

#### Privacy Policy Link
Must link to your privacy policy URL (required by Facebook)

#### Custom Disclaimer (REQUIRED - Use Verbatim)

Add this as a **Custom Disclaimer** checkbox that users MUST check to submit:

```
By checking this box and submitting this form, you expressly consent to receive calls and text messages from TravelBucks, including those made using automated dialing systems, AI-assisted technology, or pre-recorded messages, regarding your travel inquiry. Consent is not a condition of purchase. Message and data rates may apply. You may opt out at any time.
```

**IMPORTANT**: This checkbox must be:
1. Clearly visible
2. Required to submit (not optional)
3. Separate from the Privacy Policy acknowledgment

---

## Thank You Screen

### Headline
```
Thanks for Your Interest!
```

### Description
```
A TravelBucks travel specialist will call you shortly to help you choose your dream getaway. Keep your phone handy!

While you wait, here's what's included in your $999 package:
- Your choice of vacation destination
- Bonus 2-night hotel stay
- $100 dining credit

We can't wait to help you plan an amazing trip!
```

### Call-to-Action Button
- **Button Text**: Learn More
- **Link**: Your website or landing page URL

---

## Ad Creative

### Primary Text Options

#### Option A: Value-Focused
```
Your Dream Vacation is Closer Than You Think

For just $999, choose from destinations like Hawaii, Cancun, Las Vegas, or a Caribbean cruise. PLUS get bonus hotel nights and dining credit!

Limited promotional packages available. Tap below to reserve yours.
```

#### Option B: Urgency-Focused
```
JUST RELEASED: Exclusive Vacation Packages from $999

Pick your paradise:
- Hawaii
- Cancun
- Las Vegas
- Orlando
- Cruises & More

Includes bonus 2-night hotel stay + $100 dining credit

These won't last! Get details now.
```

#### Option C: Question-Based
```
Where would you escape to if you could?

For just $999, you can turn that dream into reality. Choose from Hawaii, Mexico, Vegas, Florida, or a cruise — and we'll add bonus hotel nights + dining credit.

Tap to see if you qualify for this exclusive offer.
```

#### Option D: Testimonial-Style
```
"I couldn't believe what was included for $999" - Sarah M., TX

Choose your dream destination:
- Hawaii beaches
- Cancun all-inclusive vibes
- Vegas excitement
- Orlando adventures
- Caribbean cruising

Plus bonus hotel nights & $100 dining credit!

See if you qualify.
```

### Headlines (Choose 2-3 to Test)

1. `Choose Your Dream Getaway — From $999`
2. `Hawaii, Cancun, Vegas & More — Just $999`
3. `Your $999 Vacation Awaits`
4. `Pick Your Paradise — Limited Offer`
5. `Exclusive: Premium Vacations from $999`

### Description (Under Headline)

1. `Includes bonus hotel stay + dining credit. Limited time.`
2. `Choose your destination. Includes bonuses.`
3. `Premium vacation packages with bonuses included.`

### Call-to-Action Button

- **Sign Up** (preferred for Lead Ads)
- **Get Quote**
- **Learn More**

---

## Webhook Integration (Lead Sync)

### Option 1: Zapier Integration

1. Create a Zap with trigger: **Facebook Lead Ads - New Lead**
2. Add action: **Webhooks by Zapier - POST**
3. Configure POST request:

```
URL: https://travelbucks-voice-ops-production.up.railway.app/lead
Method: POST
Headers:
  Content-Type: application/json
Body:
{
  "full_name": "{{full_name}}",
  "phone": "{{phone_number}}",
  "email": "{{email}}",
  "source": "facebook",
  "destination_interest": "{{destination_interest}}",
  "consent_checkbox": true,
  "consent_timestamp": "{{created_time}}"
}
```

### Option 2: Direct Facebook Webhooks

1. Go to **Facebook Developer Console**
2. Create/select your app
3. Add **Webhooks** product
4. Subscribe to `leadgen` events
5. Configure callback URL: `https://travelbucks-voice-ops-production.up.railway.app/facebook/webhook`
6. Verify token: Your APP_SECRET

Note: This requires additional endpoint implementation in the API.

### Option 3: Make (Integromat) Integration

Similar to Zapier - use Facebook Lead Ads trigger and HTTP module to POST to the Railway API.

---

## Image/Video Creative Guidelines

### Image Specs
- **Size**: 1080 x 1080 (square) or 1200 x 628 (landscape)
- **Format**: JPG or PNG
- **Text**: Less than 20% of image area

### Recommended Image Concepts
1. Beautiful destination photos (Hawaii beach, Cancun resort, Vegas strip)
2. Happy travelers/couples
3. Collage of multiple destinations
4. Text overlay with "$999" prominently displayed

### Video Specs (Optional)
- **Length**: 15-30 seconds recommended
- **Aspect Ratio**: 1:1 (square) or 4:5 (vertical)
- **Format**: MP4 or MOV

### Video Concepts
1. Quick cuts of destination highlights
2. "Choose your adventure" style with destination options
3. Testimonial-style with vacation footage

---

## A/B Testing Recommendations

### Week 1-2: Test Headlines
- Run 3 headline variants with same image/copy
- Keep the winner

### Week 3-4: Test Primary Text
- Run 3 copy variants with winning headline
- Keep the winner

### Week 5+: Test Audiences
- Narrow interest targeting
- Lookalike audiences (if you have customer data)
- Different age brackets

---

## Budget Recommendations

### Starting Budget
- **Daily**: $50-100/day
- **Monthly**: $1,500-3,000

### Cost Expectations
- **CPL (Cost Per Lead)**: $5-15 (varies by targeting/creative)
- **Quality leads**: Expect 10-20% to become qualified

### Scaling
- Increase budget by 20-30% every 3-4 days if CPL is stable
- Add new ad sets for different audiences
- Test new creative weekly

---

## Compliance Checklist

Before launching, verify:

- [ ] Privacy Policy link is active and accurate
- [ ] TCPA consent checkbox uses exact language provided
- [ ] Consent checkbox is REQUIRED (not optional)
- [ ] Thank you screen sets proper expectations
- [ ] Webhook integration is tested and working
- [ ] Lead response time is under 5 minutes (ideal)
- [ ] Opt-out process is documented and functional

---

## Tracking & Reporting

### Key Metrics to Monitor
- **Leads Generated**: Total form submissions
- **CPL (Cost Per Lead)**: Ad spend / leads
- **Lead-to-Call Rate**: Leads contacted / leads generated
- **Qualification Rate**: Qualified leads / leads contacted
- **Conversion Rate**: Payments / qualified leads
- **ROAS**: Revenue / ad spend

### Recommended Tools
- Facebook Ads Manager (native reporting)
- UTM parameters for landing page tracking
- CRM integration for lead scoring

---

## Sample Campaign Structure

```
Campaign: TravelBucks - Choose Your Getaway - Q1 2025
├── Ad Set: Interest - Travel Enthusiasts (25-45)
│   ├── Ad 1: Value-Focused Copy + Beach Image
│   ├── Ad 2: Urgency-Focused Copy + Beach Image
│   └── Ad 3: Value-Focused Copy + Collage Image
├── Ad Set: Interest - Cruise Lovers (35-65)
│   ├── Ad 1: Value-Focused Copy + Cruise Image
│   └── Ad 2: Urgency-Focused Copy + Cruise Image
└── Ad Set: Lookalike - Past Customers (1%)
    ├── Ad 1: Testimonial-Style + Destination Image
    └── Ad 2: Value-Focused Copy + Destination Image
```

---

## Related Documentation

- [Retell Agent Prompt](./retell_agent_prompt.md) - How leads are contacted
- [Caspio Data Model](./caspio_data_model.md) - Lead data structure
- [Deployment Checklist](./deployment_checklist.md) - Full system setup
