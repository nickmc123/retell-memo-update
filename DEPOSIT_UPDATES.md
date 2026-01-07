# Deposit Amount Updates

## Changes Made

### 1. ✅ Added EVX Package to Knowledge Base
**Lines 120-122:**
```javascript
// EVX packages (Las Vegas)
"EVX": { total_deposit: 50, activation_method: "online" },
"EVXV": { total_deposit: 50, activation_method: "online" },
```

### 2. ✅ Removed $500 Hardcoded Fallback
**Line 1665 - Before:**
```javascript
const expected_deposit = kb_info ? kb_info.total_deposit : 500;
```

**Line 1665 - After:**
```javascript
const expected_deposit = kb_info ? kb_info.total_deposit : null;
```

### 3. ✅ Updated Deposit Status Logic
**Lines 1667-1674:**
- Now checks if `expected_deposit !== null` before marking as complete
- Handles unknown package codes gracefully

### 4. ✅ Updated Agent Messages

**Partial Payment (Lines 1736-1741):**
- **With known deposit:** "I see you've paid $X toward your $Y deposit. You have $Z remaining..."
- **Unknown deposit:** "I see you've paid $X toward your deposit. Please refer to your certificate for the total amount required..."

**No Payment (Lines 1749-1753):**
- **With known deposit:** "The total deposit needed is $X."
- **Unknown deposit:** "The deposit amount is shown on your certificate."

### 5. ✅ Updated Certificate Lookup Endpoints
**Lines 1386 & 1437:**
- Changed fallback from `{ total_deposit: 500 }` to `{ total_deposit: null }`
- API now returns `null` for unknown package codes instead of incorrect $500

### 6. ✅ Updated Response JSON
**Line 1785:**
```javascript
remaining: expected_deposit !== null ? Math.max(0, expected_deposit - total_paid) : null
```

## Impact

### Before (EVXV Package):
```json
{
  "deposits": {
    "expected": 500,    // ❌ WRONG - hardcoded fallback
    "remaining": 500,
    "complete": false
  }
}
```

### After (EVXV Package):
```json
{
  "deposits": {
    "expected": 50,     // ✅ CORRECT - from knowledge base
    "remaining": 50,
    "complete": false
  }
}
```

### Unknown Package Code:
```json
{
  "deposits": {
    "expected": null,   // ✅ No incorrect fallback
    "remaining": null
  }
}
```

Agent says: "The deposit amount is shown on your certificate."

## Deployment

File: `rims-api-caspio.js`
Deploy to: `https://web-production-4080.up.railway.app`

```bash
git add rims-api-caspio.js
git commit -m "Fix EVX deposit ($50) and remove $500 fallback"
git push
```

## Testing

Test with EVXV package:
```bash
curl -X POST "https://web-production-4080.up.railway.app/api/rims/customer-status" \
  -H "Content-Type: application/json" \
  -d '{"vac_id": 255001, "pkg_code2": "EVXV"}'
```

Expected: `"expected": 50` ✅
