import type { APIRoute } from 'astro';
import { verifyRequest } from '@utils/cognito';

export const GET: APIRoute = async ({ request }) => {
  const user = await verifyRequest(request);
  const body = JSON.stringify({
    signedIn: !!user,
    role: user?.role ?? 'anonymous',
  });
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
