# AWS Cognito SMS Auth Verification Guide

## CLI Commands to Verify Configuration

### 1. Check User Pool Alias Attributes

```bash
# Get your User Pool configuration
aws cognito-idp describe-user-pool \
  --user-pool-id YOUR_USER_POOL_ID \
  --region us-east-1

# Look for "AliasAttributes" in the output:
# Should show: ["email", "phone_number"]
```

**Console Path:**  
AWS Console → Cognito → User Pools → [Your Pool] → Sign-in experience → Attributes

**What to verify:**

- [ ] `email` is checked under "Alias attributes"
- [ ] `phone_number` is checked under "Alias attributes"

---

### 2. Check App Client Auth Flows

```bash
# Describe your app client
aws cognito-idp describe-user-pool-client \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-id YOUR_CLIENT_ID \
  --region us-east-1

# Look for "ExplicitAuthFlows" in the output:
# Should include: ["USER_AUTH", "ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_AUTH"]
```

**Console Path:**  
AWS Console → Cognito → User Pools → [Your Pool] → App integration → App clients → [Your Client] → Edit

**What to verify:**

- [ ] `USER_AUTH` is enabled
- [ ] `ALLOW_USER_AUTH` is enabled
- [ ] `ALLOW_REFRESH_TOKEN_AUTH` is enabled

**In the Authentication flows section:**

- [ ] "Username and password" or "USER_AUTH" flow selected

---

### 3. Check Custom Attributes

```bash
# List all user attributes in the pool
aws cognito-idp describe-user-pool \
  --user-pool-id YOUR_USER_POOL_ID \
  --region us-east-1 \
  --query 'UserPool.SchemaAttributes[?Name==`custom:location`]'

# Should return the custom:location attribute if it exists
```

**Console Path:**  
AWS Console → Cognito → User Pools → [Your Pool] → Sign-in experience → Attributes → Custom attributes

**What to verify:**

- [ ] `custom:location` exists
- [ ] Type: String
- [ ] Mutable: Yes
- [ ] Min length: 0
- [ ] Max length: 256

**To Add Custom Attribute (CLI):**

```bash
# Note: Custom attributes can only be added at pool creation or via API
# This cannot be done after pool is created via console UI
aws cognito-idp add-custom-attributes \
  --user-pool-id YOUR_USER_POOL_ID \
  --custom-attributes \
    Name=location,AttributeDataType=String,Mutable=true,StringAttributeConstraints={MinLength=0,MaxLength=256} \
  --region us-east-1
```

---

### 4. Check SNS SMS Configuration

```bash
# Check SNS SMS spending limit
aws sns get-sms-attributes \
  --region us-east-1

# Look for "MonthlySpendLimit" in output
# Default is usually "1.00" USD
```

**Console Path:**  
AWS Console → SNS → Text messaging (SMS) → Account information

**What to verify:**

- [ ] Account spend limit: Should be > $1.00 for production
- [ ] Default sender ID: (optional)
- [ ] Default message type: Promotional or Transactional

**Sandbox Phone Numbers (Testing):**

```bash
# List verified phone numbers in SNS sandbox
aws sns list-phone-numbers-opted-out \
  --region us-east-1

# List sandbox phone numbers
aws sns list-sms-sandbox-phone-numbers \
  --region us-east-1
```

**Console Path:**  
AWS Console → SNS → Text messaging (SMS) → Sandbox destination phone numbers

**What to verify:**

- [ ] Test phone numbers are added and verified
- [ ] Each number shows "Verified" status

---

### 5. Request SNS Spending Limit Increase

**You CANNOT do this via CLI - must use Console or Support**

**Console Path:**  
AWS Console → SNS → Text messaging (SMS) → Account information → Edit account settings → Monthly SMS spend limit

**Steps:**

1. Click "Edit" next to Monthly spend limit
2. Enter new limit (e.g., $100.00)
3. Fill out use case form:
   - Use case type: Transactional (for OTP)
   - Website/app URL: https://skicyclerun.com
   - Company name: SkiCycleRun
   - Expected monthly volume: (estimate)
   - Message content example: "Your verification code is: 123456"
4. Submit request
5. Wait for AWS approval (usually 24-48 hours)

**Status Check:**

```bash
# Check current spend limit
aws sns get-sms-attributes \
  --attributes MonthlySpendLimit \
  --region us-east-1
```

---

### 6. Check IAM Permissions

```bash
# Get your current IAM policy for Cognito
aws iam get-user-policy \
  --user-name YOUR_IAM_USER \
  --policy-name YOUR_POLICY_NAME

# Or for a role:
aws iam get-role-policy \
  --role-name YOUR_ROLE_NAME \
  --policy-name YOUR_POLICY_NAME
```

**Required Permissions (JSON):**

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

**Console Path:**  
AWS Console → IAM → Users/Roles → [Your User/Role] → Permissions → Add permissions

**What to verify:**

- [ ] All Cognito actions listed above are allowed
- [ ] SNS Publish permission is granted
- [ ] Resource ARN matches your User Pool

**Add Policy (CLI):**

```bash
# Create policy document (save as cognito-sms-policy.json)
aws iam put-user-policy \
  --user-name YOUR_IAM_USER \
  --policy-name CognitoSMSAuthPolicy \
  --policy-document file://cognito-sms-policy.json
```

---

## Quick Verification Script

Save this as `verify-cognito-sms.sh`:

```bash
#!/bin/bash

POOL_ID="YOUR_USER_POOL_ID"
CLIENT_ID="YOUR_CLIENT_ID"
REGION="us-east-1"

echo "🔍 Verifying Cognito SMS Authentication Setup..."
echo ""

# 1. Check alias attributes
echo "1️⃣ Checking alias attributes..."
aws cognito-idp describe-user-pool \
  --user-pool-id $POOL_ID \
  --region $REGION \
  --query 'UserPool.AliasAttributes' \
  --output text

echo ""

# 2. Check auth flows
echo "2️⃣ Checking app client auth flows..."
aws cognito-idp describe-user-pool-client \
  --user-pool-id $POOL_ID \
  --client-id $CLIENT_ID \
  --region $REGION \
  --query 'UserPoolClient.ExplicitAuthFlows' \
  --output text

echo ""

# 3. Check custom attributes
echo "3️⃣ Checking custom:location attribute..."
aws cognito-idp describe-user-pool \
  --user-pool-id $POOL_ID \
  --region $REGION \
  --query 'UserPool.SchemaAttributes[?Name==`custom:location`]' \
  --output json

echo ""

# 4. Check SNS spend limit
echo "4️⃣ Checking SNS SMS spending limit..."
aws sns get-sms-attributes \
  --attributes MonthlySpendLimit \
  --region $REGION \
  --output text

echo ""

# 5. Check sandbox phone numbers
echo "5️⃣ Checking SNS sandbox phone numbers..."
aws sns list-sms-sandbox-phone-numbers \
  --region $REGION \
  --output table

echo ""
echo "✅ Verification complete!"
```

**Run it:**

```bash
chmod +x verify-cognito-sms.sh
./verify-cognito-sms.sh
```

---

## Dashboard Locations (Console UI)

### Quick Access Links

1. **User Pool Attributes**  
   https://console.aws.amazon.com/cognito/v2/idp/user-pools/YOUR_POOL_ID/sign-in-experience

2. **App Client Settings**  
   https://console.aws.amazon.com/cognito/v2/idp/user-pools/YOUR_POOL_ID/app-integration

3. **SNS SMS Settings**  
   https://console.aws.amazon.com/sns/v3/home?region=us-east-1#/mobile/text-messaging

4. **IAM Policies**  
   https://console.aws.amazon.com/iam/home#/users/YOUR_USER

---

## Troubleshooting

### Issue: CLI commands return "AccessDenied"

**Solution:**

```bash
# Configure AWS CLI with proper credentials
aws configure

# Or export credentials
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_DEFAULT_REGION=us-east-1
```

### Issue: Can't find custom:location attribute

**Solution:**
Custom attributes must be added when the pool is created or via API:

```bash
aws cognito-idp add-custom-attributes \
  --user-pool-id YOUR_POOL_ID \
  --custom-attributes Name=location,AttributeDataType=String,Mutable=true \
  --region us-east-1
```

### Issue: SNS spending limit still $1.00

**Solution:**

- Spending limit increases require manual AWS review
- Submit request via Console (SNS → Account information)
- Include detailed use case and business justification
- Approval usually takes 24-48 hours

---

## Final Checklist

Before enabling SMS authentication in production:

```bash
# Run this to verify everything:
aws cognito-idp describe-user-pool --user-pool-id YOUR_POOL_ID --region us-east-1 \
  | jq '{
      aliasAttributes: .UserPool.AliasAttributes,
      mfaConfig: .UserPool.MfaConfiguration,
      smsConfig: .UserPool.SmsConfiguration
    }'

aws cognito-idp describe-user-pool-client --user-pool-id YOUR_POOL_ID --client-id YOUR_CLIENT_ID --region us-east-1 \
  | jq '{
      authFlows: .UserPoolClient.ExplicitAuthFlows,
      supportedIdps: .UserPoolClient.SupportedIdentityProviders
    }'

aws sns get-sms-attributes --region us-east-1 | jq
```

- [ ] Alias attributes include email and phone_number
- [ ] USER_AUTH flow is enabled
- [ ] custom:location attribute exists
- [ ] SNS spending limit > $1.00
- [ ] IAM permissions include UpdateUserAttributes, GetUserAttributeVerificationCode, VerifyUserAttribute
- [ ] Test phone numbers verified in SNS sandbox (if testing)

**Ready to deploy!** 🚀
