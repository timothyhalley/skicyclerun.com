# AWS Cognito Configuration for SMS Authentication

## Overview

This guide documents the AWS Cognito User Pool configuration required to enable **passwordless authentication with both Email and SMS** (either/or).

Users can sign in with **either** a verified email address **or** a verified phone number. They don't need both - just one verified contact method is sufficient.

---

## ⚙️ User Pool Configuration

### 1. Alias Attributes

Enable both email and phone number as alias attributes so users can log in with either:

**AWS Console Path:**  
`Amazon Cognito → User Pools → [Your Pool] → Sign-in experience → Attributes`

**Settings:**

- ✅ **email** - Allow as alias attribute
- ✅ **phone_number** - Allow as alias attribute
- ✅ **Preferred username** (optional) - If you want traditional usernames

**What this means:**

- Users can register with email only, phone only, or both
- Users can sign in with whichever attribute they verified
- Cognito requires the attribute used for login to be verified

---

### 2. Required Attributes

Configure which attributes are mandatory at sign-up:

**AWS Console Path:**  
`Amazon Cognito → User Pools → [Your Pool] → Sign-in experience → Attributes`

**Recommended Settings:**

- ✅ **email** - Required (or optional if phone-only auth is desired)
- ✅ **phone_number** - Optional (let users add later)
- ✅ **custom:location** - Optional (let users add later)

**Note:** You can require both, but for flexibility, requiring email and making phone optional is a good balance.

---

### 3. Verification Settings

Configure how attributes are verified:

**AWS Console Path:**  
`Amazon Cognito → User Pools → [Your Pool] → Sign-in experience → Multi-factor authentication`

**Email Verification:**

- **Cognito** handles email verification automatically
- Uses built-in email service or Amazon SES
- Sends 6-8 digit verification codes

**Phone Verification:**

- **Cognito** handles SMS automatically via Amazon SNS
- Sends 6-digit verification codes
- Requires SNS SMS spending limit increase (default is $1/month)

**Settings:**

- Enable: "Attributes to verify" → Select both **email** and **phone_number**
- Verification method: **CODE** (not LINK for phone)

---

### 4. MFA Settings

**AWS Console Path:**  
`Amazon Cognito → User Pools → [Your Pool] → Sign-in experience → Multi-factor authentication`

**Recommended Settings:**

- **MFA enforcement:** Optional or OFF (passwordless is already secure)
- **MFA methods:** SMS text message (if enabling MFA)
- **Passwordless authentication:** Use EMAIL_OTP and SMS_OTP challenges instead of traditional MFA

**Why optional?**  
Passwordless authentication with time-limited OTP codes is already secure. Adding MFA would require users to enter two codes, which is poor UX.

---

### 5. Passwordless Authentication

**AWS Console Path:**  
`Amazon Cognito → User Pools → [Your Pool] → App clients → [Your App Client] → Authentication flows`

**Required Authentication Flows:**

- ✅ **USER_AUTH** - Enable passwordless authentication
- ✅ **ALLOW_USER_AUTH** - Required for USER_AUTH flow
- ✅ **ALLOW_REFRESH_TOKEN_AUTH** - For token refresh

**Challenge Types to Enable:**

- ✅ **EMAIL_OTP** - Passwordless email verification
- ✅ **SMS_OTP** - Passwordless SMS verification

---

### 6. Custom Attributes

Add custom attributes for user profile data:

**AWS Console Path:**  
`Amazon Cognito → User Pools → [Your Pool] → Sign-in experience → Attributes → Custom attributes`

**Recommended Custom Attributes:**

- **custom:location** - String, mutable, max length 256
  - Format: `country/state` (e.g., `usa/wa`, `canada/bc`, `japan`)
- **custom:timezone** - String, mutable, max length 50 (optional)
- **custom:preferences** - String, mutable, max length 1024 (optional JSON)

**Note:** Custom attributes must be prefixed with `custom:` and are **immutable after creation** (you can't change the type/name later).

---

### 7. App Client Settings

**AWS Console Path:**  
`Amazon Cognito → User Pools → [Your Pool] → App clients → [Your App Client]`

**Required Settings:**

- ✅ **Generate client secret:** NO (public client for web apps)
- ✅ **Authentication flows:**
  - ALLOW_USER_AUTH
  - ALLOW_REFRESH_TOKEN_AUTH
- ✅ **OAuth 2.0 flows:** (if using Hosted UI)
  - Authorization code grant
  - Implicit grant
- ✅ **Allowed callback URLs:** `https://skicyclerun.com/`, `http://localhost:4321/`
- ✅ **Allowed sign out URLs:** Same as callback URLs
- ✅ **OAuth scopes:**
  - openid
  - email
  - phone
  - profile

---

### 8. SNS SMS Configuration

To enable SMS_OTP, configure Amazon SNS for SMS delivery:

**AWS Console Path:**  
`Amazon SNS → Text messaging (SMS) → Sandbox destination phone numbers` (for testing)  
`Amazon SNS → Text messaging (SMS) → Spending quotas` (for production)

**Required Steps:**

1. **Sandbox Mode** (for testing):
   - Add test phone numbers to SNS sandbox
   - Verify each phone number via console
   - Can send SMS only to verified numbers

2. **Production Mode** (for live users):
   - Request spending limit increase (default is $1.00 USD/month)
   - Fill out SMS use case form (account review)
   - Wait for AWS approval (usually 24-48 hours)
   - Set spending limit based on expected usage

3. **SNS Topic Configuration** (optional):
   - Create SNS topic for SMS failures/logging
   - Set up CloudWatch alarms for delivery failures

**Cost Estimate:**

- US SMS: ~$0.00645 per message
- International: varies by country ($0.01 - $0.50 per message)
- Budget $100/month for ~15,000 SMS messages in US

---

### 9. IAM Permissions

Ensure your application's IAM role/user has the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:SignUp",
        "cognito-idp:InitiateAuth",
        "cognito-idp:RespondToAuthChallenge",
        "cognito-idp:ConfirmSignUp",
        "cognito-idp:ResendConfirmationCode",
        "cognito-idp:UpdateUserAttributes",
        "cognito-idp:GetUserAttributeVerificationCode",
        "cognito-idp:VerifyUserAttribute"
      ],
      "Resource": "arn:aws:cognito-idp:REGION:ACCOUNT_ID:userpool/POOL_ID"
    },
    {
      "Effect": "Allow",
      "Action": ["sns:Publish"],
      "Resource": "*"
    }
  ]
}
```

**Note:** Replace `REGION`, `ACCOUNT_ID`, and `POOL_ID` with your values.

---

## 🔐 Registration Flow

### New User Signs Up with Email Only

1. User enters email address
2. Cognito sends verification code to email
3. User enters code → **email verified**
4. User can now log in with email
5. _(Optional)_ User can add phone number later in profile

### New User Signs Up with Phone Only

1. User enters phone number (must include country code: +1 555 123 4567)
2. Cognito sends verification code via SMS
3. User enters code → **phone verified**
4. User can now log in with phone number
5. _(Optional)_ User can add email later in profile

### New User Signs Up with Both

1. User enters both email and phone
2. Cognito sends verification code to email (default)
3. User enters code → **email verified**
4. User can log in with email
5. _(Optional)_ User can verify phone later in profile settings

---

## 🔑 Login Flow

### Login with Email (EMAIL_OTP)

1. User enters email address
2. Cognito verifies email is registered and verified
3. Cognito sends one-time code to email
4. User enters code
5. Cognito returns JWT tokens (ID, Access, Refresh)

### Login with Phone (SMS_OTP)

1. User enters phone number (with country code)
2. Cognito verifies phone is registered and verified
3. Cognito sends one-time code via SMS
4. User enters code
5. Cognito returns JWT tokens (ID, Access, Refresh)

---

## 📝 Profile Update Flow

Users can update their contact information in the profile page:

### Update Email (Requires Verification)

1. User must have at least one verified contact method (email or phone)
2. User enters new email address
3. System calls `UpdateUserAttributes` API
4. System calls `GetUserAttributeVerificationCode` for email
5. Cognito sends verification code to **new** email
6. User enters code
7. System calls `VerifyUserAttribute` API
8. New email is now **verified** and can be used for login

### Update Phone (Requires Verification)

1. User must have at least one verified contact method (email or phone)
2. User enters new phone number (with country code)
3. System calls `UpdateUserAttributes` API
4. System calls `GetUserAttributeVerificationCode` for phone_number
5. Cognito sends verification code to **new** phone via SMS
6. User enters code
7. System calls `VerifyUserAttribute` API
8. New phone is now **verified** and can be used for login

### Safety Rule

**You cannot update your last verified contact method without first verifying a new one.**

This prevents account lockout scenarios where a user changes their email but can't verify the new email, leaving them unable to log in.

---

## 🎯 Implementation Checklist

Before enabling SMS authentication in production:

- [ ] Configure User Pool alias attributes (email + phone_number)
- [ ] Enable USER_AUTH flow and EMAIL_OTP + SMS_OTP challenges
- [ ] Add custom:location attribute for user profiles
- [ ] Set up SNS for SMS delivery
  - [ ] Configure sandbox phone numbers (testing)
  - [ ] Request spending limit increase (production)
  - [ ] Set up CloudWatch alarms for SMS failures
- [ ] Update IAM permissions for UpdateUserAttributes, GetUserAttributeVerificationCode, VerifyUserAttribute
- [ ] Test registration with email only
- [ ] Test registration with phone only
- [ ] Test login with email
- [ ] Test login with phone
- [ ] Test profile update: email → verify → login
- [ ] Test profile update: phone → verify → login
- [ ] Test edge case: can't update last verified contact without adding a new one
- [ ] Update frontend to show ProfileEditor component
- [ ] Update backend API to sync phone number to DynamoDB
- [ ] Deploy to staging environment
- [ ] User acceptance testing
- [ ] Monitor SMS delivery success rates
- [ ] Deploy to production

---

## 🐛 Common Issues & Solutions

### Issue: SMS not sending

**Possible causes:**

1. SNS spending limit reached ($1/month default)
2. Phone number not in sandbox (testing mode)
3. Invalid phone number format (missing +1 country code)
4. SNS IAM permissions missing

**Solutions:**

- Check SNS spending quotas in AWS console
- Verify phone number format: `+1 555 123 4567` (not `555-123-4567`)
- Add phone to SNS sandbox for testing
- Request spending limit increase for production

### Issue: Email verification not sending

**Possible causes:**

1. Email in spam folder
2. SES sandbox mode (testing)
3. Invalid email format

**Solutions:**

- Check spam/junk folders
- Verify email address in SES sandbox (testing)
- Request SES production access
- Use a real email domain (not temp email services)

### Issue: User locked out after changing contact info

**Root cause:** User changed their only verified contact method before verifying the new one.

**Solution:** Enforce UI rule: cannot edit last verified contact without first adding and verifying a new one.

**Code example:**

```typescript
const canUpdate = profile.emailVerified || profile.phoneVerified;
if (!canUpdate) {
  setStatus({
    tone: "error",
    text: "You must have at least one verified contact method before updating.",
  });
  return;
}
```

---

## 📚 Additional Resources

- [AWS Cognito Passwordless Authentication](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-passwordless.html)
- [SNS SMS Best Practices](https://docs.aws.amazon.com/sns/latest/dg/sns-mobile-phone-number-as-subscriber.html)
- [Cognito USER_AUTH Flow](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow.html#USER_AUTH_flow)
- [Custom Attributes in Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html#user-pool-settings-custom-attributes)

---

## 🎉 Summary

With this configuration, your application supports:

✅ Passwordless authentication via email or SMS  
✅ Users can sign in with verified email OR verified phone  
✅ Users can add/update contact information with verification  
✅ Safety rule: always maintain at least one verified contact method  
✅ Flexible registration: email only, phone only, or both  
✅ Secure OTP-based authentication (6-8 digit codes)  
✅ Custom profile attributes (location, timezone, etc.)

Your users get a modern, secure, and flexible authentication experience! 🚀
