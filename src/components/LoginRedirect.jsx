import { useEffect } from 'react';

export default function LoginRedirect() {
  useEffect(() => {
    // Capture the page the user was on before login
    const currentPath = window.location.pathname;
    localStorage.setItem('post_login_redirect', currentPath);

    // Redirect to Cognito login
    const clientId = 'hsrpdhl5sellv9n3dotako1tm';
    const redirectUri = 'http://localhost:4321/auth-callback/'; // must match Cognito config
    const cognitoDomain = 'https://us-west-2uqzzy2hbw.auth.us-west-2.amazoncognito.com';

    const loginUrl = `${cognitoDomain}/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid+profile`;

    window.location.href = loginUrl;
  }, []);

  return <p>🔁 Redirecting to login...</p>;
}
