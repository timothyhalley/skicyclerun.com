import { Amplify } from 'aws-amplify';
import { Hub } from 'aws-amplify/utils';
import { getCurrentUser } from '@aws-amplify/auth';
import { CookieStorage } from 'aws-amplify/utils'; // <-- Import CookieStorage
import { cognitoUserPoolsTokenProvider } from '@aws-amplify/auth/cognito'; // <-- Import the token provider

// --- START: CORRECTED CONFIGURATION ---
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-west-2_UqZZY2Hbw',
      userPoolClientId: 'hsrpdhl5sellv9n3dotako1tm',
      loginWith: {
        oauth: {
          domain: 'us-west-2uqzzy2hbw.auth.us-west-2.amazoncognito.com',
          scopes: ['email', 'openid', 'profile', 'phone'],
          redirectSignIn: ['http://localhost:4321/auth-callback/'],
          redirectSignOut: ['http://localhost:4321/signout/'],
          responseType: 'code',
        },
      },
    },
  },
} as const;
// --- END: CORRECTED CONFIGURATION ---

// Configure the token provider to use cookies
cognitoUserPoolsTokenProvider.setKeyValueStorage(new CookieStorage());

Amplify.configure(amplifyConfig);

let isSignedIn = false;

const updateAllUi = () => {
  const protectedContent = document.getElementById('protected-content');
  const authMessage = document.getElementById('auth-required-message');
  const loadingMessage = document.getElementById('auth-loading-message');

  if (protectedContent && authMessage && loadingMessage) {
    // Hide loader, then toggle gated content based on isSignedIn
    loadingMessage.style.display = 'none';
    if (isSignedIn) {
      authMessage.classList.remove('visible');
      protectedContent.classList.add('visible');
    } else {
      protectedContent.classList.remove('visible');
      authMessage.classList.add('visible');
    }
  }
};

Hub.listen('auth', ({ payload }) => {
  switch (payload.event) {
    case 'signedIn':
      isSignedIn = true;
      updateAllUi();
      break;
    case 'signedOut':
      isSignedIn = false;
      updateAllUi();
      break;
  }
});

const runPageSetup = async () => {
  const headerBtn = document.getElementById('auth-btn');
  const protectedContent = document.getElementById('protected-content');
  const authMessage = document.getElementById('auth-required-message');
  const loadingMessage = document.getElementById('auth-loading-message');

  // Set initial loading state if on a gated page
  if (loadingMessage && authMessage && protectedContent) {
    loadingMessage.style.display = 'block';
    authMessage.classList.remove('visible');
    protectedContent.classList.remove('visible');
  }

  if (headerBtn) {
    // Do not bind click handlers here; the header component owns button behavior.
  }

  try {
    await getCurrentUser();
    isSignedIn = true;
  } catch (e) {
    isSignedIn = false;
  }

  updateAllUi();
};

let initialized = false;

export function initializeAuth() {
  if (initialized) return;
  initialized = true;

  // existing: configure CookieStorage, Amplify.configure(amplifyConfig), Hub.listen, runPageSetup()
  // keep those lines as-is, just inside this guard
  runPageSetup();
  document.addEventListener('astro:after-swap', runPageSetup);
}

export async function isUserSignedIn(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}
