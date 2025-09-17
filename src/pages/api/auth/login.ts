import type { APIRoute } from 'astro';

// Base64 URL-safe encoding
function base64url(input: ArrayBuffer | Uint8Array | string) {
  const bytes =
    typeof input === 'string'
      ? new TextEncoder().encode(input)
      : input instanceof Uint8Array
        ? input
        : new Uint8Array(input);
  let str = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sha256(input: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(digest);
}

function randomVerifier(length = 96) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

export const GET: APIRoute = async ({ request }) => {
  const domain = import.meta.env.COGNITO_DOMAIN as string; // e.g. https://your-domain.auth.us-east-1.amazoncognito.com
  const clientId = import.meta.env.COGNITO_USER_POOL_CLIENT_ID as string;
  const redirectUri =
    (import.meta.env.COGNITO_REDIRECT_URI as string) ||
    new URL('/api/auth/callback', request.url).toString();
  const scope = (import.meta.env.COGNITO_SCOPES as string) || 'openid email profile';

  if (!domain || !clientId) {
    return new Response('Auth not configured', { status: 500 });
  }

  const url = new URL(request.url);
  const returnTo = url.searchParams.get('returnTo') || request.headers.get('referer') || '/';

  const verifier = randomVerifier();
  const challenge = base64url(await sha256(verifier));
  const state = randomVerifier(48); // CSRF token

  // Prepare authorize URL
  const authorize = new URL('/oauth2/authorize', domain);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('scope', scope);
  authorize.searchParams.set('code_challenge_method', 'S256');
  authorize.searchParams.set('code_challenge', challenge);
  authorize.searchParams.set('state', state);

  // Cookies: pkce_verifier, oauth_state, return_to (short-lived)
  const cookieParts: string[] = [];
  const common = 'Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=600';
  cookieParts.push(`pkce_verifier=${verifier}; ${common}`);
  cookieParts.push(`oauth_state=${state}; ${common}`);
  cookieParts.push(`return_to=${encodeURIComponent(returnTo)}; ${common}`);

  const headers: HeadersInit = [['Location', authorize.toString()]];
  for (const c of cookieParts) headers.push(['Set-Cookie', c]);
  return new Response(null, { status: 302, headers });
};
