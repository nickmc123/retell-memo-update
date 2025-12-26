# Facebook Lead Form - TCPA Compliant
## TravelBucks AI Voice Concierge (Production Spec)

---

## Form Configuration

**Form Name:** TravelBucks Travel Planning - Instant Callback  
**Form Type:** Higher Intent (More Volume alternative acceptable)  
**Objective:** Lead Generation

---

## Intro Screen

### Headline
**Plan Your Trip With a Travel Expert**

### Description
```
Submit the form and receive a call from a TravelBucks concierge within 60 seconds.

*You may receive an automated or AI-assisted call.*
```

### Button Text
Continue

---

## Form Questions

### Question 1: Full Name
- **Type:** Short Answer
- **Label:** Full Name
- **Required:** Yes
- **Pre-fill:** Enabled

---

### Question 2: Phone Number
- **Type:** Phone Number
- **Label:** Phone Number
- **Required:** Yes
- **Pre-fill:** Enabled
- **Format:** US Format

---

### Question 3: Where do you want to travel?
- **Type:** Short Answer
- **Label:** Where do you want to travel?
- **Required:** Yes
- **Pre-fill:** No
- **Placeholder:** "Paris, Caribbean, Hawaii, etc."

---

### Question 4: When are you planning to travel?
- **Type:** Multiple Choice (Single Select)
- **Label:** When are you planning to travel?
- **Required:** Yes
- **Pre-fill:** No
- **Options:**
  - Within 1-3 months
  - 3-6 months
  - 6+ months
  - Flexible

---

### Question 5: How many travelers?
- **Type:** Multiple Choice (Single Select)
- **Label:** How many travelers?
- **Required:** Yes
- **Pre-fill:** No
- **Options:**
  - 1
  - 2
  - 3-4
  - 5+

---

### Question 6: Estimated budget per person
- **Type:** Multiple Choice (Single Select)
- **Label:** Estimated budget per person
- **Required:** No
- **Pre-fill:** No
- **Options:**
  - Under $1,500
  - $1,500-$2,500
  - $2,500-$4,000
  - $4,000+

---

## ⚠️ REQUIRED CONSENT CHECKBOX (CRITICAL)

### Configuration
- **Type:** Custom Question → Checkbox
- **Required:** YES (MUST check to submit)
- **Pre-checked:** NO (unchecked by default)

### Checkbox Label
**I consent to be contacted**

### Disclaimer Text (USE EXACTLY AS WRITTEN)
```
By checking this box and submitting this form, you expressly consent to receive calls and text messages from TravelBucks, including those made using automated dialing systems, AI-assisted technology, or pre-recorded messages, regarding your travel inquiry. Consent is not a condition of purchase. Message and data rates may apply. You may opt out at any time.
```

**LEGAL NOTES:**
- This language covers TCPA requirements
- Mentions automated/AI explicitly
- States consent is not required for purchase
- Allows opt-out
- Must remain unchecked by default

---

## Thank You Screen

### Headline
**📞 We're Calling You Now**

### Description
```
A TravelBucks concierge may contact you shortly using automated, AI-assisted, or pre-recorded technology.

Please keep your phone nearby and answer unknown numbers.

Thank you for your travel inquiry!
```

### Button Text
Done

### Button Action
Close Form

---

## Privacy Policy

**Privacy Policy URL:** (Your privacy policy URL)  
**Must include:**
- How you use phone numbers
- Who calls will come from
- How to opt-out
- Data retention policy

---

## Webhook Configuration

### Callback URL
`https://your-railway-app.up.railway.app/webhooks/facebook-leads`

### Verify Token
`travelbucks_verify_token_2024`

### Subscribed Fields
- `leadgen` (Lead generation events)

---

## Testing Checklist

- [ ] Consent checkbox is UNCHECKED by default
- [ ] Form cannot submit without checking consent
- [ ] Disclaimer language is exactly as specified
- [ ] AI disclosure is visible on intro and thank you screens
- [ ] Webhook receives lead data correctly
- [ ] Test lead receives callback within 60 seconds

---

## Compliance Documentation

**Save for records:**
- Screenshot of form with consent checkbox
- Screenshot of disclaimer text
- Webhook logs showing lead consent = true
- Record of when form was deployed
- Any changes made to consent language

---

## What NOT To Change

❌ **DO NOT modify:**
- Consent checkbox language
- AI disclosure statements
- Requirement that checkbox be unchecked by default
- Statement that consent is not required for purchase

✅ **CAN modify:**
- Travel-related questions
- Budget ranges
- Color/design (not language)
- Thank you screen design (not legal language)

---

**This form is TCPA compliant when deployed exactly as specified.**
