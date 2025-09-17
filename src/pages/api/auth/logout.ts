import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const domain = import.meta.env.COGNITO_DOMAIN as string;
  const clientId = import.meta.env.COGNITO_USER_POOL_CLIENT_ID as string;
  const signoutRedirect =
    (import.meta.env.COGNITO_LOGOUT_REDIRECT_URI as string) || new URL('/', request.url).toString();

  const url = new URL(request.url);
  const returnTo = url.searchParams.get('returnTo') || '/';

  // Clear tokens
  const expire = 'Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0';
  const cookieParts = [
    `id_token=; ${expire}`,
    `access_token=; ${expire}`,
    `refresh_token=; ${expire}`,
  ];

  // Federated logout redirect (optional)
  const location = domain
    ? `${domain}/logout?client_id=${encodeURIComponent(clientId)}&logout_uri=${encodeURIComponent(signoutRedirect)}`
    : returnTo;

  const headers: HeadersInit = [['Location', location]];
  for (const c of cookieParts) (headers as string[][]).push(['Set-Cookie', c]);
  return new Response(null, { status: 302, headers });
};
