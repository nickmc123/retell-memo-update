# TravelBucks AI Voice Concierge

24/7 AI-powered travel booking assistant for TravelBucks members.

---

## 🎯 Overview

**Brianna - Voice Concierge** is an inbound AI agent that helps existing TravelBucks members:
- Search for travel deals
- Book hotels, flights, cruises
- Check availability
- Modify existing bookings
- Answer membership questions

**Available**: 24/7, no hold times, instant responses

---

## 📞 Use Cases

### Use Case 1: Hotel Booking
**Member**: "I need a hotel in Las Vegas for next weekend"  
**Concierge**: Searches inventory → Presents 3-5 options → Books selected hotel → Sends confirmation

### Use Case 2: Cruise Inquiry
**Member**: "What Caribbean cruises are available in March?"  
**Concierge**: Searches cruises → Filters by dates → Presents options with pricing

### Use Case 3: Booking Modification
**Member**: "I need to change my Hawaii reservation"  
**Concierge**: Looks up booking → Verifies member → Makes changes → Confirms

### Use Case 4: Membership Questions
**Member**: "How does the price match guarantee work?"  
**Concierge**: Explains policy → Offers to help find competitor pricing

---

## 🗣️ Conversation Flow Design

### Node 1: Welcome & Authentication
```
"Hi! You've reached TravelBucks 24/7 Voice Concierge. 

To get started, I'll need your member ID or the phone number on your account."

[Collect member_id or phone]
[Look up in Caspio]
[Verify membership is active]

"Great! Hi [Member Name], your membership is active through [expiration date]. 
How can I help you today?"
```

**Edges:**
- Member found & active → Main Menu
- Member not found → "I don't see an active membership. Would you like to sign up?"
- Membership expired → "Your membership expired on [date]. Would you like to renew?"

---

### Node 2: Main Menu (Intent Classification)
```
"I can help you with:
- Booking hotels, flights, or cruises
- Checking availability and pricing  
- Modifying or canceling existing bookings
- Answering questions about your membership
- Connecting you with a live agent

What would you like to do?"
```

**Edges:**
- "Book new travel" → Hotel/Flight/Cruise Router
- "Check existing booking" → Booking Lookup
- "Modify booking" → Booking Modification
- "Membership questions" → FAQ Handler
- "Live agent" → Transfer to Human
- "Unclear" → Clarification Loop

---

### Node 3: Hotel Booking Flow

**Step 3.1: Collect Details**
```
"I'd love to help you find a hotel! Let me get a few details:

Where are you traveling to? [Collect destination]
When are you checking in? [Collect check-in date]
When are you checking out? [Collect check-out date]
How many guests? [Collect number of guests]
Any preferences? Like pool, breakfast, location, star rating?"
```

**Step 3.2: Search Inventory (Function Call)**
```
[Call tool: search_hotels]
Parameters:
- destination: "Las Vegas, NV"
- check_in: "2025-01-15"
- check_out: "2025-01-17"
- guests: 2
- preferences: "pool, strip location"
```

**Step 3.3: Present Options**
```
"Great! I found several options for you in Las Vegas:

Option 1: The Venetian - $189/night (normally $349)
- 5-star resort on the Strip
- Pool, spa, multiple restaurants
- Your savings: $320 total

Option 2: Aria Resort - $149/night (normally $279)  
- 5-star modern resort
- Pool, casino, fine dining
- Your savings: $260 total

Option 3: Paris Las Vegas - $109/night (normally $199)
- 4-star themed resort
- Eiffel Tower replica, pool
- Your savings: $180 total

Which one sounds best, or would you like more options?"
```

**Step 3.4: Confirm Booking**
```
"Perfect! Let me confirm:

The Venetian, Las Vegas
Check-in: January 15, 2025
Check-out: January 17, 2025  
2 guests, 2 nights
Total: $378 (You save $320!)

Your card ending in [last 4] will be charged.
Is this correct?"
```

**Step 3.5: Process Booking (Function Call)**
```
[Call tool: book_hotel]
[Send confirmation email]

"All set! Your booking is confirmed. 
Confirmation number: TB-LV-8374922

I just sent all the details to your email at [email].
Is there anything else I can help with today?"
```

**Edges:**
- Booking successful → "Anything else?" → Main Menu or End
- Booking failed → Apologize → Retry or Transfer
- Want different dates → Loop back to Step 3.1

---

### Node 4: Flight Booking Flow

**Step 4.1: Collect Details**
```
"I can help you find flights! 

Where are you flying from? [Origin]
Where are you flying to? [Destination]  
When are you leaving? [Departure date]
Is this a round-trip or one-way? [Trip type]
[If round-trip] When are you returning? [Return date]
How many travelers? [Passengers]
Any preferences? Like non-stop, airline, time of day?"
```

**Step 4.2: Search & Present**
```
[Call tool: search_flights]

"Here are your best options:

Option 1: United Airlines - $289
- Non-stop, 3h 15min
- Departs 8:45 AM, arrives 12:00 PM
- Economy with 1 carry-on included

Option 2: Southwest - $249  
- Non-stop, 3h 20min
- Departs 2:30 PM, arrives 5:50 PM
- Economy with 2 bags included

Option 3: Delta - $319
- Non-stop, 3h 10min
- Departs 6:00 PM, arrives 9:10 PM
- Economy with seat selection

Which flight works best?"
```

---

### Node 5: Cruise Booking Flow

**Step 5.1: Collect Preferences**
```
"Let's find you a cruise!

What destination are you interested in? Like Caribbean, Alaska, Mediterranean?
What month are you thinking?
How many nights? Like 3-night, 7-night, longer?
How many passengers?
Any cruise line preferences?"
```

**Step 5.2: Search & Present**
```
[Call tool: search_cruises]

"I found some amazing cruises for you:

Option 1: Royal Caribbean - 7-Night Eastern Caribbean
- January 20-27, 2025
- Ports: St. Thomas, St. Maarten, Bahamas
- Inside cabin: $899/person (Normally $1,499) - Save $600!
- Oceanview: $1,199/person (Normally $1,899) - Save $700!

Option 2: Carnival - 7-Night Western Caribbean  
- February 3-10, 2025
- Ports: Cozumel, Belize, Honduras
- Inside cabin: $749/person (Normally $1,299) - Save $550!

Which cruise interests you?"
```

---

### Node 6: Existing Booking Lookup

```
"I can help you check on your booking. 

Do you have your confirmation number handy? 
Or I can look it up by your travel dates and destination."

[Collect lookup method]
[Call tool: lookup_booking]

"Found it! Here's your booking:

Confirmation: TB-HNL-192847
Hotel: Hilton Hawaiian Village, Honolulu
Check-in: March 15, 2025
Check-out: March 22, 2025
Guests: 2 adults
Total paid: $1,899

What would you like to do? I can:
- Modify dates
- Upgrade room
- Add extras (parking, breakfast)
- Cancel booking"
```

---

### Node 7: Booking Modification

```
"I can help you modify this booking. What would you like to change?

- Different dates
- Different room type
- Add or remove guests
- Cancel booking"

[Handle modification request]
[Call tool: modify_booking]

"All done! Your new check-in is March 17 instead of March 15.
There's no change fee, but the new total is $1,499 (saved you $400!).

Updated confirmation sent to your email."
```

---

### Node 8: FAQ / Membership Questions

```
"What would you like to know about your membership?

- How to use your benefits
- Price match guarantee
- Booking policies  
- Upgrade membership
- Refer a friend"

[Route to appropriate response]
```

**Example FAQ Responses:**

**Price Match:**
```
"Great question! Our price match guarantee works like this:

If you find the exact same hotel, dates, and room type cheaper on 
Expedia, Booking.com, or any major site within 24 hours of booking, 
we'll refund the difference PLUS give you a $50 credit.

Just email us the screenshot and we'll take care of it.
Would you like me to help you book something right now?"
```

---

### Node 9: Transfer to Human

```
"No problem, I'll connect you with a live travel specialist.

They should answer in under 2 minutes. Transferring now..."

[Call transfer_call tool]
[Transfer to: +1-555-TRAVEL-HELP]

[If transfer fails]
"I'm having trouble connecting you right now. 
Can I have someone call you back within the hour instead?"
```

---

## 🔧 Required Function Tools

### Tool 1: Member Lookup
```json
{
  "tool_id": "tool-member-lookup",
  "name": "Member Lookup",
  "url": "https://travelbucks-api.up.railway.app/api/members/lookup",
  "method": "POST",
  "parameters": {
    "type": "object",
    "properties": {
      "member_id": { "type": "string" },
      "phone": { "type": "string" }
    }
  }
}
```

### Tool 2: Search Hotels
```json
{
  "tool_id": "tool-search-hotels",
  "name": "Search Hotels",
  "url": "https://travelbucks-api.up.railway.app/api/hotels/search",
  "method": "POST",
  "parameters": {
    "type": "object",
    "properties": {
      "destination": { "type": "string" },
      "check_in": { "type": "string" },
      "check_out": { "type": "string" },
      "guests": { "type": "number" },
      "preferences": { "type": "string" }
    }
  }
}
```

### Tool 3: Book Hotel
```json
{
  "tool_id": "tool-book-hotel",
  "name": "Book Hotel",
  "url": "https://travelbucks-api.up.railway.app/api/hotels/book",
  "method": "POST",
  "parameters": {
    "type": "object",
    "properties": {
      "member_id": { "type": "string" },
      "hotel_id": { "type": "string" },
      "check_in": { "type": "string" },
      "check_out": { "type": "string" },
      "guests": { "type": "number" },
      "room_type": { "type": "string" }
    }
  }
}
```

### Tool 4: Search Flights
```json
{
  "tool_id": "tool-search-flights",
  "name": "Search Flights",
  "url": "https://travelbucks-api.up.railway.app/api/flights/search"
}
```

### Tool 5: Search Cruises
```json
{
  "tool_id": "tool-search-cruises",
  "name": "Search Cruises",
  "url": "https://travelbucks-api.up.railway.app/api/cruises/search"
}
```

### Tool 6: Lookup Booking
```json
{
  "tool_id": "tool-lookup-booking",
  "name": "Lookup Booking",
  "url": "https://travelbucks-api.up.railway.app/api/bookings/lookup"
}
```

### Tool 7: Modify Booking
```json
{
  "tool_id": "tool-modify-booking",
  "name": "Modify Booking",
  "url": "https://travelbucks-api.up.railway.app/api/bookings/modify"
}
```

---

## 🎨 Agent Personality

**Name**: Brianna (same voice as outbound agent for consistency)  
**Personality**: 
- Enthusiastic about travel
- Patient and helpful
- Knowledgeable about deals
- Empathetic when things go wrong
- Proactive in suggesting upgrades

**Tone**: Professional yet warm, like a personal travel agent who genuinely cares

**Sample Phrases:**
- "Ooh, you're going to LOVE Hawaii in March!"
- "Let me find you the absolute best deal..."
- "I'm seeing some amazing options here!"
- "That's a great choice - you're saving over $300!"
- "No worries, I can help you with that right now."

---

## 📊 Success Metrics

**Track:**
- Call volume by time of day
- Booking completion rate
- Average booking value
- Member satisfaction scores
- Transfer-to-human rate (target: <10%)
- Call resolution rate (target: >80%)

---

## 🚀 Deployment Plan

### Phase 1: Beta (Week 1-2)
- Deploy to 100 beta members
- Monitor all calls manually
- Fix any issues
- Optimize scripts

### Phase 2: Soft Launch (Week 3-4)
- Open to all members
- Advertise in member newsletter
- Monitor performance
- A/B test different scripts

### Phase 3: Full Launch (Month 2+)
- Make it the primary member service line
- Reduce human agent headcount
- Scale to handle 1000+ calls/day

---

## 💰 Cost Savings

**Current Model (Human Agents):**
- 3 agents @ $20/hour = $60/hour
- Handle ~10 calls/hour = $6/call
- 1000 calls/month = $6,000

**AI Concierge Model:**
- Retell AI: ~$0.15/min
- Average call: 5 min = $0.75/call
- 1000 calls/month = $750

**Monthly Savings: $5,250** (87% reduction!)

---

## 🎯 Member Benefits

**Why Members Will Love It:**

✅ **No Wait Times** - Instant answer, 24/7  
✅ **Faster Booking** - 5 min vs 20 min with human  
✅ **Consistent Quality** - Never has a bad day  
✅ **Patient** - Won't rush you, unlimited time  
✅ **Smart** - Remembers your preferences from past bookings  
✅ **Always Available** - 3 AM cruise emergency? No problem.

---

## 📞 Phone Number Setup

**Toll-Free Number**: 1-800-TB-VOICE  
**Routes to**: Brianna Voice Concierge (Retell AI)  
**Backup**: Transfer to human if AI can't handle

---

## 🔄 Integration with Existing Systems

**Must integrate with:**
1. **Caspio** - Member database
2. **Booking Engine** - Your travel inventory API
3. **Payment Processor** - Authorize.Net (already configured)
4. **Email System** - Send confirmations
5. **CRM** - Log all interactions

---

**Ready to give your members 24/7 AI-powered travel booking!** ✈️
