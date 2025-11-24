# Profile Completion Flow

## Overview

Added an optional profile completion step during new user signup to collect additional user attributes (phone, location) **before** final authentication.

## Flow Sequence

### New User Signup

1. **Email Entry** → User enters email
2. **Verification Code** → User confirms email with code
3. **✨ Profile Completion (NEW)** → User optionally adds:
   - Phone number
   - Location (with auto-detect)
4. **Login Code** → User enters login code
5. **Authenticated** → User is signed in with profile data saved

### Existing User Login

1. **Email Entry** → User enters email
2. **Login Code** → User enters login code
3. **Authenticated** → User is signed in

## Features

### Auto-Detect Geolocation

- Uses browser Geolocation API (`navigator.geolocation`)
- Reverse geocodes coordinates to country/state format
- Uses OpenStreetMap Nominatim API (free, no API key)
- Format: `usa/wa`, `canada/bc`, `uk/london`
- Falls back gracefully if denied or unavailable

### Optional Fields

- All fields are optional (phone, location)
- "Skip" button to bypass profile completion entirely
- "Continue" button to save and proceed
- Data stored temporarily in sessionStorage
- Applied to Cognito after successful login

### Profile Data Storage

1. User fills in profile form (or skips)
2. Data stored in `sessionStorage.pending_profile`
3. User completes login (gets access token)
4. On successful authentication:
   - Calls `updateUserAttributes(accessToken, profileData)`
   - Updates Cognito user attributes
   - Clears sessionStorage

## Files Modified

### 1. `/src/utils/passwordlessAuth.ts`

**Added:**

- `UpdateUserAttributesCommand` import
- `UserProfileAttributes` interface
- `isNewUser` flag in `PasswordlessAuthSession`
- `needsProfileCompletion` flag in `PasswordlessAuthResult`
- `updateUserAttributes()` function - updates Cognito user attributes

**Modified:**

- `startPasswordlessAuth()` - marks new users with `isNewUser: true`
- `confirmPasswordlessAuth()` - returns `needsProfileCompletion: true` for new users

### 2. `/src/utils/geolocation.ts`

**Created new file:**

- `detectGeolocation()` - browser geolocation + reverse geocoding
- `reverseGeocode()` - converts lat/lon to country/state
- `normalizeCountry()` - maps country codes (us → usa, ca → canada)
- `normalizeState()` - converts state names to abbreviations
- `formatLocationForDisplay()` - formats for display (usa/wa → USA / WA)

**Supports:**

- US states (full names → 2-letter codes)
- Canadian provinces (full names → 2-letter codes)
- International countries

### 3. `/src/components/PasswordlessAuthDialog.tsx`

**Added:**

- New step: `"profile"` in Step type
- Profile state: `profilePhone`, `profileLocation`, `locationDetecting`, `tempAccessToken`
- `handleDetectLocation()` - triggers geolocation detection
- `handleSkipProfile()` - bypasses profile completion
- `handleCompleteProfile()` - saves profile to sessionStorage, proceeds to login
- Profile form UI with phone/location inputs
- Auto-detect button (📍 Auto-detect location)

**Modified:**

- `handleConfirmCode()` - checks for `needsProfileCompletion` flag
- Final token handling - saves pending profile data via `updateUserAttributes()`
- Dialog titles and subtitles for profile step

## Cognito Attribute Mapping

| Form Field | Cognito Attribute | Format                 |
| ---------- | ----------------- | ---------------------- |
| Phone      | `phone_number`    | E.164 (+1555123456)    |
| Location   | `custom:location` | country/state (usa/wa) |

**Note:** Phone numbers are auto-formatted to E.164 (adds +1 for 10-digit US numbers)

## User Experience

### Profile Step UI

```
┌─────────────────────────────────────┐
│ ✕                                    │
│ Complete Your Profile                │
│ Help us personalize your experience  │
│ (optional)                           │
│                                      │
│ ✅ Account verified! Let's complete │
│    your profile (optional).          │
│                                      │
│ Phone number (optional)              │
│ ┌─────────────────────────────────┐ │
│ │ +1 555 123 4567                 │ │
│ └─────────────────────────────────┘ │
│                                      │
│ Location (optional)                  │
│ ┌─────────────────────────────────┐ │
│ │ usa/wa or canada/bc             │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 📍 Auto-detect location         │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌──────────┐  ┌──────────────────┐ │
│ │   Skip   │  │    Continue      │ │
│ └──────────┘  └──────────────────┘ │
└─────────────────────────────────────┘
```

### Auto-Detection Flow

1. User clicks "📍 Auto-detect location"
2. Browser requests permission
3. If granted: Shows detected location (e.g., "📍 Location detected: USA / WA")
4. If denied: Silently fails, user can type manually

## Testing

### Test New User Signup

1. Open auth dialog
2. Enter new email address
3. Enter verification code
4. **NEW:** Profile completion form appears
5. Click "📍 Auto-detect location" (grant permission)
6. Or enter phone/location manually
7. Click "Continue" (or "Skip")
8. Enter login code
9. Check profile page - should show phone/location

### Test Existing User

1. Open auth dialog
2. Enter existing email
3. Enter login code
4. **Profile step is skipped** ✓

### Test Geolocation

```javascript
// Browser console
const geo = await detectGeolocation();
console.log(geo);
// Expected: { location: "usa/wa", latitude: 47.6, longitude: -122.3, accuracy: 100 }
```

### Test Profile Update

```javascript
// After login, check Cognito attributes via API
const response = await fetch("https://api.skicyclerun.com/v2/profile", {
  headers: { Authorization: `Bearer ${idToken}` },
});
const profile = await response.json();
console.log(profile.phone, profile.location);
```

## API Backend Requirements

⚠️ **IMPORTANT:** Your Lambda profile function must map Cognito attributes correctly:

### Current API Response

```json
{
  "location": "usa/wa" // Maps from custom:location attribute
}
```

### Cognito Attributes to Map

- `phone_number` → `phone`
- `phone_number_verified` → `phoneVerified`
- `custom:location` → `location`

Make sure your Lambda is reading these attributes from the Cognito user object!

## Benefits

1. **Better User Data:** Collect phone/location immediately during signup
2. **No Extra Forms:** Integrated into auth flow (not a separate page)
3. **Optional & Skippable:** Doesn't block authentication
4. **Auto-Detection:** Geolocation makes it easier for users
5. **Profile Page Ready:** Data available immediately on first login

## Future Enhancements

- Add timezone detection (`Intl.DateTimeFormat().resolvedOptions().timeZone`)
- Preference fields (email notifications, newsletter, etc.)
- Avatar upload
- Display name / username
- Social links

## Privacy & Permissions

- Geolocation requires browser permission
- User can deny and enter manually
- All fields are optional
- Data only saved if user provides it
- Users can update later on profile page
