import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const domain = import.meta.env.COGNITO_DOMAIN as string; // e.g. https://your-domain.auth.us-east-1.amazoncognito.com
  const clientId = import.meta.env.COGNITO_USER_POOL_CLIENT_ID as string;
  const clientSecret = (import.meta.env.COGNITO_CLIENT_SECRET as string) || '';
  const redirectUri =
    (import.meta.env.COGNITO_REDIRECT_URI as string) ||
    new URL('/api/auth/callback', request.url).toString();

  if (!domain || !clientId) return new Response('Auth not configured', { status: 500 });

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return new Response('Missing code/state', { status: 400 });

  // Read transient cookies
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies: Record<string, string> = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...rest] = c.trim().split('=');
      return [k, decodeURIComponent(rest.join('='))];
    })
  );

  const verifier = cookies['pkce_verifier'];
  const expectedState = cookies['oauth_state'];
  const returnTo = decodeURIComponent(cookies['return_to'] || '/') || '/';
  if (!verifier || !expectedState || state !== expectedState)
    return new Response('Invalid state', { status: 400 });

  // Exchange code for tokens
  const tokenEndpoint = new URL('/oauth2/token', domain).toString();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });

  const tokenReqHeaders: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (clientSecret) {
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    tokenReqHeaders['Authorization'] = `Basic ${creds}`;
  }

  const resp = await fetch(tokenEndpoint, { method: 'POST', headers: tokenReqHeaders, body });
  if (!resp.ok) {
    const text = await resp.text();
    return new Response(`Token exchange failed: ${text}`, { status: 500 });
  }
  const json = await resp.json();
  const { id_token, access_token, refresh_token, expires_in } = json as any;

  // Set HttpOnly cookies; clear transient cookies; then 302 to returnTo
  const cookieParts: string[] = [];
  const secure = 'Path=/; HttpOnly; SameSite=Lax; Secure';
  if (id_token) cookieParts.push(`id_token=${id_token}; ${secure}; Max-Age=${expires_in ?? 3600}`);
  if (access_token)
    cookieParts.push(`access_token=${access_token}; ${secure}; Max-Age=${expires_in ?? 3600}`);
  if (refresh_token) cookieParts.push(`refresh_token=${refresh_token}; ${secure}; Max-Age=2592000`); // 30d typical
  // Clear short-lived cookies
  const expire = 'Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0';
  cookieParts.push(`pkce_verifier=; ${expire}`);
  cookieParts.push(`oauth_state=; ${expire}`);
  cookieParts.push(`return_to=; ${expire}`);

  const responseHeaders: HeadersInit = [['Location', returnTo]];
  for (const c of cookieParts) (responseHeaders as string[][]).push(['Set-Cookie', c]);
  return new Response(null, { status: 302, headers: responseHeaders });
};
