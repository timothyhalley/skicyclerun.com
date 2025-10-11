# Ski Cycle Run Adventures 🧳

## 🚅 Features

- [x] Recent activity in travel
- [x] AI and other technology topics
- [x] Math and Programming tips


## ✅ Lighthouse Score


[![SkiCycleRun Lighthouse Score](@svg_imgs/lighthouse-score.svg)](https://pagespeed.web.dev/analysis/https-skicyclerun-com/9wb9dytc6d?form_factor=desktop)


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


## Authentication (Cognito, client-only)

This project uses AWS Cognito with direct JWT token management on the client and a serverless API (API Gateway + Lambda) for protected data. The site builds statically (no SSR adapter), so there are no /api/auth/* routes.

Environment variables (client-visible; prefix with PUBLIC_)

- PUBLIC_USER_POOL_ID
- PUBLIC_USER_POOL_CLIENT_ID
- PUBLIC_API_BASE_URL (your API Gateway invoke URL, e.g., [https://6y0k42n7z0.execute-api.us-east-1.amazonaws.com](https://6y0k42n7z0.execute-api.us-east-1.amazonaws.com))
- Optional: PUBLIC_AWS_REGION

Client usage

- Hosted UI login: use getHostedUiAuthorizeUrl() from `src/utils/clientAuth.ts` and redirect the browser.
- Hosted UI logout: use getHostedUiLogoutUrl() from `src/utils/clientAuth.ts`.
- Auth state in UI: call getAuthState() from `src/utils/clientAuth.ts` (uses direct Cognito JWT validation).

Protected content

- Call `${PUBLIC_API_BASE_URL}/content?slug=...` with Authorization: Bearer `idToken` (see `src/utils/authToken.ts`). The Lambda verifies the JWT and checks `cognito:groups`.

Serverless API

- Reuse your existing API Gateway: `skicyclerunAPI` (id: 6y0k42n7z0), add `GET /content` to a Lambda that verifies Cognito tokens (see `lambda/verifyCognitoJwt.ts` and `lambda/getContent.ts`). Enable CORS for your site origins.


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

