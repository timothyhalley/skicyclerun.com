# GitHub Actions Secrets & Environment Setup

This guide explains which environment values from `!env.example` must be provided to GitHub Actions and how to expose them safely for the `Deploy SkiCycleRun (astro site) to AWS S3 Static Host` workflow defined in `.github/workflows/astro.yml`.

## 1. Where the secrets are used

The deploy workflow authenticates with AWS using the `aws-actions/configure-aws-credentials` step and then runs `npm run build`. Any value that the build expects (for example, Cognito configuration) must be available in the CI environment, otherwise the site falls back to the default placeholders in `src/config/cognito.ts`.

Because GitHub Actions does not read your local `.env`, you must add the required keys to **Repository → Settings → Secrets and variables → Actions**.

## 2. Required repository secrets

| Secret Name             | Maps to `.env` key      | Why it is needed                                                                                                       |
| ----------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `AWS_ACCESS_KEY_ID`     | `AWS_ACCESS_KEY_ID`     | Allow the workflow to call `aws s3 sync` and `aws cloudfront create-invalidation` (already referenced in `astro.yml`). |
| `AWS_SECRET_ACCESS_KEY` | `AWS_SECRET_ACCESS_KEY` | Paired with the access key for AWS API calls (already referenced in `astro.yml`).                                      |

> These two credentials should belong to an IAM user or role that only has the permissions required to deploy static assets and invalidate the CloudFront cache.

## 3. Recommended (non-secret) repository variables

If you want the CI build to render using your production Cognito and site settings, store the remaining values from `!env.example` as **Actions variables** (not secrets). Variables are available as `${{ vars.NAME }}` in workflows, which prevents leaking them in the repository while still keeping them editable.

| Variable Name                       | `.env` key                          | Notes                                                                                                          |
| ----------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `SKICYCLERUN_URL`                   | `SKICYCLERUN_URL`                   | Canonical site URL that powers sitemaps and canonical meta tags.                                               |
| `PUBLIC_SKICYCLERUN_API`            | `PUBLIC_SKICYCLERUN_API`            | Base API URL surfaced in the UI.                                                                               |
| `PUBLIC_COGNITO_USER_POOL_ID`       | `PUBLIC_COGNITO_USER_POOL_ID`       | Exposed to the browser; required so the header button and profile page point at the correct pool.              |
| `PUBLIC_COGNITO_CLIENT_ID`          | `PUBLIC_COGNITO_CLIENT_ID`          | Exposed to the browser.                                                                                        |
| `PUBLIC_COGNITO_DOMAIN`             | `PUBLIC_COGNITO_DOMAIN`             | Use your custom domain (for example `auth.skicyclerun.com`).                                                   |
| `PUBLIC_COGNITO_REGION`             | `PUBLIC_COGNITO_REGION`             | Region slug, e.g. `us-west-2`.                                                                                 |
| `PUBLIC_COGNITO_SCOPES`             | `PUBLIC_COGNITO_SCOPES`             | Comma-separated scopes such as `openid,email,profile,phone`.                                                   |
| `PUBLIC_COGNITO_REDIRECT_URI`       | `PUBLIC_COGNITO_REDIRECT_URI`       | Path or absolute URL for the hosted UI redirect.                                                               |
| `PUBLIC_COGNITO_LOGOUT_URI`         | `PUBLIC_COGNITO_LOGOUT_URI`         | Path or absolute URL used on logout.                                                                           |
| `PUBLIC_AUTH_METHODS`               | `PUBLIC_AUTH_METHODS`               | Comma-separated sign-in modes (`EMAIL_OTP`, `SMS_OTP`, `PASSWORD`) that the UI should offer in priority order. |
| `PUBLIC_COGNITO_DEFAULT_OTP_LENGTH` | `PUBLIC_COGNITO_DEFAULT_OTP_LENGTH` | Optional: sets the UI’s expected passwordless OTP length (4–8 digits) when Cognito doesn’t send a hint.        |
| `AWS_REGION`                        | `AWS_REGION`                        | Keep consistent with the bucket and Cognito resources (`us-west-2`).                                           |
| `S3_BUCKET_NAME`                    | `S3_BUCKET_NAME`                    | Deployment only: passed to `aws s3 sync` so the workflow can publish `dist/` to your static site bucket.       |
| `CLOUDFRONT_DISTRIBUTION_ID`        | `CLOUDFRONT_DISTRIBUTION_ID`        | Deployment only: injected into `aws cloudfront create-invalidation` to purge the CDN cache after uploads.      |

## 4. Writing the `.env` file inside the workflow

Add the following step **before** `npm run build` so the workflow writes the `.env` file from your secrets and variables:

```yaml
- name: Write environment file
  run: |
    cat <<'EOF' > .env
    SKICYCLERUN_URL=${{ vars.SKICYCLERUN_URL }}
    PUBLIC_SKICYCLERUN_API=${{ vars.PUBLIC_SKICYCLERUN_API }}
    PUBLIC_COGNITO_USER_POOL_ID=${{ vars.PUBLIC_COGNITO_USER_POOL_ID }}
    PUBLIC_COGNITO_CLIENT_ID=${{ vars.PUBLIC_COGNITO_CLIENT_ID }}
    PUBLIC_COGNITO_DOMAIN=${{ vars.PUBLIC_COGNITO_DOMAIN }}
    PUBLIC_COGNITO_REGION=${{ vars.PUBLIC_COGNITO_REGION }}
    PUBLIC_COGNITO_SCOPES=${{ vars.PUBLIC_COGNITO_SCOPES }}
    PUBLIC_COGNITO_REDIRECT_URI=${{ vars.PUBLIC_COGNITO_REDIRECT_URI }}
    PUBLIC_COGNITO_LOGOUT_URI=${{ vars.PUBLIC_COGNITO_LOGOUT_URI }}
    PUBLIC_AUTH_METHODS=${{ vars.PUBLIC_AUTH_METHODS }}
    PUBLIC_COGNITO_DEFAULT_OTP_LENGTH=${{ vars.PUBLIC_COGNITO_DEFAULT_OTP_LENGTH }}
    AWS_REGION=${{ vars.AWS_REGION }}
    S3_BUCKET_NAME=${{ vars.S3_BUCKET_NAME }}
    CLOUDFRONT_DISTRIBUTION_ID=${{ vars.CLOUDFRONT_DISTRIBUTION_ID }}
    PUBLIC_DEBUG_OUTPUT=${{ vars.PUBLIC_DEBUG_OUTPUT }}
    EOF
```

If any value is sensitive (for example, if you introduce Cognito client secrets in the future), move it from `vars` to `secrets` and reference it with `${{ secrets.NAME }}` instead.

## 5. Checklist

1. Add the required secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`).
2. Create Actions variables for each non-secret value you want the build to use.
3. Update the workflow with the "Write environment file" step so `npm run build` sees the same configuration as local builds.
4. Commit this documentation so other contributors know how to provision CI credentials.

## 6. Migration process (from existing secrets)

Follow these steps to realign the repository with this guidance:

1. **Create a clean template:** Use the new root-level `.env.example` (copied from `!env.example`) as the canonical reference for local development and CI.
2. **Audit current secrets:** In GitHub → Repository → Settings → Secrets and variables → Actions → _Secrets_, keep only `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. Note down the values for `AWS_DEFAULT_REGION`, `CLOUDFRONT_DISTRIBUTION_ID`, any legacy `COGNITO_*` secrets, `S3_BUCKET`, `SKICYCLERUN_URL`, etc. before removing them.
3. **Create variables:** Switch to the _Variables_ tab and add entries using the names listed in section 3 (for example `PUBLIC_COGNITO_DOMAIN`, `AWS_REGION`, `S3_BUCKET_NAME`, `SKICYCLERUN_URL`, `PUBLIC_DEBUG_OUTPUT`). Paste the values you captured in the previous step.
4. **Update the workflow:** Insert the "Write environment file" snippet (section 4) into `.github/workflows/astro.yml` so the CI run writes a `.env` file using `vars.NAME` and the two AWS secrets.
5. **Verify:** Trigger a workflow run (push or workflow dispatch). Confirm it succeeds and that `npm run build` uses the expected configuration (look for the custom Cognito domain in the build output).
6. **Housekeeping:** Delete the old `!env.example` once the team is comfortable using `.env.example`, or keep it temporarily if internal docs reference it—just ensure both files remain in sync.

With these steps in place, your GitHub Actions environment will faithfully mirror the values defined in `!env.example`, ensuring production builds and deployments behave the same way as local runs.
