# Profile Completion Fixes - Testing Guide

## Issues Fixed

### 1. ✅ Location Permission Popup

**Problem:** "localhost would like to use your current location" with no context
**Fix:** Added explanatory message before requesting permission

- Shows: "🌍 We'll use your location to personalize content. Click 'Allow' when prompted."
- Handles permission denial gracefully with fallback message

### 2. ✅ Location Format Display

**Problem:** Showed "wa/usa" instead of "USA / WA", and users could type anything
**Fix:**

- Display format: "USA / WA" (uppercase with spaces)
- Storage format: "usa/wa" (lowercase, no spaces)
- Validation: Ensures format is country/state or country only
- Hint text: "Format: Country / State (e.g., USA / WA, Canada / BC, Japan)"

### 3. ✅ Phone Number Formatting

**Problem:** User entered phone without country code or with spaces
**Fix:**

- Auto-formats to E.164: `+15551234567` (no spaces)
- Accepts multiple input formats:
  - `5551234567` → `+15551234567` (assumes US)
  - `+1 555 123 4567` → `+15551234567`
  - `(555) 123-4567` → `+15551234567`
  - `+44 20 1234 5678` → `+442012345678`
- Validates before saving
- Hint text: "Include country code (e.g., +1 for US/Canada)"

### 4. ✅ Data Not Saving

**Problem:** Profile data wasn't being saved to Cognito
**Fix:**

- Added extensive debug logging at every step
- Validates data before storing in sessionStorage
- Logs when data is stored, retrieved, and sent to Cognito
- Better error handling with detailed error messages

## Test Cases

### Test 1: Location Auto-Detection

1. Click "📍 Auto-detect location"
2. **Expected:** See message: "🌍 We'll use your location..."
3. Click "Allow" in browser popup
4. **Expected:** See "📍 Location detected: USA / WA" (or your location)
5. **Verify:** Location field shows "USA / WA" format

**Console logs to check:**

```javascript
[Geolocation] getCurrentPosition called
[ProfileCompletion] Formatted location: usa/wa
[ProfileCompletion] Stored pending profile: {location: "usa/wa"}
```

### Test 2: Manual Location Entry

1. Type "japan" in location field
2. Click "Continue"
3. **Expected:** Error: "Invalid location format..."
4. Type "japan/tokyo"
5. **Expected:** No error, proceeds to login code
6. **Verify:** Console shows `[ProfileCompletion] Validated location: japan/tokyo`

**Valid formats:**

- ✅ `USA / WA` → `usa/wa`
- ✅ `Canada / BC` → `canada/bc`
- ✅ `Japan` → `japan`
- ❌ `japan` alone (unless you want country-only)
- ❌ `random text` → validation error

### Test 3: Phone Number Formatting

**Input formats to test:**

| Input              | Expected Output | Valid?       |
| ------------------ | --------------- | ------------ |
| `5551234567`       | `+15551234567`  | ✅           |
| `+1 555 123 4567`  | `+15551234567`  | ✅           |
| `(555) 123-4567`   | `+15551234567`  | ✅           |
| `+44 20 1234 5678` | `+442012345678` | ✅           |
| `123`              | Error           | ❌ Too short |
| `abc`              | Error           | ❌ Invalid   |

**Console logs to check:**

```javascript
[ProfileCompletion] Formatted phone: +15551234567
[ProfileCompletion] Stored pending profile: {phone: "+15551234567"}
```

### Test 4: Complete Flow

1. **Create new account** (use new email)
2. Enter verification code
3. **Profile step appears**
4. Click "📍 Auto-detect location" → Allow permission
5. Enter phone: `(555) 123-4567`
6. **Verify console:**
   ```javascript
   [ProfileCompletion] Formatted phone: +15551234567
   [ProfileCompletion] Validated location: usa/wa
   [ProfileCompletion] Stored pending profile: {phone: "+15551234567", location: "usa/wa"}
   ```
7. Click "Continue"
8. Enter login code
9. **Verify console:**
   ```javascript
   [ProfileCompletion] Checking for pending profile data: {"phone":"+15551234567","location":"usa/wa"}
   [ProfileCompletion] Parsed profile data: {phone: "+15551234567", location: "usa/wa"}
   [PasswordlessAuth] Adding phone_number attribute: +15551234567
   [PasswordlessAuth] Adding custom:location attribute: usa/wa
   [PasswordlessAuth] Sending UpdateUserAttributesCommand with: [...]
   [PasswordlessAuth] ✅ Successfully updated user attributes: ["phone_number=+15551234567", "custom:location=usa/wa"]
   ```
10. Go to profile page
11. **Verify:** Phone and location appear

### Test 5: Skip Profile

1. Create new account
2. Enter verification code
3. Profile step appears
4. Click "Skip"
5. **Expected:** Goes straight to login code
6. **Verify:** No pending profile data in sessionStorage

### Test 6: Validation Errors

**Phone validation:**

1. Enter `123` (too short)
2. Click "Continue"
3. **Expected:** Error: "Invalid phone number. Please use format: +1 555 123 4567..."

**Location validation:**

1. Enter `random stuff` (invalid format)
2. Click "Continue"
3. **Expected:** Error: "Invalid location format. Please use: country/state..."

## Debug Commands

### Check Pending Profile Data

```javascript
// In browser console
sessionStorage.getItem("pending_profile");
// Expected: '{"phone":"+15551234567","location":"usa/wa"}'
```

### Check Current Tokens

```javascript
localStorage.getItem("cognito_access_token");
localStorage.getItem("cognito_id_token");
```

### Test Phone Formatting

```javascript
import { formatPhoneToE164 } from "@utils/phoneFormat";

formatPhoneToE164("5551234567"); // "+15551234567"
formatPhoneToE164("+1 555 123 4567"); // "+15551234567"
formatPhoneToE164("(555) 123-4567"); // "+15551234567"
```

### Test Location Validation

```javascript
import { validateLocation, formatLocationForDisplay } from "@utils/geolocation";

validateLocation("usa/wa"); // "usa/wa" ✅
validateLocation("USA / WA"); // "usa/wa" ✅
validateLocation("japan"); // "japan" ✅
validateLocation("random stuff"); // null ❌
```

## Expected Console Output (Successful Flow)

```
[PasswordlessAuth] New user created: test@example.com
[PasswordlessAuth] Account confirmed: test@example.com
[ProfileCompletion] Formatted phone: +15551234567
[ProfileCompletion] Validated location: usa/wa
[ProfileCompletion] Stored pending profile: {phone: "+15551234567", location: "usa/wa"}
[PasswordlessAuth] Initiating auth for: test@example.com
[ProfileCompletion] Checking for pending profile data: {"phone":"+15551234567","location":"usa/wa"}
[ProfileCompletion] Parsed profile data: {phone: "+15551234567", location: "usa/wa"}
[ProfileCompletion] Access token present: true
[PasswordlessAuth] updateUserAttributes called with: {phone: "+15551234567", location: "usa/wa"}
[PasswordlessAuth] Adding phone_number attribute: +15551234567
[PasswordlessAuth] Adding custom:location attribute: usa/wa
[PasswordlessAuth] Sending UpdateUserAttributesCommand with: [
  {Name: "phone_number", Value: "+15551234567"},
  {Name: "custom:location", Value: "usa/wa"}
]
[PasswordlessAuth] ✅ Successfully updated user attributes: ["phone_number=+15551234567", "custom:location=usa/wa"]
[ProfileCompletion] ✅ Profile data saved successfully!
```

## Cognito Attribute Names

| Frontend Field | Cognito Attribute | Format               |
| -------------- | ----------------- | -------------------- |
| Phone          | `phone_number`    | E.164 (+15551234567) |
| Location       | `custom:location` | lowercase (usa/wa)   |

## Backend Requirements

⚠️ **Your Lambda must read these attributes:**

```javascript
// From Cognito user object
const phone = user.attributes.phone_number; // "+15551234567"
const phoneVerified = user.attributes.phone_number_verified; // true/false
const location = user.attributes["custom:location"]; // "usa/wa"
```

## Next Steps

1. Test with new user signup
2. Check browser console for debug logs
3. Verify profile page shows data
4. Test API endpoint returns phone/location
5. If data not saving, check UpdateUserAttributes permissions in Cognito
