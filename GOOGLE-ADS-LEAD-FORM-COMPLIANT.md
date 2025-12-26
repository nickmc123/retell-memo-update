# Google Ads Lead Form - TCPA Compliant
## TravelBucks AI Voice Concierge (Production Spec)

---

## Form Configuration

**Campaign Type:** Lead Generation (Search & Display)
**Form Type:** Lead Form Extension
**Objective:** Generate qualified travel planning leads with instant callbacks
**Compliance**: TCPA, GDPR, Google Ads Policies

---

## Landing Page Headline & Description

### Headline (30 characters max)
**Option 1:** "Expert Travel Planning - Free Call"
**Option 2:** "Custom Trip Planning Service"
**Option 3:** "Travel Concierge - Call in 60s"

### Description (90 characters max)
**Option 1:**
```
Get a call from a TravelBucks travel expert within 60 seconds. AI-assisted service available.
```

**Option 2:**
```
Submit your info for instant callback. Our concierge (with AI support) will help plan your trip.
```

**Option 3:**
```
Custom travel planning with expert support. Automated/AI-assisted calls may be used. Get called now.
```

### Background Image
- High-quality travel destination photo
- 1200 x 628 pixels
- Bright, aspirational imagery (beaches, mountains, cityscapes)
- No text overlay (Google policy)

---

## Lead Form Questions

### Question 1: Full Name
- **Type:** Name
- **Label:** Your Full Name
- **Required:** Yes
- **Auto-fill:** Enabled (from Google account)

---

### Question 2: Phone Number
- **Type:** Phone Number
- **Label:** Phone Number
- **Required:** Yes
- **Auto-fill:** Enabled
- **Format:** US Phone Number
- **Help Text:** "We'll call you within 60 seconds"

---

### Question 3: Email Address
- **Type:** Email
- **Label:** Email Address
- **Required:** Yes
- **Auto-fill:** Enabled (from Google account)
- **Help Text:** "For confirmation and trip details"

---

### Question 4: Travel Destination
- **Type:** Short Answer (Text)
- **Label:** Where do you want to travel?
- **Required:** Yes
- **Placeholder:** "Paris, Caribbean, Hawaii, etc."
- **Max Length:** 100 characters

---

### Question 5: Travel Timeline
- **Type:** Multiple Choice (Dropdown)
- **Label:** When are you planning to travel?
- **Required:** Yes
- **Options:**
  - Within 1-3 months
  - 3-6 months
  - 6-12 months
  - More than a year
  - Flexible/Not sure

---

### Question 6: Number of Travelers
- **Type:** Multiple Choice (Dropdown)
- **Label:** How many travelers?
- **Required:** Yes
- **Options:**
  - 1 (Solo)
  - 2 (Couple)
  - 3-4 (Small group)
  - 5-8 (Large group)
  - 9+ (Group travel)

---

### Question 7: Budget Per Person (Optional)
- **Type:** Multiple Choice (Dropdown)
- **Label:** Estimated budget per person (optional)
- **Required:** No
- **Options:**
  - Prefer not to say
  - Under $1,500
  - $1,500 - $2,500
  - $2,500 - $4,000
  - $4,000 - $7,000
  - $7,000+

---

## ⚠️ REQUIRED CONSENT CHECKBOX (CRITICAL)

### Configuration
- **Type:** Custom Checkbox
- **Required:** YES (must be checked to submit)
- **Pre-checked:** NO (unchecked by default - REQUIRED by TCPA)
- **Position:** Immediately before submit button

### Checkbox Label
**I consent to be contacted by phone**

### Full Disclaimer Text (USE EXACTLY AS WRITTEN)
```
By checking this box and submitting this form, you expressly consent to receive
calls and text messages from TravelBucks at the phone number you provided,
including those made using automated telephone dialing systems, AI-assisted
technology, artificial or prerecorded voices, or other automated means, regarding
your travel inquiry and related services.

You understand that:
• Consent is not required as a condition of purchase
• You may receive automated or AI-assisted calls
• Message and data rates may apply
• You may revoke consent at any time by replying STOP or calling 1-800-TB-VOICE

For more information, see our Privacy Policy.
```

**LEGAL NOTES:**
- This language covers TCPA, TSR (Telemarketing Sales Rule), and Google Ads policies
- Explicitly mentions automated dialing, AI, and prerecorded messages
- States consent is optional (not required for purchase)
- Provides clear opt-out mechanism
- Must remain unchecked by default (CRITICAL)

---

## Privacy Policy Link

**Required by Google Ads**: You MUST link to a privacy policy

**Privacy Policy URL:** https://travelbucks.com/privacy

**Policy must include:**
- How phone numbers are used
- Who will contact the user (TravelBucks)
- What technology is used (automated/AI systems)
- How to opt out of communications
- Data retention and deletion policy
- Third-party sharing (if any)
- CCPA compliance (California users)
- GDPR compliance (EU users, if applicable)

---

## Thank You Screen

### Headline
**📞 We're Calling You Now!**

### Body Text
```
Thank you for your travel inquiry!

A TravelBucks concierge will contact you shortly using automated,
AI-assisted, or pre-recorded technology.

Please keep your phone nearby and answer calls from unknown numbers.

What to expect:
✓ Call within 60 seconds
✓ Brief travel qualification questions
✓ Custom planning options presented
✓ Secure payment link if applicable

Questions? Call 1-800-TB-VOICE
```

### Call-to-Action Button
- **Text:** "Done"
- **Action:** Close form or redirect to https://travelbucks.com

---

## Webhook Integration

### Google Ads Webhook Configuration

Google doesn't have native webhooks like Facebook. You'll need to use:

**Option A: Google Ads API + Apps Script**
1. Set up Google Apps Script to poll for new leads
2. Send leads to your Railway webhook

**Option B: Zapier/Make Integration**
1. Connect Google Ads to Zapier
2. Trigger: New Lead Form Submission
3. Action: POST to Railway webhook

**Option C: Lead Download + Manual Import**
1. Download leads daily from Google Ads
2. Import to Caspio manually or via scheduled script

### Recommended: Option A (Apps Script)

**Google Apps Script Setup:**

```javascript
// Google Apps Script - runs every 5 minutes
function processGoogleAdsLeads() {
  var WEBHOOK_URL = 'https://travelbucks-voice-ops-production.up.railway.app/webhooks/google-leads';
  var GOOGLE_ADS_CUSTOMER_ID = 'your-customer-id';

  // Fetch leads from last 5 minutes
  var leads = AdsApp.extensions()
    .leadFormExtensions()
    .get();

  while (leads.hasNext()) {
    var lead = leads.next();
    var leadData = lead.getLeadFormSubmissions();

    // Process each new submission
    leadData.forEach(function(submission) {
      var payload = {
        lead_id: generateLeadId(),
        full_name: submission.getFieldValue('full_name'),
        phone: submission.getFieldValue('phone'),
        email: submission.getFieldValue('email'),
        destination: submission.getFieldValue('destination'),
        travel_timeline: submission.getFieldValue('travel_timeline'),
        travelers_count: submission.getFieldValue('travelers_count'),
        budget_range: submission.getFieldValue('budget_range') || 'Not provided',
        consent_given: submission.getFieldValue('consent_checkbox') === 'true',
        source: 'google_ads',
        campaign_id: lead.getCampaign().getId(),
        campaign_name: lead.getCampaign().getName()
      };

      // Send to webhook
      sendToWebhook(WEBHOOK_URL, payload);
    });
  }
}

function sendToWebhook(url, data) {
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(data)
  };

  UrlFetchApp.fetch(url, options);
}

function generateLeadId() {
  return 'tb' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
}

// Set up time-based trigger to run every 5 minutes
```

---

## Google Ads Campaign Structure

### Campaign Settings

**Campaign Type:** Search
**Campaign Goal:** Leads
**Bidding Strategy:** Maximize Conversions (or Target CPA after learning phase)
**Budget:** Start with $50-100/day
**Networks:** Google Search only (disable Display initially)
**Locations:** United States (or specific states)
**Languages:** English

---

## Search Ad Copy (Responsive Search Ads)

### Headlines (15 max, 30 characters each)

1. "Expert Travel Planning Service"
2. "Custom Trip Itineraries"
3. "Get Called in 60 Seconds"
4. "TravelBucks Travel Concierge"
5. "Wholesale Travel Pricing"
6. "Personalized Trip Planning"
7. "Save 40-70% on Travel"
8. "Free Planning Consultation"
9. "24/7 Travel Support"
10. "Honeymoon Planning Experts"
11. "Group Travel Specialists"
12. "Luxury Travel Advisors"
13. "AI-Assisted Travel Help"
14. "Instant Travel Callback"
15. "Custom Vacation Packages"

### Descriptions (4 max, 90 characters each)

1. "Submit your info for instant callback. Our travel experts (with AI support) will help plan your perfect trip."

2. "Get personalized trip planning from TravelBucks specialists. Automated/AI-assisted service available 24/7."

3. "We'll call you within 60 seconds to discuss your travel plans. Custom itineraries at wholesale pricing."

4. "Travel planning concierge service. May include automated or AI-assisted calls. Consent not required to purchase."

### Display URL Path
- **Path 1:** Travel-Planning
- **Path 2:** Get-Called-Now

**Example Final URL:**
```
www.travelbucks.com/Travel-Planning/Get-Called-Now
```

---

## Keyword Targeting

### High-Intent Keywords (Exact & Phrase Match)

**Planning/Concierge Keywords:**
- [travel planning service]
- [custom travel planning]
- [travel concierge service]
- [personal travel advisor]
- [vacation planning help]
- [trip planning consultant]

**Destination-Specific:**
- [plan my trip to hawaii]
- [caribbean vacation planner]
- [europe travel planning]
- [honeymoon planner]
- [group travel coordinator]

**Service-Specific:**
- [travel agent near me]
- [help planning a vacation]
- [custom trip itinerary]
- [all inclusive vacation planner]

**Budget/Savings:**
- [cheap vacation packages]
- [wholesale travel pricing]
- [travel club membership]
- [discount travel service]

### Negative Keywords (Exclude)
- cheap flights (too transactional)
- free (attracts non-buyers)
- DIY (self-service seekers)
- last minute (not planning-focused)
- backpacking (budget travelers)
- hostel (not target demographic)
- jobs, careers (not customer searches)

---

## Display/YouTube Ad Creative

### Display Ad Variations

**Banner Sizes Required:**
- 300×250 (Medium Rectangle)
- 728×90 (Leaderboard)
- 160×600 (Wide Skyscraper)
- 300×600 (Half Page)
- 320×50 (Mobile Banner)

**Responsive Display Ad Assets:**

**Headlines:**
- "Expert Travel Planning"
- "Custom Trip Concierge"
- "Get Called in 60 Seconds"

**Descriptions:**
- "Submit your info for instant callback from TravelBucks travel experts"
- "AI-assisted service available 24/7. Custom trip planning at wholesale prices"

**Images:**
- High-quality travel destination photos
- Families on vacation
- Couples at romantic destinations
- Groups enjoying activities

**Logo:** TravelBucks logo (landscape and square versions)

---

## YouTube Video Ad Script (15 seconds)

### Video Script

**Visual**: Beautiful travel montage (beaches, mountains, cities)

**Voiceover:**
```
"Planning a trip? Get expert help in 60 seconds.

TravelBucks travel concierge - with AI support - will call you
to design your perfect vacation at wholesale pricing.

Click to get your instant callback now."
```

**On-Screen Text:**
- "Expert Travel Planning"
- "Get Called in 60 Seconds"
- "Click for Instant Callback"

**CTA Button:** "Get My Callback"

**Disclaimer (small text at bottom):**
"May include automated/AI-assisted calls. Consent not required for purchase."

---

## Compliance Checklist

Before launching Google Ads, verify:

### Google Ads Policy Compliance
- [ ] Privacy policy linked and accessible
- [ ] Consent checkbox present and unchecked by default
- [ ] No misleading claims (e.g., "free" if fees apply later)
- [ ] Accurate business information
- [ ] Working phone number displayed
- [ ] No restricted content (healthcare claims, financial advice)

### TCPA Compliance
- [ ] Consent checkbox UNCHECKED by default
- [ ] Consent language explicitly mentions automated/AI calls
- [ ] "Not required for purchase" statement included
- [ ] Opt-out mechanism provided
- [ ] Only consented leads receive callbacks

### Google-Specific Requirements
- [ ] Lead form has minimum 3 fields
- [ ] Privacy policy link present
- [ ] Business verification completed
- [ ] Phone number verified in Google My Business
- [ ] Website matches ad claims

---

## Tracking & Conversion Setup

### Google Ads Conversion Tracking

**Conversion Actions to Track:**

1. **Lead Form Submission**
   - Type: Submit Lead Form
   - Value: $10 (estimated lead value)
   - Count: One

2. **Phone Call Answered**
   - Type: Phone Call
   - Value: $25
   - Count: One
   - Minimum call length: 60 seconds

3. **Planning Fee Accepted**
   - Type: Import from Caspio
   - Value: $149
   - Count: One

4. **Payment Completed**
   - Type: Import from Caspio
   - Value: $149
   - Count: One (most valuable)

### Enhanced Conversions Setup

Add this code to your thank you page:

```html
<script>
gtag('set', 'user_data', {
  "email": "[@field:Email]",
  "phone_number": "[@field:Phone]",
  "address": {
    "first_name": "[@field:FirstName]",
    "last_name": "[@field:LastName]"
  }
});

gtag('event', 'conversion', {
  'send_to': 'AW-XXXXXXXXX/YYYYYYYY',
  'value': 149.0,
  'currency': 'USD',
  'transaction_id': '[@field:LeadID]'
});
</script>
```

---

## Budget & Bidding Recommendations

### Phase 1: Learning (Week 1-2)
- **Daily Budget:** $50-75/day
- **Bidding:** Maximize Conversions
- **Expected CPL:** $10-20 per lead
- **Expected Leads:** 3-5 per day

### Phase 2: Optimization (Week 3-4)
- **Daily Budget:** $100-150/day
- **Bidding:** Target CPA ($15-20)
- **Expected CPL:** $8-15 per lead
- **Expected Leads:** 7-12 per day

### Phase 3: Scaling (Month 2+)
- **Daily Budget:** $200-500/day
- **Bidding:** Target ROAS (500%+)
- **Expected CPL:** $5-12 per lead
- **Expected Leads:** 20-50 per day

---

## Testing Strategy

### A/B Tests to Run

**Week 1-2: Ad Copy Testing**
- Test 3 different headline combinations
- Test 2 different description approaches
- Test with/without "AI" mention

**Week 3-4: Landing Page Testing**
- Test different consent checkbox placements
- Test different "60 seconds" vs "instant" language
- Test different destination imagery

**Month 2: Audience Testing**
- In-market audiences (travel planning)
- Custom intent audiences (travel searches)
- Remarketing (website visitors)

---

## Recommended Ad Extensions

**Sitelink Extensions:**
1. "About TravelBucks" → https://travelbucks.com/about
2. "How It Works" → https://travelbucks.com/how-it-works
3. "Pricing" → https://travelbucks.com/pricing
4. "Contact Us" → https://travelbucks.com/contact

**Callout Extensions:**
- "24/7 Availability"
- "Wholesale Pricing"
- "Custom Itineraries"
- "Expert Planning"
- "No Hidden Fees"
- "Money Back Guarantee"

**Structured Snippets:**
- **Destinations:** Caribbean, Europe, Hawaii, Mexico, Asia
- **Services:** Trip Planning, Booking Assistance, 24/7 Support
- **Specialties:** Honeymoons, Groups, Luxury Travel, Cruises

**Call Extension:**
- Phone: 1-800-TB-VOICE
- Click-to-Call: Enabled
- Call Reporting: Enabled
- Minimum Call Length: 60 seconds for conversion

**Location Extension:**
- Enable if you have physical offices
- Otherwise, disable

---

## Remarketing Strategy

### Remarketing Audiences to Create

**1. Lead Form Viewers (didn't submit)**
- 30-day window
- Message: "Still planning your trip? Get instant help now."

**2. Lead Form Submitters (no payment)**
- 7-day window
- Message: "Complete your $149 planning fee to get started"

**3. Website Visitors (didn't convert)**
- 90-day window
- Message: "Expert travel planning - get called in 60 seconds"

**4. Payment Completed (upsell)**
- 180-day window
- Message: "Plan your next adventure with TravelBucks"

---

## What NOT to Do (Google Ads Violations)

❌ **DO NOT:**
- Use "free" if there are any fees (planning fee)
- Make healthcare claims
- Imply guaranteed savings without proof
- Use excessive punctuation (!!!)
- Use all caps in headlines
- Make countdown claims ("Only 3 spots left!")
- Collect sensitive info (SSN, financial data)
- Auto-check consent checkbox
- Hide consent language in fine print

✅ **DO:**
- Be transparent about AI/automated calls
- Link to valid privacy policy
- Provide working phone number
- Honor opt-out requests immediately
- Use accurate business information
- Comply with destination advertising policies

---

## Launch Checklist

Before turning on Google Ads:

- [ ] Privacy policy published and linked
- [ ] Consent checkbox unchecked by default
- [ ] Google Ads account verified
- [ ] Billing information added
- [ ] Conversion tracking installed
- [ ] Phone number verified
- [ ] Landing page live and tested
- [ ] Webhook receiving leads correctly
- [ ] AI callback system tested
- [ ] Legal team reviewed consent language
- [ ] Compliance documentation saved

---

## Expected Performance

### Conservative Projections (Month 1)

**Budget:** $1,500 ($50/day)
**Leads:** 100-150 leads
**CPL:** $10-15 per lead
**Consent Rate:** 75% (75-113 consented)
**Call Answer Rate:** 60% (45-68 calls)
**Planning Fee Acceptance:** 30% (14-20 accepted)
**Payment Completion:** 50% (7-10 paid)

**Revenue:** 7-10 × $149 = **$1,043 - $1,490**
**ROI:** -30% to -1% (break-even or slight loss in Month 1)

### Optimized Performance (Month 3+)

**Budget:** $3,000 ($100/day)
**Leads:** 250-300 leads
**CPL:** $10-12 per lead
**Consent Rate:** 80%
**Call Answer Rate:** 70%
**Planning Fee Acceptance:** 35%
**Payment Completion:** 60%

**Revenue:** 30-35 × $149 = **$4,470 - $5,215**
**ROI:** 49% - 74%

---

## Integration with Existing System

This Google Ads setup integrates seamlessly with your existing TravelBucks system:

1. **Leads from Google** → Railway webhook → Caspio
2. **Same AI callback flow** (Retell AI agent)
3. **Same SMS payment system** (Caspio + Twilio)
4. **Same compliance requirements** (TCPA + AI disclosure)

**Only difference:** Lead source = "google_ads" instead of "facebook"

---

**This Google Ads configuration is TCPA compliant and ready to deploy alongside your Facebook campaigns.**
