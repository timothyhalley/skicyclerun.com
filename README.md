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


----------------------
# AWS CLI Commands

## Clear cloudfront commands
### aws cloudfront list-distributions --output table --query 'DistributionList.Items[*].[Id,Origins.Items[0].DomainName]'
### 


----------------------


# Astro Starter Kit: Minimal

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
- https://github.com/understanding-astro/understanding-astro-book/blob/master/README.md


## Amplify Setup

1. ✅ Prerequisites Check

Make sure you’ve got:

•  Homebrew installed (brew --version)
•  Node.js installed via n (n --version)
•  Your preferred Node version active (node -v, npm -v)

If needed:

brew install n
sudo n latest

2. 🍺 Install AWS Amplify CLI via Homebrew

This installs the legacy CLI globally, which is still useful for some tasks:

brew install aws-amplify

Note: This installs the classic CLI, not Gen 2. Gen 2 uses create-amplify and @aws-amplify/backend, which are npm-based and project-local

3. 📦 Scaffold Amplify Gen 2 Locally (Avoid Global npm)

Navigate to your Astro project root (e.g., skicyclerun.com) and run:

npm create amplify@latest

This scaffolds:
amplify/
├── auth/
│   └── resource.ts
├── backend.ts
├── tsconfig.json

4. 🔐 Add Authentication

Inside amplify/auth/resource.ts, define your auth logic:
import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true
  }
});

Then wire it into amplify/backend.ts:
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';

defineBackend({
  auth
});

5. 🧪 Run Sandbox Locally

Use npx to avoid global install conflicts:

npx ampx sandbox

This launches a local dev backend for testing. If you hit ESM import errors, ensure your package.json includes:

"type": "module"

6. 🚀 Deploy When Ready

Once tested, you can deploy with:

npx ampx deploy

🔍 Notes for Your Astro Site

Your site at skicyclerun.com is Astro-based with modular components and SVG-heavy visuals. Amplify Gen 2 integrates cleanly with Astro, but you’ll need to:

•  Add frontend auth UI manually (e.g., via Amplify UI or custom forms)
•  Use Amplify JS client to connect to the backend
•  Ensure SSR compatibility if needed (Astro islands or client-only components)

1. 🔐 Verify AWS Credentials

Run:
aws sts get-caller-identity

If this fails, your credentials are invalid. To reset:
aws configure

Use credentials from an IAM user with AmplifyBackendDeployFullAccess or equivalent. If you use named profiles, set:

export AWS_PROFILE=your-profile-name
export AWS_SDK_LOAD_CONFIG=1


---------

🔌 1. Connect Astro Frontend to Amplify

After running npx ampx sandbox, you should have an amplify_outputs.json file in your project root. This contains your Cognito config.

Create a file: src/amplify-config.ts
  import { Amplify } from 'aws-amplify';
  import amplifyConfig from '../amplify_outputs.json';

  Amplify.configure(amplifyConfig);

Then import this early in your app entry point (e.g., src/pages/index.astro or src/layouts/Layout.astro):

  import '../amplify-config';

🎛️ 2. Install Amplify Auth UI

Install the UI components:

  npm install @aws-amplify/ui-react

Also install the core client if not already:

  npm install aws-amplify

🧪 3. Create a Gated Test Page

Create src/pages/protected.astro:

    ---

    import { Authenticator } from "@aws-amplify/ui-react";
    import "@aws-amplify/ui-react/styles.css";
    import "../amplify-config"
    ---

    <Authenticator client:only="react">
      {
        context => {
          console.log("Authenticator context:", context);
          if (!context) return <div>Loading context...</div>;
          if (!context.user) return <div>Please sign in to access this page.</div>;
          return (
            <div>
              <h1>Welcome, {context.user.username}</h1>
              <p>This is a protected page.</p>
              <button onClick={context.signOut}>Sign out</button>
            </div>
          );
        }
      }
    </Authenticator>

  Astro supports React components via islands. This page will render client-side only, so make sure your project is set up for hybrid rendering.

🧭 4. Validate Auth Flow

Run your dev server:

  npm run dev

Then visit /protected. You should see:

•  A login form (email/password)
•  After login, a welcome message and sign-out button

If you’re not authenticated, Amplify will gate the page automatically.


🧠 Bonus: SSR-Friendly Auth Check

If you want to gate routes server-side, you’ll need to use Amplify’s Auth client manually:

  import { Auth } from 'aws-amplify';

  const user = await Auth.currentAuthenticatedUser();

But for now, the Authenticator component handles most of the heavy lifting.


--- running dev server ---
🔧 


✅ Fix Options

Option 1: Update Cognito Redirect URIs to Allow `http`

1. Go to the AWS Cognito Console.
2. Select your User Pool.
3. Navigate to "App client settings" under the "App integration" section.
4. Add `http://localhost:4321/auth-callback/` to the list of allowed callback URLs.
5. Also add it to Allowed Sign Out URLs:`http://localhost:4321/signout/`
6. Save changes.

Option 2: Use HTTPS for Local Development
1. Set up a self-signed SSL certificate for localhost.
  openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

  openssl req -x509 -newkey rsa:4096 -keyout skicyclerun_key.pem -out skicyclerun_cert.pem -days 365 -nodes

  Country Name (2 letter code) [AU]:US
  State or Province Name (full name) [Some-State]:WA
  Locality Name (eg, city) []:Redmond
  Organization Name (eg, company) [Internet Widgits Pty Ltd]:SkiCycleRun 2026
  Organizational Unit Name (eg, section) []:DeepThink
  Common Name (e.g. server FQDN or YOUR name) []:skicyclerun.com
  Email Address []:skicyclerun@gmail.com

2. Configure your Astro dev server to use HTTPS.
  astro dev --https --cert cert.pem --key key.pem

3. Update Cognito redirect URIs to:
    https://localhost:4321


🧪 Test Flow

Once the redirect URI matches your dev protocol:

•  Visit /protected
•  Authenticator should render
•  On login, Cognito redirects back to your app
•  Authenticator picks up the token and renders the gated content


--- Test AWS ---

aws cognito-idp list-users --user-pool-id us-west-2_32jPUWXJE

once okay then:

aws cognito-idp admin-initiate-auth \
  --user-pool-id <your_user_pool_id> \
  --client-id <your_app_client_id> \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=<username>,PASSWORD=<password>


aws cognito-idp admin-initiate-auth \
  --user-pool-id us-west-2_32jPUWXJE \
  --client-id 47e5hsbfm5fbcfpob4sln383o6 \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=289183a0-00f1-7032-8235-8160bea4074c,PASSWORD=<password>
