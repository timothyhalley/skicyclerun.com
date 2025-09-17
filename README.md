# Ski Cycle Run Adventures 🧳

## 🚅 Features

- [x] Recent activity in travel
- [x] AI and other technology topics
- [x] Math and Programming tips


## ✅ Lighthouse Score

<p align="center">
  <a href="https://pagespeed.web.dev/analysis/https-skicyclerun-com/9wb9dytc6d?form_factor=desktop">
    <img width="710" alt="SkiCycleRun Lighthouse Score" src="@svg_imgs/lighthouse-score.svg">
  <a>
</p>


---

## AWS CLI Commands

### Clear cloudfront commands

```bash
aws cloudfront list-distributions --output table --query 'DistributionList.Items[*].[Id,Origins.Items[0].DomainName]'
```


---


## Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/minimal)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/minimal)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/minimal/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).


## Astro book on GitHub

- <https://github.com/understanding-astro/understanding-astro-book/blob/master/README.md>


## Authentication (Cognito, no Amplify UI)

This project uses AWS Cognito directly with server-only endpoints to avoid any visible callback page flash.

Environment variables (server-only; do NOT prefix with PUBLIC_)

- COGNITO_DOMAIN: <https://your-domain.auth.region.amazoncognito.com>
- COGNITO_USER_POOL_ID: your Cognito User Pool ID (e.g., us-east-1_XXXXXXX)
- COGNITO_USER_POOL_CLIENT_ID: your Cognito App Client ID
- Optional: COGNITO_CLIENT_SECRET (if your App Client has a secret)
- Optional: COGNITO_REDIRECT_URI (defaults to /api/auth/callback for the current origin)
- Optional: COGNITO_LOGOUT_REDIRECT_URI (defaults to /)
- Optional: COGNITO_SCOPES (defaults to "openid email profile")

Endpoints

- GET /api/auth/login?returnTo=/path
  - Starts PKCE + redirects to Cognito. After success, tokens are set as HttpOnly cookies and you’re redirected back to returnTo.
- GET /api/auth/callback
  - Exchanges code for tokens, sets id_token/access_token/refresh_token cookies, clears transient cookies, and redirects to the original URL.
- GET /api/auth/logout?returnTo=/
  - Clears cookies and optionally performs Cognito federated logout, then redirects.
- GET /api/auth/session
  - Returns { signedIn: boolean, role: 'anonymous' | 'basic' | 'elevated' } based on HttpOnly cookies.

Client usage

- Login: link to `/api/auth/login?returnTo=${encodeURIComponent(location.pathname + location.search + location.hash)}`
- Logout: link to `/api/auth/logout?returnTo=${encodeURIComponent(location.pathname + location.search + location.hash)}`
- State: fetch `/api/auth/session` to update header/UI.

Server gating

- Use `verifyRequest` and `hasMinRole` from `src/utils/cognito.ts` in API routes to gate access.
- Roles are derived from `cognito:groups` claims (e.g., group "elevated" -> role elevated; any signed-in user -> basic).


## Local HTTPS Development (mkcert)

Run the dev server over HTTPS so Secure cookies work and redirect URIs match exactly.

1. Generate a trusted localhost certificate (macOS)

- Install mkcert and a local CA, then generate a cert for localhost:

```bash
brew install mkcert
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

This creates two files in the current directory, for example:

- localhost+2.pem
- localhost+2-key.pem

1. Configure the dev server

- Option A (recommended): keep config in astro.config.mjs (already set in this repo) to force HTTPS on port 4321.
- Option B: drive via npm script flags:

```json
"devs": "astro dev --https --host localhost --port 4321 --cert localhost+2.pem --key localhost+2-key.pem"
```

1. Start and verify

- Run the dev server and confirm it prints:
  - Local: <https://localhost:4321/>
- Open <https://localhost:4321> (not <http://localhost:4321>). If your browser prompts, accept once (mkcert should usually avoid prompts).

