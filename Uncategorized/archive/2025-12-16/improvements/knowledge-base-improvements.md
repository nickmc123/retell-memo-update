# Knowledge Base Content Improvements
## Goal: Increase resolution rate from 34.7% to 60%+

Based on call analysis showing top issue categories and resolution gaps, these knowledge base improvements will enable the AI agent to resolve more issues without transfer.

---

## PRIORITY 1: Top Issue Categories (Critical Content Gaps)

### 1. Travel Date Scheduling (13 calls, 6.4% of volume)

**Current Problem:** Most common issue category, likely requires transfer

**Knowledge Base Addition:**

```markdown
# Travel Date Scheduling

## Overview
Customers can schedule travel dates for their vacation packages after activation and deposit payment.

## Eligibility Requirements
- Certificate must be activated
- Deposit must be paid in full ($99 per person)
- Booking must be made at least 60 days in advance
- Travel dates must be within 12-18 months from activation date

## Available Travel Windows
- Most packages: Valid for 12-18 months from activation
- Blackout dates: Major holidays (Thanksgiving week, Christmas week, New Year's week)
- Peak seasons may have limited availability

## How to Schedule
1. **Online Portal:** Log into customer portal at [PORTAL_URL]
   - Navigate to "Book Travel"
   - Select destination and dates
   - Submit request (requires 48-hour approval)

2. **Phone Reservations:** Call 1-800-XXX-XXXX
   - Available Mon-Fri 8AM-8PM EST, Sat 9AM-5PM EST
   - Have certificate number and preferred dates ready
   - Agent will check availability and confirm

## Timeline
- Minimum advance notice: 60 days before travel
- Booking confirmation: Within 48 hours of request
- Changes to reservation: Must be made 30+ days before travel

## Common Questions
Q: Can I book less than 60 days out?
A: No, our supplier partners require 60-day minimum advance booking.

Q: What if my preferred dates aren't available?
A: Our reservations team will offer alternative dates within 7 days of your preference.

Q: Can I extend my 12-month validity window?
A: Extensions may be available for a fee. Contact customer service.
```

**AI Agent Script Guidance:**
- If customer asks about scheduling: "I can help with that! To schedule your travel dates, you'll need to..."
- If dates are less than 60 days away: "I understand you want to travel soon. Unfortunately, our booking system requires at least 60 days advance notice. Would you like to look at dates 60+ days from now?"
- If customer needs immediate booking: Offer transfer to reservations team

---

### 2. Deposit Payment Information (Deposit questions identified in analysis)

**Current Problem:** Common question, creates friction in activation process

**Knowledge Base Addition:**

```markdown
# Deposit Payment

## Deposit Amount
- Standard: $99 per person
- Example: Family of 4 = $396 total deposit
- Non-refundable once package is activated

## Payment Methods
- Credit card (Visa, Mastercard, Amex, Discover)
- Debit card
- NOT accepted: PayPal, Venmo, checks, money orders

## How to Pay
### Option 1: Online (Fastest)
1. Visit [CUSTOMER_PORTAL_URL]
2. Log in with your email and certificate code
3. Click "Pay Deposit"
4. Enter payment details
5. Confirmation instant

### Option 2: Phone
1. Call payment line: 1-800-XXX-XXXX
2. Have certificate code and payment method ready
3. Processing time: 5-10 minutes

## Timeline
- Due date: Within 7 days of receiving certificate
- Late payment: Certificate may expire and require reactivation fee
- Payment confirmation: Immediate (online) or within 24 hours (phone)

## After Payment
- Activation email sent within 24 hours
- Can begin booking travel dates 60+ days out
- Access to customer portal unlocked

## Common Questions
Q: Is the deposit refundable?
A: No, deposits are non-refundable once the package is activated.

Q: Can I pay partial deposit?
A: No, full deposit must be paid to activate the package.

Q: What if I miss the 7-day deadline?
A: Contact customer service. Reactivation may require additional fee.

Q: Is the $99 per person or per room?
A: Per person. A couple would pay $198 total.
```

**AI Agent Script Guidance:**
- "Great question! Your deposit is $99 per person, and you can pay online at [URL] or by calling [PHONE]. Would you like me to walk you through the online process?"
- If customer wants to pay now: "I can't process payments directly, but I can transfer you to our payment line where they can help immediately. Would you like me to do that?"

---

### 3. Certificate Activation Steps (5+ calls identified)

**Current Problem:** Customers unclear on activation process

**Knowledge Base Addition:**

```markdown
# Certificate Activation

## Activation Overview
Your vacation certificate must be activated before you can book travel.

## Step-by-Step Activation Process

### Step 1: Locate Your Certificate
- Check email for subject line: "Your Vacation Certificate - Action Required"
- Certificate code format: XXX-XXXXX-XXXX (example: VAC-12345-6789)
- Not received? Check spam folder or contact support

### Step 2: Pay Deposit
- Amount: $99 per person
- Methods: Online portal or phone payment line
- See "Deposit Payment" article for detailed instructions

### Step 3: Confirm Activation
- Activation email sent within 24 hours of deposit payment
- Email subject: "Your Vacation Package is Activated!"
- Includes: Customer portal login, certificate details, booking instructions

### Step 4: Access Customer Portal
- URL: [CUSTOMER_PORTAL_URL]
- Login: Your email address and certificate code
- Features: Book travel, view package details, access FAQs

## Activation Timeline
- Certificate received → 7 days to pay deposit
- Deposit paid → 24 hours to activation confirmation
- Activated → Can begin booking travel dates

## Troubleshooting
**"I don't have my certificate code"**
- Check email (including spam) for original certificate email
- Call support: 1-800-XXX-XXXX with your booking reference number

**"My activation is taking longer than 24 hours"**
- Check email spam folder for activation confirmation
- Verify deposit payment processed (check bank statement)
- Call support if 48+ hours have passed

**"I lost my activation email"**
- Log into customer portal with email + certificate code
- Contact support to resend activation email

## After Activation
✓ Full access to customer portal
✓ Can view available travel dates
✓ Can submit booking requests (60+ days advance)
✓ Receive booking confirmations and updates
```

**AI Agent Script Guidance:**
- "Activation is easy! You'll need your certificate code from the email, then pay the $99 per person deposit. Once that's done, you'll get an activation email within 24 hours. Do you have your certificate code handy?"
- If customer is stuck: "Let me transfer you to our activation specialists who can walk you through this step-by-step."

---

### 4. Refund Inquiries (6 calls, 3.0% of volume)

**Current Problem:** Always requires transfer, but agent can set expectations

**Knowledge Base Addition:**

```markdown
# Refund Policy & Process

## Refund Eligibility
Refunds are handled on a case-by-case basis by our refund department.

### Potentially Eligible:
- Purchase cancelled within cooling-off period (varies by state law)
- Package not used and within eligibility window
- Special circumstances (medical, military deployment, etc.)

### Not Eligible:
- After cooling-off period has passed
- Package already activated and deposit paid
- Travel dates already booked
- Expired certificates

## Refund Request Process

### Step 1: Contact Refund Department
- Phone: 1-800-XXX-XXXX (Option 3)
- Email: refunds@company.com
- Hours: Mon-Fri 9AM-7PM EST

### Step 2: Provide Information
Required:
- Full name and booking reference number
- Certificate code (if applicable)
- Reason for refund request
- Purchase date and amount paid

### Step 3: Review & Decision
- Processing time: 7-14 business days
- Refund decision communicated via email
- If approved: Refund processed within 10 business days

### Step 4: Refund Payment
- Issued to original payment method
- Credit card: 5-10 business days to appear
- Bank account: Up to 14 business days

## Important Notes
- **Deposits are non-refundable** once package is activated
- **Partial refunds** may be offered in some cases
- **Service fees** may be deducted from refund amount
- **State laws** may affect eligibility (cooling-off periods)

## What AI Agent Can Do
✓ Explain refund policy
✓ Provide refund department contact information
✓ Set expectations on timeline
✓ Transfer to refund department

✗ Cannot process refunds directly
✗ Cannot make eligibility determinations
✗ Cannot override refund decisions
```

**AI Agent Script Guidance:**
- "I understand you're inquiring about a refund. Our refund department handles these requests on a case-by-case basis. The typical review process takes 7-14 business days. Would you like me to transfer you to the refund team now so they can review your specific situation?"
- Show empathy: "I understand this is frustrating. Let me connect you with someone who can help right away."

---

### 5. Package Code Verification (5 calls, 2.5% of volume)

**Current Problem:** Customer can't find or verify their package code

**Knowledge Base Addition:**

```markdown
# Package Code Verification

## What is a Package Code?
Your package code (certificate code) is a unique identifier for your vacation package.

**Format:** XXX-XXXXX-XXXX
**Example:** VAC-12345-6789

## Where to Find Your Code

### 1. Original Email
- Subject: "Your Vacation Certificate" or "Booking Confirmation"
- Usually in the first paragraph or highlighted in a box
- Check email from: reservations@company.com or bookings@company.com

### 2. Confirmation Documents
- PDF attachment in original email
- Physical mail (if sent)
- Text message confirmation (if provided phone number)

### 3. Customer Portal
- Log in at [CUSTOMER_PORTAL_URL]
- Dashboard shows certificate code
- Requires: Email address used at booking

## Can't Find Your Code?

### Option 1: Search Email
Search terms:
- "certificate"
- "vacation package"
- "booking confirmation"
- Your name + "vacation"

Check these folders:
- Inbox
- Spam/Junk
- Promotions (Gmail)
- All Mail

### Option 2: Contact Support
Call: 1-800-XXX-XXXX
Provide:
- Full name (as used at booking)
- Email address
- Phone number
- Approximate purchase date

Support can:
✓ Resend certificate email
✓ Verify package details
✓ Reset customer portal access

### Option 3: Alternative Identifiers
If you have these, support can locate your package:
- Booking reference number
- Order number
- Transaction ID
- Last 4 digits of payment card

## Common Issues

**"My code isn't working"**
- Verify correct format (XXX-XXXXX-XXXX)
- Check for typos (O vs 0, I vs 1)
- Ensure no spaces before/after
- Try copy-paste instead of typing

**"Email says code is invalid"**
- Package may not be activated yet
- Code may have expired
- Contact support for verification

**"I have multiple codes"**
- Multiple packages purchased
- Each code is for separate package
- Check email for correct package/destination
```

**AI Agent Script Guidance:**
- "Your package code is in the original email you received - it's usually in the subject line or at the top of the email. Would you like me to help you locate it, or should I transfer you to support who can resend it?"
- If customer needs immediate help: "Let me transfer you to support. They can look up your package and resend the code right away."

---

## PRIORITY 2: Quick Resolution Scripts

For each common issue, provide the AI agent with quick resolution patterns:

### Pattern 1: Information + Self-Service Option + Transfer Offer
```
"I can help with that! [PROVIDE INFORMATION]. You can [SELF-SERVICE ACTION], or if you prefer, I can transfer you to [DEPARTMENT] who can walk you through it. What would you prefer?"
```

### Pattern 2: Empathy + Information + Transfer
```
"I understand [ACKNOWLEDGE CONCERN]. Here's what I know: [INFORMATION]. Let me connect you with [SPECIALIST] who can [SPECIFIC HELP]. Sound good?"
```

### Pattern 3: Clarify + Resolve or Transfer
```
"Just to make sure I understand correctly, you're asking about [CLARIFY ISSUE], is that right? [IF YES: PROVIDE SOLUTION or TRANSFER]"
```

---

## PRIORITY 3: Search Optimization

Ensure knowledge base articles are searchable with these terms:

### Travel Dates
- "when can I travel"
- "schedule my trip"
- "book travel dates"
- "blackout dates"
- "travel restrictions"

### Deposits
- "how to pay deposit"
- "deposit amount"
- "pay online"
- "payment methods"
- "deposit due date"

### Activation
- "activate certificate"
- "activation process"
- "how to activate"
- "activation email"
- "certificate not working"

### Refunds
- "get refund"
- "cancel package"
- "money back"
- "refund policy"
- "request refund"

### Package Codes
- "certificate code"
- "can't find code"
- "code not working"
- "invalid code"
- "resend certificate"

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Content Creation (4 hours)
- [ ] Write all 5 priority articles
- [ ] Add search keywords
- [ ] Create internal linking
- [ ] Add FAQ sections
- [ ] Include contact information

### Phase 2: AI Agent Integration (2 hours)
- [ ] Upload articles to knowledge base system
- [ ] Update AI agent's knowledge base access
- [ ] Add article references to node instructions
- [ ] Test knowledge base queries

### Phase 3: Testing (2 hours)
- [ ] Test queries for each top issue category
- [ ] Verify agent can retrieve correct information
- [ ] Test with sample customer questions
- [ ] Adjust search terms if needed

### Phase 4: Monitoring (Ongoing)
- [ ] Track resolution rate improvement
- [ ] Identify new content gaps
- [ ] Update articles based on findings
- [ ] Add new FAQs from common questions

---

## EXPECTED IMPACT

**Current State:**
- Resolution rate: 34.7%
- Top 5 issues: 35 calls (17.3% of volume)
- 80% of unresolved need human transfer

**After KB Improvements:**
- Expected resolution rate: 50-60%
- Top 5 issues: 50% resolvable by AI with better info
- Reduce unnecessary transfers by 30%

**ROI:**
- 15% improvement in resolution = 30 fewer transfers/day
- 30 transfers × 5 min agent time = 150 minutes saved/day
- Better customer experience (faster resolution)
- Reduced call center costs

---

## ONGOING MAINTENANCE

**Weekly:**
- Review unresolved calls for new content gaps
- Update FAQs with new common questions

**Monthly:**
- Analyze which KB articles are most accessed
- Identify articles with low usage (may need better search terms)
- Add new articles for emerging issues

**Quarterly:**
- Full content audit
- Update contact information
- Refresh examples and screenshots
- Test all self-service links
