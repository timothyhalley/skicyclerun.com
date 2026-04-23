# SAM Backend — Auth Lambda Specification

> **This document lives in the frontend repo as a reference contract only.**
> All implementation changes described here belong in the SAM/Lambda repository.
> Nothing in this file should ever be edited in this repo.

---

## Overview

The frontend communicates with the backend exclusively through two HTTP endpoints
exposed by API Gateway. No Cognito SDK calls are made from the frontend.

```text
Frontend (Astro)
  │
  ├─ POST https://api.skicyclerun.com/v2/auth/send-otp
  └─ POST https://api.skicyclerun.com/v2/auth/verify-otp
```

All Cognito user pool operations (user creation, group assignment, token issuance)
happen inside the SAM backend Lambdas. The frontend is a pure consumer of the
responses — it stores tokens in `localStorage` and reads `groups` to gate content.

---

## Endpoint Contracts

### `POST /v2/auth/send-otp`

Initiates a passwordless OTP challenge for an existing or new user.

#### send-otp — Request body

```json
{
  "action": "send",
  "email": "user@example.com",
  "phoneNumber": "+12065551234"
}
```

- `action` — always `"send"` (string, required)
- `email` — user's email address (string, optional if `phoneNumber` provided)
- `phoneNumber` — E.164 format (string, optional if `email` provided)
- At least one of `email` or `phoneNumber` is required

#### send-otp — Success response (HTTP 200)

```json
{
  "success": true,
  "message": "OTP sent",
  "challengeName": "EMAIL_OTP",
  "session": "<cognito-session-token>",
  "availableChallenges": ["EMAIL_OTP"],
  "challengeParameters": {}
}
```

#### send-otp — Error response (HTTP 4xx/5xx)

```json
{
  "error": "Human-readable error message"
}
```

---

### `POST /v2/auth/verify-otp`

Verifies the OTP and returns JWT tokens plus the user's full profile.

#### verify-otp — Request body

```json
{
  "otp": "123456",
  "email": "user@example.com",
  "phoneNumber": "+12065551234"
}
```

- `otp` — the code the user entered (string, required)
- `email` / `phoneNumber` — same identifier used in `send-otp` (one required)

#### verify-otp — Success response (HTTP 200)

```json
{
  "success": true,
  "verified": true,
  "sub": "cognito-user-uuid",
  "username": "user@example.com",
  "name": "Display Name",
  "email": "user@example.com",
  "emailVerified": true,
  "phone": "+12065551234",
  "phoneVerified": false,
  "zoneinfo": "America/Los_Angeles",
  "location": "usa/wa",
  "groups": ["SuperUsers", "GeneralUsers"],
  "userStatus": "CONFIRMED",
  "enabled": true,
  "createdTime": "2026-01-15T08:00:00Z",
  "lastUpdatedTime": "2026-01-15T08:00:00Z",
  "idToken": "<JWT>",
  "accessToken": "<JWT>",
  "refreshToken": "<JWT>",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

> **Critical:** `groups` must be a non-empty string array for the frontend to
> correctly gate protected content. An empty or missing `groups` array causes the
> frontend to fall back to a display-only `["User"]` label with no real access.
>
> **Ordering contract:** API should return groups sorted by Cognito precedence
> (`Precedence`: lower number = higher authority), so `groups[0]` is always the
> highest role.

#### verify-otp — Error response (HTTP 4xx/5xx)

```json
{
  "error": "Invalid OTP code"
}
```

---

## Known Issue — Group Assignment Bug

### Symptom

New users who sign in for the first time have no Cognito group assignment.
The `verify-otp` response returns `groups: []` or omits `groups` entirely.
The frontend profile page then displays `"User"` as a cosmetic fallback (not a
real Cognito group) and the user cannot access `GeneralUsers`-gated content.

### Root Cause

The `SkiCycleRun_AutoConfirm` PreSignUp Lambda auto-confirms new users but does
**not** add them to any Cognito group. Cognito group assignment (`AdminAddUserToGroup`)
must be performed explicitly — it is never automatic.

### Group Model (Required)

- `GeneralUsers` is the baseline group for all users.
- `SuperUsers` is additive, not exclusive.
- Any `SuperUsers` member must also be in `GeneralUsers`.

### User Mapping (Required)

- `skicyclerun` => `SuperUsers` + `GeneralUsers`
- `amsherrin` => `GeneralUsers`

### Fix Required in SAM Repo

There are two valid implementation locations. **Option A is preferred** because it
runs exactly once per user at creation time.

---

#### Option A — PreSignUp Lambda (`SkiCycleRun_AutoConfirm`)

**Lambda function change** (`handlers/autoConfirmUser.js` or equivalent):

```js
const {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const cognitoClient = new CognitoIdentityProviderClient({});
const GENERAL_GROUP = "GeneralUsers";
const SUPERUSER_GROUP = "SuperUsers";
const SUPERUSER_USERNAMES = new Set(["skicyclerun"]);

exports.handler = async (event) => {
  event.response.autoConfirmUser = true;

  if (
    Object.prototype.hasOwnProperty.call(event.request.userAttributes, "email")
  ) {
    event.response.autoVerifyEmail = true;
  }
  if (
    Object.prototype.hasOwnProperty.call(
      event.request.userAttributes,
      "phone_number",
    )
  ) {
    event.response.autoVerifyPhone = true;
  }

  try {
    // Baseline group for every user.
    await cognitoClient.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: event.userPoolId,
        Username: event.userName,
        GroupName: GENERAL_GROUP,
      }),
    );
    console.log(`[AutoConfirm] Added ${event.userName} to ${GENERAL_GROUP}`);

    // Additive elevation: superusers keep GeneralUsers and also get SuperUsers.
    if (SUPERUSER_USERNAMES.has(String(event.userName).toLowerCase())) {
      await cognitoClient.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: event.userPoolId,
          Username: event.userName,
          GroupName: SUPERUSER_GROUP,
        }),
      );
      console.log(
        `[AutoConfirm] Added ${event.userName} to ${SUPERUSER_GROUP}`,
      );
    }
  } catch (err) {
    // Non-fatal: log and continue — do not throw, or the signup will fail.
    console.error(`[AutoConfirm] Group assignment failed: ${err.message}`);
  }

  return event;
};
```

**IAM role addition** for the Lambda execution role (add to SAM template or inline policy):

```yaml
Policies:
  - Statement:
      - Effect: Allow
        Action:
          - cognito-idp:AdminAddUserToGroup
        Resource: !Sub "arn:aws:cognito-idp:${AWS::Region}:${AWS::AccountId}:userpool/${UserPoolId}"
```

Or as a raw IAM policy document:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["cognito-idp:AdminAddUserToGroup"],
      "Resource": "arn:aws:cognito-idp:us-west-2:<ACCOUNT_ID>:userpool/us-west-2_nkPiRBTSr"
    }
  ]
}
```

---

#### Option B — verify-otp Lambda (post-auth group check)

Add a group-check-and-assign step inside the `verify-otp` handler, after the
Cognito `AdminInitiateAuth` / `RespondToAuthChallenge` succeeds:

```js
const {
  AdminListGroupsForUserCommand,
  AdminAddUserToGroupCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const GENERAL_GROUP = "GeneralUsers";
const SUPERUSER_GROUP = "SuperUsers";
const SUPERUSER_USERNAMES = new Set(["skicyclerun"]);

// After successful auth:
const groupsResult = await cognitoClient.send(
  new AdminListGroupsForUserCommand({
    UserPoolId: process.env.USER_POOL_ID,
    Username: username,
  }),
);

const groupsFromCognito = groupsResult.Groups ?? [];
const groupNames = new Set(groupsFromCognito.map((g) => g.GroupName));

if (!groupNames.has(GENERAL_GROUP)) {
  await cognitoClient.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: username,
      GroupName: GENERAL_GROUP,
    }),
  );
  groupNames.add(GENERAL_GROUP);
}

if (
  SUPERUSER_USERNAMES.has(String(username).toLowerCase()) &&
  !groupNames.has(SUPERUSER_GROUP)
) {
  await cognitoClient.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: username,
      GroupName: SUPERUSER_GROUP,
    }),
  );
  groupNames.add(SUPERUSER_GROUP);
}

// Re-read groups so precedence metadata is current after any additions.
const updatedGroupsResult = await cognitoClient.send(
  new AdminListGroupsForUserCommand({
    UserPoolId: process.env.USER_POOL_ID,
    Username: username,
  }),
);

const groups = (updatedGroupsResult.Groups ?? [])
  .slice()
  .sort((a, b) => {
    const aPrecedence = a.Precedence ?? Number.MAX_SAFE_INTEGER;
    const bPrecedence = b.Precedence ?? Number.MAX_SAFE_INTEGER;
    return aPrecedence - bPrecedence;
  })
  .map((g) => g.GroupName);

// Include groups in the response body sent back to the frontend:
return {
  statusCode: 200,
  body: JSON.stringify({
    success: true,
    // ... other fields ...
    groups,
  }),
};
```

The IAM policy addition is the same as Option A.

---

#### Option B — verify-otp Lambda — `groups` sourcing

Regardless of which option is chosen, the `verify-otp` Lambda must populate the
`groups` array in its response from Cognito (via `AdminListGroupsForUser`) rather
than returning an empty array or omitting the field.

---

## Existing User Migration

Users who signed up before this fix was deployed have no group assignment.
Run a one-time migration in the SAM repo:

```js
// migration/backfill-groups.js
const {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminListGroupsForUserCommand,
  AdminAddUserToGroupCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient({ region: "us-west-2" });
const USER_POOL_ID = "us-west-2_nkPiRBTSr";
const DEFAULT_GROUP = "GeneralUsers";

async function backfill() {
  let paginationToken;
  do {
    const { Users, PaginationToken } = await client.send(
      new ListUsersCommand({
        UserPoolId: USER_POOL_ID,
        PaginationToken: paginationToken,
      }),
    );
    for (const user of Users) {
      const { Groups } = await client.send(
        new AdminListGroupsForUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: user.Username,
        }),
      );
      if (Groups.length === 0) {
        await client.send(
          new AdminAddUserToGroupCommand({
            UserPoolId: USER_POOL_ID,
            Username: user.Username,
            GroupName: DEFAULT_GROUP,
          }),
        );
        console.log(`Assigned ${user.Username} → ${DEFAULT_GROUP}`);
      }
    }
    paginationToken = PaginationToken;
  } while (paginationToken);
}

backfill().catch(console.error);
```

Run once with appropriate AWS credentials. Requires `cognito-idp:ListUsers`,
`cognito-idp:AdminListGroupsForUser`, and `cognito-idp:AdminAddUserToGroup`.

---

## User Pool Reference

| Parameter             | Value                                                                         |
| --------------------- | ----------------------------------------------------------------------------- |
| Region                | `us-west-2`                                                                   |
| User Pool ID          | `us-west-2_nkPiRBTSr`                                                         |
| Auth flows            | `ALLOW_USER_AUTH`, `ALLOW_REFRESH_TOKEN_AUTH`                                 |
| OTP challenge types   | `EMAIL_OTP`, `SMS_OTP`                                                        |
| Group model           | `GeneralUsers` baseline, `SuperUsers` additive                                |
| Group ordering in API | Sort by Cognito `Precedence` ascending                                        |
| User mapping          | `skicyclerun` => `SuperUsers` + `GeneralUsers`; `amsherrin` => `GeneralUsers` |
| PreSignUp Lambda      | `SkiCycleRun_AutoConfirm`                                                     |

---

## Frontend Group Expectations

The frontend reads `groups` from the `verify-otp` response and stores it in
`localStorage`. Protected content checks for group membership like:

```ts
// src/utils/passwordlessAuth.ts
const groups = response.groups ?? [];
// "GeneralUsers" members can access protected posts
```

If `groups` is `[]` or missing:

- User appears logged in but sees no protected content
- Profile page displays fake `["User"]` label (cosmetic only, not a Cognito group)
- No errors thrown — the failure is silent from the user's perspective
