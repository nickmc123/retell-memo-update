# Travel Rep Confirmation Script - Regular Trips

## INTRO

Hi, this is [REP NAME] with Casablanca Express. I am calling to finalize the details of your [DESTINATION] trip on [TRAVEL DATE], do you have a few minutes?

Great!

So, what I am going to do is go over the promotional trip that you have and I will also tell you about some options available to you. Do you have a pen and paper handy because you might want to take some notes.

---

## TRIP OVERVIEW

The trip you have is valid for:
- **[NIGHTS] nights accommodations** in [DESTINATION]
- **Round trip airfare for two people** from [DEPARTURE CITY]

This is a promotional trip and as such is subject to certain restrictions that do not normally pertain to most retail travel.

---

## FLIGHT RESTRICTIONS

While we do try to get the best flights available to us, however due to the nature of group travel and the promotional fare base that we use, it DOES tend to leave BOTH the less desirable flights and the less desirable flight times involving:
- Stopovers
- Layovers
- Changes of plane

### Departure Flights
The promotional flights normally depart between **1pm and 7pm** on your departure day. You will have the full day at your destination.

### Return Flights
On your return day, flights begin departing as early as **9am**, leaving you just one full day at your destination.

---

## HOTEL ACCOMMODATIONS

The promotional motels that we use are **economy class** and are:
- Not located near the beach or main attractions
- Simple and basic with no frills
- They are not bad, just basic accommodations

---

## GROUND TRANSPORTATION

**You are responsible for all ground transportation:**
- To and from the airport
- To and from the hotel
- To any attractions or activities

---

## UPGRADE OPTIONS

As most of my travelers do not want to fly all the way to [DESTINATION] to just have one full day, we do offer upgrades.

### Standard Upgrade
With an upgrade you are removed from the group promotional and placed on:
- Better flight times (morning departures, evening returns)
- Direct flights when available
- Better hotel locations

### Upgrade Pricing
The upgrade cost varies by destination and availability. Would you like me to check upgrade pricing for your trip?

---

## CONFIRMATION QUESTIONS

Before we finalize, I need to confirm a few things:

1. **Traveler Names**: Can you confirm the names of both travelers exactly as they appear on your government-issued ID?
   - Traveler 1: ________________________
   - Traveler 2: ________________________

2. **Date of Birth**: I need the date of birth for each traveler.
   - Traveler 1 DOB: ________________________
   - Traveler 2 DOB: ________________________

3. **Contact Information**: What is the best phone number and email to reach you?
   - Phone: ________________________
   - Email: ________________________

4. **Special Requests**: Do you have any special requests or requirements we should note?

---

## CLOSING

Alright, so you are all set! Here's what happens next:

1. **7-14 days before your trip**: A booking agent will call you with your exact flight times and hotel confirmation.

2. **Travel documents**: Your itinerary and confirmation details will be emailed to you.

3. **Questions before travel**: Call our customer service line at **818-992-5100**, Monday through Friday, 9am to 5pm Pacific.

Is there anything else I can help you with today?

Thank you for choosing Casablanca Express. Have a wonderful trip!

---

## DESTINATION-SPECIFIC NOTES

### Orlando Trips
- Theme park tickets may be included (check package)
- Parks: Disney, Universal, SeaWorld
- Ground transportation especially important - parks are spread out

### Mexico/Caribbean All-Inclusive
- All-inclusive means meals and drinks at resort are included
- Tips/gratuities may not be included
- Excursions and activities outside resort are extra

### Las Vegas Trips
- Hotel is on or near the Strip
- No airfare included on some packages (drive packages)
- Resort fees may apply at hotel

### Cruise Packages
- Port departure city matters
- Cruise line and ship will be confirmed closer to date
- Gratuities typically not included

---

## OBJECTION HANDLING

### "The flight times don't work for me"
"I completely understand. That's exactly why we offer the upgrade option - it gives you much better flight times. Would you like me to check the upgrade pricing for you?"

### "The hotel sounds too basic"
"The promotional hotels are clean and safe, just basic. If you'd prefer something nicer, the upgrade includes better hotel options closer to attractions. Want me to look into that?"

### "I didn't know about these restrictions"
"I understand this is a lot of information. These are standard restrictions for promotional travel packages. The great news is your trip is still a fantastic value, and we have upgrade options if you want more flexibility."

### "Can I change my dates?"
"Date changes may be possible depending on availability. There may be a change fee. Would you like me to check on alternate dates for you?"

---

## SCRIPT VARIABLES (from destsel)

| Variable | Source Field | Example |
|----------|-------------|---------|
| [DESTINATION] | destination | Orlando |
| [NIGHTS] | ngts | 2 |
| [DEPARTURE CITY] | depart_city | Austin |
| [VACATION TYPE] | vacation_type | Orlando Theme Park Adventure |
| [PACKAGE DESC] | vaca_desc | Two nights in Orlando plus four attraction tickets and round trip airfare |
| [TRAVEL DATE] | asgn_trv_dt (from RIMS) | 2026-10-29 |
| [REP NAME] | tm (from RIMS) | Hal |
