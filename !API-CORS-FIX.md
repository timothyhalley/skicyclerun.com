# Fix CORS Issue - API Gateway Configuration

## Error

```
Fetch API cannot load https://api.skicyclerun.com/v2/profile due to access control checks.
```

This is a **CORS (Cross-Origin Resource Sharing)** error. Your API Gateway is blocking requests from your website.

## Root Cause

- Frontend: `http://localhost:4321` or `https://skicyclerun.com`
- API: `https://api.skicyclerun.com`
- Different domains = CORS required

## Fix in AWS Console

### Option 1: Enable CORS in API Gateway (Recommended)

1. **Go to API Gateway Console**
   - Open [AWS API Gateway](https://console.aws.amazon.com/apigateway)
   - Select your API (skicyclerun API)

2. **Enable CORS for `/v2/profile` endpoint**
   - Click on `/v2/profile` resource
   - Click "Actions" → "Enable CORS"
   - Set the following:

     ```
     Access-Control-Allow-Origin: *
     (or specific: https://skicyclerun.com,http://localhost:4321)

     Access-Control-Allow-Headers:
     Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token

     Access-Control-Allow-Methods: GET,OPTIONS
     ```

   - Click "Enable CORS and replace existing CORS headers"

3. **Deploy API**
   - Click "Actions" → "Deploy API"
   - Select deployment stage (e.g., "prod")
   - Click "Deploy"

### Option 2: Add CORS in Lambda Response

If you prefer to handle CORS in Lambda code:

```python
# In your Lambda function (Python)
import json

def lambda_handler(event, context):
    # ... your existing code ...

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',  # Or your specific domain
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,OPTIONS'
        },
        'body': json.dumps({
            'sub': user_sub,
            'email': user_email,
            # ... rest of profile data
        })
    }
```

### Option 3: Add CORS via SAM Template

If using SAM/CloudFormation:

```yaml
# template.yaml
Resources:
  ProfileFunction:
    Type: AWS::Serverless::Function
    Properties:
      # ... existing properties ...
      Events:
        ProfileApi:
          Type: Api
          Properties:
            Path: /v2/profile
            Method: get
            RestApiId: !Ref MyApi

  MyApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Cors:
        AllowOrigin: "'*'" # Or "'https://skicyclerun.com'"
        AllowHeaders: "'Content-Type,Authorization'"
        AllowMethods: "'GET,OPTIONS'"
```

## Verify CORS Headers

After deploying, test with curl:

```bash
# Check OPTIONS preflight request
curl -X OPTIONS https://api.skicyclerun.com/v2/profile \
  -H "Origin: http://localhost:4321" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -v

# Expected response headers:
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Methods: GET,OPTIONS
# Access-Control-Allow-Headers: Content-Type,Authorization
```

```bash
# Check actual GET request
curl https://api.skicyclerun.com/v2/profile \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Origin: http://localhost:4321" \
  -v

# Expected response header:
# Access-Control-Allow-Origin: *
```

## Frontend Fix Applied

Changed the fetch call from:

```javascript
// BEFORE (wrong - no email param needed)
fetch("https://api.skicyclerun.com/v2/profile?email=user@example.com", {
  credentials: "include",
});

// AFTER (correct - token contains user identity)
fetch("https://api.skicyclerun.com/v2/profile", {
  method: "GET",
  headers: { Authorization: "Bearer YOUR_ID_TOKEN" },
  mode: "cors",
  credentials: "omit",
});
```

## Quick Test After CORS Fix

1. Open browser console on profile page
2. Should see:
   ```
   [Profile] 🚀 Making API request to: https://api.skicyclerun.com/v2/profile
   [Profile] 📥 API response status: 200
   [Profile] API success response: { sub: "...", email: "...", ... }
   ```

## Common CORS Issues

### Issue: Still getting CORS error after enabling

**Solution:** Make sure you **deployed** the API after enabling CORS

### Issue: Works in Postman but not browser

**Reason:** Postman doesn't enforce CORS, browsers do
**Solution:** Enable CORS in API Gateway (browser requirement)

### Issue: 401 Unauthorized instead of CORS error

**Solution:** This means CORS is fixed! Now fix the authorizer (see previous notes)

### Issue: Preflight OPTIONS request failing

**Solution:** API Gateway needs to respond to OPTIONS requests with 200 + CORS headers

## Expected Flow After Fix

1. ✅ Frontend makes request to `/v2/profile` with `Authorization: Bearer <token>`
2. ✅ API Gateway OPTIONS preflight succeeds (CORS headers present)
3. ✅ API Gateway GET request forwarded to Lambda
4. ⚠️ Lambda authorizer validates token (currently blocking - see AUTH-FIX notes)
5. ✅ Lambda returns profile data with CORS headers
6. ✅ Frontend receives and displays profile

## Next Steps

1. **Enable CORS in API Gateway** (this fix)
2. **Fix authorizer** to accept USER_AUTH tokens (previous issue)
3. Test profile page loads correctly

## API Endpoint Reference

| Endpoint      | Method | Auth                    | Query Params           |
| ------------- | ------ | ----------------------- | ---------------------- |
| `/v2/profile` | GET    | Required (Bearer token) | None (user from token) |

## Browser Console Commands

```javascript
// Test API call manually
const token = localStorage.getItem("cognito_id_token");
fetch("https://api.skicyclerun.com/v2/profile", {
  headers: { Authorization: `Bearer ${token}` },
})
  .then((r) => r.json())
  .then((d) => console.log("Profile:", d))
  .catch((e) => console.error("Error:", e));
```
