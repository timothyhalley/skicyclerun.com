import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ request }) => {
  const auth = request.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  return new Response(JSON.stringify({ message: 'Secure content unlocked' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
