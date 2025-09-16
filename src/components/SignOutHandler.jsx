import { useEffect } from 'react';

export default function SignOutHandler() {
  useEffect(() => {
    localStorage.removeItem('access_token');
    // Optional: redirect after cleanup
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  }, []);

  return null;
}
