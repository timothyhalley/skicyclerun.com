# LLM Directives — Scope Boundaries for This Repository

This document establishes hard boundaries for AI coding assistants working in
this codebase. Read this before making any changes.

---

## What This Repo Is

This is the **skicyclerun.com frontend** — an Astro static site.

- Framework: Astro + React islands + Tailwind CSS v4
- Deployment: Static build output, served via CDN
- Auth: Passwordless OTP via API Gateway endpoints (frontend is a consumer only)

---

## What This Repo Is NOT

This repo does **not** contain:

- AWS Lambda function source code
- SAM (Serverless Application Model) templates
- AWS CDK stacks
- Cognito configuration or triggers
- IAM roles or policies
- DynamoDB schemas or access patterns
- Any backend infrastructure

**All of the above live in a separate SAM repository** that is not open in this workspace.

---

## Hard Boundaries — Never Do These

### ❌ Do not create Lambda function code here

Any `.js`/`.ts` file that is intended to run as an AWS Lambda handler does not
belong in this repo. If a logic fix involves Lambda behavior, write a specification
(see `!help_md/SAM-AUTH-LAMBDA-SPEC.md`) and stop.

### ❌ Do not create AWS deployment scripts here

Scripts that call `aws lambda`, `aws cognito-idp`, `aws iam`, `aws cloudformation`,
`sam deploy`, or similar AWS CLI commands for infrastructure deployment do not
belong here. The one exception is `update-version.ts` which updates the static
`version.json` file only.

### ❌ Do not create or modify IAM policy documents here

IAM policies belong in the SAM repo's CloudFormation/SAM templates.

### ❌ Do not suggest or implement changes to Cognito triggers here

Cognito PreSignUp, PostConfirmation, PreAuthentication, DefineAuthChallenge,
CreateAuthChallenge, VerifyAuthChallenge, and similar triggers are Lambda
functions that live in the SAM repo.

### ❌ Do not add AWS SDK packages to package.json here

`@aws-sdk/*`, `aws-amplify`, `amazon-cognito-identity-js`, and similar packages
are backend concerns. The frontend calls plain HTTPS endpoints — no SDK needed.

---

## The Auth Boundary

The frontend's auth layer is intentionally thin and consists of exactly two files:

| File                            | Purpose                                     |
| ------------------------------- | ------------------------------------------- |
| `src/utils/samAuthClient.ts`    | HTTP wrapper for the two OTP endpoints      |
| `src/utils/passwordlessAuth.ts` | Session management, token storage, UI state |

**The frontend does not talk to Cognito directly.** It only POSTs to:

```
POST https://api.skicyclerun.com/v2/auth/send-otp
POST https://api.skicyclerun.com/v2/auth/verify-otp
```

These are the only auth endpoints. Do not hardcode other API paths unless the
contract in `!help_md/SAM-AUTH-LAMBDA-SPEC.md` has been updated first.

### Group Semantics Contract

- `GeneralUsers` is the baseline group for all users.
- `SuperUsers` is additive, not exclusive.
- A `SuperUsers` member is also expected to be in `GeneralUsers`.
- API `groups` should be sorted by Cognito `Precedence` ascending (lower number
  means higher authority), so client logic can treat `groups[0]` as highest role.
- Current required user mapping from backend contract:
  - `skicyclerun` => `SuperUsers` + `GeneralUsers`
  - `amsherrin` => `GeneralUsers`

If you observe a behavior that seems wrong on the backend (e.g., groups not
returned, user not created, wrong token format), the correct action is:

1. Document the issue and the required fix in `!help_md/SAM-AUTH-LAMBDA-SPEC.md`
2. Tell the user what needs to change in the SAM repo
3. Do **not** add workaround Lambda code here

---

## What You Should Do Instead

When a problem is clearly caused by the backend:

- Update `!help_md/SAM-AUTH-LAMBDA-SPEC.md` with the specification for the fix
- Reference the endpoint contract and expected response shape
- Suggest the user apply the fix in their SAM repo

When a problem is frontend-only:

- Edit files in `src/`, `public/`, `scripts/update-version.ts`, `astro.config.mjs`
- Stay within the Astro/React/Tailwind stack

---

## Permitted `scripts/` Contents

The `scripts/` directory is for **local development utility scripts only**:

| File                      | Purpose                              | OK?       |
| ------------------------- | ------------------------------------ | --------- |
| `update-version.ts`       | Updates `version.json` at build time | ✅        |
| `download-video.sh`       | Downloads video assets for local dev | ✅        |
| Lambda `.js` handlers     | AWS execution code                   | ❌ Remove |
| `deploy-lambda.sh`        | AWS infrastructure deployment        | ❌ Remove |
| `cognito-iam-policy.json` | IAM policy documents                 | ❌ Remove |

---

## Summary

> This repo owns the **UI**. The SAM repo owns the **backend**.
> Never blur that line. When in doubt, write a spec and stop.
