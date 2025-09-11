import { Amplify } from "aws-amplify";
import { Hub } from 'aws-amplify/utils';
import {
  getCurrentUser,
  signInWithRedirect,
  signOut,
} from "@aws-amplify/auth";
import { CookieStorage } from "aws-amplify/utils";  // <-- Import CookieStorage
import { cognitoUserPoolsTokenProvider } from "@aws-amplify/auth/cognito"; // <-- Import the token provider

// --- START: CORRECTED CONFIGURATION ---
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: "us-west-2_UqZZY2Hbw",
      userPoolClientId: "hsrpdhl5sellv9n3dotako1tm",
      loginWith: {
        oauth: {
          domain: "us-west-2uqzzy2hbw.auth.us-west-2.amazoncognito.com",
          scopes: ["email", "openid", "profile", "phone"],
          redirectSignIn: ["http://localhost:4321/"],
          redirectSignOut: ["http://localhost:4321/"],
          responseType: "code",
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
  const headerBtn = document.getElementById("auth-btn");
  const loginSvg = document.getElementById("login-svg");
  const logoutSvg = document.getElementById("logout-svg");
  const protectedContent = document.getElementById("protected-content");
  const authMessage = document.getElementById("auth-required-message");
  const loadingMessage = document.getElementById("auth-loading-message");

  if (headerBtn && loginSvg && logoutSvg) {
    headerBtn.style.display = "block";
    if (isSignedIn) {
      loginSvg.style.display = "none";
      logoutSvg.style.display = "block";
      headerBtn.title = "Logout";
    } else {
      loginSvg.style.display = "block";
      logoutSvg.style.display = "none";
      headerBtn.title = "Login";
    }
  }

  if (protectedContent && authMessage && loadingMessage) {
    // Hide the loading spinner first
    loadingMessage.style.display = "none";
    
    // Then, toggle visibility of the other states
    if (isSignedIn) {
      authMessage.classList.remove("visible");
      protectedContent.classList.add("visible");
    } else {
      protectedContent.classList.remove("visible");
      authMessage.classList.add("visible");
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
  const headerBtn = document.getElementById("auth-btn");
  const protectedContent = document.getElementById("protected-content");
  const authMessage = document.getElementById("auth-required-message");
  const loadingMessage = document.getElementById("auth-loading-message");

  // Set initial loading state if on a gated page
  if (loadingMessage && authMessage && protectedContent) {
    loadingMessage.style.display = "block";
    authMessage.classList.remove("visible");
    protectedContent.classList.remove("visible");
  }

  if (headerBtn) {
    headerBtn.onclick = () => {
      if (isSignedIn) {
        signOut({ global: true });
      } else {
        signInWithRedirect();
      }
    };
  }

  try {
    await getCurrentUser();
    isSignedIn = true;
  } catch (e) {
    isSignedIn = false;
  }
  
  updateAllUi();
};

export function initializeAuth() {
  runPageSetup();
  document.addEventListener("astro:after-swap", runPageSetup);
}