import { useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { initializeAuth } from '@scripts/auth-island-clients';

export default function AuthCallbackComponent() {
  useEffect(() => {
    (async () => {
      try {
        initializeAuth(); // ensure CookieStorage + config
        await fetchAuthSession(); // completes code exchange, sets cookies
      } catch (e) {
        console.error('fetchAuthSession during callback failed:', e);
      } finally {
        const dest = sessionStorage.getItem('postLoginRedirect') || '/';
        sessionStorage.removeItem('postLoginRedirect');
        window.location.replace(dest);
      }
    })();
  }, []);

  return <p>Signing you in…</p>;
}
